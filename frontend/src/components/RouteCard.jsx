export default function RouteCard({ route, compact = false }) {
  return (
    <div className={`route-card ${compact ? "compact" : ""}`}>
      <div className="route-card-top">
        <div>
          <div className="route-rank">Route #{route.rank}</div>
          <div className="route-score">Score {route.score.toFixed(3)}</div>
        </div>

        <div className="route-distance">{route.distance_km.toFixed(2)} km</div>
      </div>

      <div className="badge-row card-badges">
        {route.badges?.map((badge, idx) => (
          <span key={idx} className={`route-badge ${badge.tone}`}>
            {badge.label}
          </span>
        ))}
      </div>

      <div className="route-metrics">
        <MiniMetric label="Park" value={`${route.park_near_pct.toFixed(1)}%`} />
        <MiniMetric label="Safety" value={route.safety_score.toFixed(2)} />
        <MiniMetric label="Turns" value={route.turns} />
        <MiniMetric label="Major" value={`${route.major_pct.toFixed(1)}%`} />
      </div>

      <p className="route-summary">{route.summary}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}