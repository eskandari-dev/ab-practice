function Skeleton({ wide = false }) {
  return (
    <div className={'page skeleton-page' + (wide ? ' skeleton-page-wide' : '')} aria-hidden="true">
      <span className="skeleton skeleton-title" />
      <span className="skeleton skeleton-line short" />
      <span className="skeleton skeleton-card" />
      <div className="skeleton-row">
        <span className="skeleton skeleton-tile" />
        <span className="skeleton skeleton-tile" />
      </div>
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-line short" />
    </div>
  )
}

export default Skeleton
