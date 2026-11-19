import type { Summary } from '../data';
import { Chips } from './Chip';

export function SummaryView({ summary, onClose, onOpenSource }: { summary: Summary; onClose: () => void; onOpenSource: (id: number) => void }) {
  return (
    <div className="workpane__inner">
      <div className="hd">
        <span className="label label--accent">
          {summary.label} · {summary.scope}
        </span>
        <button className="iconbtn" aria-label="Close summary, back to draft" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="card card--out">
        <p className="sumout">
          {summary.points.map((pt) => (
            <span key={pt.id}>
              {pt.text} {pt.sourceIds.length ? <Chips ids={pt.sourceIds} onOpen={onOpenSource} /> : <span className="mono warn">⚠ unsourced</span>}{' '}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
