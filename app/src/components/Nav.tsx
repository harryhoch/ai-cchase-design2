import type { Summary, Thread } from '../data';

interface Props {
  threads: Thread[];
  activeThread: string;
  onThread: (id: string) => void;
  summaries: Summary[];
  activeSummary: string | null;
  onSummary: (s: Summary) => void;
}

export function Nav({ threads, activeThread, onThread, summaries, activeSummary, onSummary }: Props) {
  return (
    <nav className="pane nav" aria-label="Threads and summaries">
      <div className="label">Threads</div>
      <ul className="navlist">
        {threads.map((t) => (
          <li key={t.id}>
            <button
              className={'navitem' + (t.id === activeThread ? ' navitem--active' : '')}
              aria-current={t.id === activeThread ? 'page' : undefined}
              onClick={() => onThread(t.id)}
            >
              {t.title}
            </button>
          </li>
        ))}
      </ul>
      <div className="label" style={{ marginTop: 16 }}>
        Summaries
      </div>
      <ul className="navlist">
        {summaries.map((s) => (
          <li key={s.id}>
            <button
              className={'navitem' + (s.id === activeSummary ? ' navitem--active' : '')}
              onClick={() => onSummary(s)}
            >
              <span>{s.label}</span>
              <span className="mono navitem__meta">{s.scope}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
