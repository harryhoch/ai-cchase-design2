import { useEffect, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Claim, Message, Summary } from '../data';
import { Chips } from './Chip';

interface Props {
  messages: Message[];
  summaries: Summary[];
  summarizedThrough: number;
  summaryOpen: boolean;
  onToggleSummary: () => void;
  pending: boolean;
  inDraft: Set<string>;
  onOpenSource: (id: number) => void;
  onSendToDraft: (claims: Claim[]) => void;
  onSend: (text: string) => void;
  empty?: boolean;
}

function DraggableClaim({ claim, inDraft, onOpenSource }: { claim: Claim; inDraft: boolean; onOpenSource: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `chat:${claim.id}`,
    data: { type: 'chat', claim },
  });
  return (
    <span
      ref={setNodeRef}
      className={'claim' + (isDragging ? ' claim--dragging' : '') + (inDraft ? ' claim--indraft' : '')}
      title={inDraft ? 'Already in draft — drag to add again' : 'Drag into the draft'}
      {...attributes}
      {...listeners}
      aria-roledescription="draggable claim"
    >
      <span className="claim__grip" aria-hidden>
        ⠿
      </span>
      {claim.text} <Chips ids={claim.sourceIds} onOpen={onOpenSource} />
      {inDraft && (
        <span className="claim__check" aria-label="in draft">
          &nbsp;✓
        </span>
      )}{' '}
    </span>
  );
}

export function Chat(p: Props) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const totalTurns = p.messages.length ? p.messages[p.messages.length - 1].turn : 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [p.messages.length, p.pending]);

  useEffect(() => {
    if (p.summaryOpen) summaryRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [p.summaryOpen]);

  const submit = () => {
    const t = text.trim();
    if (!t || p.pending) return;
    p.onSend(t);
    setText('');
  };

  if (p.empty) {
    return (
      <section className="pane chat" aria-label="Conversation">
        <div className="hd">
          <span className="label">Conversation</span>
        </div>
        <div className="empty">This thread has no data in the mock. Switch back to “Q3 filings research”.</div>
      </section>
    );
  }

  return (
    <section className="pane chat" aria-label="Conversation">
      <div className="hd">
        <span className="label">Conversation</span>
        <span className="mono">
          {totalTurns} turns · summarized ×{p.summaries.length}
        </span>
      </div>

      <div className="chat__scroll">
        <div ref={summaryRef}>
          <button className="divider" aria-expanded={p.summaryOpen} onClick={p.onToggleSummary}>
            <span className="divider__rule" />
            <span className="mono">
              turns 1–{p.summarizedThrough} summarized {p.summaryOpen ? '▴' : '▾'}
            </span>
            <span className="divider__rule" />
          </button>
          {p.summaryOpen && (
            <div className="convsum">
              {p.summaries.map((s) => (
                <div key={s.id} className="convsum__card">
                  <div className="label label--accent">
                    {s.label} · {s.scope}
                  </div>
                  <ul>
                    {s.points.map((pt) => (
                      <li key={pt.id}>
                        {pt.text} <Chips ids={pt.sourceIds} onOpen={p.onOpenSource} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="mono">Original turns 1–{p.summarizedThrough} are hidden behind these summaries.</div>
            </div>
          )}
        </div>

        {p.messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="msg msg--user">
              <div className="bubble">{m.text}</div>
            </div>
          ) : (
            <div key={m.id} className="msg msg--assistant">
              <span className="avatar" aria-hidden>
                A
              </span>
              <div className="msg__body">
                <p className="msg__text">
                  {m.claims.map((c) => (
                    <DraggableClaim key={c.id} claim={c} inDraft={p.inDraft.has(c.id)} onOpenSource={p.onOpenSource} />
                  ))}
                </p>
                <div className="row msg__actions">
                  <button className="btn btn--sm btn--accent" onClick={() => p.onSendToDraft(m.claims)}>
                    → Send to draft
                  </button>
                  <button className="btn btn--sm" onClick={() => p.onOpenSource(m.claims[0].sourceIds[0])}>
                    Sources
                  </button>
                  <span className="mono">turn {m.turn}</span>
                </div>
              </div>
            </div>
          ),
        )}
        {p.pending && (
          <div className="msg msg--assistant">
            <span className="avatar" aria-hidden>
              A
            </span>
            <div className="typing" aria-label="Assistant is responding">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          rows={1}
          value={text}
          placeholder="Ask about the filings…"
          aria-label="Message"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button className="btn btn--icon" type="submit" disabled={!text.trim() || p.pending} aria-label="Send">
          ↑
        </button>
      </form>
    </section>
  );
}
