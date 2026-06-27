import type { ZoneLabels } from '../types'

// Ideology label per spectrum zone (far-left index 0 → far-right index 6), per axis.
export const zoneLabels: ZoneLabels = {
  economic: ['Command economy', 'Democratic socialism', 'Social democracy', 'Mixed economy', 'Market liberalism', 'Free-market conservatism', 'Corporatist autarky'],
  fiscal: ['Universal welfare state', 'Redistributive taxation', 'Keynesian stimulus', 'Balanced-budget centrism', 'Supply-side tax cuts', 'Fiscal conservatism', 'Minarchist austerity'],
  social: ['Radical progressivism', 'Secular liberalism', 'Social liberalism', 'Moderate centrism', 'Social conservatism', 'Religious traditionalism', 'Theocratic fundamentalism'],
  identity: ['Borderless internationalism', 'Open-borders multiculturalism', 'Civic pluralism', 'Civic nationalism', 'Cultural nationalism', 'Ethno-nationalism', 'Nativist ultranationalism'],
  law_order: ['Prison abolitionism', 'Civil libertarianism', 'Due-process reformism', 'Community-policing centrism', 'Tough-on-crime conservatism', 'Hardline law and order', 'Authoritarian security state'],
}
