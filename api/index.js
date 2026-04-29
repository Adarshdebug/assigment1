const express = require("express");
const metricsRouter = require("../backend/routes/metrics");

const app = express();

app.use(express.json());
app.use("/", metricsRouter);

module.exports = app;
