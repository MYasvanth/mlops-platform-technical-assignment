import pytest
from app.models.orm import LifecycleStage, DeploymentStatus, LIFECYCLE_TRANSITIONS


def test_lifecycle_transitions_draft():
    allowed = LIFECYCLE_TRANSITIONS[LifecycleStage.DRAFT]
    assert LifecycleStage.VALIDATED in allowed
    assert LifecycleStage.PRODUCTION not in allowed


def test_lifecycle_transitions_archived_is_terminal():
    assert LIFECYCLE_TRANSITIONS[LifecycleStage.ARCHIVED] == set()


def test_lifecycle_transitions_approved_to_staging():
    allowed = LIFECYCLE_TRANSITIONS[LifecycleStage.APPROVED]
    assert LifecycleStage.STAGING in allowed


def test_all_stages_have_transition_entry():
    for stage in LifecycleStage:
        assert stage in LIFECYCLE_TRANSITIONS


def test_deployment_status_values():
    statuses = {s.value for s in DeploymentStatus}
    assert "REQUESTED" in statuses
    assert "ROLLED_BACK" in statuses
    assert "FAILED" in statuses
