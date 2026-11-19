import { sourceById } from '../data';

interface Props {
  id: number;
  onOpen: (id: number) => void;
  active?: boolean;
}

export function Chip({ id, onOpen, active }: Props) {
  const s = sourceById(id);
  return (
    <button
      type="button"
      className={'chip' + (active ? ' chip--active' : '') + (s.verified ? '' : ' chip--unverified')}
      title={`${s.title} · ${s.origin} ${s.location}${s.verified ? '' : ' · unverified'}`}
      aria-label={`Open source ${id}: ${s.title}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(id);
      }}
    >
      {id}
    </button>
  );
}

export function Chips({ ids, onOpen }: { ids: number[]; onOpen: (id: number) => void }) {
  return (
    <span className="chips">
      {ids.map((id) => (
        <Chip key={id} id={id} onOpen={onOpen} />
      ))}
    </span>
  );
}
