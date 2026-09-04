# ADR-002: Explicit Lifecycle Transition Map

## Status
Accepted

## Context
Model versions must follow a defined promotion path (DRAFT → VALIDATED → APPROVED → STAGING → PRODUCTION → ARCHIVED). Invalid transitions must be rejected at the API layer, not silently accepted.

## Decision
Encode valid transitions as a static `dict[LifecycleStage, set[LifecycleStage]]` (`LIFECYCLE_TRANSITIONS`) in the ORM module. The service layer checks this map before applying any stage change.

## Alternatives Considered
- **No validation** — red flag; allows arbitrary stage jumps
- **Database triggers** — hard to test and couples logic to DB engine
- **State machine library (transitions)** — adds a dependency for logic that fits in ~10 lines

## Consequences

### Positive
- Transition rules are co-located with the domain model
- Fully unit-testable without a database
- HTTP 422 returned with a clear message listing allowed transitions

### Negative
- Map must be kept in sync if new stages are added
- No audit trail of who triggered a transition (future: add `changed_by` field)

## Follow-up Actions
- Add `approved_by` and `approved_at` fields to `ModelVersion`
- Consider event sourcing for full audit history
