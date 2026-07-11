import { AXIS_IDS } from '../../../types'
import { archetypes, leaders, parties } from '../../../data'
import { axisMeta, readPosition, to100 } from '../../../engine/axes'
import { nearestArchetype, rankLeaders, rankParties } from '../../../engine/scoring'
import { SpectrumBar } from '../../../components/verdict/SpectrumBar'
import { EchoList } from '../../../components/verdict/EchoList'
import { scenario } from '../../data/scenario'
import type { TermsShare } from '../../lib/share'
import type { TermsSetup } from '../../types'
import '../../../styles/verdict.css'
import '../../styles/terms-screens.css'

const SHARE_STD = 0.2

/** A career someone else lived, decoded from a #t= link — read-only, with a
 *  same-seed challenge. */
export function SharedObituary({
  share,
  onChallenge,
  onExit,
}: {
  share: TermsShare
  onChallenge: (seed: number, setup: TermsSetup) => void
  onExit: () => void
}) {
  const party = scenario.blocs.find((b) => b.id === share.setup.partyId)?.name ?? share.setup.partyId
  const arch = nearestArchetype(share.axisMeans, archetypes)
  const topLeaders = rankLeaders(share.axisMeans, leaders)
  const topParties = rankParties(share.axisMeans, parties)
  const termWord = ['no terms', 'one term', 'two terms', 'three terms'][share.termsServed] ?? `${share.termsServed} terms`

  return (
    <div className="desk t-obit-wrap">
      <div className="sheet t-obit t-shared">
        <div className="t-obit-stamps">
          <span className="stamp t-obit-stamp">{share.stamp}</span>
        </div>

        <div className="t-obit-head">
          <div className="kicker">A Career, Shared · The Republic Remembers</div>
          <h2 className="t-obit-headline">{arch.title}</h2>
          <div className="t-obit-line">
            {party} · the {share.setup.seatType} seat · {termWord} — {share.stamp.toLowerCase()}.
          </div>
        </div>

        <div className="t-obit-body">
          <div className="t-obit-left">
            <div className="t-sec">For the record</div>
            <div className="t-brags">
              <div className="chip"><span className="n">{share.brag.termsServed}</span><span className="u">terms served</span></div>
              <div className="chip"><span className="n">{share.brag.winningSide}</span><span className="u">winning side</span></div>
              <div className="chip"><span className="n">{share.brag.promisesKept}/{share.brag.promisesBroken}</span><span className="u">promises kept / broken</span></div>
              <div className="chip"><span className="n">{share.brag.scandalsSurvived}</span><span className="u">scandals survived</span></div>
            </div>
            <div className="t-sec">The challenge</div>
            <div className="t-challenge-copy">
              The same Republic, the same crises, the same knife-edge divisions — dealt from the
              same seed. Take the seat and see if history writes you kinder.
            </div>
            <button className="t-btn solid t-cta" onClick={() => onChallenge(share.seed, share.setup)}>
              Same seed — take office
            </button>
            <button className="t-btn" onClick={onExit}>Decline the writ</button>
          </div>

          <div className="t-obit-right">
            <div className="t-sec">History's verdict</div>
            <SpectrumBar
              headline
              label="Final standing"
              read={`${readPosition(share.overall)} · ${to100(share.overall)}/100`}
              mean={share.overall}
              std={SHARE_STD}
            />
            {AXIS_IDS.map((axis) => (
              <SpectrumBar
                key={axis}
                axis={axis}
                label={axisMeta(axis).name}
                read={readPosition(share.axisMeans[axis] ?? 0)}
                mean={share.axisMeans[axis] ?? 0}
                std={SHARE_STD}
              />
            ))}
            <EchoList title="Leaders echoed" items={topLeaders.map((l) => ({ name: l.leader.name, sub: `${l.leader.country} · ${l.leader.era}`, pct: l.pct }))} />
            <EchoList title="Parties resembled" items={topParties.map((p) => ({ name: p.party.name, sub: p.party.country, pct: p.pct }))} />
          </div>
        </div>
      </div>
    </div>
  )
}
