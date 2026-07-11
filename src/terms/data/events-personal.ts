import type { TermsEvent } from '../types'

/** Margaret Halloway’s four letters — the run’s only conviction recovery (+10).
 * Letters carry no figures and no meter names; the hand does the work. */
export const personalEvents: TermsEvent[] = [
  {
    id: 'ev-letter-first',
    kind: 'letter',
    title: 'My dearest — the house is too quiet',
    body:
      'They say the chamber has a sound to it, like the sea in a shell, and that men who sit in it long enough begin to hear it in their sleep. Come home before you do.\n\n' +
      'I read your first week in the papers and looked for you in it, and found instead a stranger in a very good coat. You will tell me the coat was necessary. Perhaps. Only remember that the town did not send a coat to the capital — it sent the man I married, and it will want him back unaltered.\n\n' +
      'Be kind where you can and stubborn where it matters, and when you cannot tell which is which, write to me. The plums have come early. Everyone here believes in you, which is a heavy thing to carry. Carry it anyway.',
    byline: 'ever your Margaret',
    options: [
      {
        id: 'answer',
        label: 'Answer it tonight',
        detail: 'Some letters should not wait for the recess.',
        effects: { conviction: 5, setFlags: { letter1: true } },
      },
      {
        id: 'pocket',
        label: 'Fold it into your breast pocket',
        detail: 'Carry it into the chamber tomorrow.',
        effects: { conviction: 5, setFlags: { letter1: true } },
      },
    ],
    precedents: [
      {
        name: 'Clementine Churchill to Winston, 27 June 1940 — “urbanity, kindness and if possible Olympic calm”',
        url: 'https://winstonchurchill.org/publications/churchill-bulletin/bulletin-144-jun-2020/uxorial-advice/',
      },
    ],
    gates: { notFlag: 'letter1' },
  },
  {
    id: 'ev-letter-betrayal',
    kind: 'letter',
    title: 'My dear — the sketch reached us first',
    body:
      'The morning paper arrived before your letter did, which I mind more than anything printed in it. The sketch-writer is paid by the inch to be clever, and ‘turned his coat’ is the sort of clever that costs him nothing at all.\n\n' +
      'Your mother telephoned in a state. I told her what I tell you now: I knew that man before the House had his measure, and his mind was never for sale by the yard. A man may change his vote for good reasons. He should be able to say them at his own table without looking at his shoes.\n\n' +
      'Come home when the session allows, and say them to me. I will know if they are yours.',
    byline: '— M.',
    options: [
      {
        id: 'plainly',
        label: 'Write the reasons out, plainly',
        detail: 'If they hold on paper, they hold.',
        effects: { conviction: 5, setFlags: { letter2: true } },
      },
      {
        id: 'friday',
        label: 'Take the early train on Friday',
        detail: 'Some accounts are settled at the table, not the despatch box.',
        effects: { conviction: 5, setFlags: { letter2: true } },
      },
    ],
    precedents: [
      {
        name: 'Harry Truman’s 1,300 “Dear Bess” letters, 1910–1959',
        url: 'https://www.trumanlibrary.gov/education/presidential-inquiries/dear-bess',
      },
      {
        name: 'Clementine Churchill’s counsel, collected',
        url: 'https://en.wikiquote.org/wiki/Clementine_Churchill',
      },
    ],
    gates: { flag: 'weathervane', notFlag: 'letter2' },
  },
  {
    id: 'ev-letter-scandal',
    kind: 'letter',
    title: 'Dearest — I have seen the front pages',
    body:
      'You will want to know what is said in the shops here. Less than you fear, and by people who matter more than the ones printing it. Mrs Aldous asked after your health. That was the whole of the inquisition.\n\n' +
      'When they came for better men than these, the wives sat down and wrote to first ministers. I am willing — my pen is full — but I suspect you would rather I aimed it at you, so here it is: you did not become another man on the morning they printed it. They may take the office. The man is not theirs unless you hand him across the table yourself.\n\n' +
      'Eat something. Sleep. Then write me the truth of it, all of it, the flattering parts last.',
    byline: 'your Margaret, unresigned',
    options: [
      {
        id: 'truth',
        label: 'Write her the whole of it',
        detail: 'All of it. The flattering parts last.',
        effects: { conviction: 5, setFlags: { letter3: true } },
      },
      {
        id: 'keep',
        label: 'Keep the letter with the clippings',
        detail: 'So the file reads both ways.',
        effects: { conviction: 5, setFlags: { letter3: true } },
      },
    ],
    precedents: [
      {
        name: 'Clementine Churchill’s plea to Asquith after the Dardanelles, May 1915',
        url: 'https://www.loc.gov/exhibits/churchill/wc-affairs.html',
      },
      {
        name: 'Clementine Churchill’s counsel, collected',
        url: 'https://en.wikiquote.org/wiki/Clementine_Churchill',
      },
    ],
    gates: { flag: 'scandal', notFlag: 'letter3' },
  },
  {
    id: 'ev-letter-eve',
    kind: 'letter',
    title: 'My dear heart — before tomorrow',
    body:
      'They tell me the House means to make history tomorrow, which is what it is called when nobody can sleep. Here the news is that the kitchen chimney draws again and the dog has ruined the second-best blanket, and I find I can sleep perfectly well.\n\n' +
      'They have measured you for years now — the papers, the party, the men on the benches — and they have only ever measured the Member. I married the man. Whatever I had to give this long undertaking of yours was love and loyalty, and the account stands open.\n\n' +
      'Whatever they decide you are tomorrow, come home afterwards and be it here first.',
    byline: 'ever, M.',
    options: [
      {
        id: 'sleep',
        label: 'There is nothing to decide tonight',
        detail: 'Sleep. The House keeps until morning.',
        effects: { conviction: 5, setFlags: { letter4: true } },
      },
    ],
    precedents: [
      {
        name: 'Denis Thatcher — “All I could produce, small as it may be, was love and loyalty”',
        url: 'https://en.wikipedia.org/wiki/Denis_Thatcher',
      },
      {
        name: 'Harry Truman’s 1,300 “Dear Bess” letters, 1910–1959',
        url: 'https://www.trumanlibrary.gov/education/presidential-inquiries/dear-bess',
      },
    ],
    gates: { notFlag: 'letter4' },
  },
]
