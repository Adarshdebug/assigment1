import { useEffect, useState } from "react";
import ManagerView from "./ManagerView";

const API_BASE = "https://assignment1-2.onrender.com";

const metricLabels = {
  leadTime: { label: "Lead Time", suffix: "days" },
  cycleTime: { label: "Cycle Time", suffix: "days" },
  bugRate: { label: "Bug Rate", suffix: "" },
  deploymentFrequency: { label: "Deployment Frequency", suffix: "deployments" },
  prThroughput: { label: "PR Throughput", suffix: "merged PRs" }
};

function normalizeMetricData(data) {
  if (data.metrics) {
    return data;
  }

  return {
    metrics: data,
    insights: "",
    suggestions: []
  };
}

function App() {
  const [developers, setDevelopers] = useState([]);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [managerMetrics, setManagerMetrics] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeView, setActiveView] = useState("developer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [devRes, managerRes] = await Promise.all([
          fetch(`${API_BASE}/developers`),
          fetch(`${API_BASE}/manager-metrics`)
        ]);

        if (!devRes.ok || !managerRes.ok) {
          throw new Error("Failed to load data");
        }

        const developers = await devRes.json();
        const managerMetrics = await managerRes.json();

        setDevelopers(developers);
        setManagerMetrics(managerMetrics);

        if (developers.length > 0) {
          const firstId = developers[0].id;
          setSelectedDeveloperId(firstId);

          const metricRes = await fetch(`${API_BASE}/metrics/${firstId}`);

          if (!metricRes.ok) {
            throw new Error("Failed to load metrics");
          }

          const metricData = await metricRes.json();
          setDashboardData(normalizeMetricData(metricData));
        }
      } catch (err) {
        setDevelopers([]);
        setManagerMetrics([]);
        setDashboardData(null);
        setError("Could not load developers");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleDeveloperChange(developerId) {
    setSelectedDeveloperId(developerId);
    setLoading(true);
    setError("");

    try {
      const metricRes = await fetch(`${API_BASE}/metrics/${developerId}`);

      if (!metricRes.ok) {
        throw new Error("Failed to load metrics");
      }

      const metricData = await metricRes.json();
      setDashboardData(normalizeMetricData(metricData));
    } catch (err) {
      setDashboardData(null);
      setError("Could not load metrics for this developer");
    } finally {
      setLoading(false);
    }
  }

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
                onChange={(event) => handleDeveloperChange(event.target.value)}
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

      {activeView === "manager" && <ManagerView managerMetrics={managerMetrics} />}

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
