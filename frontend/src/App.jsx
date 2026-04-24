import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import MapView from "./components/MapView";
import RouteCard from "./components/RouteCard";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const PRESETS = [
  {
    label: "Scenic",
    value:
      "prefer scenic calm walk, avoid busy roads, fewer intersections, more residential streets, stay near parks",
  },
  {
    label: "Safer",
    value:
      "prefer safer route, avoid tunnels, avoid major roads, prefer well-lit areas, fewer crossings",
  },
  {
    label: "Fewer Turns",
    value:
      "prefer fewer turns, fewer intersections, straighter route, easy navigation",
  },
  {
    label: "Shortest",
    value: "shortest route, minimize distance, do not care about scenery",
  },
];

function modeTone(mode) {
  if (mode === "prompt") return "mode-prompt";
  if (mode === "profile") return "mode-profile";
  if (mode === "hybrid") return "mode-hybrid";
  return "";
}

function inferBadges(route) {
  const badges = [];

  if (route.park_near_pct >= 15) badges.push({ label: "Scenic", tone: "green" });
  if ((route.profile_score ?? -1) > 0.7 || route.safety_score >= 55) {
    badges.push({ label: "Safer", tone: "blue" });
  }
  if (route.turns <= 8 && route.intersections <= 70) {
    badges.push({ label: "Fewer Turns", tone: "purple" });
  }
  if (route.rank === 1 || route.distance_km <= 1.9) {
    badges.push({ label: "Shortest", tone: "orange" });
  }

  if (!badges.length) badges.push({ label: "Balanced", tone: "gray" });
  return badges;
}

