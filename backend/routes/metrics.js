const express = require("express");
const path = require("path");
const xlsx = require("xlsx");

const router = express.Router();

// Strictly read the Excel file from the required assignment path.
const EXCEL_FILE_PATH = path.join(
  __dirname,
  "../../data/intern_assignment_support_pack_dev_only_v3.xlsx"
);

const SHEETS = {
  developers: "Dim_Developers",
  issues: "Fact_Jira_Issues",
  pullRequests: "Fact_Pull_Requests",
  deployments: "Fact_CI_Deployments",
  bugs: "Fact_Bug_Reports"
};

function readWorkbookData() {
  const workbook = xlsx.readFile(EXCEL_FILE_PATH);

  return {
    developers: readRequiredSheet(workbook, SHEETS.developers),
    issues: readRequiredSheet(workbook, SHEETS.issues),
    pullRequests: readRequiredSheet(workbook, SHEETS.pullRequests),
    deployments: readRequiredSheet(workbook, SHEETS.deployments),
    bugs: readRequiredSheet(workbook, SHEETS.bugs)
  };
}

function readRequiredSheet(workbook, sheetName) {
  if (!workbook.Sheets[sheetName]) {
    throw new Error(`Missing required sheet: ${sheetName}`);
  }

  // defval keeps empty cells as null so missing data is handled safely.
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: null,
    raw: false
  });
}

