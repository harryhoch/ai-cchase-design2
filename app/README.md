# Research workspace — design 1b (three-pane)

Implementation of option **1b** from `../project/Chatbot Wireframes.dc.html`:
threads/summaries nav · conversation · draft, where the draft is built by dragging
claim + evidence cards out of the chat. Reordering edits the deliverable, not the chat history.

All data is **mock** (`src/data.ts`, fictional company). There is no LLM; the composer
cycles canned replies and "Summarize draft" is a deterministic rewrite.

```
npm install
npm run dev      # http://localhost:5173
npm run build
```

## What maps to the wireframe

| Wireframe | Implementation |
|---|---|
| Main (1b) | `App.tsx`, `Nav.tsx`, `Chat.tsx`, `DraftPane.tsx` |
| 1b-B summarization as a reviewable step | `SummarizePane.tsx`: include/exclude blocks, length, streamed output, regenerate/accept; unsourced sentences flagged |
| 1b-C citation drill-down (third pane swaps to source) | `SourcePane.tsx`: ‹ › through 12 sources, highlighted passage, quote into draft, "N claims use this" |

## Interactions
- Drag any sentence (claim) in an assistant message into the draft; a drop zone shows where it lands.
- "→ Send to draft" adds a message's claims (skips ones already in the draft, marked ✓ in chat).
- Reorder draft blocks by the ⠿ handle (mouse, or focus + Space / arrows / Space).
- Double-click or ✎ to edit a claim; ✕ to remove; ⟲ undo or ⌘/Ctrl+Z.
- Click any numbered chip to open that source in the third pane.
- "turns 1–47 summarized ▾" expands the conversation summaries; accepted draft summaries appear in the sidebar.
- Export downloads Markdown with numbered references.

## Deviations from the wireframe
- "Open full doc" became "Copy citation" (no real documents behind the mock).
- Other threads in the sidebar are empty placeholders.
- Desktop only (min width 960px), light theme only.
