import type { Act, Branch, Scenario } from '../types'
import { blocs } from './blocs'
import { characters } from './characters'
import { allEvents, allMandates } from './events'

// ---- branches -----------------------------------------------------------------

const promotionBranch: Branch = {
  id: 'branch-promotion',
  title: 'A Letter from the Chief Whip',
  letter:
    'You survived a term and an election, which is one more than most manage. The Prime Minister is rebuilding the front bench and your name has come up twice — once from me. The Treasury wants a spare pair of hands that can count. The Home Office wants a spine. Or you may refuse the whip’s shilling altogether and sit out where the pay is worse and the conscience keeps its own books. Choose before the House meets.',
  byline: '— The Chief Whip',
  options: [
    {
      id: 'promote-treasury',
      label: 'Accept the Treasury',
      detail: 'Minister at the Exchequer. A docket of money bills, and the markets watching every figure.',
      office: 'minister',
      portfolio: 'treasury',
      nextActId: 'act-2-treasury',
    },
    {
      id: 'promote-home',
      label: 'Accept the Home Office',
      detail: 'Minister at the Home Department. Order, borders, and the House’s darker instincts.',
      office: 'minister',
      portfolio: 'home',
      nextActId: 'act-2-home',
    },
    {
      id: 'refuse-whip',
      label: 'Refuse the whip',
      detail: 'The Wilderness. No office and no bargains — a conscience docket, and your own name on every vote.',
      office: 'backbencher',
      portfolio: 'wilderness',
      nextActId: 'act-2-wilderness',
      effects: { conviction: 5 },
    },
  ],
}

const leadershipBranch: Branch = {
  id: 'branch-leadership',
  title: 'The Leadership Falls Vacant',
  letter:
    'The leader is finished — the benches knew it before he did. Edmund Vane declared within the hour; he has the papers, half the front bench, and the smile. There is one other name the men keep saying quietly, and it is yours. Declare, and the benches will count themselves before any ballot is printed — Vane does not fight counts he has already lost. Serve, and you hold high office under him owing nothing worse than loyalty. Thursday, either way.',
  byline: '— The Chief Whip',
  options: [
    {
      id: 'stand-vane',
      label: 'Stand against Vane',
      detail: 'Declare, and Vane withdraws before the count. The party is yours to whip, and the third term is fought from the front.',
      office: 'leader',
      nextActId: 'act-3',
    },
    {
      id: 'serve-loyal',
      label: 'Serve loyally',
      detail: 'Decline the contest. Keep your office under Vane, and keep your hands clean of his knife.',
      office: 'minister',
      nextActId: 'act-3',
    },
  ],
}

// ---- acts -----------------------------------------------------------------------
// Curated slots pin { billId, expectTitle } verbatim against the live pool; every
// bill with a fiscal or economic loading carries its authored treasury delta.

const actOne: Act = {
  id: 'act-1',
  title: 'Term I — The Backbench',
  epigraph: 'They will tell you the maiden speech matters. It is the maiden vote they file.',
  election: true,
  branch: promotionBranch,
  slots: [
    { kind: 'bill', billId: 'bill-23', expectTitle: 'Civil Partnership Act 2004' },
    {
      kind: 'bill',
      billId: 'bill-100',
      expectTitle: 'The Firearms Act: A National Registry for Every Gun, Including Rifles and Shotguns',
      whip: {
        ratify: true,
        note: 'Your first outing. The Registry has every front bench’s word behind it — vote aye and be seen voting. — W.',
      },
    },
    { kind: 'event', eventId: 'ev-memo-pollster' },
    {
      kind: 'bill',
      billId: 'bill-12',
      expectTitle: 'Finance Bill: Graduated Taxes to Fund Old-Age Pensions',
      treasury: -6,
    },
    {
      kind: 'bill',
      billId: 'bill-60',
      expectTitle: 'The Digital Fair Repair Act: Making Manufacturers Share Repair Manuals, Parts, and Tools',
      treasury: -2,
    },
    { kind: 'event', eventId: 'ev-mandate-pressbaron' },
    { kind: 'fill' },
    { kind: 'event', eventId: 'ev-letter-first' },
    {
      kind: 'bill',
      billId: 'bill-92',
      expectTitle:
        'The Quota Law: Reserved Federal-University Seats for Black, Brown, and Indigenous Students',
      treasury: -3,
    },
    {
      kind: 'bill',
      billId: 'bill-14',
      expectTitle: 'The Code for Fiscal Stability: The Golden Rule and the Sustainable Investment Rule',
      whip: {
        ratify: true,
        note: 'Sound money is the one hymn all three benches sing. The Rule passes with or without you; see that it is with. — W.',
      },
      treasury: 4,
    },
    { kind: 'fill' },
    { kind: 'event', eventId: 'ev-telegram-bankrun' },
  ],
}

