import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  CANNED_REPLIES,
  CONVERSATION_SUMMARIES,
  INITIAL_DRAFT,
  INITIAL_MESSAGES,
  SUMMARIZED_THROUGH,
  THREADS,
  evidenceFor,
  sourceById,
  type Claim,
  type DraftBlock,
  type Message,
  type Summary,
} from './data';
import { newBlockId, useDraft } from './draftState';
import { Nav } from './components/Nav';
import { Chat } from './components/Chat';
import { BlockBody, DraftPane } from './components/DraftPane';
import { SourcePane } from './components/SourcePane';
import { SummarizePane } from './components/SummarizePane';
import { SummaryView } from './components/SummaryView';
import { Chips } from './components/Chip';

type Mode = { kind: 'draft' } | { kind: 'summarize' } | { kind: 'source'; id: number } | { kind: 'summary'; id: string };

const claimToBlock = (c: Claim): DraftBlock => ({
  id: newBlockId(),
  text: c.text,
  evidence: c.sourceIds.map(evidenceFor),
  origin: 'chat',
  fromClaim: c.id,
});

function toMarkdown(blocks: DraftBlock[]) {
  const used = [...new Set(blocks.flatMap((b) => b.evidence.map((e) => e.sourceId)))].sort((a, b) => a - b);
  const body = blocks
    .map((b, i) => `${i + 1}. ${b.text}${b.evidence.length ? ' ' + b.evidence.map((e) => `[${e.sourceId}]`).join('') : ' _(no evidence)_'}`)
    .join('\n');
  const refs = used
    .map((id) => {
      const s = sourceById(id);
      return `[${id}] ${s.title}. ${s.origin}, ${s.location}. Retrieved ${s.retrieved}.${s.verified ? '' : ' (unverified)'}`;
    })
    .join('\n');
  return `# Q3 filings — draft\n\n${body}\n\n## Sources\n\n${refs}\n`;
}

