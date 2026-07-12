import type { Bloc, DialogueChoice, DialogueLine, DialogueScene, SeatType } from '../types'

/** First sentence of a blurb — the one-line flavour on a reply slip. */
function firstSentence(s: string): string {
  const i = s.indexOf('. ')
  return i === -1 ? s : s.slice(0, i + 1)
}

/** Plain-consequence reply-slip lines for the founding parties: one line on
 *  what each stands for, one on whose orders you accept by joining. */
const partyDetails: Record<string, string> = {
  'bloc-labour':
    'The left: unions, public ownership, welfare for working people. Join, and it is Labour’s whip who sends your voting orders.',
  'bloc-national':
    'The right: order, business, the nation. Join, and it is the National whip who sends your voting orders.',
  'bloc-reform':
    'The centre: personal liberties and reform, few seats but kingmakers. Join, and it is Reform’s whip who sends your voting orders.',
}

/** The prologue conversation: the officer receives you, the parties pitch,
 *  Margaret frames the ground. Its two choices resolve party and seat. */
export function prologueScene(blocs: Bloc[], seatBlurbs: Record<SeatType, string>): DialogueScene {
  const partyChoice: DialogueChoice = {
    prompt: 'Pick your party. Whose hand do you shake?',
    options: blocs.map((b) => ({
      id: b.id,
      label: b.name,
      detail: partyDetails[b.id] ?? firstSentence(b.blurb),
    })),
  }
  const seatChoice: DialogueChoice = {
    prompt: 'Which seat will you take?',
    options: [
      { id: 'safe', label: 'The safe seat — the machine’s gift', detail: seatBlurbs.safe },
      { id: 'marginal', label: 'The marginal seat — your own ground', detail: seatBlurbs.marginal },
    ],
  }
  return {
    id: 'scene-prologue',
    beats: [
      {
        speaker: 'narrator',
        text: 'The Members’ Lobby, past midnight. A gentleman in black silk finds your name in his ledger and rules a line beneath it: elected.',
      },
      {
        speaker: 'char-officer',
        text: 'The Member for Halloway, I presume. Plainly, then: you have won your election, and you now hold a seat in the House — the parliament of this Republic.',
      },
      {
        speaker: 'char-officer',
        text: 'From tonight, every vote you cast is written into the public record, which forgets nothing and forgives less. My congratulations — I am required to offer them once.',
      },
      {
        speaker: 'narrator',
        text: 'In the margin, a later hand: the Republic is invented, but every bill you will vote on is real — actual laws from actual history, word for word.',
      },
      {
        speaker: 'char-officer',
        text: 'Two choices remain before you take the oath, and they will shape your whole career. The first is your party.',
      },
      {
        speaker: 'char-officer',
        text: 'Every party keeps a Chief Whip — its enforcer, the one who sends you orders on how to vote. Join a party and you accept its orders; cross them and your own side turns on you. They have smelt a new member. Here they come.',
      },
      {
        speaker: 'char-whip',
        text: 'The National Party: order, business, the nation — sound money and no sudden movements. Shake my hand and your career will be looked after. Decline it, and you will be looked at.',
      },
      {
        speaker: 'narrator',
        text: 'A man from the Labour Front takes your other elbow, smelling of print and pit-smoke. “Unions, public ownership, a decent wage for the people who do the work. The pits and the docks sent us up — ask who sent him.”',
      },
      {
        speaker: 'narrator',
        text: 'At your shoulder, a Reform Union man polishes his spectacles. “The centre: personal liberty, honest reform, and few enough seats that nothing passes this House without us. Both of these gentlemen will need our votes, and we keep the price-list.”',
      },
      partyChoice,
      {
        speaker: 'narrator',
        text: 'The envoys withdraw to their corners to report. Margaret — your wife, and the sharper politician — appears at your elbow, as though she had been standing there the whole evening. She has.',
      },
      {
        speaker: 'char-spouse',
        text: 'So that is the coat you mean to wear. Now the second choice, and mind it: this one sets how hard the next years will be.',
      },
      {
        speaker: 'char-spouse',
        text: 'A safe seat you almost cannot lose at an election — but the party machine that built it owns you, and punishes disobedience twice over. A marginal seat you can genuinely lose — but you would owe nobody anything.',
      },
      {
        speaker: 'char-spouse',
        text: 'The machine keeps a man the way a bank keeps money — safely, and as its own. The town would keep you on your word, and not an inch further. Choose the one you can come home to.',
      },
      seatChoice,
      {
        speaker: 'char-officer',
        text: 'So entered, so certified. The first bills reach your desk in the morning, Member — vote as you would be remembered, for remembered you will be.',
      },
    ],
  }
}

/** Election night, before the slips: the officer and Margaret, briefly. */
export function electionExchange(held: boolean): DialogueLine[] {
  if (held) {
    return [
      {
        speaker: 'char-officer',
        text: 'The boxes are counted and the certificate signed: Halloway keeps its Member. You hold your seat. My congratulations again — you will observe they improve with repetition.',
      },
      {
        speaker: 'char-spouse',
        text: 'Come here before they put you on a platform. I told the town you would hold, and the town, being sensible, believed me. You may read the count in a moment — husband first, Member second.',
      },
      {
        speaker: 'char-officer',
        text: 'The results are read out presently. Compose your face, Member; the record is watching.',
      },
    ]
  }
  return [
    {
      speaker: 'char-officer',
      text: 'The boxes are counted and the certificate signed. It falls to me to say it plainly: Halloway has chosen another. You have lost your seat tonight.',
    },
    {
      speaker: 'char-spouse',
      text: 'Look at me — not at the floor, at me. They have taken a chair, my dear; a piece of furniture. The man who sat in it is standing beside me, where he began, and where he is wanted.',
    },
    {
      speaker: 'char-officer',
      text: 'The results are read out presently. However they read, you will walk out as you walked in — through the front door, at your own pace.',
    },
  ]
}