function normalize(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalize(value).toLowerCase();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function average(values) {
  const validValues = values.filter((value) => value !== null);

  if (validValues.length === 0) {
    return 0;
  }

  const total = validValues.reduce((sum, value) => sum + value, 0);
  return total / validValues.length;
}

function round(value) {
  return Number(value.toFixed(2));
}

function filterByDeveloper(rows, developerId) {
  return rows.filter((row) => normalize(row.developer_id) === developerId);
}

function filterByMonth(rows, month, monthColumn) {
  if (!month) {
    return rows;
  }

  return rows.filter((row) => normalize(row[monthColumn]) === month);
}

function getCompletedIssues(issues) {
  return issues.filter((issue) => normalizeLower(issue.status) === "done");
}

function getMergedPullRequests(pullRequests) {
  return pullRequests.filter((pr) => normalizeLower(pr.status) === "merged");
}

function getSuccessfulDeployments(deployments) {
  return deployments.filter((deployment) => normalizeLower(deployment.status) === "success");
}

function getEscapedBugs(bugs) {
  return bugs.filter((bug) => normalizeLower(bug.escaped_to_prod) === "yes");
}

function calculateLeadTime(deployments) {
  // Lead Time = avg(lead_time_days from successful deployments)
  const leadTimes = getSuccessfulDeployments(deployments).map((deployment) =>
    toNumber(deployment.lead_time_days)
  );

  return round(average(leadTimes));
}

function calculateCycleTime(issues) {
  // Cycle Time = avg(cycle_time_days from completed issues)
  const cycleTimes = getCompletedIssues(issues).map((issue) => toNumber(issue.cycle_time_days));

  return round(average(cycleTimes));
}

function calculatePRThroughput(pullRequests) {
  // PR Throughput = count merged pull requests
  return getMergedPullRequests(pullRequests).length;
}

function calculateDeploymentFrequency(deployments) {
  // Deployment Frequency = count successful deployments
  return getSuccessfulDeployments(deployments).length;
}

function calculateBugRate(bugs, issues) {
  // Bug Rate = escaped bugs / completed issues
  const completedIssuesCount = getCompletedIssues(issues).length;

  if (completedIssuesCount === 0) {
    return 0;
  }

  return round(getEscapedBugs(bugs).length / completedIssuesCount);
}

function buildManagerMap(developers) {
  const managers = {};

  developers.forEach((developer) => {
    const managerId = normalize(developer.manager_id);

    if (!managerId) {
      return;
    }

    if (!managers[managerId]) {
      managers[managerId] = {
        manager_id: managerId,
        manager_name: developer.manager_name,
        developerIds: new Set()
      };
    }

    managers[managerId].developerIds.add(normalize(developer.developer_id));
  });

  return managers;
}

function addManagerMonth(groups, managerId, managerName, month) {
  if (!managerId || !month) {
    return;
  }

  const key = `${managerId}|${month}`;

  if (!groups[key]) {
    groups[key] = {
      manager_id: managerId,
      manager_name: managerName,
      month,
      issues: [],
      deployments: [],
      bugs: []
    };
  }
}

function groupRowsByManagerAndMonth(data) {
  const groups = {};

  // Grouping logic: create one bucket for every manager + month found in the dataset facts.
  data.issues.forEach((issue) => {
    addManagerMonth(groups, normalize(issue.manager_id), issue.manager_name, normalize(issue.month_done));
    const key = `${normalize(issue.manager_id)}|${normalize(issue.month_done)}`;
    if (groups[key]) groups[key].issues.push(issue);
  });

  data.deployments.forEach((deployment) => {
    addManagerMonth(groups, normalize(deployment.manager_id), deployment.manager_name, normalize(deployment.month_deployed));
    const key = `${normalize(deployment.manager_id)}|${normalize(deployment.month_deployed)}`;
    if (groups[key]) groups[key].deployments.push(deployment);
  });

  data.bugs.forEach((bug) => {
    addManagerMonth(groups, normalize(bug.manager_id), bug.manager_name, normalize(bug.month_found));
    const key = `${normalize(bug.manager_id)}|${normalize(bug.month_found)}`;
    if (groups[key]) groups[key].bugs.push(bug);
  });

  return Object.values(groups);
}

function getManagerSignal(avgBugRate, avgCycleTime) {
  if (avgBugRate > 0.3) {
    return "Watch bottlenecks";
  }

  if (avgCycleTime > 5) {
    return "Needs review";
  }

  return "Healthy flow";
}

function calculateManagerMetrics(data) {
  const managers = buildManagerMap(data.developers);
  const managerMonthGroups = groupRowsByManagerAndMonth(data);

  return managerMonthGroups
    .map((group) => {
      const manager = managers[group.manager_id];
      const teamSize = manager ? manager.developerIds.size : 0;
      const avgLeadTime = calculateLeadTime(group.deployments);
      const avgCycleTime = calculateCycleTime(group.issues);
      const avgBugRate = calculateBugRate(group.bugs, group.issues);

      return {
        manager_id: group.manager_id,
        manager_name: group.manager_name || manager?.manager_name || "",
        month: group.month,
        teamSize,
        avgLeadTime,
        avgCycleTime,
        avgBugRate,
        signal: getManagerSignal(avgBugRate, avgCycleTime)
      };
    })
    .sort((a, b) => {
      if (a.manager_id === b.manager_id) {
        return a.month.localeCompare(b.month);
      }

      return a.manager_id.localeCompare(b.manager_id);
    });
}

function calculateMetricsForRows({ issues, pullRequests, deployments, bugs }) {
  return {
    leadTime: calculateLeadTime(deployments),
    cycleTime: calculateCycleTime(issues),
    bugRate: calculateBugRate(bugs, issues),
    deploymentFrequency: calculateDeploymentFrequency(deployments),
    prThroughput: calculatePRThroughput(pullRequests)
  };
}

function getRowsForDeveloper(data, developerId, month) {
  return {
    issues: filterByMonth(filterByDeveloper(data.issues, developerId), month, "month_done"),
    pullRequests: filterByMonth(filterByDeveloper(data.pullRequests, developerId), month, "month_merged"),
    deployments: filterByMonth(filterByDeveloper(data.deployments, developerId), month, "month_deployed"),
    bugs: filterByMonth(filterByDeveloper(data.bugs, developerId), month, "month_found")
  };
}

function calculateDatasetAverages(data, month) {
  const developerIds = data.developers.map((developer) => normalize(developer.developer_id));
  const allDeveloperMetrics = developerIds.map((developerId) =>
    calculateMetricsForRows(getRowsForDeveloper(data, developerId, month))
  );

  return {
    leadTime: round(average(allDeveloperMetrics.map((metrics) => metrics.leadTime))),
    cycleTime: round(average(allDeveloperMetrics.map((metrics) => metrics.cycleTime))),
    bugRate: round(average(allDeveloperMetrics.map((metrics) => metrics.bugRate)))
  };
}

function buildInsightEngine(metrics, datasetAverages) {
  const insights = [];
  const suggestions = [];

  // Dataset logic: high means above the average for the same dataset/month.
  if (metrics.bugRate > datasetAverages.bugRate) {
    insights.push("High bug rate indicates a quality issue.");
    suggestions.push("Improve testing.");
  }

  if (metrics.cycleTime > datasetAverages.cycleTime) {
    insights.push("High cycle time suggests tasks are stuck in progress.");
    suggestions.push("Review blockers and reduce work in progress.");
  }

  if (metrics.leadTime > datasetAverages.leadTime) {
    insights.push("High lead time indicates slow delivery.");
    suggestions.push("Reduce release delays after work is completed.");
  }

  if (insights.length === 0) {
    insights.push("Balanced metrics indicate a healthy flow.");
    suggestions.push("Continue monitoring delivery, quality, and release trends.");
  }

  return {
    insights: insights.join(" "),
    suggestions
  };
}

router.get("/developers", (req, res) => {
  try {
    const data = readWorkbookData();

    res.json(
      data.developers.map((developer) => ({
        id: normalize(developer.developer_id),
        name: developer.developer_name,
        team: developer.team_name
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/metrics/:developerId", (req, res) => {
  try {
    const developerId = normalize(req.params.developerId);
    const month = normalize(req.query.month);
    const data = readWorkbookData();
    const developer = data.developers.find((row) => normalize(row.developer_id) === developerId);

    if (!developer) {
      return res.status(404).json({ error: "Developer not found" });
    }

    const developerRows = getRowsForDeveloper(data, developerId, month);
    const metrics = calculateMetricsForRows(developerRows);
    const datasetAverages = calculateDatasetAverages(data, month);
    const insightResult = buildInsightEngine(metrics, datasetAverages);

    res.json({
      metrics,
      insights: insightResult.insights,
      suggestions: insightResult.suggestions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/manager-metrics", (req, res) => {
  try {
    const data = readWorkbookData();
    const managerMetrics = calculateManagerMetrics(data);

    res.json(managerMetrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
