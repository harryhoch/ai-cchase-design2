// Mock data for the three-pane research workspace (design 1b).
// Everything here is fictional: "Northwind Components" is not a real company.

export type SourceKind = 'filing' | 'transcript' | 'web' | 'turn';

export interface Source {
  id: number;
  title: string;
  origin: string; // domain, file name, or "conversation"
  location: string; // page or turn reference
  retrieved: string;
  kind: SourceKind;
  verified: boolean;
  passage: { before: string; quote: string; after: string };
}

export interface Claim {
  id: string;
  text: string;
  sourceIds: number[];
}

export type Message =
  | { id: string; turn: number; role: 'user'; text: string }
  | { id: string; turn: number; role: 'assistant'; claims: Claim[] };

export interface Evidence {
  sourceId: number;
  quote: string;
}

export interface DraftBlock {
  id: string;
  text: string;
  evidence: Evidence[];
  origin: 'chat' | 'quote' | 'seed';
  fromClaim?: string;
}

export interface Summary {
  id: string;
  label: string;
  scope: string; // e.g. "turns 1–22" or "draft · 3 blocks"
  kind: 'conversation' | 'draft';
  points: Claim[];
}

export interface Thread {
  id: string;
  title: string;
}

export const SOURCES: Source[] = [
  {
    id: 1,
    title: 'Form 10-Q, Q3 FY2026',
    origin: 'sec.gov',
    location: 'p.4',
    retrieved: '2026-08-01',
    kind: 'filing',
    verified: true,
    passage: {
      before: 'Results of operations for the three months ended June 30, 2026 are summarized below.',
      quote: 'Net revenue was $412.6 million, an increase of 9.1% compared with $378.2 million in the prior-year quarter, driven primarily by higher unit volumes in the Industrial Sensors segment.',
      after: 'Foreign currency movements reduced reported revenue by approximately 0.8 percentage points.',
    },
  },
  {
    id: 2,
    title: 'Q3 FY2026 earnings call transcript',
    origin: 'ir.northwind.example',
    location: 'p.7',
    retrieved: '2026-08-01',
    kind: 'transcript',
    verified: true,
    passage: {
      before: 'Turning to margins for the quarter —',
      quote: 'gross margin came in at 38.4%, down about 120 basis points sequentially, and the bulk of that is the expedited freight we absorbed in July.',
      after: 'We expect freight to normalize by the end of the fourth quarter.',
    },
  },
  {
    id: 3,
    title: 'Form 10-Q, Q3 FY2026 — segment results',
    origin: 'sec.gov',
    location: 'p.18',
    retrieved: '2026-08-01',
    kind: 'filing',
    verified: true,
    passage: {
      before: 'Segment operating income is presented before unallocated corporate costs.',
      quote: 'Industrial Sensors operating income increased to $61.3 million from $48.9 million, while Consumer Modules operating income declined to $7.2 million from $12.4 million.',
      after: 'The decline in Consumer Modules reflects lower volumes with two large customers.',
    },
  },
  {
    id: 4,
    title: 'Annual report FY2025',
    origin: 'annual-report.pdf',
    location: 'p.14',
    retrieved: '2026-08-02',
    kind: 'filing',
    verified: true,
    passage: {
      before: 'Customer concentration remains a material consideration for the Company.',
      quote: 'Our three largest customers together accounted for approximately 41% of consolidated net revenue in fiscal 2025, and the loss of any one of them could have a material adverse effect on our results.',
      after: 'We continue to pursue diversification through new design wins in adjacent markets.',
    },
  },
  {
    id: 5,
    title: 'Form 8-K — credit agreement amendment',
    origin: 'sec.gov',
    location: 'p.2',
    retrieved: '2026-08-03',
    kind: 'filing',
    verified: true,
    passage: {
      before: 'On July 18, 2026, the Company entered into a second amendment to its revolving credit agreement.',
      quote: 'The amendment increases maximum permitted total net leverage from 3.25x to 3.75x for the fiscal quarters ending September 30, 2026 through March 31, 2027.',
      after: 'All other material terms remain unchanged.',
    },
  },
  {
    id: 6,
    title: 'Q3 FY2026 earnings press release',
    origin: 'ir.northwind.example',
    location: 'p.1',
    retrieved: '2026-08-01',
    kind: 'filing',
    verified: true,
    passage: {
      before: 'Northwind reaffirmed its full-year outlook.',
      quote: 'The Company now expects fiscal 2026 revenue of $1.62 to $1.66 billion, narrowed from the prior range of $1.60 to $1.68 billion.',
      after: 'Guidance assumes no further deterioration in Consumer Modules demand.',
    },
  },
  {
    id: 7,
    title: 'Industry blog: “Sensor makers face a freight squeeze”',
    origin: 'supplychainnotes.example',
    location: 'web',
    retrieved: '2026-08-04',
    kind: 'web',
    verified: false,
    passage: {
      before: 'Several mid-cap component makers have flagged logistics costs this summer.',
      quote: 'Trans-Pacific spot rates rose roughly 30% between May and July, hitting firms that ship finished modules by air when ocean capacity is tight.',
      after: 'Analysts expect rates to ease into the winter.',
    },
  },
  {
    id: 8,
    title: 'Your notes on supplier exposure',
    origin: 'conversation',
    location: 'turn 22',
    retrieved: '2026-08-05',
    kind: 'turn',
    verified: true,
    passage: {
      before: 'From our procurement contact:',
      quote: 'roughly a third of their MEMS die still come from a single fab in Hsinchu, with a second source not qualified until mid-2027.',
      after: 'Treat as unconfirmed until we see it in a filing.',
    },
  },
  {
    id: 9,
    title: 'Form 10-Q, Q3 FY2026 — risk factors',
    origin: 'sec.gov',
    location: 'p.31',
    retrieved: '2026-08-01',
    kind: 'filing',
    verified: true,
    passage: {
      before: 'There have been no material changes to our risk factors except as follows.',
      quote: 'We rely on a limited number of suppliers for certain semiconductor components, and qualification of alternative suppliers can take twelve months or longer.',
      after: 'Any disruption could delay shipments to customers.',
    },
  },
  {
    id: 10,
    title: 'Supplier sustainability disclosure',
    origin: 'fab-partner.example',
    location: 'web',
    retrieved: '2026-08-05',
    kind: 'web',
    verified: false,
    passage: {
      before: 'Our Hsinchu facility serves automotive and industrial customers.',
      quote: 'Capacity at the Hsinchu MEMS line is fully allocated through the first half of 2027.',
      after: 'Expansion is planned for 2028.',
    },
  },
  {
    id: 11,
    title: 'Form 10-Q, Q2 FY2026',
    origin: 'sec.gov',
    location: 'p.5',
    retrieved: '2026-08-01',
    kind: 'filing',
    verified: true,
    passage: {
      before: 'For the three months ended March 31, 2026:',
      quote: 'Gross margin was 39.6%, compared with 37.9% in the prior-year quarter.',
      after: 'The improvement reflected favorable product mix.',
    },
  },
  {
    id: 12,
    title: 'Trade press: “Northwind wins automotive radar socket”',
    origin: 'componentsweekly.example',
    location: 'web',
    retrieved: '2026-08-06',
    kind: 'web',
    verified: false,
    passage: {
      before: 'People familiar with the matter said',
      quote: 'the award could be worth up to $90 million annually once production ramps in 2028.',
      after: 'Northwind declined to comment.',
    },
  },
];

