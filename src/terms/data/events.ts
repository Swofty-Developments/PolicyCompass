import type { Mandate, TermsEvent } from '../types'
import { telegramEvents } from './events-telegrams'
import { frontpageEvents } from './events-frontpages'
import { personalEvents } from './events-personal'
import { mandateEvents, mandates } from './mandates'

/** Every authored event, in genre order. The scenario consumes this one list. */
export const allEvents: TermsEvent[] = [
  ...telegramEvents,
  ...frontpageEvents,
  ...personalEvents,
  ...mandateEvents,
]

export const allMandates: Mandate[] = mandates
