import { useEffect, useMemo, useState } from 'react';
import type { Claim, DraftBlock } from '../data';
import { Chips } from './Chip';

type Length = 'short' | 'medium' | 'long';

interface Props {
  blocks: DraftBlock[];
  onOpenSource: (id: number) => void;
  onCancel: () => void;
  onAccept: (points: Claim[], includedCount: number) => void;
}

// Mock "summarizer": deterministic rewrite of included blocks, keeping each block's sources.
function summarize(blocks: DraftBlock[], length: Length): Claim[] {
  return blocks.map((b) => {
    let text = b.text;
    if (length === 'short') {
      const cut = text.search(/[,;:—]/);
      text = cut > 20 ? text.slice(0, cut).trim() + '.' : text;
    } else if (length === 'long' && b.evidence[0]) {
      const q = b.evidence[0].quote;
      text = `${text.replace(/\.$/, '')} — “${q.length > 90 ? q.slice(0, 90).trimEnd() + '…' : q}”`;
    }
    return { id: 'p-' + b.id, text, sourceIds: b.evidence.map((e) => e.sourceId) };
  });
}

export function SummarizePane({ blocks, onOpenSource, onCancel, onAccept }: Props) {
  const [included, setIncluded] = useState<Set<string>>(() => new Set(blocks.filter((b) => b.evidence.length).map((b) => b.id)));
  const [length, setLength] = useState<Length>('medium');
  const [shown, setShown] = useState(0);
  const [run, setRun] = useState(0);

  const inBlocks = blocks.filter((b) => included.has(b.id));
  const out = useMemo(() => summarize(inBlocks, length), [inBlocks.map((b) => b.id).join(), length]); // eslint-disable-line react-hooks/exhaustive-deps
  const done = shown >= out.length;
  const unsourced = out.filter((p) => !p.sourceIds.length).length;

  // Simulated streaming: reveal one sentence at a time.
  useEffect(() => {
    setShown(0);
    const t = setInterval(() => setShown((n) => (n >= out.length ? n : n + 1)), 320);
    return () => clearInterval(t);
  }, [out, run]);

  const toggle = (id: string) =>
    setIncluded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="workpane__inner">
      <div className="hd">
        <span className="label">Summarizing {blocks.length} blocks</span>
        <button className="iconbtn" aria-label="Cancel, back to draft" onClick={onCancel}>
          ✕
        </button>
      </div>
      <div className="split">
        <div className="col split__in">
          <span className="label">In</span>
          {blocks.map((b, i) => (
            <label key={b.id} className={'card card--compact sumin' + (included.has(b.id) ? '' : ' sumin--off')}>
              <input type="checkbox" checked={included.has(b.id)} onChange={() => toggle(b.id)} />
              <span className="col" style={{ gap: 2 }}>
                <span className={'mono' + (b.evidence.length ? '' : ' warn')}>
                  claim {i + 1}
                  {!b.evidence.length && ' · no evidence ⚠'}
                </span>
                <span className="sumin__text">{b.text}</span>
              </span>
            </label>
          ))}
          <span className="mono" style={{ marginTop: 'auto' }}>
            {included.size} of {blocks.length} included
          </span>
        </div>
        <div className="col split__out">
          <div className="hd">
            <span className="label">Out</span>
            <div className="seg" role="radiogroup" aria-label="Summary length">
              {(['short', 'medium', 'long'] as Length[]).map((l) => (
                <button key={l} role="radio" aria-checked={length === l} className={'seg__btn' + (length === l ? ' seg__btn--on' : '')} onClick={() => setLength(l)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="card card--out" aria-live="polite">
            {out.length === 0 && <span className="mono">Include at least one block.</span>}
            <p className="sumout">
              {out.slice(0, shown).map((pt) => (
                <span key={pt.id}>
                  {pt.text} {pt.sourceIds.length ? <Chips ids={pt.sourceIds} onOpen={onOpenSource} /> : <span className="mono warn">⚠ unsourced</span>}{' '}
                </span>
              ))}
              {!done && <span className="caret" aria-hidden />}
            </p>
            <div className={'mono' + (unsourced ? ' warn' : ' accent')} style={{ marginTop: 'auto' }}>
              {unsourced ? `${unsourced} sentence${unsourced > 1 ? 's have' : ' has'} no source` : 'every sentence keeps its source'}
            </div>
          </div>
          <div className="row">
            <button className="btn" onClick={() => setRun((r) => r + 1)}>
              Regenerate
            </button>
            <button className="btn btn--accent" disabled={!done || !out.length} onClick={() => onAccept(out, inBlocks.length)}>
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
