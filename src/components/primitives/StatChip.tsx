export function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="chip">
      <span className="n">{value}</span>
      <span className="u">{label}</span>
    </div>
  )
}