export default function App() {
  const draft = useDraft(INITIAL_DRAFT);
  const [thread, setThread] = useState('q3');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [pending, setPending] = useState(false);
  const replyIdx = useRef(0);
  const [summaries, setSummaries] = useState<Summary[]>(CONVERSATION_SUMMARIES);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: 'draft' });
  const [flashId, setFlashId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // drag state
  const [active, setActive] = useState<{ type: 'chat'; claim: Claim } | { type: 'draft'; id: string } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const isQ3 = thread === 'q3';
  const inDraft = useMemo(() => new Set(draft.blocks.map((b) => b.fromClaim).filter(Boolean) as string[]), [draft.blocks]);

  const flash = useCallback((id: string) => {
    setFlashId(id);
    setTimeout(() => setFlashId((f) => (f === id ? null : f)), 1200);
  }, []);
  const say = useCallback((t: string) => {
    setToast(t);
    setTimeout(() => setToast((x) => (x === t ? null : x)), 2200);
  }, []);

  const openSource = useCallback((id: number) => setMode({ kind: 'source', id }), []);
  const backToDraft = useCallback(() => setMode({ kind: 'draft' }), []);

  const sendToDraft = (claims: Claim[]) => {
    const fresh = claims.filter((c) => !inDraft.has(c.id));
    if (!fresh.length) return say('Those claims are already in the draft');
    const blocks = fresh.map(claimToBlock);
    draft.insert(blocks);
    setMode({ kind: 'draft' });
    flash(blocks[0].id);
    say(`Added ${blocks.length} claim${blocks.length > 1 ? 's' : ''} to draft`);
  };

  const quoteIntoDraft = (id: number) => {
    const ev = evidenceFor(id);
    const b: DraftBlock = { id: newBlockId(), text: `“${ev.quote}”`, evidence: [ev], origin: 'quote' };
    draft.insert([b]);
    setMode({ kind: 'draft' });
    flash(b.id);
    say(`Quoted source ${id} into draft`);
  };

  const sendMessage = (text: string) => {
    const last = messages[messages.length - 1]?.turn ?? SUMMARIZED_THROUGH;
    setMessages((m) => [...m, { id: 'u' + Date.now(), turn: last + 1, role: 'user', text }]);
    setPending(true);
    setTimeout(() => {
      const claims = CANNED_REPLIES[replyIdx.current % CANNED_REPLIES.length].map((c) => ({ ...c, id: `${c.id}-${Date.now()}` }));
      replyIdx.current++;
      setMessages((m) => [...m, { id: 'a' + Date.now(), turn: last + 2, role: 'assistant', claims }]);
      setPending(false);
    }, 900);
  };

  const exportDraft = () => {
    const blob = new Blob([toMarkdown(draft.blocks)], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'q3-filings-draft.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const acceptSummary = (points: Claim[], n: number) => {
    const s: Summary = {
      id: 'ds-' + Date.now(),
      label: 'Draft summary',
      scope: `draft · ${n} block${n > 1 ? 's' : ''}`,
      kind: 'draft',
      points,
    };
    setSummaries((x) => [...x, s]);
    setMode({ kind: 'draft' });
    say('Summary saved to the sidebar');
  };

  const onNavSummary = (s: Summary) => {
    if (s.kind === 'conversation') {
      setThread('q3');
      setSummaryOpen(true);
    } else setMode({ kind: 'summary', id: s.id });
  };

  // ⌘Z / Ctrl+Z undo outside text fields
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !/^(INPUT|TEXTAREA)$/.test(t.tagName)) {
        e.preventDefault();
        draft.undo();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [draft]);

  // ----- drag and drop -----
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => {
    const d = e.active.data.current as { type: string; claim?: Claim } | undefined;
    if (d?.type === 'chat' && d.claim) {
      setActive({ type: 'chat', claim: d.claim });
      if (mode.kind !== 'draft') setMode({ kind: 'draft' });
    } else setActive({ type: 'draft', id: String(e.active.id) });
  };

  const onDragOver = (e: DragOverEvent) => {
    if (active?.type !== 'chat') return;
    const over = e.over;
    if (!over) return setDropIndex(null);
    if (over.id === 'draft-drop') return; // keep current index while hovering the placeholder
    if (over.id === 'draft-end') return setDropIndex(draft.blocks.length);
    const i = draft.blocks.findIndex((b) => b.id === over.id);
    if (i < 0) return setDropIndex(null);
    const r = e.active.rect.current.translated;
    const below = r ? r.top + r.height / 2 > over.rect.top + over.rect.height / 2 : false;
    setDropIndex(below ? i + 1 : i);
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (active?.type === 'chat') {
      if (e.over && dropIndex !== null) {
        const b = claimToBlock(active.claim);
        draft.insert([b], dropIndex);
        flash(b.id);
      }
    } else if (active?.type === 'draft' && e.over) {
      const from = draft.blocks.findIndex((b) => b.id === e.active.id);
      const to = draft.blocks.findIndex((b) => b.id === e.over!.id);
      if (from >= 0 && to >= 0) draft.move(from, to);
    }
    setActive(null);
    setDropIndex(null);
  };

  const activeBlockIndex = active?.type === 'draft' ? draft.blocks.findIndex((b) => b.id === active.id) : -1;
  const summaryForMode = mode.kind === 'summary' ? summaries.find((s) => s.id === mode.id) : undefined;
  const crumb = mode.kind === 'source' ? 'sources' : 'draft';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) =>
        active?.type === 'chat'
          ? pointerWithin(args)
          : closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => !String(c.id).startsWith('draft-')) })
      }
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActive(null);
        setDropIndex(null);
      }}
    >
      <div className="app">
        <header className="topbar">
          <span className="topbar__title">Workspace · {THREADS.find((t) => t.id === thread)?.title}</span>
          <span className="badge">mock data</span>
          <span style={{ flex: 1 }} />
          <span className="crumbs mono" aria-label="Panes">
            <span>chat</span> · <span className={crumb === 'sources' ? 'on' : ''}>sources</span> · <span className={crumb === 'draft' ? 'on' : ''}>draft</span>
          </span>
        </header>
        <div className="panes">
          <Nav
            threads={THREADS}
            activeThread={thread}
            onThread={(id) => {
              setThread(id);
              setMode({ kind: 'draft' });
            }}
            summaries={summaries}
            activeSummary={summaryForMode?.id ?? null}
            onSummary={onNavSummary}
          />
          <Chat
            empty={!isQ3}
            messages={messages}
            summaries={summaries.filter((s) => s.kind === 'conversation')}
            summarizedThrough={SUMMARIZED_THROUGH}
            summaryOpen={summaryOpen}
            onToggleSummary={() => setSummaryOpen((x) => !x)}
            pending={pending}
            inDraft={inDraft}
            onOpenSource={openSource}
            onSendToDraft={sendToDraft}
            onSend={sendMessage}
          />
          <aside className="pane workpane" aria-label="Workspace">
            {!isQ3 || mode.kind === 'draft' ? (
              <DraftPane
                empty={!isQ3}
                blocks={draft.blocks}
                canUndo={draft.canUndo}
                dropIndex={dropIndex}
                flashId={flashId}
                onUndo={draft.undo}
                onRemove={draft.remove}
                onEdit={draft.edit}
                onOpenSource={openSource}
                onSummarize={() => setMode({ kind: 'summarize' })}
                onExport={exportDraft}
              />
            ) : mode.kind === 'summarize' ? (
              <SummarizePane blocks={draft.blocks} onOpenSource={openSource} onCancel={backToDraft} onAccept={acceptSummary} />
            ) : mode.kind === 'source' ? (
              <SourcePane id={mode.id} blocks={draft.blocks} onNavigate={openSource} onClose={backToDraft} onQuote={quoteIntoDraft} />
            ) : summaryForMode ? (
              <SummaryView summary={summaryForMode} onClose={backToDraft} onOpenSource={openSource} />
            ) : null}
          </aside>
        </div>
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </div>
      <DragOverlay dropAnimation={null}>
        {active?.type === 'chat' ? (
          <div className="card block block--lifted">
            <span className="grip accent">⠿</span>
            <div className="col block__body">
              <span className="mono">dragging from chat</span>
              <div className="block__text">{active.claim.text}</div>
              <Chips ids={active.claim.sourceIds} onOpen={() => {}} />
            </div>
          </div>
        ) : activeBlockIndex >= 0 ? (
          <div className="card block block--lifted">
            <span className="grip accent">⠿</span>
            <BlockBody block={draft.blocks[activeBlockIndex]} index={activeBlockIndex} expanded={false} onOpenSource={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
