const metricsByDeveloper = {
  "dev-101": {
    metrics: {
      leadTime: 3.2,
      cycleTime: 4.1,
      bugRate: 0.18,
      deploymentFrequency: 9,
      prThroughput: 16
    },
    insights: "Balanced delivery speed with a healthy defect rate.",
    suggestions: [
      "Keep PRs small and continue reviewing release blockers early.",
      "Watch cycle time during larger platform tasks."
    ]
  },
  "dev-102": {
    metrics: {
      leadTime: 2.6,
      cycleTime: 3.4,
      bugRate: 0.12,
      deploymentFrequency: 11,
      prThroughput: 21
    },
    insights: "Strong throughput and fast cycle time show consistent flow.",
    suggestions: [
      "Document reusable frontend patterns for the team.",
      "Keep pairing on complex UI changes to maintain quality."
    ]
  },
  "dev-103": {
    metrics: {
      leadTime: 4.8,
      cycleTime: 5.7,
      bugRate: 0.28,
      deploymentFrequency: 6,
      prThroughput: 12
    },
    insights: "Cycle time is higher than the team average, which may point to backend review or testing bottlenecks.",
    suggestions: [
      "Break larger backend work into smaller pull requests.",
      "Review handoff points between implementation and QA."
    ]
  },
  "dev-104": {
    metrics: {
      leadTime: 3.9,
      cycleTime: 4.6,
      bugRate: 0.08,
      deploymentFrequency: 7,
      prThroughput: 14
    },
    insights: "Low bug rate suggests strong quality practices with steady delivery.",
    suggestions: [
      "Share test coverage patterns with the team.",
      "Look for opportunities to automate repeated QA checks."
    ]
  }
};

module.exports = function handler(req, res) {
  const developerId = req.query.developerId || "dev-101";
  const dashboardData = metricsByDeveloper[developerId] || metricsByDeveloper["dev-101"];

  res.status(200).json(dashboardData);
};