const actTreasury: Act = {
  id: 'act-2-treasury',
  title: 'Term II — The Treasury',
  epigraph: 'The Exchequer has no friends, only creditors.',
  election: true,
  branch: leadershipBranch,
  slots: [
    { kind: 'bill', billId: 'bill-2', expectTitle: 'Coal Industry Nationalisation Act 1946', treasury: -7 },
    {
      kind: 'bill',
      billId: 'bill-15',
      expectTitle: 'The Debt Brake: A Constitutional Cap on Government Spending',
      whip: {
        ratify: true,
        note: 'You wanted the Treasury; the Brake is the Treasury. If the Chancellor’s own bench wavers, the House smells blood. — W.',
      },
      treasury: 7,
    },
    { kind: 'event', eventId: 'ev-mandate-industry' },
    { kind: 'bill', billId: 'bill-13', expectTitle: 'Child Tax Credit Expansion (Tax Year 2021)', treasury: -5 },
    { kind: 'fill', axis: 'social' },
    {
      kind: 'bill',
      billId: 'bill-62',
      expectTitle: 'The Ultra-Millionaire Tax Act: A Yearly Tax on Fortunes Above $50 Million',
      whip: {
        ratify: false,
        note: 'The markets have a rope round our neck this week. Kill the wealth levy before they hang us with it. Nothing personal. — W.',
      },
      treasury: -8,
    },
    { kind: 'event', eventId: 'ev-letter-betrayal' },
    { kind: 'bill', billId: 'bill-59', expectTitle: 'The Railways Act 1993: Privatisation of British Rail', treasury: 6 },
    { kind: 'fill' },
    {
      kind: 'bill',
      billId: 'bill-18',
      expectTitle: 'Voter Approval for Tax Increases and a Constitutional Cap on Government Revenue Growth',
      treasury: 6,
    },
    { kind: 'event', eventId: 'ev-telegram-currency' },
  ],
}

const actHome: Act = {
  id: 'act-2-home',
  title: 'Term II — The Home Office',
  epigraph: 'Order is what the House asks for when it is frightened; the bill for it arrives later.',
  election: true,
  branch: leadershipBranch,
  slots: [
    {
      kind: 'bill',
      billId: 'bill-105',
      expectTitle: 'Serious Violence Reduction Orders: Suspicionless Stop and Search of Convicted Knife Carriers',
      whip: {
        ratify: true,
        note: 'Your bill, your box, your name on the order paper. The Department does not lose its first division. — W.',
      },
    },
    { kind: 'bill', billId: 'bill-44', expectTitle: 'The Violent Crime Control and Law Enforcement Act', treasury: -4 },
    { kind: 'event', eventId: 'ev-mandate-union' },
    {
      kind: 'bill',
      billId: 'bill-21',
      expectTitle: 'Decriminalisation of the Personal Use and Possession of All Drugs (Law 30/2000)',
    },
    { kind: 'fill' },
    { kind: 'bill', billId: 'bill-99', expectTitle: 'The Pretrial Fairness Act: Ending Cash Bail in Illinois', treasury: -2 },
    { kind: 'event', eventId: 'ev-letter-betrayal' },
    { kind: 'bill', billId: 'bill-91', expectTitle: 'An Act Prohibiting the Concealment of the Face in Public Space' },
    { kind: 'fill' },
    {
      kind: 'bill',
      billId: 'bill-37',
      expectTitle: 'Retroactively End Birthright Citizenship for Children of Irregular Migrants',
      whip: { ratify: true, note: 'Cabinet’s line in the sand. Hold it. I do not ask twice. — W.' },
    },
    { kind: 'event', eventId: 'ev-telegram-genstrike' },
  ],
}

