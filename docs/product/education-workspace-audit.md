# Moshaver Education Workspace audit

Status: source audit and composition update on 2026-09-30. This is source-level evidence; it does not prove a deployed browser or production authorization configuration.

## Ownership model

`apps/api/src/modules/education/EducationModule` is now the product composition boundary for education. It composes catalog, plans and templates, learning resources, exams, assessments, questions, quizzes, and subjects without moving their independently testable domain modules or changing `/api/v2` routes.

`apps/admin/src/features/education/` is the Admin public feature boundary. Planner, learning, exams, questions, quizzes, subjects, and resources route through Education-owned façade entrypoints; their existing internal feature folders remain intact to avoid breaking imports while consolidation is adopted incrementally.

## What Admin has

| Area | Control surface | Evidence |
| --- | --- | --- |
| Planner | Daily plans, tasks, templates, publishing | `PlansModule`, `PlannerPage` |
| Learning | Student learning items, reviews and progress | `LearningPage`, student learning endpoints |
| Exams | Authoring, publishing, assignments, attempts, retry moderation, syllabus | `ExamsModule`, `AssessmentsModule`, `ExamsPage` |
| Questions and quizzes | Question-bank CRUD; quiz authoring and publication | `QuestionsModule`, `QuizModule` |
| Subjects | Categorized global/org subjects, teacher and student assignments, archive/restore, server-validated JSON/Excel import preview and commit, sample, JSON/Excel export | `SubjectsModule`, `SubjectsPage` |
| Resources | Categorized resource CRUD, three-column inventory, scoped student assignment and quick sharing; Student-side searchable/filterable library with live refresh | `LearningResourcesModule`, `ResourcesPage`, `LearningResourcesPage` |
| Classes | Organization-scoped classes connect an education profile to catalog books, responsible teachers, an advisor, and a capacity-checked student roster. Admin management uses focused modals with two-column book and student rows; Students and authorized Guardians see only their assigned active classes. | `ClassesModule`, `ClassesPage`, `StudentClassesPage` |
| Catalog and operations | Scoped books, coverage, cohort/date trends, CSV and remediation queues | `EducationCatalogModule`, `EducationOverviewPage` |

## UX and layout decisions

- The Education landing page is a compact navigation-and-operations workspace rather than a duplicate of every management screen.
- Each detail page remains the owner of its rich editor/list workflow; the hub exposes compact routes, urgent exams, operations signals, and remediation links.
- When a multi-route contextual rail appears, the primary right rail collapses once to preserve content width. Users can reopen or collapse either rail afterward; routes without a contextual rail do not change the primary rail.
- Page titles are owned by the global Admin header. Education surfaces do not repeat a competing page-level `h1`.
- Education operations uses the shared Persian/Shamsi date picker; API queries still receive normalized ISO dates.
- Catalog rows are searchable and status-filtered. Editing keeps common fields visible and places less-frequent publishing metadata under an explicit disclosure.

## Cross-feature links verified or added

| Origin | Link/control | Destination or effect |
| --- | --- | --- |
| Education operations | Remediation student row | Student workspace, scoped to the affected student |
| Catalog book | Audience preview | Server-calculated affected students from the stored education profile |
| Subject catalog | Teacher assignment | Organization-scoped teacher/subject relation |
| Student subject settings | Enable/name/weekly goal | Student learning configuration |
| Student app «More» | Subject category and weekly target | Same subject configuration returned by the scoped student endpoint |
| Resource create/edit/remove or authorized resource share | Minimal recipient-scoped `learning-resource.updated` event | An open Student resource library refetches only its assigned-resource projection; no resource payload is sent in the event |

## Resource workspace authorization

The three-column resource workspace is available to Admin roles holding `learning_resources.manage`: Advisor, Teacher, Mentor, Content Manager, Organization Admin, and Platform Admin. The API remains authoritative: platform admins can manage the complete inventory; other authorized roles are limited to resources they created or whose assigned students are all inside their permitted student scope. Student and Guardian roles only receive published, assigned resources through the read endpoint.

Resources have a persistent category with a migration default of `عمومی`; the Admin list supports category/status/search filtering, while quick sharing respects the same scoped student lookup and never offers a student who is already assigned.

The Student library exposes the same category field as a compact chip and supports local title/description/category search plus category and resource-type filters. An Admin mutation or an authorized learner/staff share emits only a resource identifier and action to the recipient's realtime stream, so an open library refreshes from the existing server-scoped `GET /learning-resources/assigned` endpoint rather than trusting event data.

### Classes and roster controls

`classes.manage` is limited to Organization and Platform Admins. `classes.roster.manage` additionally permits the assigned Advisor or Mentor to maintain an eligible roster, while teachers can read only classes to which a book is assigned. The server validates organization membership, advisor/teacher roles, the class education profile, and capacity; the browser never supplies an unrestricted student list. The product demo now creates three distinct classes across the three organizations, with their own profile, books, teachers, advisor, and students.

### Assessment question bank

Reusable question sources live in `question_bank_items` and are organization-scoped. Archiving a source never changes an existing exam or quiz: `POST /question-bank/:id/add-to-exam` and `POST /question-bank/:id/add-to-quiz` create assessment snapshots and record the originating item ID. Question-bank mutation requires `question_bank.manage`; attaching a source additionally requires the destination assessment's question-management capability. Quiz deletion preserves recorded learner history by archiving an attempted quiz rather than deleting it.

Not yet delivered: a bulk bank-selection UI, quiz targeting/scheduling/attempt policy, and assessment analytics. These must be implemented as server-scoped contracts rather than inferred in the Admin UI.
| Planner and exams | Existing transfer workspace | Shared plans/exams JSON or Excel transfer workflow |

## Remaining deliberate gaps

- Subjects are currently referenced by text in several historic planner/exam/quiz payloads. A `subjectId` migration across those product entities would be a breaking data-model project and should be designed with backfill and compatibility before implementation.
- Catalog bulk import remains JSON-only because its data has nested taxonomy fields; subjects support both JSON and Excel where the schema is flat.

## Follow-up opportunities

- Browser visual/a11y verification for the combined rail transition at desktop breakpoints.
- Optional gradual physical relocation of internal Admin domain folders only after all consumers import the Education façade.
- Optional unified education search across planner, resources, assessments, and catalog. This requires a scoped server search contract; do not implement it as unrestricted client-side aggregation.
