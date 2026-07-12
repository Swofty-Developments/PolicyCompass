import type { TermsEvent } from '../types'

/** Sentinel blocId: the effects engine resolves it to the player's own party at apply time. */
const PARTY = 'party'

// Front pages — 4 scandals + 2 radical-spawn world pages. Broadsheet voice, about the
// player; every composite cites its real precedents like bill sources.
export const frontpageEvents: TermsEvent[] = [
  {
    id: 'ev-scandal-bribe',
    kind: 'frontpage',
    title: 'THE MEMBER FOR HALLOWAY NAMED IN THE ADMIRALTY COAL LEASES',
    body:
      'This newspaper has obtained the private ledger of an agent of the Consolidated Fuel Syndicate. Against the season in which the Admiralty’s reserve collieries were leased without tender, it records a retainer of two thousand, entered in a clerk’s fair hand: ‘to the Member for Halloway, for questions asked and offices rendered.’\n\n' +
      'The agent has since sworn an affidavit, which is held at this office. He states that the sum was passed in banknotes, in a private room above a club whose name we withhold for the present. The Member’s bankers decline to comment. The House meets on Thursday, and will want to know what the honourable Member knew — and when he was paid to know it.',
    byline: 'THE REPUBLIC INTELLIGENCER',
    options: [
      {
        id: 'face',
        label: 'DEMAND THE COMMITTEE',
        detail: 'Testify on oath before the House. Vindication or ruin — the record will say which.',
        gamble: {
          base: 0.5,
          perConviction: 0.006,
          perTrust: 0.003,
          success: {
            text: 'The ledger falls apart under examination — dates that contradict the division lists, a clerk who cannot say who dictated the entry. The committee finds nothing proven; the sketch-writers find a Member who did not blink.',
            effects: { trust: 7, conviction: 6, setFlags: { scandal: true } },
          },
          failure: {
            text: 'The clerk holds up; the dates hold; the affidavit is read into the record. The committee stops short of the word bribery, which is somehow worse. Your own benches study their order papers as you pass.',
            effects: {
              trust: -10,
              relations: [{ blocId: PARTY, delta: -12 }],
              setFlags: { scandal: true },
            },
          },
        },
      },
      {
        id: 'hush',
        label: 'BUY THE AFFIDAVIT',
        detail: 'The syndicate will settle it quietly and the paper will spike the story. The editor keeps the affidavit in his safe.',
        effects: { conviction: -12, buryScandal: true, setFlags: { scandal: true } },
      },
      {
        id: 'resign',
        label: 'RESIGN THE WHIP',
        detail: 'Sit out the storm below the gangway. It is a demotion, and it is survivable.',
        effects: { resignOffice: true, conviction: 8, trust: -4, setFlags: { scandal: true } },
      },
    ],
    precedents: [
      {
        name: 'The Teapot Dome scandal, 1922–23',
        url: 'https://en.wikipedia.org/wiki/Teapot_Dome_scandal',
      },
      {
        name: 'The cash-for-questions affair, 1994',
        url: 'https://en.wikipedia.org/wiki/Cash-for-questions_affair',
      },
    ],
  },
  {
    id: 'ev-scandal-affair',
    kind: 'frontpage',
    title: 'THE MEMBER AND THE DANCER: QUESTIONS FOR HALLOWAY',
    body:
      'The Member for Halloway has for some months enjoyed the acquaintance of Miss Vera Lane, of the Alcazar ballet — an acquaintance conducted at a country house whose weekend registers this newspaper has seen. Miss Lane’s circle is a wide one. It includes, our readers will wish to know, the naval attaché of a foreign power.\n\n' +
      'We make no allegation touching the security of the Republic. We record only the registers, the dates, and the fact that the Member sat through the fleet estimates in the same season. A personal statement to the House would be the customary course. The House, in our experience, forgives much — but it does not forgive being lied to.',
    byline: 'THE REPUBLIC INTELLIGENCER',
    options: [
      {
        id: 'face',
        label: 'MAKE THE PERSONAL STATEMENT',
        detail: 'Stand at the box and give the House the whole of it, on your honour. Statements of this kind are remembered — one way or the other.',
        gamble: {
          base: 0.5,
          perConviction: 0.006,
          perTrust: 0.003,
          success: {
            text: 'You give the House everything — names, dates, the folly of it, plainly. The chamber, braced for a denial, is disarmed by a confession. The sketch-writers reach for their better adjectives; the whips exhale.',
            effects: { trust: 5, conviction: 7, setFlags: { scandal: true } },
          },
          failure: {
            text: 'Your account is measured against the registers and found wanting in one particular — a single weekend, flatly denied, flatly proven. The word for that has hanged better men. Miss Lane’s memoirs are announced within the fortnight.',
            effects: {
              trust: -9,
              relations: [{ blocId: PARTY, delta: -10 }],
              setFlags: { scandal: true },
            },
          },
        },
      },
      {
        id: 'hush',
        label: 'SETTLE HER MEMOIRS',
        detail: 'Buy the serial rights and the letters through an intermediary. Her letters stay in the editor’s safe — for exactly as long as he pleases.',
        effects: { conviction: -12, buryScandal: true, setFlags: { scandal: true } },
      },
    ],
    precedents: [
      { name: 'The Profumo affair, 1963', url: 'https://en.wikipedia.org/wiki/Profumo_affair' },
    ],
  },
  {
    id: 'ev-scandal-expenses',
    kind: 'frontpage',
    title: 'THE MEMBER FOR HALLOWAY’S ACCOUNTS, ITEMISED',
    body:
      'A clerk of the House Fees Office has copied for this newspaper four years of the Member for Halloway’s claims upon the public purse, and we publish the particulars unabridged in our inner pages. The Republic, it emerges, has paid for the repointing of an orchard wall at a cottage the Member visits at Whitsun; for a rose arbour; for the mole-catcher, twice.\n\n' +
      'Each claim, the Fees Office confirms, was within the rules. That is precisely what the public will not forgive: the rules are the scandal, and the Member’s signature is on every page. Every desk in this office has had a letter about the mole-catcher. There is no version of these figures that reads well aloud — and they will be read aloud.',
    byline: 'THE REPUBLIC INTELLIGENCER',
    options: [
      {
        id: 'hush',
        label: 'REPAY IN FULL, SAY NOTHING',
        detail: 'A banker’s draft to the Fees Office and no statement. The clerk who copied the ledger still has the original, and the editor knows it.',
        effects: { conviction: -12, buryScandal: true, setFlags: { scandal: true } },
      },
      {
        id: 'resign',
        label: 'RESIGN THE WHIP',
        detail: 'Take it standing up: repay, apologise from below the gangway, and let the party pass by on the other side.',
        effects: { resignOffice: true, conviction: 8, trust: -4, setFlags: { scandal: true } },
      },
    ],
    precedents: [
      {
        name: 'The parliamentary expenses scandal, 2009',
        url: 'https://en.wikipedia.org/wiki/United_Kingdom_parliamentary_expenses_scandal',
      },
    ],
  },
  {
    id: 'ev-scandal-leak',
    kind: 'frontpage',
    title: 'THE LAW OFFICER’S LETTER: WHO ORDERED THE LEAK?',
    body:
      'A confidential letter of the Solicitor-General — finding ‘material inaccuracies’ in the case lately put about by Mr Edmund Vane — reached the evening editions on Thursday within four hours of its signature. Law officers’ advice does not walk to the printers by itself.\n\n' +
      'The trail, this newspaper can state, runs through the Member for Halloway’s own department: the copy bears its registry stamp. Mr Vane’s friends say the instruction came from the top of that department and demand the Member’s head; the Member’s friends observe that Mr Vane’s friends have been remarkably quick with the registry’s private markings. An inquiry is unavoidable. What it finds will depend a great deal on who is believed under oath.',
    byline: 'THE REPUBLIC INTELLIGENCER',
    options: [
      {
        id: 'face',
        label: 'STAND UP THE INQUIRY',
        detail: 'Open the registry, produce the minutes, testify first. If the trail runs where you believe it runs, it ends at Mr Vane’s door.',
        gamble: {
          base: 0.5,
          perConviction: 0.006,
          perTrust: 0.003,
          success: {
            text: 'The registry gives up its minute-book: the instruction was drafted in your department, but over an initial that is not yours — a hand that reports, when the ink is traced, to Mr Vane. The inquiry says so in one dry paragraph, which the sketch-writers set to music.',
            effects: {
              trust: 6,
              conviction: 6,
              setFlags: { scandal: true, 'leak-implicated-vane': true },
            },
          },
          failure: {
            text: 'The minute-book is incomplete where it matters most, and a junior official recalls, under oath, a corridor instruction he took to come from you. Nothing is proven; everything is believed. The party does not forgive a minister who wounds a colleague through the newspapers.',
            effects: {
              trust: -10,
              relations: [{ blocId: PARTY, delta: -14 }],
              setFlags: { scandal: true },
            },
          },
        },
      },
      {
        id: 'hush',
        label: 'LET THE PRESS OFFICER CARRY IT',
        detail: 'She acted, it will be said, on her own initiative. She has kept her own minute of the instruction, and the editor knows where to find her.',
        effects: { conviction: -12, buryScandal: true, setFlags: { scandal: true } },
      },
      {
        id: 'resign',
        label: 'RESIGN THE SEALS',
        detail: 'Go before you are sent for. The House has an old respect for a clean wound.',
        effects: { resignOffice: true, conviction: 8, trust: -4, setFlags: { scandal: true } },
      },
    ],
    precedents: [
      { name: 'The Westland affair, 1986', url: 'https://en.wikipedia.org/wiki/Westland_affair' },
    ],
    gates: { office: ['minister', 'leader'] },
  },
  {
    id: 'ev-spawn-left',
    kind: 'frontpage',
    title: 'NEW PARTY FOUNDED: THE PEOPLE’S VANGUARD',
    body:
      'At a congress in the Corn Exchange concluded late last night, delegates of the dock, rail and foundry unions, together with the expelled left branches of the Labour Front, constituted themselves THE PEOPLE’S VANGUARD. The founding resolution, carried by a show of raised fists, declares parliament ‘an instrument to be used as the crowbar is used’ and commits the party to the general strike as a political weapon.\n\n' +
      'Twelve members of the House have taken the new whip, and sat this morning below the gangway, singing. The Labour Front’s chairman calls it a splinter. The Vanguard’s secretary, asked for his programme, replied that any man could read it in the price of bread.',
    byline: 'THE REPUBLIC INTELLIGENCER',
    options: [
      {
        id: 'note',
        label: 'NOTE THE NEW WHIP',
        detail: 'Twelve seats below the gangway, and a new arithmetic to every division.',
        effects: { setFlags: { 'spawn-left': true } },
      },
    ],
    precedents: [
      { name: 'The Congress of Tours, 1920', url: 'https://en.wikipedia.org/wiki/Congress_of_Tours' },
      {
        name: 'The CPGB Unity Convention, 1920',
        url: 'https://en.wikipedia.org/wiki/Communist_Party_of_Great_Britain',
      },
    ],
  },
  {
    id: 'ev-spawn-right',
    kind: 'frontpage',
    title: 'NEW PARTY FOUNDED: THE IRON LEAGUE',
    body:
      'The veterans’ league that has drilled in the drill-halls these past months declared itself a political party yesterday, from a platform dressed in flags and flanked by men in grey shirts standing at attention. Colonel Vickery, its founder, told a crowd of forty thousand that the parties of the House had ‘talked the Republic to the edge of a grave’, and that THE IRON LEAGUE would march it back — in step, and in order.\n\n' +
      'Twelve members of the House have crossed to the League’s whip, most from the National benches. Its stewards salute; its programme fits on a postcard: order, work, the flag. This newspaper notes that postcards have carried worse, and been delivered.',
    byline: 'THE REPUBLIC INTELLIGENCER',
    options: [
      {
        id: 'note',
        label: 'NOTE THE NEW WHIP',
        detail: 'Grey shirts in the gallery, twelve seats on the floor, and stewards at the gates.',
        effects: { setFlags: { 'spawn-right': true } },
      },
    ],
    precedents: [
      {
        name: 'The British Union of Fascists, 1932',
        url: 'https://en.wikipedia.org/wiki/British_Union_of_Fascists',
      },
      { name: 'The Croix-de-Feu, 1927', url: 'https://en.wikipedia.org/wiki/Croix-de-Feu' },
    ],
  },
]
