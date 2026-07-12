import type { TermsEvent } from '../../types'
import { PaperArtifact } from './PaperArtifact'

const DEFAULT_STAMPS: Partial<Record<TermsEvent['kind'], string>> = {
  telegram: 'URGENT',
  ultimatum: 'FINAL NOTICE',
  memo: 'CONFIDENTIAL',
}

/** Maps an authored event onto the paper chassis. */
export function EventArtifact({
  event,
  header,
  marginNote,
  onChoose,
}: {
  event: TermsEvent
  header?: string
  marginNote?: string
  onChoose: (optionId: string) => void
}) {
  return (
    <PaperArtifact
      kind={event.kind}
      title={event.title}
      body={event.body}
      byline={event.byline}
      header={header}
      stampText={DEFAULT_STAMPS[event.kind]}
      options={event.options.map((o) => ({ id: o.id, label: o.label, detail: o.detail }))}
      precedents={event.precedents}
      marginNote={marginNote}
      onChoose={onChoose}
    />
  )
}
