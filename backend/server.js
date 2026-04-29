const express = require("express");
const cors = require("cors");
const metricsRouter = require("./routes/metrics");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/", metricsRouter);

app.get("/", (req, res) => {
  res.json({ message: "Developer Productivity Dashboard API" });
});

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing server or run with a different PORT.`);
    console.error("Example: $env:PORT=5001; npm start");
    process.exit(1);
  }

  throw error;
});