export default function App() {
  const [origin, setOrigin] = useState(
    "University of Toronto, Toronto, Canada"
  );
  const [destination, setDestination] = useState(
    "Nathan Phillips Square, Toronto, Canada"
  );
  const [preference, setPreference] = useState(PRESETS[0].value);
  const [userId, setUserId] = useState("omar_demo");
  const [requestDatetime, setRequestDatetime] = useState("2026-04-07T18:15:00");
  const [rankingMode, setRankingMode] = useState("profile");

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);

  const [profileSummary, setProfileSummary] = useState("");
  const [responseContext, setResponseContext] = useState(null);
  const [responseMode, setResponseMode] = useState("");

  const timerRef = useRef(null);
  const startedAtRef = useRef(null);

  const selectedRoute = routes[selectedRouteIdx] || null;

  useEffect(() => {
    if (loading) {
      startedAtRef.current = Date.now();
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startedAtRef.current) / 1000);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRoutes([]);
    setSelectedRouteIdx(0);
    setProfileSummary("");
    setResponseContext(null);
    setResponseMode("");

    try {
      const payload = {
        origin,
        destination,
        dist_meters: 3000,
        k_routes: 5,
        ranking_mode: rankingMode,
      };

      if (rankingMode === "prompt" || rankingMode === "hybrid") {
        payload.preference = preference;
      }

      if (rankingMode === "profile" || rankingMode === "hybrid") {
        payload.user_id = userId;
        payload.request_datetime = requestDatetime;
      }

      const res = await axios.post(`${API_BASE}/rank-routes`, payload);

      const enriched = (res.data.routes || []).map((route) => ({
        ...route,
        badges: inferBadges(route),
      }));

      setRoutes(enriched);
      setProfileSummary(res.data.profile_summary || "");
      setResponseContext(res.data.context || null);
      setResponseMode(res.data.ranking_mode || "");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Failed to fetch ranked routes. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const explanation = useMemo(() => {
    if (!selectedRoute) return null;

    const reasons = [];

    if (selectedRoute.profile_score !== null && selectedRoute.profile_score !== undefined) {
      reasons.push(`profile score: ${selectedRoute.profile_score.toFixed(3)}`);
    }

    if (selectedRoute.sbert_score !== null && selectedRoute.sbert_score !== undefined) {
      reasons.push(`semantic score: ${selectedRoute.sbert_score.toFixed(3)}`);
    }

    if (selectedRoute.park_near_pct >= 15) reasons.push("high park proximity");
    if (selectedRoute.major_pct <= 10) reasons.push("low major-road exposure");
    if (selectedRoute.turns <= 8) reasons.push("relatively few turns");
    if (selectedRoute.safety_score >= 55) reasons.push("stronger safety proxy");
    if (selectedRoute.walk_pct >= 50) reasons.push("high walk-friendly segment share");

    if (!reasons.length) reasons.push("good overall balance across route features");
    return reasons;
  }, [selectedRoute]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-badge">GeoRoute</div>
          <h1>Preference-Based Route Ranking</h1>
          <p>
            Dynamic route ranking with prompt, profile, or hybrid personalization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="panel form-panel">
          <div className="panel-header">
            <h2>Route Query</h2>
            <span className="panel-tag">FastAPI + React</span>
          </div>

          <label>Ranking Mode</label>
          <select
            value={rankingMode}
            onChange={(e) => setRankingMode(e.target.value)}
          >
            <option value="prompt">Prompt</option>
            <option value="profile">Profile</option>
            <option value="hybrid">Hybrid</option>
          </select>

          <label>Origin</label>
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Enter origin"
          />

          <label>Destination</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter destination"
          />

          {(rankingMode === "prompt" || rankingMode === "hybrid") && (
            <>
              <label>Preference Prompt</label>
              <textarea
                rows={4}
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                placeholder="Describe what kind of route you want..."
              />

              <div className="preset-section">
                <div className="preset-label">Quick presets</div>
                <div className="preset-grid">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="chip-btn"
                      onClick={() => setPreference(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {(rankingMode === "profile" || rankingMode === "hybrid") && (
            <>
              <label>User ID</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. omar_demo"
              />

              <label>Request Datetime</label>
              <input
                value={requestDatetime}
                onChange={(e) => setRequestDatetime(e.target.value)}
                placeholder="2026-04-07T18:15:00"
              />
            </>
          )}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Ranking routes..." : "Rank Routes"}
          </button>

          {loading && (
            <div className="loading-box">
              <div className="spinner" />
              <div>
                <div className="loading-title">Backend is processing...</div>
                <div className="loading-subtitle">
                  Elapsed time: {elapsed.toFixed(1)}s
                </div>
              </div>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}
        </form>

        <div className="panel">
          <div className="panel-header">
            <h2>Response Context</h2>
            <span className={`panel-tag ${modeTone(responseMode || rankingMode)}`}>
              {responseMode || "No response yet"}
            </span>
          </div>

          {!responseContext ? (
            <div className="empty-box">No response context available yet.</div>
          ) : (
            <div className="context-grid">
              <ContextItem label="Day" value={responseContext.day_name} />
              <ContextItem label="Type" value={responseContext.day_type} />
              <ContextItem label="Time Bucket" value={responseContext.time_bucket} />
              <ContextItem label="Season" value={responseContext.season} />
              <ContextItem
                label="Rush Hour"
                value={responseContext.rush_hour ? "Yes" : "No"}
              />
              <ContextItem label="Hour" value={responseContext.hour} />
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Profile Summary</h2>
            <span className="panel-tag">
              {profileSummary ? "Active" : "None"}
            </span>
          </div>

          {profileSummary ? (
            <div className="summary-box">
              <p>{profileSummary}</p>
            </div>
          ) : (
            <div className="empty-box">
              No profile summary returned. Use profile or hybrid mode.
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Top Ranked Routes</h2>
            <span className="panel-tag">{routes.length} returned</span>
          </div>

          {!loading && routes.length === 0 && (
            <div className="empty-box">
              Submit an origin, destination, and ranking mode to see results.
            </div>
          )}

          {!loading &&
            routes.map((route, idx) => (
              <div
                key={idx}
                className={`route-card-wrap ${idx === selectedRouteIdx ? "selected" : ""}`}
                onClick={() => setSelectedRouteIdx(idx)}
              >
                <RouteCard route={route} compact />
              </div>
            ))}
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h2>Interactive Route Explorer</h2>
            <p>
              Compare prompt-based, profile-based, and hybrid route ranking.
            </p>
          </div>
          <div className="topbar-stats">
            <div className="stat-pill">
              <span>Mode</span>
              <strong className={modeTone(responseMode || rankingMode)}>
                {responseMode || rankingMode}
              </strong>
            </div>
            <div className="stat-pill">
              <span>City</span>
              <strong>Toronto</strong>
            </div>
          </div>
        </div>

        <div className="main-grid">
          <section className="map-card">
            <div className="map-card-header">
              <h3>Route Map</h3>
              <span>
                {selectedRoute ? `Showing route #${selectedRoute.rank}` : "No route yet"}
              </span>
            </div>
            <div className="map-frame">
              <MapView routes={routes} selectedRouteIdx={selectedRouteIdx} />
            </div>
          </section>

          <section className="details-card">
            <div className="panel-header">
              <h3>Selected Route Details</h3>
              <span className="panel-tag">
                {selectedRoute ? `Rank #${selectedRoute.rank}` : "Waiting"}
              </span>
            </div>

            {!selectedRoute ? (
              <div className="empty-box">
                Select a route after ranking to inspect its features.
              </div>
            ) : (
              <>
                <div className="badge-row">
                  {selectedRoute.badges?.map((badge, idx) => (
                    <span key={idx} className={`route-badge ${badge.tone}`}>
                      {badge.label}
                    </span>
                  ))}
                </div>

                <div className="metric-grid">
                  <Metric label="Combined Score" value={selectedRoute.combined_score.toFixed(3)} />
                  <Metric
                    label="Profile Score"
                    value={
                      selectedRoute.profile_score !== null &&
                      selectedRoute.profile_score !== undefined
                        ? selectedRoute.profile_score.toFixed(3)
                        : "N/A"
                    }
                  />
                  <Metric
                    label="SBERT Score"
                    value={
                      selectedRoute.sbert_score !== null &&
                      selectedRoute.sbert_score !== undefined
                        ? selectedRoute.sbert_score.toFixed(3)
                        : "N/A"
                    }
                  />
                  <Metric label="Distance" value={`${selectedRoute.distance_km.toFixed(2)} km`} />
                  <Metric label="Park Near" value={`${selectedRoute.park_near_pct.toFixed(1)}%`} />
                  <Metric label="Safety" value={`${selectedRoute.safety_score.toFixed(1)}/100`} />
                  <Metric label="Turns" value={selectedRoute.turns} />
                  <Metric label="Intersections" value={selectedRoute.intersections} />
                  <Metric label="Major Roads" value={`${selectedRoute.major_pct.toFixed(1)}%`} />
                  <Metric label="Walk %" value={`${selectedRoute.walk_pct.toFixed(1)}%`} />
                </div>

                <div className="why-box">
                  <h4>Why this route?</h4>
                  <ul>
                    {explanation?.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="summary-box">
                  <h4>Route Summary</h4>
                  <p>{selectedRoute.summary}</p>
                </div>
              </>
            )}
          </section>
        </div>

        <section className="comparison-card">
          <div className="panel-header">
            <h3>Route Comparison Table</h3>
            <span className="panel-tag">Prompt vs profile vs combined</span>
          </div>

          {routes.length === 0 ? (
            <div className="empty-box">No route comparison available yet.</div>
          ) : (
            <div className="table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Badges</th>
                    <th>Combined</th>
                    <th>Profile</th>
                    <th>SBERT</th>
                    <th>Distance</th>
                    <th>Park Near</th>
                    <th>Safety</th>
                    <th>Turns</th>
                    <th>Intersections</th>
                    <th>Major %</th>
                    <th>Walk %</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route, idx) => (
                    <tr
                      key={idx}
                      className={idx === selectedRouteIdx ? "active-row" : ""}
                      onClick={() => setSelectedRouteIdx(idx)}
                    >
                      <td>#{route.rank}</td>
                      <td>
                        <div className="table-badges">
                          {route.badges?.map((badge, bidx) => (
                            <span key={bidx} className={`route-badge small ${badge.tone}`}>
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{route.combined_score.toFixed(3)}</td>
                      <td>
                        {route.profile_score !== null && route.profile_score !== undefined
                          ? route.profile_score.toFixed(3)
                          : "N/A"}
                      </td>
                      <td>
                        {route.sbert_score !== null && route.sbert_score !== undefined
                          ? route.sbert_score.toFixed(3)
                          : "N/A"}
                      </td>
                      <td>{route.distance_km.toFixed(2)} km</td>
                      <td>{route.park_near_pct.toFixed(1)}%</td>
                      <td>{route.safety_score.toFixed(1)}/100</td>
                      <td>{route.turns}</td>
                      <td>{route.intersections}</td>
                      <td>{route.major_pct.toFixed(1)}%</td>
                      <td>{route.walk_pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ContextItem({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}