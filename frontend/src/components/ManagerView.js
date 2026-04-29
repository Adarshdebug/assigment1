import { useMemo, useState } from "react";

function ManagerView({ managerMetrics = [] }) {
  const [selectedManagerId, setSelectedManagerId] = useState("all");

  const managers = useMemo(() => {
    const uniqueManagers = new Map();

    managerMetrics.forEach((row) => {
      uniqueManagers.set(row.manager_id, row.manager_name);
    });

    return Array.from(uniqueManagers, ([id, name]) => ({ id, name }));
  }, [managerMetrics]);

  const filteredRows = managerMetrics.filter((row) => {
    return selectedManagerId === "all" || row.manager_id === selectedManagerId;
  });

  return (
    <section className="section-block">
      <div className="section-header">
        <h2>Manager View</h2>

        <label className="developer-select compact-select">
          Manager
          <select
            value={selectedManagerId}
            onChange={(event) => setSelectedManagerId(event.target.value)}
          >
            <option value="all">All managers</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table className="manager-table">
          <thead>
            <tr>
              <th>Manager</th>
              <th>Month</th>
              <th>Team Size</th>
              <th>Lead Time</th>
              <th>Cycle Time</th>
              <th>Bug Rate</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={`${row.manager_id}-${row.month}`}>
                <td>{row.manager_name}</td>
                <td>{row.month}</td>
                <td>{row.teamSize}</td>
                <td>{row.avgLeadTime}</td>
                <td>{row.avgCycleTime}</td>
                <td>{row.avgBugRate}</td>
                <td>
                  <span className="signal-pill">{row.signal}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ManagerView;
