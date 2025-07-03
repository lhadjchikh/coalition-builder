"""
Tests for Site Password Protection Middleware
"""

from collections.abc import Callable, Generator

import pytest
from django.http import HttpRequest, HttpResponse
from django.test import RequestFactory, override_settings

from coalition.middleware.site_protection import SitePasswordProtectionMiddleware

# Type alias for the get_response callable
GetResponse = Callable[[HttpRequest], HttpResponse]


class TestSitePasswordProtectionMiddleware:
    """Test cases for site password protection middleware"""

    @pytest.fixture
    def factory(self) -> RequestFactory:
        """Request factory for creating test requests"""
        return RequestFactory()

    @pytest.fixture
    def get_response(self) -> Callable[[HttpRequest], HttpResponse]:
        """Mock get_response callable"""

        def _get_response(request: HttpRequest) -> HttpResponse:
            return HttpResponse("OK")

        return _get_response

    @pytest.fixture
    def password_disabled_settings(self) -> Generator[None]:
        """Settings with password protection disabled"""
        with override_settings(SITE_PASSWORD_ENABLED=None):
            yield

    @pytest.fixture
    def password_enabled_settings(self) -> Generator[None]:
        """Settings with password protection enabled and test password"""
        with override_settings(
            SITE_PASSWORD_ENABLED="true",
            SITE_PASSWORD="test-password",
        ):
            yield

    @pytest.fixture
    def password_enabled_no_password_settings(self) -> Generator[None]:
        """Settings with password protection enabled but no password"""
        with override_settings(SITE_PASSWORD_ENABLED="true", SITE_PASSWORD=None):
            yield

    @pytest.fixture
    def password_explicitly_disabled_settings(self) -> Generator[None]:
        """Settings with password protection explicitly disabled"""
        with override_settings(
            SITE_PASSWORD_ENABLED="false",
            SITE_PASSWORD="test-password",
        ):
            yield

    @pytest.fixture
    def password_case_insensitive_settings(self) -> Generator[None]:
        """Settings with uppercase enabled value"""
        with override_settings(
            SITE_PASSWORD_ENABLED="TRUE",
            SITE_PASSWORD="test-password",
        ):
            yield

    @pytest.fixture
    def password_numeric_enabled_settings(self) -> Generator[None]:
        """Settings with numeric enabled value"""
        with override_settings(
            SITE_PASSWORD_ENABLED="1",
            SITE_PASSWORD="test-password",
        ):
            yield

    @pytest.fixture
    def password_invalid_enabled_settings(self) -> Generator[None]:
        """Settings with invalid enabled value"""
        with override_settings(
            SITE_PASSWORD_ENABLED="yes",
            SITE_PASSWORD="test-password",
        ):
            yield

    @pytest.mark.usefixtures("password_disabled_settings")
    def test_middleware_disabled_by_default(
        self,
        factory: RequestFactory,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that middleware is disabled when SITE_PASSWORD_ENABLED is not set"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        request = factory.get("/")
        response = middleware.process_request(request)

        assert response is None  # Middleware should pass through

    @pytest.mark.usefixtures("password_enabled_no_password_settings")
    def test_middleware_requires_password_when_enabled(
        self,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that middleware raises error when enabled without password"""
        with pytest.raises(
            ValueError,
            match="SITE_PASSWORD must be set",
        ) as exc_info:
            SitePasswordProtectionMiddleware(get_response)

        assert "SITE_PASSWORD must be set" in str(exc_info.value)

    @pytest.mark.usefixtures("password_enabled_settings")
    def test_middleware_shows_login_form_when_not_authenticated(
        self,
        factory: RequestFactory,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that middleware shows login form for unauthenticated requests"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        request = factory.get("/some-page/")
        request.session = {}
        response = middleware.process_request(request)

        assert response is not None
        assert response.status_code == 200
        assert b"Site Access" in response.content
        assert b"Access Password" in response.content

    @pytest.mark.usefixtures("password_enabled_settings")
    def test_middleware_allows_authenticated_requests(
        self,
        factory: RequestFactory,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that middleware allows requests with valid session"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        request = factory.get("/some-page/")
        request.session = {"site_password_authenticated": True}
        response = middleware.process_request(request)

        assert response is None  # Should pass through to next middleware

    @pytest.mark.usefixtures("password_enabled_settings")
    def test_excluded_paths_bypass_protection(
        self,
        factory: RequestFactory,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that excluded paths bypass password protection"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        excluded_paths = ["/health/", "/health", "/admin/", "/site-login/"]

        for path in excluded_paths:
            request = factory.get(path)
            request.session = {}
            response = middleware.process_request(request)
            assert response is None, f"Path {path} should bypass protection"

    @pytest.mark.usefixtures("password_enabled_settings")
    def test_login_with_correct_password(
        self,
        factory: RequestFactory,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test successful login with correct password"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        request = factory.post(
            "/site-login/",
            {"password": "test-password", "next": "/dashboard/"},
        )
        request.session = {}
        response = middleware.process_request(request)

        assert response is not None
        assert response.status_code == 302  # Redirect
        assert response.url == "/dashboard/"
        assert request.session.get("site_password_authenticated") is True

    @pytest.mark.usefixtures("password_enabled_settings")
    def test_login_with_incorrect_password(
        self,
        factory: RequestFactory,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test failed login with incorrect password"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        request = factory.post(
            "/site-login/",
            {"password": "wrong-password", "next": "/dashboard/"},
        )
        request.session = {}
        response = middleware.process_request(request)

        assert response is not None
        assert response.status_code == 200
        assert b"Incorrect password" in response.content
        assert request.session.get("site_password_authenticated") is None

    @pytest.mark.usefixtures("password_enabled_settings")
    def test_login_redirects_to_home_without_next_url(
        self,
        factory: RequestFactory,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test login redirects to home when no next URL provided"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        request = factory.post("/site-login/", {"password": "test-password"})
        request.session = {}
        response = middleware.process_request(request)

        assert response is not None
        assert response.status_code == 302
        assert response.url == "/"

    @pytest.mark.usefixtures("password_explicitly_disabled_settings")
    def test_middleware_disabled_when_setting_is_false(
        self,
        factory: RequestFactory,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that middleware is properly disabled when setting is false"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        request = factory.get("/")
        request.session = {}
        response = middleware.process_request(request)

        assert response is None  # Should pass through

    @pytest.mark.usefixtures("password_enabled_settings")
    def test_login_form_includes_csrf_protection(
        self,
        factory: RequestFactory,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that login form is protected against CSRF"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        request = factory.get("/some-page/")
        request.session = {}
        response = middleware.process_request(request)

        # Since we're not using Django's template system, we're using a simple form
        # Check that the form has proper structure
        assert b'<form method="post"' in response.content
        assert b'action="/site-login/"' in response.content

    @pytest.mark.usefixtures("password_case_insensitive_settings")
    def test_case_insensitive_enabled_setting(
        self,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that SITE_PASSWORD_ENABLED setting is case-insensitive"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        assert middleware.enabled is True

    @pytest.mark.usefixtures("password_numeric_enabled_settings")
    def test_enabled_setting_accepts_1(
        self,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that SITE_PASSWORD_ENABLED accepts '1' as true"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        assert middleware.enabled is True

    @pytest.mark.usefixtures("password_invalid_enabled_settings")
    def test_enabled_setting_rejects_invalid_values(
        self,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        """Test that SITE_PASSWORD_ENABLED rejects non-standard true values"""
        middleware = SitePasswordProtectionMiddleware(get_response)
        assert middleware.enabled is False
