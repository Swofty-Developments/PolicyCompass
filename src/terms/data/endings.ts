import type { EndingStamp } from '../types'

/** Obituary masthead copy per stamp. Placeholders: {party} {terms} {cause} {archetype}.
 * {terms} is a spelled-out phrase ("two terms", "less than a single term"). */
export const ENDING_COPY: Record<EndingStamp, { headline: string; line: string }> = {
  DEFEATED: {
    headline: 'THE SEAT IS LOST',
    line: '{cause}. After {terms} on the {party} benches, the Member for Halloway goes home a private citizen.',
  },
  'NO CONFIDENCE': {
    headline: 'THE HOUSE WITHDRAWS ITS CONFIDENCE',
    line: '{cause}. A career of {terms} ended not by the country’s hand but by the House’s — the crueller of the two.',
  },
  EXPELLED: {
    headline: 'READ OUT OF THE PARTY',
    line: '{cause}. The {party} machine forgives error, occasionally conviction, never both; {terms} in the chamber weighed nothing against its ledger.',
  },
  REVOLUTION: {
    headline: 'THE REPUBLIC OVERTAKEN',
    line: '{cause}. The House kept its procedures to the last; the street kept the Republic. What a {archetype} was doing at the centre of it, historians still dispute.',
  },
  DISGRACED: {
    headline: 'ALL OF IT IN PRINT',
    line: '{cause}. The first burial was survivable; the second was arithmetic. The {party} benches did not look up as the Member left the chamber.',
  },
  'RETIRED WITH HONOURS': {
    headline: 'THE HOUSE RISES',
    line: 'Three terms, served to the hour. The {party} benches stood, and even the sketch-writers stood. History files the Member for Halloway under {archetype}, and history is seldom so tidy.',
  },
}

/** Seeded epitaph openers, three per stamp. Every {terms} frame must read
 * naturally at any count, including a career cut short before one full term. */
export const EPITAPH_LEADS: Record<EndingStamp, string[]> = {
  DEFEATED: [
    'The electors of Halloway, having lent their Member to the {party} cause for {terms}, asked for the seat back.',
    'A {archetype} by conviction and a candidate by necessity; the two careers could not both survive the count.',
    'The House passes bills, not men. After {terms}, it passed over the Member for Halloway.',
  ],
  'NO CONFIDENCE': [
    'Trust is the only coin the chamber honours, and the Member spent {terms} discovering the exchange rate.',
    'The whips talk at twenty; by the end, nobody was talking at all.',
    'A {archetype} who treated confidence as a renewable resource. The House audits.',
  ],
  EXPELLED: [
    'The {party} whip was withdrawn, and with it the roof, the walls, and the floor.',
    'Three strikes make a rhythm any whip can count; the Member supplied the percussion inside {terms}.',
    'A {archetype} to the last division — which is precisely what the {party} machine could not afford.',
  ],
  REVOLUTION: [
    'The Member held a seat while the Republic lost its footing: {terms} of procedure, and then the street.',
    'History does not record whether the Member heard the crowd before the chamber did.',
    'A {archetype} in a House that had run out of centre; the gallery emptied into the square.',
  ],
  DISGRACED: [
    'The editor kept the affidavit in his safe, as editors do, until keeping it paid less than printing it.',
    'What {terms} of care had buried surfaced in a single morning edition.',
    'A {archetype} at the dispatch box and a gambler in private; the second hand always shows.',
  ],
  'RETIRED WITH HONOURS': [
    'Three terms, one seat, and a record the sketch-writers never quite managed to caricature.',
    'The rarest ending in the Archive: the Member for Halloway left the chamber at a walking pace.',
    'A {archetype} who survived the arithmetic — the House’s, the party’s, and history’s.',
  ],
}