const actWilderness: Act = {
  id: 'act-2-wilderness',
  title: 'Term II — The Wilderness',
  epigraph: 'The whip is withdrawn. The conscience is not.',
  election: true,
  branch: leadershipBranch,
  slots: [
    {
      kind: 'bill',
      billId: 'bill-20',
      expectTitle: "Legalise Euthanasia on a Patient's Request",
      whip: {
        ratify: false,
        note: 'You are out, not gone. Strike this one quietly and there are men here who will remember you kindly. — W.',
      },
    },
    { kind: 'bill', billId: 'bill-84', expectTitle: 'Divorce, Dissolution and Separation Act 2020: No-Fault Divorce' },
    { kind: 'event', eventId: 'ev-letter-betrayal' },
    { kind: 'bill', billId: 'bill-27', expectTitle: "Enshrine the Unborn's Right to Life in the Constitution" },
    { kind: 'fill', axis: 'economic' },
    {
      kind: 'bill',
      billId: 'bill-19',
      expectTitle: "On the Protection of Women's Health — Legalizing Abortion on Request",
      whip: {
        ratify: false,
        note: 'They say it may come down to a single seat — imagine that. The machine wants it dead. Do this and come home. — W.',
      },
      treasury: -2,
    },
    { kind: 'event', eventId: 'ev-mandate-union' },
    {
      kind: 'bill',
      billId: 'bill-79',
      expectTitle: 'Universal National Service: A Compulsory Civic Programme for Every Teenager',
    },
    { kind: 'fill' },
    {
      kind: 'bill',
      billId: 'bill-97',
      expectTitle: 'Federal Popular Initiative "Against the Construction of Minarets"',
    },
    { kind: 'event', eventId: 'ev-mandate-industry' },
  ],
}

const actThree: Act = {
  id: 'act-3',
  title: 'Term III — The House at Bay',
  epigraph: 'Every career ends in the House at bay; the fortunate choose which siege.',
  election: false,
  slots: [
    {
      kind: 'bill',
      billId: 'bill-52',
      expectTitle:
        'The Federal Jobs Guarantee Development Act: A Pilot Guaranteeing Public Jobs in High-Unemployment Communities',
      treasury: -7,
    },
    {
      kind: 'bill',
      billId: 'bill-66',
      expectTitle: 'A Constitutional Balanced Budget Amendment: No Federal Deficits Without a Three-Fifths Vote',
      whip: {
        ratify: true,
        note: 'The Amendment is the Government and the Government is the Amendment. All else is weather. — W.',
      },
      treasury: 7,
    },
    { kind: 'event', eventId: 'ev-letter-scandal' },
    { kind: 'bill', billId: 'bill-36', expectTitle: 'An Act to Limit Immigration Through National-Origin Quotas' },
    { kind: 'fill', axis: 'social' },
    { kind: 'bill', billId: 'bill-47', expectTitle: 'State of Exception: Emergency Suspension of Legal Protections' },
    { kind: 'event', eventId: 'ev-telegram-warscare' },
    {
      kind: 'bill',
      billId: 'bill-1',
      expectTitle: 'On the Pace of Collectivisation and State Assistance to Collective-Farm Construction',
      whip: { ratify: false, note: 'For God’s sake. Whatever you have become out there, you are not this. Strike it. — W.' },
      treasury: -9,
    },
    { kind: 'fill' },
    {
      kind: 'bill',
      billId: 'bill-9',
      expectTitle: 'Decree Law 3500: The Individual Capitalisation Pension System',
      treasury: 6,
    },
    { kind: 'event', eventId: 'ev-letter-eve' },
  ],
}

// ---- scenario --------------------------------------------------------------------

export const scenario: Scenario = {
  id: 'member-for-halloway',
  title: 'The Member for Halloway',
  intro:
    'OFFICE OF THE RETURNING OFFICER, HALLOWAY. To the Member-elect: the count is certified and the writ returned — Halloway sends you to the House. Two matters remain before the oath. First, the benches: no member sits alone, and the party whose whip you accept will colour every vote you cast and every kindness you are owed. Second, the ground beneath you: a member is only ever as safe as their seat. Choose both as though your career depends on them. It does.',
  seatBlurbs: {
    safe: 'The party’s machine seat. A majority built by other hands over forty years — you would have to work at losing it. But what the machine gives, the machine prices: defiance of the whip from a safe seat is remembered twice as hard.',
    marginal:
      'Your own ground, held by your own name and a majority that would fit in a tram. Every promise matters here — the ledger keeps room for one more — and the whip’s hand rests lighter on a member the party might lose.',
  },
  blocs,
  characters,
  events: allEvents,
  mandates: allMandates,
  acts: {
    'act-1': actOne,
    'act-2-treasury': actTreasury,
    'act-2-home': actHome,
    'act-2-wilderness': actWilderness,
    'act-3': actThree,
  },
  firstActId: 'act-1',
  zeitgeist: { economic: -0.05, fiscal: 0, social: -0.05, identity: 0.05, law_order: 0.05 },
}
