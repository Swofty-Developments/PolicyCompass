import { useState } from 'react'
import type { SessionState } from '../../engine/session'
import type { AxisId } from '../../types'
import { archetypes, leaders, parties } from '../../data'
import { axisMeta, readPosition, to100 } from '../../engine/axes'
import { axisResults, nearestArchetype, overallStanding, partiesInZone, rankLeaders, rankParties, userVector } from '../../engine/scoring'
import { buildShareUrl } from '../../lib/share'
import { downloadResultImage } from '../../lib/resultImage'
import { SpectrumBar } from './SpectrumBar'
import { EchoList } from './EchoList'
import { VerdictIdentity } from './VerdictIdentity'
import { TallyStrip } from './TallyStrip'
import { PaperTrail } from './PaperTrail'
import '../../styles/verdict.css'

function certaintyWord(c: number): string {
  return c > 0.82 ? 'tight band' : c > 0.62 ? 'fairly sure' : c > 0.42 ? 'rough read' : 'uncertain'
}

export function Verdict({ state, onHome, onNewRun }: { state: SessionState; onHome: () => void; onNewRun: () => void }) {
  const [showTrail, setShowTrail] = useState(false)

  const results = axisResults(state.posteriors)
  const overall = overallStanding(results)
  const uv = userVector(results)
  const arch = nearestArchetype(uv, archetypes)
  const topParties = rankParties(uv, parties)
  const topLeaders = rankLeaders(uv, leaders)
  const ratified = state.history.filter((h) => h.ratified).length
  const struck = state.history.length - ratified

  const [copied, setCopied] = useState(false)
  const stds = Object.fromEntries(results.map((r) => [r.axis, r.std])) as Record<AxisId, number>
  const copyLink = () => {
    const url = buildShareUrl(uv, stds, [ratified, struck])
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }
  const saveImage = () =>
    downloadResultImage({
      archetype: arch.title,
      overallRead: `${readPosition(overall.mean)} · ${to100(overall.mean)}/100`,
      axes: results.map((r) => ({ name: axisMeta(r.axis).name, mean: r.mean })),
      topLeader: topLeaders[0]?.leader.name,
      topParty: topParties[0]?.party.name,
      ratified,
      struck,
    })

  if (showTrail) return <PaperTrail history={state.history} onBack={() => setShowTrail(false)} />

  return (
    <div className="desk verdict-wrap">
      <div className="sheet ledger">
        <div className="v-head">
          <div className="kick">Official Findings · Session XII</div>
          <h2>Your Standing</h2>
          <div className="sub">{state.history.length} bills judged · adaptive certainty {Math.round(overall.certainty * 100)}%</div>
        </div>

        <div className="v-body">
          <div className="v-left">
            <div className="poleskey">
              <span className="l">◀ Communist</span>
              <span style={{ opacity: 0.6 }}>centre</span>
              <span className="r">Fascist ▶</span>
            </div>
            <SpectrumBar headline label="Overall Standing" read={`${readPosition(overall.mean)} · ${to100(overall.mean)}/100`} mean={overall.mean} std={overall.std} />
            {results.map((r) => {
              const moves = state.history
                .map((h) => {
                  const d = h.deltas.find((x) => x.axis === r.axis)
                  return d ? { h, delta: d.delta } : null
                })
                .filter((m): m is { h: (typeof state.history)[number]; delta: number } => m !== null)
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
              const top = moves[0]
              const band = partiesInZone(parties, r.axis, r.zoneIndex).slice(0, 3)
              const shorten = (t: string) => (t.length > 44 ? t.slice(0, 43) + '…' : t)
              const note = (
                <>
                  {top && (
                    <span className="an-line">
                      <span className="an-key">{top.delta < 0 ? '◀ pulled left' : top.delta > 0 ? 'pulled right ▶' : 'held centre'}</span>{' '}
                      most when you {top.h.ratified ? 'ratified' : 'struck'} “{shorten(top.h.title)}”.
                    </span>
                  )}
                  <span className="an-line">
                    {band.length ? (
                      <>You share this band with <strong>{band.map((p) => p.name).join(', ')}</strong>.</>
                    ) : (
                      'No major party sits in your band here.'
                    )}
                  </span>
                </>
              )
              return (
                <SpectrumBar
                  key={r.axis}
                  axis={r.axis}
                  label={axisMeta(r.axis).name}
                  read={`${readPosition(r.mean)} · ${certaintyWord(r.certainty)}`}
                  mean={r.mean}
                  std={r.std}
                  note={note}
                />
              )
            })}
          </div>

          <div className="v-right">
            <VerdictIdentity archetype={arch} />
            <EchoList title="Parties you most resemble" items={topParties.map((p) => ({ name: p.party.name, sub: p.party.country, pct: p.pct }))} />
            <EchoList title="Leaders your votes echoed" items={topLeaders.map((p) => ({ name: p.leader.name, sub: `${p.leader.country} · ${p.leader.era}`, pct: p.pct }))} />
            <TallyStrip ratified={ratified} struck={struck} total={state.history.length} />
            <div className="v-actions">
              <button className="v-btn" onClick={() => setShowTrail(true)}>▸ See Detailed Analysis</button>
              <button className="v-btn" onClick={copyLink}>{copied ? '✓ Link copied' : '🔗 Copy link'}</button>
              <button className="v-btn" onClick={saveImage}>⤓ Save image</button>
              <button className="v-btn" onClick={onHome}>↩ Dossier</button>
              <button className="v-btn solid" onClick={onNewRun}>↻ New Session</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
