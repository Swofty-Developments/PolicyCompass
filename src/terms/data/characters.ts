import type { Character } from '../types'

export const characters: Character[] = [
  {
    id: 'char-vane',
    name: 'Edmund Vane',
    role: 'rival',
    blurb:
      'The coming man of whichever bench he happens to stand on. Entered the House the same day you did and has treated it as a staircase since; his speeches are quotable, his loyalties negotiable, and his count of your mistakes exact. Drawn from Benjamin Disraeli’s long ambush of the front bench and Michael Heseltine’s march on a sitting leader.',
    composites: ['Benjamin Disraeli', 'Michael Heseltine'],
    portrait: '/terms/cast/vane.jpg',
  },
  {
    id: 'char-spouse',
    name: 'Margaret Halloway',
    role: 'spouse',
    blurb:
      'Keeps the house in Halloway, the constituency’s confidence, and the only honest ledger of your conscience. Writes at night, after the papers have gone to bed, and is never wrong about what a division cost you. Drawn from the political-spouse memoir tradition: Clementine Churchill and Denis Thatcher.',
    composites: ['Clementine Churchill', 'Denis Thatcher'],
    portrait: '/terms/cast/spouse.jpg',
  },
  {
    id: 'char-corran',
    name: 'Lord Corran',
    role: 'patron',
    blurb:
      'Owns the morning edition, the evening edition, and by his own account the weather in between. His backing arrives as a printed card and is repaid in kind — or in kindling. Drawn from the great press barons: Lord Beaverbrook and William Randolph Hearst.',
    composites: ['Lord Beaverbrook', 'William Randolph Hearst'],
    portrait: '/terms/cast/corran.jpg',
  },
  {
    id: 'char-whip',
    name: 'The Chief Whip',
    role: 'whip',
    blurb:
      'Has no first name anyone dares use. Counts the House twice before breakfast, knows what every member wants and what every member fears, and files the two together. His notes are short because they need to be. Drawn from Edward Heath’s years in the Whips’ Office and Lyndon Johnson’s mastery of the Senate count.',
    composites: ['Edward Heath (Chief Whip, 1955–59)', 'Lyndon B. Johnson (Senate majority leader)'],
    portrait: '/terms/cast/whip.jpg',
  },
  {
    id: 'char-officer',
    name: 'The Returning Officer',
    role: 'officer',
    blurb:
      'Has certified every writ and read every count in Halloway within living memory, always in the same unhurried voice. Regards members as a crop the constituency sends up and the record eventually gathers in. Drawn from the Westminster tradition of the returning officer and the Speaker’s chair — William Court Gully presiding.',
    composites: ['the Westminster returning-officer tradition', 'Speaker William Court Gully'],
    portrait: '/terms/cast/officer.jpg',
  },
  {
    id: 'char-pollster',
    name: 'The Pollster',
    role: 'pollster',
    blurb:
      'Counts the Republic the way other men count birds — patiently, in all weathers, and with a growing suspicion that the flock knows it is being watched. His memoranda arrive typed, unsigned and unarguable. Drawn from the early scientific pollsters, George Gallup and Mass-Observation, and Sir John Lubbock’s habit of measuring everything he loved.',
    composites: ['George Gallup', 'Mass-Observation', 'Sir John Lubbock'],
    portrait: '/terms/cast/pollster.jpg',
  },
]
