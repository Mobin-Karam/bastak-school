# Moshaver v2 — Product Showcase

Moshaver is an education operations platform built around one idea: **student context should stay connected while the team plans, communicates, assesses, and follows up.**

This page is the quickest way to understand what the product is trying to solve and where its main experiences live.

> Access to individual screens and actions is role-, capability-, organization-, and student-scoped by the backend.

## 1. Operations dashboard

The Admin experience is designed to help an education team answer **what needs attention now?**

The operational flow includes:

- dashboard and reporting surfaces;
- a **Needs attention** queue for actionable items;
- priority, ownership, due-date and status context;
- deep links into the student or workflow that needs action;
- retry, recovery and system-oriented operations where supported.

Typical items can include recovery requests, task issues, retry requests, unread conversations, sync failures and inactive accounts.

## 2. Student context

Moshaver keeps the active student context connected across operational surfaces.

From a student record, authorized users can move into related workflows such as:

- planner and study work;
- reports and activity;
- chat and communication;
- exams, quizzes and question workflows;
- guardian/relationship information;
- learning resources and subjects;
- follow-up actions.

The goal is to reduce the context switching that happens when student information lives in separate systems.

## 3. Planning and study workflow

Planning is not treated as an isolated calendar.

The platform includes concepts around:

- plans;
- tasks;
- study sessions;
- progress/follow-up;
- education workflows;
- shared student context between planning and reporting.

This lets the team move from **plan → activity → evidence → follow-up** instead of maintaining disconnected records.

## 4. Assessment workflow

Assessment features are represented across Admin, Student and API layers.

The active codebase includes support around:

- exams;
- quizzes;
- questions and question workflows;
- reviews and mistake tracking;
- recommendations;
- assignment/transfer-oriented workflows;
- analytics and reporting;
- capability-gated operations.

This makes assessment part of the same student-support workflow instead of a separate testing product.

## 5. Communication and notifications

Moshaver includes:

- chat workflows;
- realtime platform capabilities;
- notifications;
- live-oriented Admin experiences;
- browser/device push diagnostics in operational tooling.

Communication is designed to remain connected to student and operational context.

## 6. Student application

The Student application is built for multiple delivery targets.

It contains product areas for:

- home/dashboard;
- authentication;
- study plans;
- exams and quizzes;
- learning content/resources;
- chat and notifications;
- audio-oriented experiences;
- synchronization;
- local/native storage;
- native notification and opener integrations.

Runtime paths include browser/PWA plus Tauri-based native integration and Android build support.

## 7. Admin application

The Admin application groups operational work into dedicated feature areas:

- access and security;
- students and guardians;
- onboarding and follow-up;
- learning and subjects;
- planning;
- exams, quizzes and questions;
- chat and notifications;
- dashboard and reports;
- settings and system tools.

Shared list/table patterns provide filtering, loading/error/empty states, selection and responsive card layouts across supported management surfaces.

## 8. Backend platform

The `/api/v2` backend is the product's server-side authority.

Key module areas include:

- authentication and authorization;
- students, users and organizations;
- guardians and relationships;
- plans, tasks and study sessions;
- exams, quizzes, questions, reviews and recommendations;
- chat and realtime behavior;
- notifications;
- dashboards, reports, activity and analytics;
- subjects and learning resources;
- onboarding;
- import/export and data transfer;
- sync and system operations;
- health/readiness.

Security-sensitive scope and capability checks belong on the server, not only in the UI.

## 9. Platform architecture

```text
Admin web ───────────────┐
                         ├── /api/v2 ──> NestJS/Fastify API ──> TypeORM
Student web/PWA/Tauri ───┘
       │
       └── student-core

api-contract ──> shared request/response boundary
CMB packages ──> reusable auth, identity, tenancy, realtime, notification,
                 activity and system capabilities
```

Moshaver uses a grouped product monorepo and evolves reusable backend capabilities through **CMB — Composable Modular Backend Architecture**.

## 10. Try it locally

```bash
git clone https://github.com/Mobin-Karam/moshaver.git
cd moshaver
docker compose up --build
```

Then open:

- Student: `http://localhost:8080`
- Admin: `http://localhost:8081`
- API health: `http://localhost:4000/health`
- Swagger: `http://localhost:4000/api/v2/docs`

For setup and verification details, use the [repository runbook](docs/operations/repository-runbook.md).

## Suggested walkthrough

For a product-oriented first look:

1. Open the Admin dashboard.
2. Review **Needs attention**.
3. Open a student.
4. Move through Planner and Reports.
5. Continue into Chat.
6. Review Assessments.
7. Open the Student application to compare the learner-facing experience.
8. Inspect Swagger to understand the `/api/v2` surface.

## Learn more

- [README](README.md)
- [Persian README](README.fa.md)
- [Architecture](ARCHITECTURE.md)
- [Documentation hub](docs/README.md)
- [Admin capability matrix](docs/ADMIN_V2_CAPABILITY_MATRIX.md)
- [Product roadmap](docs/product/version-roadmap.md)
- [Product changelog](docs/releases/product-changelog.md)

---

**Moshaver v2** — one connected workspace for student planning, learning, communication, assessment and follow-up.
