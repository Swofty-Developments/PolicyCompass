import type { Bloc, DialogueChoice, DialogueLine, DialogueScene, SeatType } from '../types'

/** First sentence of a blurb — the one-line flavour on a reply slip. */
function firstSentence(s: string): string {
  const i = s.indexOf('. ')
  return i === -1 ? s : s.slice(0, i + 1)
}

/** The prologue conversation: the officer receives you, the parties pitch,
 *  Margaret frames the ground. Its two choices resolve party and seat. */
export function prologueScene(blocs: Bloc[], seatBlurbs: Record<SeatType, string>): DialogueScene {
  const partyChoice: DialogueChoice = {
    prompt: 'Whose hand do you shake?',
    options: blocs.map((b) => ({ id: b.id, label: b.name, detail: firstSentence(b.blurb) })),
  }
  const seatChoice: DialogueChoice = {
    prompt: 'Where do you stand?',
    options: [
      { id: 'safe', label: 'The machine seat — safe', detail: seatBlurbs.safe },
      { id: 'marginal', label: 'Your own ground — marginal', detail: seatBlurbs.marginal },
    ],
  }
  return {
    id: 'scene-prologue',
    beats: [
      {
        speaker: 'narrator',
        text: 'The Members’ Lobby, past midnight. A gentleman in black silk consults his ledger, finds your name in it, and rules a line beneath it.',
      },
      {
        speaker: 'char-officer',
        text: 'The Member for Halloway, I presume. The count is certified and the writ returned; from tonight you belong to the public record, which forgets nothing and forgives less. My congratulations — I am required to offer them once.',
      },
      {
        speaker: 'char-officer',
        text: 'Two matters remain before the oath. First, the benches: no member sits alone, and the whip you accept will colour every vote you cast. The parties have smelt a new member. Here they come.',
      },
      {
        speaker: 'char-whip',
        text: 'They will have told you I have no name. Quite right. I keep the National count — the counting-house, the county seat, sound money and no sudden movements. Shake my hand and your career will be looked after. Decline it, and you will be looked at.',
      },
      {
        speaker: 'narrator',
        text: 'A man from the Labour Front takes your other elbow, smelling of print and pit-smoke. “They will teach you the price of everything,” he says, nodding at the Whip. “We teach the wages. The pits, the docks and the union hall sent us up — ask who sent them.”',
      },
      {
        speaker: 'narrator',
        text: 'At your shoulder, a Reform Union man polishes his spectacles. “Both of these gentlemen own their majorities the way other men own debts. We are few, and therefore indispensable — free trade, free conscience, tidy books. Nothing passes this House without a price, and we keep the price-list.”',
      },
      partyChoice,
      {
        speaker: 'narrator',
        text: 'The envoys withdraw to their corners to report. Margaret appears at your elbow, as though she had been standing there the whole evening. She has.',
      },
      {
        speaker: 'char-spouse',
        text: 'So that is the coat you mean to wear. I have seen you in worse — and the House has certainly seen worse men in better. Now attend to me for one minute, before these people decide the rest of your life for you.',
      },
      {
        speaker: 'char-spouse',
        text: 'They will offer you the machine’s seat, or the ground that knows your name. The machine keeps a man the way a bank keeps money — safely, and as its own. The town would keep you the way I do: on your word, and not an inch further. Choose the one you can come home to.',
      },
      seatChoice,
      {
        speaker: 'char-officer',
        text: 'So entered, so certified. The House sits directly, Member. Take your ground, keep your name, and endeavour to leave the record no worse than you found it.',
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
        text: 'The boxes are counted and the certificate signed. Halloway returns its Member. My congratulations again — you will observe they improve with repetition.',
      },
      {
        speaker: 'char-spouse',
        text: 'Come here before they put you on a platform. I told the town you would hold, and the town, being sensible, believed me. You may read the count in a moment — husband first, Member second.',
      },
      {
        speaker: 'char-officer',
        text: 'The declaration presently. Compose your face, Member; the record is watching.',
      },
    ]
  }
  return [
    {
      speaker: 'char-officer',
      text: 'The boxes are counted and the certificate signed. It falls to me to read it plainly: Halloway has chosen another. The seat passes from your keeping tonight.',
    },
    {
      speaker: 'char-spouse',
      text: 'Look at me — not at the floor, at me. They have taken a chair, my dear; a piece of furniture. The man who sat in it is standing beside me, where he began, and where he is wanted.',
    },
    {
      speaker: 'char-officer',
      text: 'The declaration presently. However it reads, you will walk out as you walked in — through the front door, at your own pace.',
    },
  ]
}
