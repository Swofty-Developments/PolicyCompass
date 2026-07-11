import { useState } from 'react'
import { AXIS_IDS } from '../../../types'
import { archetypes } from '../../../data'
import { axisMeta, readPosition, to100 } from '../../../engine/axes'
import { SpectrumBar } from '../../../components/verdict/SpectrumBar'
import { EchoList } from '../../../components/verdict/EchoList'
import { ENDING_COPY } from '../../data/endings'
import { scenario } from '../../data/scenario'
import { buildTermsShareUrl } from '../../lib/share'
import { downloadObituaryImage } from '../../lib/obituaryImage'
import type { Obituary as ObituaryData } from '../../types'
import '../../../styles/verdict.css'

const TERM_WORDS = ['no terms', 'one term', 'two terms', 'three terms']

function fillCopy(template: string, obit: ObituaryData): string {
  const party = scenario.blocs.find((b) => b.id === obit.setup.partyId)?.name ?? obit.setup.partyId
  return template
    .split('{party}').join(party)
    .split('{terms}').join(TERM_WORDS[obit.termsServed] ?? `${obit.termsServed} terms`)
    .split('{cause}').join(obit.ending.cause)
    .split('{archetype}').join(obit.archetypeTitle)
}

/** The full-screen dossier that ends a career. Read-only when `onFile` is absent. */
export function Obituary({
  obit,
  filed,
  onFile,
  onArchive,
  onClose,
  closeLabel = 'Close the file',
}: {
  obit: ObituaryData
  filed?: boolean
  onFile?: () => void
  onArchive?: () => void
  onClose: () => void
  closeLabel?: string
}) {
  const [copied, setCopied] = useState(false)
  const copy = ENDING_COPY[obit.ending.stamp]
  const archetype = archetypes.find((a) => a.id === obit.archetypeId)
  const cutShort = obit.ending.cutShort

  const copyLink = () => {
    navigator.clipboard
      ?.writeText(buildTermsShareUrl(obit))
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      })
      .catch(() => {})
  }

  return (
    <div className="desk t-obit-wrap">
      <div className="sheet t-obit">
        <div className="t-obit-stamps">
          <span className="stamp t-obit-stamp">{obit.ending.stamp}</span>
          {cutShort && <span className="stamp t-obit-stamp cut">CUT SHORT</span>}
        </div>

        <div className="t-obit-head">
          <div className="kicker">Obituary · The Republic Remembers</div>
          <h2 className="t-obit-headline">{fillCopy(copy.headline, obit)}</h2>
          <div className="t-obit-line">{fillCopy(copy.line, obit)}</div>
          <div className="hand t-epitaph">“{obit.epitaph}”</div>
        </div>

        <div className="t-obit-body">
          <div className="t-obit-left">
            <div className="t-sec">The career</div>
            <div className="t-timeline">
              {obit.offices.map((office, i) => (
                <div className="t-timeline-row" key={i}>
                  <span className="t-tl-term">Term {['I', 'II', 'III'][i] ?? i + 1}</span>
                  <span className="t-tl-office">{office}</span>
                </div>
              ))}
              <div className="t-timeline-row end">
                <span className="t-tl-term">Cause</span>
                <span className="t-tl-office">{obit.ending.cause}</span>
              </div>
            </div>

            {obit.signatureVotes.length > 0 && (
              <>
                <div className="t-sec">Signature divisions</div>
                <div className="t-sigvotes">
                  {obit.signatureVotes.map((v, i) => (
                    <div className="t-sigvote" key={i}>
                      <div className="t-sigvote-title">{v.title}</div>
                      <div className="t-sigvote-line">{v.line}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="t-sec">For the record</div>
            <div className="t-brags">
              <div className="chip"><span className="n">{obit.brag.termsServed}</span><span className="u">terms served</span></div>
              <div className="chip"><span className="n">{obit.brag.winningSide}</span><span className="u">winning side</span></div>
              <div className="chip"><span className="n">{obit.brag.promisesKept}/{obit.brag.promisesBroken}</span><span className="u">promises kept / broken</span></div>
              <div className="chip"><span className="n">{obit.brag.scandalsSurvived}</span><span className="u">scandals survived</span></div>
            </div>
            <div className="t-tallyline">
              Ratified {obit.tally.ratified} · Struck {obit.tally.struck} · Abstained {obit.tally.abstained} · Passed the House {obit.tally.passed}
            </div>
          </div>

          <div className="t-obit-right">
            <div className="t-sec">History's verdict</div>
            <div className="t-verdict-name">{obit.archetypeTitle}</div>
            {archetype && <div className="t-verdict-blurb">{archetype.blurb}</div>}
            {cutShort && (
              <div className="t-thin-note">The record was too thin to read — the bands below run wide.</div>
            )}
            <SpectrumBar
              headline
              label="Final standing"
              read={cutShort ? 'too thin to read' : `${readPosition(obit.overall)} · ${to100(obit.overall)}/100`}
              mean={obit.overall}
              std={obit.overallStd}
            />
            {AXIS_IDS.map((axis) => (
              <SpectrumBar
                key={axis}
                axis={axis}
                label={axisMeta(axis).name}
                read={cutShort ? 'too thin to read' : readPosition(obit.axisMeans[axis] ?? 0)}
                mean={obit.axisMeans[axis] ?? 0}
                std={obit.axisStds[axis] ?? 0.2}
              />
            ))}
            <EchoList title="Leaders echoed" items={obit.leaderEchoes.map((e) => ({ name: e.name, sub: '', pct: e.pct }))} />
            <EchoList title="Parties resembled" items={obit.partyEchoes.map((e) => ({ name: e.name, sub: '', pct: e.pct }))} />
          </div>
        </div>

        <div className="t-obit-actions">
          {onFile && (
            <button className="t-btn solid" onClick={onFile} disabled={filed}>
              {filed ? '✓ Filed to the Archive' : 'File to the Archive'}
            </button>
          )}
          {filed && onArchive && (
            <button className="t-btn" onClick={onArchive}>Open the Archive</button>
          )}
          <button className="t-btn" onClick={copyLink}>{copied ? '✓ Link copied' : 'Copy link'}</button>
          <button className="t-btn" onClick={() => downloadObituaryImage(obit)}>Save image</button>
          <button className="t-btn" onClick={onClose}>{closeLabel}</button>
        </div>

        <div className="t-disclaimer">
          A reading of votes cast in a fiction, by the same instrument that scores the test — a mirror, not a measure of the soul.
        </div>
      </div>
    </div>
  )
}
