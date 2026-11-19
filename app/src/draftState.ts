import { useCallback, useReducer } from 'react';
import type { DraftBlock } from './data';

type Action =
  | { type: 'insert'; blocks: DraftBlock[]; index?: number }
  | { type: 'move'; from: number; to: number }
  | { type: 'remove'; id: string }
  | { type: 'edit'; id: string; text: string }
  | { type: 'undo' };

interface State {
  blocks: DraftBlock[];
  past: DraftBlock[][];
}

const LIMIT = 50;

function reducer(state: State, action: Action): State {
  if (action.type === 'undo') {
    if (!state.past.length) return state;
    return { blocks: state.past[state.past.length - 1], past: state.past.slice(0, -1) };
  }
  let next: DraftBlock[];
  switch (action.type) {
    case 'insert': {
      const i = action.index ?? state.blocks.length;
      next = [...state.blocks.slice(0, i), ...action.blocks, ...state.blocks.slice(i)];
      break;
    }
    case 'move': {
      if (action.from === action.to) return state;
      next = [...state.blocks];
      const [b] = next.splice(action.from, 1);
      next.splice(action.to, 0, b);
      break;
    }
    case 'remove':
      next = state.blocks.filter((b) => b.id !== action.id);
      break;
    case 'edit': {
      const cur = state.blocks.find((b) => b.id === action.id);
      if (!cur || cur.text === action.text) return state;
      next = state.blocks.map((b) => (b.id === action.id ? { ...b, text: action.text } : b));
      break;
    }
  }
  return { blocks: next, past: [...state.past, state.blocks].slice(-LIMIT) };
}

let seq = 0;
export const newBlockId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

export function useDraft(initial: DraftBlock[]) {
  const [state, dispatch] = useReducer(reducer, { blocks: initial, past: [] });
  return {
    blocks: state.blocks,
    canUndo: state.past.length > 0,
    insert: useCallback((blocks: DraftBlock[], index?: number) => dispatch({ type: 'insert', blocks, index }), []),
    move: useCallback((from: number, to: number) => dispatch({ type: 'move', from, to }), []),
    remove: useCallback((id: string) => dispatch({ type: 'remove', id }), []),
    edit: useCallback((id: string, text: string) => dispatch({ type: 'edit', id, text }), []),
    undo: useCallback(() => dispatch({ type: 'undo' }), []),
  };
}
