import type { Bloc } from '../types'

/** The five blocs of the Republic's House. Vectors are triangulated against
 * data/parties.ts so each sits plausibly among its real referents. */
export const blocs: Bloc[] = [
  {
    id: 'bloc-labour',
    name: 'The Labour Front',
    short: 'Labour',
    blurb:
      'The party of the pits, the docks and the union hall — a machine for turning wages into votes and votes into nationalisation. Its members sing on the way into the lobby. Drawn from Attlee’s Labour of 1945, the German SPD, and the trade-union movement that built them both.',
    composites: ['UK Labour Party (1945)', 'SPD (Germany)', 'the trade-union movement'],
    vector: { economic: -0.65, fiscal: -0.55, social: -0.3, identity: -0.2, law_order: 0 },
    seats: 38,
    playable: true,
  },
  {
    id: 'bloc-national',
    name: 'The National Party',
    short: 'National',
    blurb:
      'The party of the counting-house and the county seat: sound money, safe streets, and a deep suspicion of anyone in a hurry. It has governed longer than anyone can remember and regards this as evidence. Drawn from the post-war UK Conservatives, the German CDU, and the mid-century Republican establishment.',
    composites: ['UK Conservative Party', 'CDU (Germany)', 'US mid-century Republican Party'],
    vector: { economic: 0.5, fiscal: 0.4, social: 0.3, identity: 0.45, law_order: 0.4 },
    seats: 40,
    playable: true,
  },
  {
    id: 'bloc-reform',
    name: 'The Reform Union',
    short: 'Reform',
    blurb:
      'The radical centre and the House’s permanent kingmaker: twenty-two seats, no majority in sight, and a price for everything. Free trade, free conscience, tidy books. Drawn from the British Liberals of the People’s Budget era, the German FDP, and the continent’s social-liberal parties.',
    composites: ['UK Liberal Party', 'FDP (Germany)', 'European social-liberal parties'],
    vector: { economic: -0.05, fiscal: 0.25, social: -0.35, identity: -0.2, law_order: -0.1 },
    seats: 22,
    playable: true,
  },
  {
    id: 'bloc-vanguard',
    name: "The People's Vanguard",
    short: 'Vanguard',
    blurb:
      'What the Labour Front looks like to a man who has stopped waiting: one general strike from the new Republic, and no patience for the old one’s procedures. Drawn from militant syndicalism and the early Comintern parties.',
    composites: ['militant syndicalism', 'early Comintern parties'],
    vector: { economic: -0.85, fiscal: -0.8, social: -0.5, identity: -0.6, law_order: -0.25 },
    seats: 0,
    emergent: {
      axis: 'economic',
      pole: 'left',
      threshold: 0.25,
      seedSeats: 12,
      spawnEventId: 'ev-spawn-left',
    },
    playable: false,
  },
  {
    id: 'bloc-ironleague',
    name: 'The Iron League',
    short: 'Iron League',
    blurb:
      'Marching boots, coloured shirts, and a programme with one plank: the nation, purified. It holds the House in contempt and a dozen of its seats all the same. Drawn from the interwar leagues — the British Union of Fascists and the Croix-de-Feu.',
    composites: ['British Union of Fascists', 'Croix-de-Feu (France)'],
    vector: { economic: 0.3, fiscal: 0.2, social: 0.75, identity: 0.9, law_order: 0.85 },
    seats: 0,
    emergent: {
      axis: 'identity',
      pole: 'right',
      threshold: 0.25,
      seedSeats: 12,
      spawnEventId: 'ev-spawn-right',
    },
    playable: false,
  },
]
