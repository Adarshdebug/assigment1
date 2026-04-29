import { useEffect, useState } from "react";
import ManagerView from "./ManagerView";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const metricLabels = {
  leadTime: { label: "Lead Time", suffix: "days" },
  cycleTime: { label: "Cycle Time", suffix: "days" },
  bugRate: { label: "Bug Rate", suffix: "" },
  deploymentFrequency: { label: "Deployment Frequency", suffix: "deployments" },
  prThroughput: { label: "PR Throughput", suffix: "merged PRs" }
};

function App() {
  const [developers, setDevelopers] = useState([]);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [activeView, setActiveView] = useState("developer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDevelopers() {
      try {
        const response = await fetch(`${API_BASE_URL}/developers`);

        if (!response.ok) {
          throw new Error("Could not load developers");
        }

        const data = await response.json();
        setDevelopers(data);
        setSelectedDeveloperId(data[0]?.id || "");
      } catch (err) {
        setError(err.message);
      }
    }

    loadDevelopers();
  }, []);

  useEffect(() => {
    if (!selectedDeveloperId) return;

    async function loadMetrics() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/metrics/${selectedDeveloperId}`);

        if (!response.ok) {
          throw new Error("Could not load metrics for this developer");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setDashboardData(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, [selectedDeveloperId]);

  return (
    <main className="page-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Developer Productivity Dashboard</p>
          <h1>Metrics with context and next steps</h1>
        </div>

        <div className="toolbar">
          <div className="view-toggle">
            <button
              className={activeView === "developer" ? "active" : ""}
              onClick={() => setActiveView("developer")}
              type="button"
            >
              Developer
            </button>
            <button
              className={activeView === "manager" ? "active" : ""}
              onClick={() => setActiveView("manager")}
              type="button"
            >
              Manager
            </button>
          </div>

          {activeView === "developer" && (
            <label className="developer-select">
              Developer
              <select
                value={selectedDeveloperId}
                onChange={(event) => setSelectedDeveloperId(event.target.value)}
              >
                {developers.map((developer) => (
                  <option key={developer.id} value={developer.id}>
                    {developer.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      {activeView === "manager" && <ManagerView />}

      {activeView === "developer" && loading && <p className="status-message">Loading dashboard data...</p>}
      {activeView === "developer" && error && <p className="error-message">{error}</p>}

      {activeView === "developer" && !loading && dashboardData && (
        <>
          <section className="section-block">
            <h2>Metrics</h2>
            <div className="metrics-grid">
              {Object.entries(dashboardData.metrics).map(([key, value]) => {
                const metric = metricLabels[key];

                return (
                  <article className="metric-card" key={key}>
                    <span>{metric.label}</span>
                    <strong>{value}</strong>
                    {metric.suffix && <small>{metric.suffix}</small>}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="section-block">
            <h2>Insights</h2>
            <p className="insight-text">{dashboardData.insights}</p>
          </section>

          <section className="section-block">
            <h2>Suggested Actions</h2>
            <ul className="suggestion-list">
              {dashboardData.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

export default App;