export const sourceById = (id: number) => SOURCES.find((s) => s.id === id)!;

export const evidenceFor = (sourceId: number): Evidence => ({
  sourceId,
  quote: sourceById(sourceId).passage.quote,
});

export const THREADS: Thread[] = [
  { id: 'q3', title: 'Q3 filings research' },
  { id: 'supplier', title: 'Supplier risk memo' },
  { id: 'guidance', title: 'FY26 guidance check' },
];

export const SUMMARIZED_THROUGH = 47;

export const CONVERSATION_SUMMARIES: Summary[] = [
  {
    id: 'sum-1',
    label: 'Revenue & margins',
    scope: 'turns 1–22',
    kind: 'conversation',
    points: [
      { id: 's1p1', text: 'Q3 revenue grew 9.1% year over year to $412.6M, led by Industrial Sensors.', sourceIds: [1, 3] },
      { id: 's1p2', text: 'Gross margin fell ~120 bps sequentially to 38.4%, mostly from expedited freight.', sourceIds: [2, 11] },
      { id: 's1p3', text: 'Consumer Modules operating income nearly halved on weaker volumes from two customers.', sourceIds: [3] },
    ],
  },
  {
    id: 'sum-2',
    label: 'Risk & balance sheet',
    scope: 'turns 23–47',
    kind: 'conversation',
    points: [
      { id: 's2p1', text: 'Top three customers were ~41% of FY25 revenue.', sourceIds: [4] },
      { id: 's2p2', text: 'Leverage covenant was loosened to 3.75x through March 2027.', sourceIds: [5] },
      { id: 's2p3', text: 'A single-fab dependency for MEMS die is plausible but only partly confirmed.', sourceIds: [8, 9, 10] },
    ],
  },
];

