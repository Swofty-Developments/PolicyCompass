import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Character, DialogueChoice, DialogueLine } from '../../types'
import '../../styles/terms-dialogue.css'

type Beat = DialogueLine | DialogueChoice

function isChoiceBeat(b: Beat): b is DialogueChoice {
  return 'options' in b
}

/** Visual-novel player: one cast cutout standing on the desk, one line on a
 *  slip. Tap / Space / Enter advances; choices pause; skip stops at choices. */
export function DialogueScene({
  scene,
  characters,
  onChoice,
  onDone,
  header,
  skipLabel,
  skipLabelShort,
}: {
  scene: { beats: Beat[] }
  characters: Character[]
  onChoice: (choiceIndex: number, optionId: string) => void
  onDone: () => void
  header?: string
  skipLabel?: string
  /** Swapped in below 1280px, where the full label would overlap the header */
  skipLabelShort?: string
}) {
  const beats = scene.beats
  const [idx, setIdx] = useState(0)
  const beat: Beat | undefined = beats[idx]

  // Preload every cast cutout so speaker changes never flash blank paper.
  useEffect(() => {
    characters.forEach((c) => {
      if (c.portrait) new Image().src = c.portrait
    })
  }, [characters])

  const advance = () => {
    if (beat && isChoiceBeat(beat)) return
    if (idx + 1 >= beats.length) onDone()
    else setIdx(idx + 1)
  }

  const choose = (optionId: string) => {
    const choiceIndex = beats.slice(0, idx).filter(isChoiceBeat).length
    onChoice(choiceIndex, optionId)
    if (idx + 1 >= beats.length) onDone()
    else setIdx(idx + 1)
  }

  const skip = () => {
    let j = idx
    while (j < beats.length && !isChoiceBeat(beats[j])) j++
    if (j >= beats.length) onDone()
    else if (j !== idx) setIdx(j)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      if (e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') return
      e.preventDefault()
      advance()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // The standing cutout: the last character to have spoken at or before idx.
  const cast = useMemo(() => {
    for (let i = Math.min(idx, beats.length - 1); i >= 0; i--) {
      const b = beats[i]
      if (b && !isChoiceBeat(b) && b.speaker !== 'narrator' && b.speaker !== 'player')
        return characters.find((c) => c.id === b.speaker)
    }
    return undefined
  }, [beats, characters, idx])

  const line = beat && !isChoiceBeat(beat) ? beat : null
  const choice = beat && isChoiceBeat(beat) ? beat : null

  return (
    <div className="desk t-dlg" onClick={advance}>
      {header && <div className="t-dlg-header">{header}</div>}
      <button
        className="t-dlg-skip"
        onClick={(e) => {
          e.stopPropagation()
          skip()
        }}
      >
        {skipLabelShort ? (
          <>
            <span className="t-dlg-skip-full">{skipLabel ?? 'Skip'}</span>
            <span className="t-dlg-skip-short">{skipLabelShort}</span>
          </>
        ) : (
          skipLabel ?? 'Skip'
        )}{' '}
        ›
      </button>

      <div className="t-dlg-stage">
        <AnimatePresence>
          {cast?.portrait && (
            <motion.figure
              className="t-dlg-cutout"
              key={cast.id}
              initial={{ opacity: 0, x: 48, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: -1.3 }}
              exit={{ opacity: 0, x: -48, transition: { duration: 0.22 } }}
              transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <img className="t-dlg-litho" src={cast.portrait} alt={cast.name} draggable={false} />
              <figcaption className="t-dlg-nameplate">{cast.name}</figcaption>
            </motion.figure>
          )}
        </AnimatePresence>
      </div>

      <div className="t-dlg-foot">
        {line && line.speaker === 'narrator' && (
          <motion.div className="t-dlg-direction" key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {line.text}
          </motion.div>
        )}
        {line && line.speaker !== 'narrator' && (
          <motion.div
            className={'t-dlg-slip' + (line.speaker === 'player' ? ' player' : '')}
            key={idx}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {line.speaker === 'player' && <span className="t-dlg-slipname">You</span>}
            {line.speaker !== 'player' && !cast?.portrait && (
              <span className="t-dlg-slipname">{cast?.name ?? ''}</span>
            )}
            <p className="t-dlg-line">{line.text}</p>
          </motion.div>
        )}
        {choice && (
          <motion.div className="t-dlg-slip t-dlg-choice" key={idx} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <div className="t-dlg-prompt">{choice.prompt}</div>
            <div className="t-dlg-opts">
              {choice.options.map((o) => (
                <button
                  className="t-dlg-opt"
                  key={o.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    choose(o.id)
                  }}
                >
                  <span className="t-dlg-opt-label">{o.label}</span>
                  {o.detail && <span className="t-dlg-opt-detail">{o.detail}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {line && <div className="t-dlg-hint">tap to continue</div>}
      </div>
    </div>
  )
}
