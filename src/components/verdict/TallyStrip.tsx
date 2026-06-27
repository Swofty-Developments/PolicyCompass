export function TallyStrip({ ratified, struck, total }: { ratified: number; struck: number; total: number }) {
  return (
    <div className="v-tally">
      <div><div className="big" style={{ color: 'var(--green)' }}>{ratified}</div><div className="cap">Ratified</div></div>
      <div><div className="big" style={{ color: 'var(--red)' }}>{struck}</div><div className="cap">Struck</div></div>
      <div><div className="big" style={{ color: 'var(--sepia)' }}>{total}</div><div className="cap">Total</div></div>
    </div>
  )
}
