"""Tests for API health check endpoints."""

import pytest
from django.test import Client


@pytest.mark.django_db
class TestHealthCheckAPI:
    """Test health check endpoints."""

    def test_health_check_without_trailing_slash(self, client: Client) -> None:
        """Test health check endpoint without trailing slash."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "database" in data
        assert "memory" in data
        assert "application" in data

    def test_health_check_with_trailing_slash(self, client: Client) -> None:
        """Test health check endpoint with trailing slash."""
        response = client.get("/api/health/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "database" in data
        assert "memory" in data
        assert "application" in data

    def test_health_check_endpoints_return_same_response(self, client: Client) -> None:
        """Test that both health endpoints return the same response structure."""
        response_without_slash = client.get("/api/health")
        response_with_slash = client.get("/api/health/")

        assert response_without_slash.status_code == 200
        assert response_with_slash.status_code == 200

        data_without = response_without_slash.json()
        data_with = response_with_slash.json()

        # Check same keys are present
        assert set(data_without.keys()) == set(data_with.keys())

        # Check status is the same
        assert data_without["status"] == data_with["status"]
        assert data_without["status"] == "healthy"
