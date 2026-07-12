import type { TermsEvent } from '../types'

/** Crisis telegrams + office memos. Each is a composite of documented history;
 * precedents render like bill sources. Bodies are STOP-cadence for telegrams. */
export const telegramEvents: TermsEvent[] = [
  {
    id: 'ev-telegram-bankrun',
    kind: 'telegram',
    title: 'RUN ON THE COMMERCIAL TRUST',
    body:
      'MOST IMMEDIATE STOP COMMERCIAL TRUST OF THE REPUBLIC SUSPENDED PAYMENT AT ELEVEN THIS MORNING STOP DEPOSITORS QUEUE FOUR ABREAST FROM THE BRONZE DOORS TO THE CORN EXCHANGE STOP TWO COUNTRY BANKS REFUSING WITHDRAWALS STOP CLEARING HOUSE DECLINES TO ACT ALONE STOP RESERVE POSITION CRITICAL STOP FINANCIERS ASSEMBLED IN THE GOVERNORS LIBRARY AWAIT WORD FROM THE HOUSE STOP EVERY HOUR OF SILENCE CLOSES ANOTHER COUNTER STOP INSTRUCTION REQUIRED BEFORE MARKETS OPEN STOP',
    byline: 'GOVERNOR OF THE REPUBLIC BANK',
    options: [
      {
        id: 'guarantee',
        label: 'Guarantee the deposits: the Treasury stands behind every counter in the Republic.',
        detail: 'A heavy draft on the reserve — some twenty points — but the queues disperse by evening.',
        effects: { treasury: -20, trust: 3 },
      },
      {
        id: 'refuse',
        label: 'Refuse. The bank made its bed; the depositors may lie in it.',
        detail: 'Costs nothing the Treasury can count. The ruined count differently, and the country turns against finance.',
        effects: {
          trust: -6,
          fervour: [{ blocId: 'bloc-labour', delta: 1 }],
          zeitgeist: [{ axis: 'economic', delta: -0.1 }],
        },
      },
      {
        id: 'pool',
        label: 'Lock the financiers in the library until they subscribe a rescue pool of their own.',
        detail: 'The Treasury seeds the pool. The City’s party remembers the favour; the Labour benches remember the company.',
        effects: {
          treasury: -8,
          relations: [
            { blocId: 'bloc-national', delta: 6 },
            { blocId: 'bloc-labour', delta: -6 },
          ],
        },
      },
    ],
    precedents: [
      { name: 'The Panic of 1907 and the Knickerbocker Trust', url: 'https://www.federalreservehistory.org/essays/panic-of-1907' },
      { name: 'The run on Northern Rock, 2007', url: 'https://en.wikipedia.org/wiki/Northern_Rock' },
    ],
  },
  {
    id: 'ev-telegram-currency',
    kind: 'telegram',
    title: 'THE PARITY',
    body:
      'MOST SECRET STOP MARKETS OPEN IN DISORDER STOP CONTINENTAL HOUSES SELLING THE CURRENCY IN VOLUME STOP RESERVE LOSSES EIGHTEEN MILLION FRIDAY TEN MILLION SATURDAY HALF DAY STOP PARIS AND NEW YORK DECLINE FURTHER CREDITS WITHOUT ASSURANCES ON THE BUDGET STOP BANK CAN HOLD THE PARITY DAYS NOT WEEKS STOP EVERY DEFENCE SPENDS WHAT CANNOT BE RECOVERED STOP GOVERNOR REQUESTS INSTRUCTION BEFORE THE EXCHANGES OPEN STOP THE WORLD IS WATCHING THE FIGURE STOP',
    byline: 'GOVERNOR OF THE REPUBLIC BANK — EXCHANGE DIVISION',
    options: [
      {
        id: 'defend',
        label: 'Defend the parity to the last reserve; the Republic’s word is gold.',
        detail: 'The Treasury bleeds by the hour, but the Republic’s credit is seen to be kept. The wage-earners will pay for the applause.',
        effects: {
          treasury: -18,
          trust: 3,
          relations: [{ blocId: 'bloc-national', delta: 6 }],
          fervour: [{ blocId: 'bloc-labour', delta: 0.25 }],
        },
      },
      {
        id: 'float',
        label: 'Leave the standard. Let the currency find its level and the exports their markets.',
        detail: 'A humiliation on every front page — and a quiet loosening everywhere money is owed.',
        effects: {
          trust: -5,
          treasury: 10,
          zeitgeist: [{ axis: 'fiscal', delta: -0.1 }],
        },
      },
      {
        id: 'austerity',
        label: 'An emergency budget: cuts deep enough to make the creditors believe.',
        detail: 'The credits arrive. The cuts fall on wages and the dole, and the Labour benches know it.',
        effects: {
          treasury: 12,
          fervour: [{ blocId: 'bloc-labour', delta: 0.5 }],
          relations: [{ blocId: 'bloc-labour', delta: -8 }],
        },
      },
    ],
    precedents: [
      { name: 'Britain leaves the gold standard, 1931', url: 'https://www.nationalarchives.gov.uk/education/resources/thirties-britain/going-gold/' },
      { name: 'Black Wednesday and the ERM exit, 1992', url: 'https://en.wikipedia.org/wiki/Black_Wednesday' },
    ],
  },
  {
    id: 'ev-telegram-genstrike',
    kind: 'telegram',
    title: 'GENERAL STRIKE',
    body:
      'HOME OFFICE DUTY ROOM STOP THE FEDERATION CALLS OUT THREE MILLION AT MIDNIGHT STOP RAILWAYS DOCKS TRAMS PRESSES ALL STOPPED STOP NOTHING MOVES WITHOUT A PERMIT FROM THE STRIKE COMMITTEE STOP COAL STOCKS SIX WEEKS AT WINTER RATES STOP VOLUNTEERS OFFERING AT EVERY DEPOT STOP OWNERS REFUSE ARBITRATION MINERS REFUSE THE CUT STOP EACH DAY OF SILENCE HARDENS BOTH STOP THE HOUSE MUST CHOOSE WHOSE PATIENCE BREAKS FIRST STOP',
    byline: 'HOME OFFICE DUTY ROOM',
    options: [
      {
        id: 'subsidy',
        label: 'Buy the peace: a subsidy for the pits while a royal commission sits.',
        detail: 'The Treasury carries the wage bill for a season; the temperature falls on the Labour flank.',
        effects: {
          treasury: -15,
          fervour: [{ blocId: 'bloc-labour', delta: -1 }],
          relations: [{ blocId: 'bloc-labour', delta: 6 }],
        },
      },
      {
        id: 'break',
        label: 'Break it: emergency powers, volunteers on the buses, the government’s own gazette on the streets.',
        detail: 'Order is restored and seen to be restored. The militants take their politics underground.',
        effects: {
          zeitgeist: [{ axis: 'law_order', delta: 0.1 }],
          trust: 4,
          relations: [{ blocId: 'bloc-labour', delta: -10 }],
          fervour: [{ blocId: 'bloc-vanguard', delta: 0.5 }],
        },
      },
      {
        id: 'broadcast',
        label: 'Address the nation on the wireless: a man of peace, conceding nothing.',
        detail: 'Patience as policy. The strike starves slowly, and the Treasury with it.',
        effects: {
          trust: 3,
          treasury: -6,
          relations: [{ blocId: 'bloc-labour', delta: -4 }],
        },
      },
    ],
    precedents: [
      { name: 'The General Strike, 1926 — The National Archives', url: 'https://www.nationalarchives.gov.uk/explore-the-collection/stories/the-general-strike/' },
      { name: 'The 1926 United Kingdom general strike', url: 'https://en.wikipedia.org/wiki/1926_United_Kingdom_general_strike' },
    ],
  },
  {
    id: 'ev-telegram-warscare',
    kind: 'telegram',
    title: 'THE FRONTIER INCIDENT',
    body:
      'MOST SECRET MOST IMMEDIATE STOP THE EASTERN POWER HAS SEIZED THE CANAL ZONE AND CLOSED IT TO OUR SHIPPING STOP AMBASSADOR HANDED ULTIMATUM EXPIRING FORTY EIGHT HOURS STOP GENERAL STAFF ADVISE MOBILISATION TIMETABLES ADMIT NO PAUSE ONCE BEGUN STOP OLD ALLIES ASK OUR INTENTIONS OLD CREDITORS ASK THEM LOUDER STOP THE PRESS HAS THE STORY BY MORNING STOP EVERY CHANCERY IN EUROPE IS DRAFTING THE SAME TELEGRAM STOP THE HOUSE SPEAKS TONIGHT OR EVENTS SPEAK FOR IT STOP',
    byline: 'FOREIGN OFFICE — MOST SECRET',
    options: [
      {
        id: 'mobilise',
        label: 'Mobilise. The fleet to its stations; the ultimatum answered in kind.',
        detail: 'The nation rallies to the colours — and the colours to the harder men. The timetables take command.',
        effects: {
          zeitgeist: [
            { axis: 'identity', delta: 0.12 },
            { axis: 'law_order', delta: 0.08 },
          ],
          trust: 5,
          treasury: -10,
          fervour: [{ blocId: 'bloc-ironleague', delta: 0.5 }],
        },
      },
      {
        id: 'conference',
        label: 'Stand down. Summon the powers to a conference and swallow what it costs.',
        detail: 'Peace, at the price of prestige. The jingo press cries surrender; the National benches agree with it.',
        effects: {
          zeitgeist: [{ axis: 'identity', delta: -0.12 }],
          trust: -6,
          relations: [{ blocId: 'bloc-national', delta: -8 }],
          fervour: [
            { blocId: 'bloc-ironleague', delta: 0.5 },
            { blocId: 'bloc-vanguard', delta: -0.5 },
          ],
        },
      },
      {
        id: 'buy-time',
        label: 'Neither war nor retreat: partial mobilisation, quiet talks, and gold to buy the hours.',
        detail: 'The Treasury pays for every day the guns stay quiet. Fevers cool on both flanks — slowly.',
        effects: {
          treasury: -15,
          trust: 2,
          fervour: [
            { blocId: 'bloc-ironleague', delta: -0.5 },
            { blocId: 'bloc-vanguard', delta: -0.5 },
          ],
        },
      },
    ],
    precedents: [
      { name: 'The July Crisis, 1914', url: 'https://en.wikipedia.org/wiki/July_Crisis' },
      { name: 'The Suez Crisis, 1956', url: 'https://www.nationalarchives.gov.uk/education/sessions/suez-crisis-1956/' },
    ],
  },
  {
    id: 'ev-telegram-fiscal',
    kind: 'telegram',
    title: 'THE RESERVE POSITION',
    body:
      'PERMANENT SECRETARY TO THE MEMBER STOP IT FALLS TO ME TO STATE THE POSITION PLAINLY STOP THE RESERVE IS EXHAUSTED BELOW THE FIFTEENTH POINT STOP DEPARTMENTS BID AGAINST EACH OTHER FOR WHAT REMAINS STOP FOREIGN LENDERS WANT TERMS THE HOUSE WILL HATE STOP THE FUND WANTS TERMS THE COUNTRY WILL HATE MORE STOP THERE IS NO COURSE WITHOUT A PRICE STOP ONLY COURSES WITH DIFFERENT CREDITORS STOP AWAIT INSTRUCTION STOP',
    byline: 'PERMANENT SECRETARY, THE TREASURY',
    options: [
      {
        id: 'fund',
        label: 'Go to the Fund and take the loan on the terms offered.',
        detail: 'The reserve refills at a stroke. The conditions are read aloud in the House, to laughter and worse.',
        effects: {
          treasury: 25,
          trust: -4,
          fervour: [{ blocId: 'bloc-labour', delta: 0.5 }],
        },
      },
      {
        id: 'retrench',
        label: 'A retrenchment budget of our own devising, before one is devised for us.',
        detail: 'Pride intact, purse half-mended. The cuts land where the poorest live, and retrenchment becomes the fashion.',
        effects: {
          treasury: 15,
          zeitgeist: [{ axis: 'fiscal', delta: 0.1 }],
          relations: [{ blocId: 'bloc-labour', delta: -8 }],
          fervour: [{ blocId: 'bloc-labour', delta: 0.5 }],
        },
      },
      {
        id: 'levy',
        label: 'An emergency levy on capital: let the broadest shoulders carry the shortfall.',
        detail: 'The books balance. The propertied interest calls it confiscation, and organises accordingly.',
        effects: {
          treasury: 12,
          relations: [{ blocId: 'bloc-national', delta: -10 }],
          fervour: [{ blocId: 'bloc-ironleague', delta: 0.5 }],
          zeitgeist: [{ axis: 'economic', delta: -0.08 }],
        },
      },
    ],
    precedents: [
      { name: 'The 1976 sterling crisis and the IMF loan', url: 'https://en.wikipedia.org/wiki/1976_sterling_crisis' },
    ],
    gates: { maxTreasury: 15 },
  },
  {
    id: 'ev-telegram-unrest',
    kind: 'telegram',
    title: 'THE DISTRICT ASKS WHETHER IT IS GOVERNED',
    body:
      'CONSTABULARY NORTHERN DISTRICT STOP EIGHTY THOUSAND ASSEMBLED ON THE PLATEAU YESTERDAY STOP BATON CHARGES READ AS PROVOCATION STOP CARTERS AND DOCKERS OUT IN SYMPATHY STOP MAGISTRATES REQUEST TROOPS STOP A CRUISER STANDS IN THE RIVER WITH GUNS TRAINED ON ITS OWN CITY STOP TWO MEN SHOT AT THE PRISON VAN STOP FUNERALS FRIDAY WILL BRING A QUARTER MILLION INTO THE STREETS STOP INSTRUCTION BY RETURN STOP',
    byline: 'CHIEF CONSTABLE, NORTHERN DISTRICT',
    options: [
      {
        id: 'settlement',
        label: 'Fund the settlement: wage boards, an inquiry, relief for the injured districts.',
        detail: 'Costly, unglamorous, effective. The heat goes out of the street by the month’s end.',
        effects: {
          treasury: -12,
          fervour: [
            { blocId: 'bloc-labour', delta: -1 },
            { blocId: 'bloc-national', delta: -1 },
            { blocId: 'bloc-vanguard', delta: -1 },
            { blocId: 'bloc-ironleague', delta: -1 },
          ],
        },
      },
      {
        id: 'troops',
        label: 'Troops to the depots and the Riot Act read from the steps.',
        detail: 'Order by nightfall, at order’s usual price. The street does not forget who sent the soldiers.',
        effects: {
          zeitgeist: [{ axis: 'law_order', delta: 0.1 }],
          trust: 3,
          relations: [{ blocId: 'bloc-labour', delta: -8 }],
          fervour: [
            { blocId: 'bloc-vanguard', delta: 0.5 },
            { blocId: 'bloc-ironleague', delta: 0.5 },
          ],
        },
      },
      {
        id: 'ride-out',
        label: 'Do nothing loudly: let the district exhaust itself.',
        detail: 'The cheapest course tonight and the dearest by winter.',
        effects: {
          trust: -5,
          fervour: [
            { blocId: 'bloc-vanguard', delta: 0.25 },
            { blocId: 'bloc-ironleague', delta: 0.25 },
          ],
        },
      },
    ],
    precedents: [
      { name: 'The Liverpool general transport strike, 1911', url: 'https://en.wikipedia.org/wiki/1911_Liverpool_general_transport_strike' },
    ],
  },
  {
    id: 'ev-memo-pollster',
    kind: 'memo',
    title: 'A NOTE ON THE MEMBER’S STANDING',
    body:
      'You will forgive a tradesman’s bluntness: opinion can be counted, and I am paid to count it. Three figures now govern your career. Confidence is the public’s trust in you — yours stands in the middle fifties, comfortable; a member whose figure sinks below twenty is in danger of being finished. Conviction is how consistent your voting record is — the House punishes a flip-flopper, and the trouble starts below forty. The Exchequer is the Republic’s money, which the laws you pass spend or refill. All three sit on the Standing rail beside your desk; the Ledger button above the order paper opens the full accounts. Consult them as you would a barometer. Gentlemen who navigate by feel alone end up as weather.',
    byline: 'J. Ashworth, canvasser, by appointment to the party',
    options: [
      {
        id: 'acknowledge',
        label: 'File the canvasser’s note where you will find it again.',
        detail: 'Confidence, Conviction, Exchequer — watch them on the Standing rail; the Ledger keeps the full accounts.',
      },
    ],
    precedents: [
      { name: '“President” Landon and the 1936 Literary Digest poll', url: 'https://www.cambridge.org/core/journals/social-science-history/article/president-landon-and-the-1936-literary-digest-poll/E360C38884D77AA8D71555E7AB6B822C' },
    ],
  },
  {
    id: 'ev-ultimatum',
    kind: 'ultimatum',
    title: 'FROM THE OFFICE OF THE CHIEF WHIP',
    body:
      'It is past midnight and I will be brief. Confidence — the public’s trust in you — stands at {figure}. Below twenty, the party starts planning a member’s replacement, and it is planning yours: in the smoking room, in the lobbies, in paragraphs the sketch-writers have already filed. So hear it plainly. Bring Confidence back to thirty before this term ends, or the House votes no confidence in you and your career is over. I have served four leaders and buried three; the arithmetic is neither cruel nor kind, and I will not be able to stop it.',
    byline: 'The Chief Whip',
    options: [
      {
        id: 'acknowledge',
        label: 'There is nothing to answer. Turn down the lamp and count the ways back.',
        detail: 'Reach Confidence thirty before the term ends — keep promises, vote with the public mood, obey the whip. Every point counts.',
        effects: { setFlags: { ultimatum: true } },
      },
    ],
    precedents: [
      { name: 'The vote of no confidence in the Callaghan government, 1979', url: 'https://en.wikipedia.org/wiki/1979_vote_of_no_confidence_in_the_Callaghan_ministry' },
      { name: 'The Norway Debate — Hansard, 8 May 1940', url: 'https://api.parliament.uk/historic-hansard/commons/1940/may/08/conduct-of-the-war' },
    ],
    gates: { maxTrust: 20 },
  },
]