export const INITIAL_MESSAGES: Message[] = [
  { id: 'm48', turn: 48, role: 'user', text: 'Before we draft — is the margin drop a one-off, or does it look structural?' },
  {
    id: 'm49',
    turn: 49,
    role: 'assistant',
    claims: [
      { id: 'c49a', text: 'Management attributes most of the 120 bps sequential decline to expedited freight absorbed in July and expects it to normalize by year-end.', sourceIds: [2] },
      { id: 'c49b', text: 'Revenue growth itself was healthy at 9.1%, so the margin pressure is not coming from pricing.', sourceIds: [1] },
    ],
  },
  { id: 'm50', turn: 50, role: 'user', text: 'What is the strongest case that it is structural, then?' },
  {
    id: 'm51',
    turn: 51,
    role: 'assistant',
    claims: [
      { id: 'c51a', text: 'Customer concentration is high — about 41% of revenue from three customers — which limits pricing power when costs rise.', sourceIds: [4, 6] },
      { id: 'c51b', text: 'The covenant amendment gives headroom through March 2027, suggesting management expects pressure to persist for several quarters.', sourceIds: [5] },
      { id: 'c51c', text: 'Freight-rate spikes hit the whole sector this summer, which supports the temporary reading.', sourceIds: [7] },
    ],
  },
];

export const INITIAL_DRAFT: DraftBlock[] = [
  {
    id: 'd1',
    text: 'Q3 revenue rose 9.1% year over year to $412.6M on Industrial Sensors volume.',
    evidence: [evidenceFor(1)],
    origin: 'seed',
  },
  {
    id: 'd2',
    text: 'Consumer Modules is the weak segment, with operating income down from $12.4M to $7.2M.',
    evidence: [evidenceFor(3)],
    origin: 'seed',
  },
  {
    id: 'd3',
    text: 'Concentration risk is material: three customers drove ~41% of revenue, and guidance assumes no further Consumer Modules decline.',
    evidence: [evidenceFor(4), evidenceFor(6)],
    origin: 'seed',
  },
  {
    id: 'd4',
    text: 'Management is likely to cut FY26 guidance next quarter.',
    evidence: [],
    origin: 'seed',
  },
];

// Canned replies for the mock composer. Cycled in order.
export const CANNED_REPLIES: Claim[][] = [
  [
    { id: 'r1a', text: 'The supplier risk factor says qualifying an alternative supplier can take twelve months or longer.', sourceIds: [9] },
    { id: 'r1b', text: 'Your procurement note and the fab’s own disclosure both point to mid-2027 before relief, but neither is confirmed in a Northwind filing.', sourceIds: [8, 10] },
  ],
  [
    { id: 'r2a', text: 'Prior-quarter gross margin was 39.6%, so Q3’s 38.4% reverses the Q2 mix improvement.', sourceIds: [11, 2] },
  ],
  [
    { id: 'r3a', text: 'An unconfirmed trade report puts a new automotive radar award at up to $90M a year from 2028.', sourceIds: [12] },
    { id: 'r3b', text: 'FY26 revenue guidance was narrowed to $1.62–1.66B rather than cut.', sourceIds: [6] },
  ],
];
