import type { Mandate, TermsEvent } from '../types'

/** Patron mandates (run-modifier relics, max 2 held — engine-enforced)
 * and the calling-card events that offer them. */
export const mandates: Mandate[] = [
  {
    id: 'mandate-pressbaron',
    title: 'The Proprietor’s Favour',
    patron: 'Lord Corran',
    text: 'Corran’s mastheads take your part when a story breaks against you, and his safes keep what wants keeping. One page of the ledger stays reserved for the proprietor, permanently.',
    composites: ['Lord Beaverbrook', 'William Randolph Hearst'],
    hooks: { scandalBonus: 0.15, reservesPromiseSlot: true },
  },
  {
    id: 'mandate-union',
    title: 'The Federated Trades Compact',
    patron: 'The Congress of Federated Trades',
    text: 'The lodges stand with you whenever the House divides leftward on the mills and the men who work them. Cross them on that ground twice and the compact is ash.',
    composites: ['The Trades Union Congress', 'the Gladstone–MacDonald pact of 1903'],
    hooks: {
      divisionBonus: { axis: 'economic', pole: 'left', blocId: 'bloc-labour', relations: 6 },
      crossLimit: { axis: 'economic', pole: 'left', blocId: 'bloc-labour', limit: 2 },
    },
  },
  {
    id: 'mandate-industry',
    title: 'The Manufacturers’ Subscription',
    patron: 'The Consolidated Manufacturers’ Association',
    text: 'A standing subscription for the health of the public purse, credited the day you sign. The Labour Front reads the signature too, and does not forget it.',
    composites: ['The Federation of British Industries (1916)'],
    hooks: { treasury: 10, relationsOnAccept: [{ blocId: 'bloc-labour', delta: -8 }] },
  },
]

export const mandateEvents: TermsEvent[] = [
  {
    id: 'ev-mandate-pressbaron',
    kind: 'mandate',
    title: 'Lord Corran presents his compliments',
    body:
      'A card, heavy enough to stop a door: CORRAN — proprietor, The Morning Sentinel, The Examiner, and forty provincial titles. Beneath the engraving, in blue pencil:\n\n' +
      '‘I have made three governments and buried two. My editors can be brought to admire you, and my safes are famously roomy when a story wants keeping. In exchange I ask one standing kindness, to be named when I have need of it. Dine Thursday. — C.’',
    byline: 'delivered by hand, Corran House',
    options: [
      {
        id: 'accept',
        label: 'Dine on Thursday',
        detail: 'His mastheads soften what breaks against you; one page of your ledger is his to name.',
        effects: { grantMandate: 'mandate-pressbaron' },
      },
      {
        id: 'decline',
        label: 'Send regrets, engraved',
        detail: 'The Labour benches note, with rare warmth, whose table you refused.',
        effects: { relations: [{ blocId: 'bloc-labour', delta: 2 }] },
      },
    ],
    precedents: [
      {
        name: 'Lord Beaverbrook’s Empire Crusade and the United Empire Party, 1930–31',
        url: 'https://spartacus-educational.com/United_Empire_Party.htm',
      },
      {
        name: 'William Randolph Hearst, proprietor and kingmaker',
        url: 'https://en.wikipedia.org/wiki/William_Randolph_Hearst',
      },
    ],
  },
  {
    id: 'ev-mandate-union',
    kind: 'mandate',
    title: 'A card from the Federated Trades',
    body:
      'No engraving; a typed card on union stock, under the letterhead of the Congress of Federated Trades, signed in a firm schoolroom hand:\n\n' +
      '‘The lodges have read your record and find it wants improving. Stand with the mills when the House divides on them, and half a million members stand with you at the doors. We do not ask twice, and we do not forgive twice either. The second time a friend crosses a picket, he was never a friend.’',
    byline: 'A. Grieve, General Secretary',
    options: [
      {
        id: 'accept',
        label: 'Sign the compact',
        detail: 'The lodges at your back on the mills — and a tally kept when you cross them.',
        effects: { grantMandate: 'mandate-union' },
      },
      {
        id: 'decline',
        label: 'Decline, with compliments to the lodges',
        detail: 'The National benches approve of a member who keeps his own counsel, and their dividends.',
        effects: { relations: [{ blocId: 'bloc-national', delta: 2 }] },
      },
    ],
    precedents: [
      {
        name: 'The General Strike of 1926',
        url: 'https://en.wikipedia.org/wiki/1926_United_Kingdom_general_strike',
      },
      {
        name: 'The Gladstone–MacDonald pact, 1903',
        url: 'https://en.wikipedia.org/wiki/Gladstone%E2%80%93MacDonald_pact',
      },
    ],
  },
  {
    id: 'ev-mandate-industry',
    kind: 'mandate',
    title: 'The Manufacturers’ Association requests the honour',
    body:
      'Cream stock, gilt edge, the crest of the Consolidated Manufacturers’ Association — a gear and a sheaf — above copperplate:\n\n' +
      '‘The Association observes that governments are expensive and elections more so. A standing subscription is proposed, for the general health of the public purse, no conditions attached beyond the natural sympathy of gentlemen. The Labour Front will call it bought government. The Association calls it bookkeeping.’',
    byline: 'by favour of the Honorary Secretary',
    options: [
      {
        id: 'accept',
        label: 'Accept the subscription',
        detail: 'The public purse breathes easier; the lodges read the signature.',
        effects: { grantMandate: 'mandate-industry' },
      },
      {
        id: 'decline',
        label: 'Return the cheque, flap unbroken',
        detail: 'Word reaches the lodges by evening. They approve of little; they approve of this.',
        effects: { relations: [{ blocId: 'bloc-labour', delta: 2 }] },
      },
    ],
    precedents: [
      {
        name: 'The Federation of British Industries, 1916',
        url: 'https://en.wikipedia.org/wiki/Federation_of_British_Industries',
      },
      {
        name: 'CBI predecessor archive, Modern Records Centre',
        url: 'https://warwick.ac.uk/services/library/mrc/research_guides/cbi/',
      },
    ],
  },
]
