import { useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { sourceById, type DraftBlock } from '../data';
import { Chip } from './Chip';

interface Props {
  blocks: DraftBlock[];
  canUndo: boolean;
  dropIndex: number | null; // where a chat claim would land, while dragging from chat
  flashId: string | null;
  onUndo: () => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onOpenSource: (id: number) => void;
  onSummarize: () => void;
  onExport: () => void;
  empty?: boolean;
}

export function BlockLabel({ index, block }: { index: number; block: DraftBlock }) {
  const n = block.evidence.length;
  return (
    <span className={'mono' + (n === 0 ? ' warn' : '')}>
      claim {index + 1}
      {n === 0 ? ' · no evidence ⚠' : n > 1 ? ` · ${n} evidence` : ''}
    </span>
  );
}

export function EvidenceCard({ sourceId, quote, onOpen }: { sourceId: number; quote: string; onOpen: (id: number) => void }) {
  const s = sourceById(sourceId);
  return (
    <div className="evidence">
      <div className="evidence__quote">“{quote}”</div>
      <div className="row" style={{ gap: 6 }}>
        <Chip id={sourceId} onOpen={onOpen} />
        <span className="mono">
          {s.origin} {s.location}
          {!s.verified && ' · unverified'}
        </span>
      </div>
    </div>
  );
}

export function BlockBody({
  block,
  index,
  expanded,
  onOpenSource,
  editing,
  onEditDone,
}: {
  block: DraftBlock;
  index: number;
  expanded: boolean;
  onOpenSource: (id: number) => void;
  editing?: boolean;
  onEditDone?: (text: string | null) => void;
}) {
  const [val, setVal] = useState(block.text);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (editing) {
      setVal(block.text);
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing, block.text]);
  const showCards = block.evidence.length === 1 || expanded;
  return (
    <div className="col block__body">
      <BlockLabel index={index} block={block} />
      {editing ? (
        <textarea
          ref={ref}
          className="block__edit"
          value={val}
          aria-label={`Edit claim ${index + 1}`}
          onChange={(e) => setVal(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onEditDone?.(val.trim() || block.text);
            }
            if (e.key === 'Escape') onEditDone?.(null);
          }}
          onBlur={() => onEditDone?.(val.trim() || block.text)}
        />
      ) : (
        <div className="block__text">{block.text}</div>
      )}
      {showCards
        ? block.evidence.map((e) => <EvidenceCard key={e.sourceId} {...e} onOpen={onOpenSource} />)
        : block.evidence.length > 1 && (
            <div className="row" style={{ gap: 4 }}>
              {block.evidence.map((e) => (
                <Chip key={e.sourceId} id={e.sourceId} onOpen={onOpenSource} />
              ))}
            </div>
          )}
    </div>
  );
}

function SortableBlock({
  block,
  index,
  flash,
  onRemove,
  onEdit,
  onOpenSource,
}: {
  block: DraftBlock;
  index: number;
  flash: boolean;
  onRemove: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onOpenSource: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: 'draft' },
  });
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        'card block' +
        (block.evidence.length === 0 ? ' block--weak' : '') +
        (isDragging ? ' block--placeholder' : '') +
        (flash ? ' block--flash' : '')
      }
      onClick={() => block.evidence.length > 1 && setExpanded((x) => !x)}
      onDoubleClick={() => setEditing(true)}
    >
      <button
        ref={setActivatorNodeRef}
        className="grip"
        aria-label={`Reorder claim ${index + 1}. Press space to lift, arrows to move.`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <BlockBody
        block={block}
        index={index}
        expanded={expanded}
        onOpenSource={onOpenSource}
        editing={editing}
        onEditDone={(t) => {
          setEditing(false);
          if (t !== null) onEdit(block.id, t);
        }}
      />
      <div className="block__tools">
        <button
          className="iconbtn"
          aria-label={`Edit claim ${index + 1}`}
          title="Edit (or double-click)"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
        >
          ✎
        </button>
        <button
          className="iconbtn"
          aria-label={`Remove claim ${index + 1}`}
          title="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(block.id);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function DropZone({ index }: { index: number }) {
  const { setNodeRef } = useDroppable({ id: 'draft-drop' });
  return (
    <div ref={setNodeRef} className="drop">
      <span className="mono accent">drop here — becomes claim {index + 1}</span>
    </div>
  );
}

function EndZone({ hint }: { hint: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'draft-end' });
  return (
    <div ref={setNodeRef} className={'endzone' + (hint ? ' endzone--hint' : '')}>
      {hint && <span className="mono">Drag claims here from the conversation, or use “→ Send to draft”.</span>}
    </div>
  );
}

export function DraftPane(p: Props) {
  if (p.empty) {
    return (
      <div className="workpane__inner">
        <div className="hd">
          <span className="label">Draft</span>
        </div>
        <div className="empty">No draft for this thread in the mock.</div>
      </div>
    );
  }
  const items = p.blocks.map((b) => b.id);
  const unsourced = p.blocks.filter((b) => !b.evidence.length).length;
  return (
    <div className="workpane__inner">
      <div className="hd">
        <span className="label">
          Draft · {p.blocks.length} block{p.blocks.length === 1 ? '' : 's'}
        </span>
        <button className="linkbtn mono" onClick={p.onUndo} disabled={!p.canUndo} title="Undo (⌘Z)">
          ⟲ undo
        </button>
      </div>
      <div className="draft__list">
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {p.blocks.map((b, i) => (
            <div key={b.id} className="contents">
              {p.dropIndex === i && <DropZone index={i} />}
              <SortableBlock
                block={b}
                index={i}
                flash={p.flashId === b.id}
                onRemove={p.onRemove}
                onEdit={p.onEdit}
                onOpenSource={p.onOpenSource}
              />
            </div>
          ))}
        </SortableContext>
        {p.dropIndex === p.blocks.length && <DropZone index={p.blocks.length} />}
        <EndZone hint={p.blocks.length === 0 && p.dropIndex === null} />
      </div>
      {unsourced > 0 && (
        <div className="mono warn">
          {unsourced} claim{unsourced > 1 ? 's have' : ' has'} no evidence
        </div>
      )}
      <div className="row">
        <button className="btn" style={{ flex: 1 }} onClick={p.onSummarize} disabled={!p.blocks.length}>
          Summarize draft
        </button>
        <button className="btn" onClick={p.onExport} disabled={!p.blocks.length}>
          Export
        </button>
      </div>
    </div>
  );
}
