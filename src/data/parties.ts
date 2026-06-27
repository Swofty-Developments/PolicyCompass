import type { Party } from '../types'

// Web-grounded 5-axis vectors. Generated + reviewed via the refdata workflow.
export const parties: Party[] = [
  { name: 'Labour Party', country: 'United Kingdom', vector: { economic: -0.35, fiscal: -0.3, social: -0.5, identity: -0.25, law_order: 0.05 } },
  { name: 'Conservative Party', country: 'United Kingdom', vector: { economic: 0.5, fiscal: 0.45, social: 0.25, identity: 0.45, law_order: 0.45 } },
  { name: 'Democratic Party', country: 'United States', vector: { economic: -0.3, fiscal: -0.4, social: -0.55, identity: -0.45, law_order: -0.2 } },
  { name: 'Republican Party', country: 'United States', vector: { economic: 0.5, fiscal: 0.45, social: 0.55, identity: 0.7, law_order: 0.6 } },
  { name: 'Social Democratic Party (SPD)', country: 'Germany', vector: { economic: -0.35, fiscal: -0.35, social: -0.45, identity: -0.2, law_order: -0.05 } },
  { name: 'Christian Democratic Union (CDU/CSU)', country: 'Germany', vector: { economic: 0.45, fiscal: 0.35, social: 0.3, identity: 0.35, law_order: 0.35 } },
  { name: 'Alternative für Deutschland (AfD)', country: 'Germany', vector: { economic: 0.35, fiscal: 0.25, social: 0.65, identity: 0.9, law_order: 0.75 } },
  { name: 'Die Linke', country: 'Germany', vector: { economic: -0.8, fiscal: -0.8, social: -0.7, identity: -0.75, law_order: -0.6 } },
  { name: 'La France Insoumise (LFI)', country: 'France', vector: { economic: -0.75, fiscal: -0.8, social: -0.65, identity: -0.7, law_order: -0.5 } },
  { name: 'Renaissance', country: 'France', vector: { economic: 0.35, fiscal: 0.2, social: -0.3, identity: -0.05, law_order: 0.2 } },
  { name: 'Rassemblement National (RN)', country: 'France', vector: { economic: 0.05, fiscal: -0.1, social: 0.45, identity: 0.85, law_order: 0.65 } },
  { name: 'Swedish Social Democratic Party', country: 'Sweden', vector: { economic: -0.4, fiscal: -0.45, social: -0.4, identity: -0.1, law_order: 0.1 } },
  { name: 'Podemos', country: 'Spain', vector: { economic: -0.7, fiscal: -0.75, social: -0.75, identity: -0.65, law_order: -0.55 } },
  { name: 'Vox', country: 'Spain', vector: { economic: 0.5, fiscal: 0.45, social: 0.7, identity: 0.75, law_order: 0.6 } },
  { name: 'Liberal Party of Canada', country: 'Canada', vector: { economic: -0.15, fiscal: -0.3, social: -0.5, identity: -0.55, law_order: -0.1 } },
  { name: 'Bharatiya Janata Party (BJP)', country: 'India', vector: { economic: 0.4, fiscal: 0.15, social: 0.65, identity: 0.8, law_order: 0.6 } },
  { name: 'Workers’ Party (PT)', country: 'Brazil', vector: { economic: -0.45, fiscal: -0.5, social: -0.35, identity: -0.35, law_order: -0.2 } },
  { name: 'National Fascist Party (PNF)', country: 'Italy · 1921–1943', vector: { economic: 0.5, fiscal: 0.3, social: 0.85, identity: 0.95, law_order: 0.95 } },
  { name: 'Communist Party (CPSU)', country: 'Soviet Union · 1912–1991', vector: { economic: -0.98, fiscal: -0.9, social: -0.2, identity: -0.85, law_order: 0.9 } },
]
