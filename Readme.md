# devops-pipeline-demo

A simple REST API for notes — a pet project for practicing a CI/CD pipeline.

![CI](https://github.com/ilya-r-v/project-ci-cd/actions/workflows/ci.yml/badge.svg)

## Endpoints

- `GET /` — greeting
- `GET /health` — healthcheck
- `GET /api/info` — app version and stats
- `GET /api/notes` — list notes
- `GET /api/notes/:id` — get a single note
- `POST /api/notes` — create a note (`{title, content}`)
- `PUT /api/notes/:id` — update a note
- `DELETE /api/notes/:id` — delete a note

## Running locally

```bash
npm install
npm start
```

## Running in Docker

```bash
docker build -t devops-pipeline-demo .
docker run -p 3000:3000 devops-pipeline-demo
```

## Verification

```bash
curl localhost:3000/health
curl -X POST localhost:3000/api/notes -H "Content-Type: application/json" -d '{"title":"Test"}'
curl localhost:3000/api/notes
```