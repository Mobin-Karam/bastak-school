# Guided attendance flows — 11 October 2026

These ten screenshots show the current components with clearly labeled synthetic preview data. They do not contain production student records. The larger attendance modernization plan remains tracked in [the implementation ledger](../../implementation/attendance-modernization.md).

| Flow                                                                                                              | Desktop                                                       | Mobile                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| Principal/supervisor attendance entry: choose a target and date, mark physical attendance, review totals, confirm | [Review dialog](guided-images/entry-review-1440.png)          | [Review drawer](guided-images/entry-review-390.png)          |
| Principal/supervisor absence decision: open a reason, choose a decision and optional note, confirm                | [Decision dialog](guided-images/supervisor-decision-1440.png) | [Decision drawer](guided-images/supervisor-decision-390.png) |
| Teacher timetable entry: mark students, review selections, confirm                                                | [Teacher dialog](guided-images/teacher-review-1440.png)       | [Teacher drawer](guided-images/teacher-review-390.png)       |
| Student: filter own history and open read-only record details                                                     | [Record dialog](guided-images/student-detail-1440.png)        | [Record drawer](guided-images/student-detail-390.png)        |

| Unsaved changes: keep the draft or explicitly discard it | [Discard dialog](guided-images/discard-confirm-1440.png) | [Discard drawer](guided-images/discard-confirm-390.png) |

The school-wide page keeps the absence-review queue collapsed until requested. Physical marking offers present, absent and late; approval of an excuse belongs to the review flow. Unmarked students are explicitly identified before submission and are not silently recorded absent. Failed requests preserve the review choices and original retry request while mounted. This is not durable offline storage.

The mobile panels use the existing accessible bottom drawer; desktop uses the shared modal. Close controls have 44px targets. Student detail panels display existing record facts only, and do not offer an unsupported explanation/correction action.

## Backend fixes and compatibility

The running development server uses `dist-dev`, while migration discovery previously hardcoded `dist/database/migrations/*.js`. Read-only inspection of the default local database confirmed it lacked the new session lifecycle columns. Migration discovery now resolves beside the running data-source file: `dist-dev` in watch mode, `dist` in production, and `.ts` migrations for the source CLI. The existing watch process automatically migrated its default local schema after the source change; subsequent read-only inspection confirmed the lifecycle columns were present. No manual production migration or deployment was performed.

Direct new `excused` marks now return `422 ATTENDANCE_EXCUSE_REQUIRES_REVIEW` without creating sessions, records or events. Existing excused history remains readable. Update attendance clients to the three physical choices before enforcing this rule on an independently deployed older client. Reviews keep the physical observation while updating the legacy status projection for existing consumers.

This increment does not yet provide final session submission/corrections, durable scoped drafts, historical membership reconstruction, advanced role dashboards, persistent dorm follow-up cases or student explanation requests. Those remain active work in the full ledger.

## Validation

48 backend regression tests and 11 Admin flow tests passed. API and Admin builds, TypeScript checks through the Admin build, and scoped Admin lint passed. All ten shown desktop/mobile panels passed axe with zero violations and no browser runtime errors. Repository-wide validation remains limited by the missing student application and the unrelated workflow test compile errors recorded in the implementation ledger.
