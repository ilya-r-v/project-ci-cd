const express = require("express");
const { randomUUID } = require("crypto");
const pkg = require("../package.json");
const client = require("prom-client");

const app = express();
app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const notesGauge = new client.Gauge({
  name: "notes_count",
  help: "Current number of notes in memory",
  registers: [register],
});

app.use((req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds + nanoseconds / 1e9;

    const route = req.route ? req.route.path : req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
  });

  next();
});

let notes = [];

app.get("/", (req, res) => {
  res.json({ message: "Notes API is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/api/info", (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    notesCount: notes.length,
  });
});

app.get("/api/notes", (req, res) => {
  res.json(notes);
});

app.get("/api/notes/:id", (req, res) => {
  const note = notes.find((n) => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json(note);
});

app.post("/api/notes", (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const note = {
    id: randomUUID(),
    title,
    content: content || "",
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  notesGauge.set(notes.length);
  res.status(201).json(note);
});

app.put("/api/notes/:id", (req, res) => {
  const note = notes.find((n) => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: "Note not found" });

  const { title, content } = req.body;
  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  note.updatedAt = new Date().toISOString();

  res.json(note);
});

app.delete("/api/notes/:id", (req, res) => {
  const index = notes.findIndex((n) => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Note not found" });

  notes.splice(index, 1);
  notesGauge.set(notes.length);
  res.status(204).send();
});

app._resetNotes = () => {
  notes = [];
  notesGauge.set(0);
};

module.exports = app;