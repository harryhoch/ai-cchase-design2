import { useState } from 'react';
import { SOURCES, sourceById, type DraftBlock } from '../data';
import { Chip } from './Chip';

interface Props {
  id: number;
  blocks: DraftBlock[];
  onNavigate: (id: number) => void;
  onClose: () => void;
  onQuote: (id: number) => void;
}

export function SourcePane({ id, blocks, onNavigate, onClose, onQuote }: Props) {
  const s = sourceById(id);
  const idx = SOURCES.findIndex((x) => x.id === id);
  const prev = SOURCES[(idx - 1 + SOURCES.length) % SOURCES.length].id;
  const next = SOURCES[(idx + 1) % SOURCES.length].id;
  const usedBy = blocks.map((b, i) => (b.evidence.some((e) => e.sourceId === id) ? i + 1 : 0)).filter(Boolean);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const cite = `[${s.id}] ${s.title}, ${s.origin}, ${s.location}. Retrieved ${s.retrieved}. “${s.passage.quote}”`;
    try {
      await navigator.clipboard.writeText(cite);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked; ignore */
    }
  };

  return (
    <div className="workpane__inner" aria-label={`Source ${id}`}>
      <div className="hd">
        <span className="mono">
          source {idx + 1} of {SOURCES.length}
        </span>
        <span className="row" style={{ gap: 2 }}>
          <button className="iconbtn" aria-label="Previous source" onClick={() => onNavigate(prev)}>
            ‹
          </button>
          <button className="iconbtn" aria-label="Next source" onClick={() => onNavigate(next)}>
            ›
          </button>
        </span>
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Chip id={id} onOpen={() => {}} active />
        <h2 className="source__title">{s.title}</h2>
        <button className="iconbtn" style={{ marginLeft: 'auto' }} aria-label="Close source, back to draft" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="mono">
        {s.origin} · {s.location} · retrieved {s.retrieved}
        {!s.verified && <span className="badge badge--warn">unverified</span>}
      </div>
      <div className="passage">
        <p>{s.passage.before}</p>
        <blockquote>
          <mark>{s.passage.quote}</mark>
        </blockquote>
        <p>{s.passage.after}</p>
      </div>
      <div className="row">
        <button className="btn btn--accent" onClick={() => onQuote(id)}>
          Quote into draft
        </button>
        <button className="btn" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy citation'}
        </button>
        <span className="mono" style={{ marginLeft: 'auto' }}>
          {usedBy.length === 0
            ? 'not used in draft'
            : `${usedBy.length} claim${usedBy.length > 1 ? 's use' : ' uses'} this (${usedBy.map((n) => '#' + n).join(', ')})`}
        </span>
      </div>
    </div>
  );
}
