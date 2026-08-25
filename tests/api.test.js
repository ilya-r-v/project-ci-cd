const request = require("supertest");
const app = require("../src/app");

beforeEach(() => {
  app._resetNotes();
});

describe("GET /health", () => {
  it("returns 200 and status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /api/info", () => {
  it("returns app metadata", async () => {
    const res = await request(app).get("/api/info");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("version");
    expect(res.body.notesCount).toBe(0);
  });
});

describe("Notes CRUD", () => {
  it("creates a note", async () => {
    const res = await request(app)
      .post("/api/notes")
      .send({ title: "Test", content: "Hello" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("rejects a note without title", async () => {
    const res = await request(app).post("/api/notes").send({ content: "no title" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for a missing note", async () => {
    const res = await request(app).get("/api/notes/nonexistent-id");
    expect(res.statusCode).toBe(404);
  });

  it("updates a note", async () => {
    const created = await request(app).post("/api/notes").send({ title: "Old" });
    const res = await request(app)
      .put(`/api/notes/${created.body.id}`)
      .send({ title: "New" });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("New");
  });

  it("deletes a note", async () => {
    const created = await request(app).post("/api/notes").send({ title: "ToDelete" });
    const del = await request(app).delete(`/api/notes/${created.body.id}`);
    expect(del.statusCode).toBe(204);

    const check = await request(app).get(`/api/notes/${created.body.id}`);
    expect(check.statusCode).toBe(404);
  });
});