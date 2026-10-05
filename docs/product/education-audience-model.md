# Education audience model

## Goal

Every educational item is delivered to an explicit audience: one learner, selected learners, classes, school grade/type/track rules, or an independent learner profile. Delivery decisions remain server-authoritative.

## Delivery plan

1. **Learner profiles (implemented):** distinguish `school` learners from `independent` learners. Independent learners do not require a fictitious school grade and record a supported profile type plus an optional learning level.
2. **Reusable audience contract (implemented for assessment delivery):** the shared allocation UI supports direct learners, active-class members, grade/type/track filters, and independent learner profiles. Exams and standalone Quizzes persist direct, class, and dynamic-rule audiences server-side. A Quiz linked to an Exam inherits that Exam's full audience. Question management deliberately reuses the selected Exam's audience: individual questions do not create a competing delivery scope.
3. **Plan delivery (implemented):** individual daily plans remain learner-owned. Published plan templates can be applied to a resolved audience of selected learners, class members, or learner filters; each resulting plan records its template/version. Existing destination plans are preserved by default.
4. **Learning resources (implemented):** resources resolve their audience to authorized learner assignments when saved. The resource editor uses the same filters, including active-class membership and independent profiles.
5. **Future delivery features:** every new student-facing educational item must either use this audience model or remain explicitly learner-owned. Keep direct assignments compatible when evolving an existing surface.
6. **Visibility proof:** API and student-surface tests protect resolved assessment access, including class membership and independent profiles.

## Invariants

- School profile: valid catalog grade/type/track is required.
- Independent profile: grade is absent; it is never enrolled in a school class by inference.
- A client may suggest an audience, but the API validates organization scope and resolves visibility.
- Existing learners remain `school` by default.
- Existing Quiz rule JSON is normalized with empty independent-profile arrays, so no data rewrite is required for older records.
- Class/grade/profile targeting resolves to explicit learner-owned plans at template-apply time; it does not grant an ongoing implicit plan relationship.
