export default function handler(req, res) {
  res.status(200).json({
    message: "Developer Productivity Dashboard API",
    routes: ["/api/developers", "/api/metrics", "/api/manager-metrics"]
  });
}
