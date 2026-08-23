const express = require("express");
const { randomUIID } = require("crypto");
const pkg = require("./package.json");

const app = express();
const PORT = process.env.port || 3000;

app.use(express.json());

//хранилище данных пока работает контейнер

let notes = [];

app.get("/", (req, res) => {
    res.json({messae: "Notes Api is running"});
});

app.get("/health", (req, res) => {
    res.json({status: "ok"});
});

app.get("/api/info", (req, res) => {
    res.json({
        name: pkg.name,
        version: pkg.varsion,
        notesCount: notes.length,
    });
});

app.get("/api/notes", (req, res) => {
    res.json(notes);
});

app.get("/api/notes/:id", (req, res) => {
    const note = notes.find((n) => n.id == req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found"});
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
  res.status(204).send();
});
 
app.listen(PORT, () => {
  console.log(`Notes API listening on port ${PORT}`);
});
 
module.exports = app;