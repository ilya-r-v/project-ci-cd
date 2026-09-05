# devops-pipeline-demo

![CI](https://github.com/ilya-r-v/project-ci-cd/actions/workflows/ci.yml/badge.svg)

A small REST API for notes, built as a hands-on pet project to practice a full CI/CD pipeline end to end — from a Dockerized Node.js app to automated staging deploys, gated production releases, and monitoring.

The goal wasn't the API itself (it's intentionally simple) — it was building and understanding every stage of a real deployment pipeline: linting, testing, image builds, registry publishing, automated staging rollout, manual production approval, and alerting.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐
│   GitHub     │────▶│ GitHub       │────▶│   ghcr.io          │
│   push/PR    │     │ Actions CI   │     │  (image registry)  │
└─────────────┘     └──────┬───────┘     └─────────┬──────────┘
                            │                       │
                    lint → test → build             │ pull
                            │                       ▼
                            │              ┌───────────────────┐
                            ├─────────────▶│  VPS (Timeweb)     │
                            │  Ansible/SSH │  ┌───────────────┐ │
                            │  (staging)   │  │ notes-staging │ │
                            │              │  │   :3001       │ │
                            │              │  └───────────────┘ │
                            │                       │
                    workflow_dispatch              │
                    + manual approval               │
                            │                       │
                            └──────────────▶┌───────────────┐  │
                              Ansible/SSH    │  notes-prod   │  │
                              (production)   │    :3000      │  │
                                              └───────────────┘  │
                                              └───────────────────┘
```

Staging and production run as two separate Docker containers on the same VPS, deployed independently, to keep the project's infrastructure cost minimal while still demonstrating real environment separation.

## Tech stack

- **App**: Node.js 22, Express
- **Testing**: Jest, Supertest
- **Containers**: Docker (multi-stage build: `dev` / `prod`), Docker Compose
- **CI/CD**: GitHub Actions
- **Image registry**: GitHub Container Registry (ghcr.io)
- **Provisioning & deploy**: Ansible over SSH
- **Infrastructure**: VPS on Timeweb Cloud (Ubuntu 24.04)
- **Notifications**: Telegram Bot API

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Greeting / liveness |
| GET | `/health` | Healthcheck |
| GET | `/api/info` | App name, version, notes count |
| GET | `/api/notes` | List all notes |
| GET | `/api/notes/:id` | Get a single note |
| POST | `/api/notes` | Create a note (`{title, content}`) |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |

Notes are stored in memory — this is a pipeline demo, not a persistence exercise.

## Running locally

```bash
npm install
npm start
```

### With Docker Compose (hot-reload dev environment)

```bash
docker compose up --build
```

### Running the test suite

```bash
npm test                                          # locally
docker compose --profile test run --rm test       # inside a container
```

## CI/CD pipeline

Every push to `main` runs the full pipeline:

1. **lint** — ESLint
2. **test** — Jest + Supertest, matrix across Node 20 and 22, with a coverage threshold gate and an uploaded coverage report artifact
3. **build-and-push** — multi-platform (`linux/amd64`, `linux/arm64`) Docker image built and pushed to GHCR, tagged both `latest` and by short commit SHA
4. **smoke-test** — pulls the freshly published image and hits `/health` and `/api/info` before anything is deployed
5. **deploy-staging** — Ansible playbook over SSH automatically rolls out the new image to the staging container
6. **notify** — sends a pipeline result summary to Telegram

Production deploys are **not** automatic. They're triggered manually via `workflow_dispatch`, let you pick a specific image tag (any SHA-tagged build, not just `latest`), and require a manual approval through a GitHub Environment protection rule before the Ansible playbook runs against production. A separate Telegram notification reports the outcome.

A scheduled `healthcheck` workflow polls the production `/health` endpoint every 15 minutes and sends a Telegram alert if it goes down — independent of the deploy pipeline, so it also catches issues like a crashed container or a server reboot.

## Environments

| | Port | Trigger | Approval |
|---|---|---|---|
| Staging | 3001 | Every push to `main` | None |
| Production | 3000 | Manual (`workflow_dispatch`) | Required reviewer |

## Project structure

```
.
├── src/app.js                    # Express app (no listen — testable)
├── index.js                      # Entry point
├── tests/                        # Jest + Supertest
├── Dockerfile                    # Multi-stage: dev / prod
├── docker-compose.yml            # Local dev + test profile
├── ansible/
│   ├── deploy-staging.yml
│   ├── deploy-prod.yml
│   └── requirements.yml
└── .github/workflows/
    ├── ci.yml                    # lint, test, build, deploy, notify
    └── healthcheck.yml           # scheduled prod monitoring
```

## What this project demonstrates

- Multi-stage Docker builds separating dev and production images
- A CI pipeline with real quality gates (lint → test → smoke-test) before anything reaches an environment
- Infrastructure-as-code deployment via Ansible, run identically by hand and from CI
- Environment separation with different risk profiles: automatic staging rollout vs. approval-gated production release
- SHA-based image tagging, enabling rollback to any previously built version
- Operational monitoring independent of the deploy pipeline (scheduled healthcheck + alerting)