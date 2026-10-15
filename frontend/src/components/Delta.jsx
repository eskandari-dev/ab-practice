// change in percentage points between two scores, e.g. ▲ +12%
function Delta({ value }) {
  const rounded = Math.round(value)
  let className = 'delta delta-same'
  let label = '= 0%'
  if (rounded > 0) {
    className = 'delta delta-up'
    label = '▲ +' + rounded + '%'
  } else if (rounded < 0) {
    className = 'delta delta-down'
    label = '▼ ' + rounded + '%'
  }
  return <span className={className} dir="ltr">{label}</span>
}

export default Delta
