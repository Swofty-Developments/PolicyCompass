import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ArtifactKind, Precedent } from '../../types'
import { SourceLink } from '../../../components/primitives'
import '../../styles/terms.css'

const OPTION_TAGS: Partial<Record<ArtifactKind, string>> = {
  telegram: 'Reply paid',
  frontpage: 'Statement',
  memo: 'Minute',
  ultimatum: 'Answer',
}

const LETTERS = ['A', 'B', 'C', 'D', 'E']

function Chrome({ kind, byline }: { kind: ArtifactKind; byline?: string }) {
  if (kind === 'telegram') {
    return (
      <div className="t-tg-route">
        <span className="t-tg-co">Republic Telegraph Service</span>
        <span className="t-tg-mark">Received at the House<br />Priority · Reply Paid</span>
      </div>
    )
  }
  if (kind === 'frontpage') {
    return (
      <>
        <div className="t-fp-masthead">{byline ?? 'The Republic Herald'}</div>
        <div className="t-fp-dateline">
          <span>Late Edition</span>
          <span>The Morning of the Division</span>
          <span>One Penny</span>
        </div>
      </>
    )
  }
  if (kind === 'whipnote') {
    return (
      <div className="t-whip-head">
        <span className="t-whip-office">Office of the Chief Whip</span>
        <span className="t-whip-party">In confidence</span>
      </div>
    )
  }
  if (kind === 'mandate') return <div className="t-mandate-orn">❦</div>
  return null
}

/** One paper chassis, skinned per genre. Precedents render at the foot on
 * desktop and move to the verso on mobile — tap the folded corner to turn. */
export function PaperArtifact({
  kind,
  title,
  body,
  byline,
  header,
  stampText,
  options,
  precedents,
  marginNote,
  onChoose,
}: {
  kind: ArtifactKind
  title: string
  body: string
  byline?: string
  header?: string
  stampText?: string
  options: { id: string; label: string; detail?: string }[]
  precedents?: Precedent[]
  marginNote?: string
  onChoose: (optionId: string) => void
}) {
  const [flipped, setFlipped] = useState(false)
  const hasPrecedents = !!precedents?.length
  const isMemoSkin = kind === 'memo' || kind === 'ultimatum'
  const isMandate = kind === 'mandate'
  const tag = OPTION_TAGS[kind]

  const front = (
    <div className={`t-paper t-paper--${kind}`}>
      <i className="t-grain" aria-hidden />
      {stampText && <span className="stamp t-stamp">{stampText}</span>}
      <Chrome kind={kind} byline={byline} />

      {isMemoSkin && (
        <div className="t-memo-fields">
          <div className="t-memo-title">{kind === 'ultimatum' ? 'Final Memorandum' : 'Memorandum'}</div>
          <div className="t-memo-field"><span className="k">To</span><span className="v">The Member for Halloway</span></div>
          {byline && <div className="t-memo-field"><span className="k">From</span><span className="v">{byline}</span></div>}
          <div className="t-memo-field"><span className="k">In re</span><span className="v">{title}</span></div>
        </div>
      )}
      {isMandate && (
        <>
          {byline && <div className="t-mandate-patron">{byline}</div>}
          <div className="t-title">{title}</div>
        </>
      )}
      {!isMemoSkin && !isMandate && <h2 className="t-title">{title}</h2>}

      <div className="t-paper-scroll">
        <p className={'t-body' + (kind === 'frontpage' ? ' t-fp-body' : '')}>{body}</p>
        {kind === 'telegram' && byline && <div className="t-tg-sender">— {byline}</div>}
        {(kind === 'letter' || kind === 'whipnote') && byline && <div className="t-letter-sig">{byline}</div>}
        {marginNote && <div className="t-margin-note">{marginNote}</div>}
      </div>

      {options.length > 0 && (
        <div className="t-options">
          {options.map((o, i) => (
            <button className="t-option" key={o.id} onClick={() => onChoose(o.id)}>
              {tag && <span className="t-option-tag">{tag} · {LETTERS[i] ?? i + 1}</span>}
              <span className="t-option-label">{o.label}</span>
              {o.detail && <span className="t-option-detail">{o.detail}</span>}
            </button>
          ))}
        </div>
      )}

      {hasPrecedents && (
        <div className="t-precfoot">
          <span className="t-precfoot-label">Precedents</span>
          {precedents!.map((p, i) => (
            <span className="t-precitem" key={p.url + i}>
              <span className="t-precnum">{i + 1}</span>
              <SourceLink name={p.name} url={p.url} />
            </span>
          ))}
        </div>
      )}

      {hasPrecedents && (
        <>
          <span className="t-fold-hint" aria-hidden>precedents overleaf</span>
          <button className="t-fold" aria-label="Turn the paper over" onClick={() => setFlipped(true)} />
        </>
      )}
    </div>
  )

  const back = hasPrecedents ? (
    <div className="t-paper t-verso">
      <i className="t-grain" aria-hidden />
      <div className="t-kick">Verso · Precedents &amp; Papers</div>
      <div className="t-verso-title">{title}</div>
      <div className="t-verso-note">This paper composites the documented record below.</div>
      <div className="t-paper-scroll">
        <div className="t-verso-list">
          {precedents!.map((p, i) => (
            <span className="t-verso-item" key={p.url + i}>
              <span className="t-precnum">{i + 1}</span>
              <SourceLink name={p.name} url={p.url} />
            </span>
          ))}
        </div>
      </div>
      <button className="t-btn quiet t-verso-back" onClick={() => setFlipped(false)}>Turn back</button>
    </div>
  ) : null

  return (
    <div className="t-artifact-wrap">
      {header && <div className="t-arthead">{header}</div>}
      <div className={`t-flip t-flip--${kind}`}>
        <motion.div
          className={'t-flip-inner' + (flipped ? ' is-flipped' : '')}
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.3, 0.1, 0.2, 1] }}
        >
          <div className="t-face t-face-front">{front}</div>
          {back && <div className="t-face t-face-back">{back}</div>}
        </motion.div>
      </div>
    </div>
  )
}
