export function TallyStrip({ ratified, struck, abstained, total }: { ratified: number; struck: number; abstained: number; total: number }) {
  return (
    <div className="v-tally">
      <div><div className="big" style={{ color: 'var(--green)' }}>{ratified}</div><div className="cap">Ratified</div></div>
      <div><div className="big" style={{ color: 'var(--red)' }}>{struck}</div><div className="cap">Struck</div></div>
      {abstained > 0 && <div><div className="big" style={{ color: 'var(--sepia)' }}>{abstained}</div><div className="cap">Abstained</div></div>}
      <div><div className="big" style={{ color: 'var(--sepia)' }}>{total}</div><div className="cap">Total</div></div>
    </div>
  )
}
