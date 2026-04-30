const managerMetrics = [
  {
    manager_id: "mgr-1",
    manager_name: "Priya Nair",
    month: "2026-01",
    teamSize: 2,
    avgLeadTime: 2.9,
    avgCycleTime: 3.8,
    avgBugRate: 0.15,
    signal: "Healthy flow"
  },
  {
    manager_id: "mgr-1",
    manager_name: "Priya Nair",
    month: "2026-02",
    teamSize: 2,
    avgLeadTime: 3.1,
    avgCycleTime: 4.0,
    avgBugRate: 0.14,
    signal: "Healthy flow"
  },
  {
    manager_id: "mgr-2",
    manager_name: "Rohan Kapoor",
    month: "2026-01",
    teamSize: 2,
    avgLeadTime: 4.4,
    avgCycleTime: 5.2,
    avgBugRate: 0.2,
    signal: "Needs review"
  },
  {
    manager_id: "mgr-2",
    manager_name: "Rohan Kapoor",
    month: "2026-02",
    teamSize: 2,
    avgLeadTime: 4.1,
    avgCycleTime: 4.8,
    avgBugRate: 0.18,
    signal: "Healthy flow"
  }
];

module.exports = function handler(req, res) {
  res.status(200).json(managerMetrics);
};
