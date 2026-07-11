import type { AnalystSource, Bill } from '../../types'
import { Highlighted } from '../../lib/Highlighted'
import { Exhibit } from '../charts'
import { Icons, SectionHeading, Stamp } from '../primitives'
import { KeyFigures } from './KeyFigures'
import { AnalystColumns } from './AnalystColumns'
import { SourceList } from './SourceList'
import '../../styles/card.css'

export function BillCard({ bill, billNumber, maxTarget }: { bill: Bill; billNumber: number; maxTarget: number }) {
  // Number sources in order of appearance (deduped by url) for footnote-style citations.
  const sources: AnalystSource[] = []
  const numByUrl = new Map<string, number>()
  for (const p of [...bill.analysisFor, ...bill.analysisAgainst]) {
    if (!numByUrl.has(p.source.url)) {
      sources.push(p.source)
      numByUrl.set(p.source.url, sources.length)
    }
  }
  const citeNumber = (url: string) => numByUrl.get(url) ?? 0

  return (
    <div className="sheet billsheet">
      <Stamp className="stampbox">TABLED · Nº {bill.number}</Stamp>

      <header className="b-top">
        <div className="b-kicker">Bill Nº {bill.number} · Session XII · Tabled for Vote</div>
        <h2 className="b-title">{bill.title}</h2>
        <div className="b-dek">{bill.dek}</div>
      </header>

      <div className="b-scroll">
      <div className="b-grid">
        <section className="b-lead">
          <SectionHeading icon={Icons.problem}>The Current Problem</SectionHeading>
          <div className="b-copy"><Highlighted text={bill.problem} phrases={bill.problemHighlights} /></div>
          <Exhibit chart={bill.exhibit} />
        </section>

        <section className="b-right">
          <KeyFigures stats={bill.stats} />
          <div className="blk">
            <SectionHeading icon={Icons.offer}>The Offer</SectionHeading>
            <div className="b-copy"><Highlighted text={bill.offer} phrases={bill.offerHighlights} /></div>
          </div>
          <div className="blk">
            <SectionHeading icon={Icons.intent}>The Intent</SectionHeading>
            <div className="b-copy">{bill.intent}</div>
          </div>
        </section>

        <section className="b-analysis">
          <SectionHeading icon={Icons.analysts}>What the Analysts Say</SectionHeading>
          <AnalystColumns forPoints={bill.analysisFor} againstPoints={bill.analysisAgainst} citeNumber={citeNumber} />
        </section>
      </div>
      </div>

      <SourceList sources={sources} />
      <footer className="b-foot">Bill {billNumber} of ≤{maxTarget} · the docket closes when the floor is satisfied</footer>
    </div>
  )
}
