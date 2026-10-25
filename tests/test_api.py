"""Unit tests for Component E: FastAPI Service."""

import pytest
from fastapi.testclient import TestClient
from shiftguard.api.main import app

client = TestClient(app)


def test_api_health_endpoint():
    """GET /health must return 200 with simulated badge and status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["simulated"] is True
    assert "available_experiments" in data


def test_api_scenarios_endpoint():
    """GET /scenarios must return scenario catalog with splits."""
    response = client.get("/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert data["simulated"] is True
    assert "splits" in data
    assert "train" in data["splits"]
    assert "test" in data["splits"]


def test_api_results_valid_and_missing_experiment():
    """GET /results/{experiment} must return precomputed metrics or 404."""
    # Valid experiment
    response = client.get("/results/exp1_normal")
    assert response.status_code == 200
    data = response.json()
    assert data["simulated"] is True
    assert data["experiment_id"] == "exp1_normal"
    assert "approaches" in data
    assert "approach1_conventional" in data["approaches"]
    assert "approach2_conformal" in data["approaches"]
    assert "approach3_shiftguard" in data["approaches"]

    # Missing experiment
    response_missing = client.get("/results/non_existent_regime_999")
    assert response_missing.status_code == 404


def test_api_compare_endpoint():
    """GET /compare must return all 3 approaches side-by-side across all 6 experiments."""
    response = client.get("/compare")
    assert response.status_code == 200
    data = response.json()
    assert data["simulated"] is True
    assert "comparisons" in data
    assert len(data["comparisons"]) == 6

    # Verify each comparison entry contains all 3 approaches
    for comp in data["comparisons"]:
        assert "approaches" in comp
        assert "approach1_conventional" in comp["approaches"]
        assert "approach2_conformal" in comp["approaches"]
        assert "approach3_shiftguard" in comp["approaches"]
