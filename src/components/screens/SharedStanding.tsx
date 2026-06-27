import type { SharedResult } from '../../lib/share'
import { AXIS_IDS } from '../../types'
import { archetypes, leaders, parties } from '../../data'
import { axisMeta, readPosition, to100, zoneOf } from '../../engine/axes'
import { nearestArchetype, partiesInZone, rankLeaders, rankParties } from '../../engine/scoring'
import { SpectrumBar } from '../verdict/SpectrumBar'
import { EchoList } from '../verdict/EchoList'
import { VerdictIdentity } from '../verdict/VerdictIdentity'
import { TallyStrip } from '../verdict/TallyStrip'
import '../../styles/verdict.css'

const STD_MAX = 0.5775
const certaintyWord = (c: number) => (c > 0.82 ? 'tight band' : c > 0.62 ? 'fairly sure' : c > 0.42 ? 'rough read' : 'uncertain')

export function SharedStanding({ result, onExit }: { result: SharedResult; onExit: () => void }) {
  const { vector, stds, tally } = result
  const results = AXIS_IDS.map((axis) => {
    const mean = vector[axis] ?? 0
    const std = stds[axis] ?? 0.2
    return { axis, mean, std, certainty: Math.max(0, Math.min(1, 1 - std / STD_MAX)), zoneIndex: zoneOf(mean) }
  })
  const overallMean = results.reduce((s, r) => s + r.mean, 0) / results.length
  const overallStd = Math.sqrt(results.reduce((s, r) => s + r.std * r.std, 0)) / results.length
  const arch = nearestArchetype(vector, archetypes)
  const topParties = rankParties(vector, parties)
  const topLeaders = rankLeaders(vector, leaders)

  return (
    <div className="desk verdict-wrap">
      <div className="sheet ledger">
        <div className="v-head">
          <div className="kick">A Shared Standing · Policy Compass</div>
          <h2>{arch.title}</h2>
          <div className="sub">Someone’s record — see if the floor would find you the same</div>
        </div>

        <div className="v-body">
          <div className="v-left">
            <div className="poleskey">
              <span className="l">◀ Communist</span>
              <span style={{ opacity: 0.6 }}>centre</span>
              <span className="r">Fascist ▶</span>
            </div>
            <SpectrumBar headline label="Overall Standing" read={`${readPosition(overallMean)} · ${to100(overallMean)}/100`} mean={overallMean} std={overallStd} />
            {results.map((r) => {
              const band = partiesInZone(parties, r.axis, r.zoneIndex).slice(0, 3)
              const note = (
                <span className="an-line">
                  {band.length ? <>Shares this band with <strong>{band.map((p) => p.name).join(', ')}</strong>.</> : 'No major party sits in this band.'}
                </span>
              )
              return (
                <SpectrumBar key={r.axis} axis={r.axis} label={axisMeta(r.axis).name} read={`${readPosition(r.mean)} · ${certaintyWord(r.certainty)}`} mean={r.mean} std={r.std} note={note} />
              )
            })}
          </div>

          <div className="v-right">
            <VerdictIdentity archetype={arch} />
            <EchoList title="Parties most resembled" items={topParties.map((p) => ({ name: p.party.name, sub: p.party.country, pct: p.pct }))} />
            <EchoList title="Leaders echoed" items={topLeaders.map((p) => ({ name: p.leader.name, sub: `${p.leader.country} · ${p.leader.era}`, pct: p.pct }))} />
            <TallyStrip ratified={tally[0]} struck={tally[1]} total={tally[0] + tally[1]} />
            <div className="v-actions">
              <button className="v-btn solid" onClick={onExit}>↻ Take the test yourself</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
