"""Tests for core application views."""

import json
import sys
from unittest.mock import Mock, mock_open, patch

from django.test import TestCase
from django.test.client import RequestFactory

from coalition.core.views import (
    _find_static_files_directly,
    _get_manifest_paths,
    _normalize_asset_paths,
    _parse_manifest,
    get_react_assets,
    health_check,
    home,
    robots_txt,
)


class CoreViewsTest(TestCase):
    """Test core application views and helper functions."""

    def setUp(self) -> None:
        self.factory = RequestFactory()

    def test_parse_manifest_old_format_entrypoints(self) -> None:
        """Test parsing manifest with old entrypoints format."""
        manifest = {
            "entrypoints": [
                "static/js/main.abc123.js",
                "static/css/main.def456.css",
                "static/js/runtime.xyz789.js",
            ],
        }

        main_js, main_css = _parse_manifest(manifest)

        assert main_js == "static/js/main.abc123.js"
        assert main_css == "static/css/main.def456.css"

    def test_parse_manifest_entrypoints_multiple_js_files(self) -> None:
        """Test parsing manifest with multiple JS files in entrypoints."""
        manifest = {
            "entrypoints": [
                "static/js/runtime.xyz789.js",  # First JS file found
                "static/css/main.def456.css",
                "static/js/main.abc123.js",  # This won't be selected
            ],
        }

        main_js, main_css = _parse_manifest(manifest)

        # Should pick the first JS file found
        assert main_js == "static/js/runtime.xyz789.js"
        assert main_css == "static/css/main.def456.css"

    def test_parse_manifest_empty_structure(self) -> None:
        """Test parsing manifest with no files or entrypoints."""
        manifest = {}

        main_js, main_css = _parse_manifest(manifest)

        assert main_js == ""
        assert main_css == ""

    def test_normalize_asset_paths(self) -> None:
        """Test asset path normalization."""
        result = _normalize_asset_paths(
            "/static/js/main.abc123.js",
            "static/css/main.def456.css",
        )

        expected = {
            "main_js": "js/main.abc123.js",
            "main_css": "css/main.def456.css",
        }
        assert result == expected

    @patch("os.path.exists")
    @patch("os.listdir")
    def test_find_static_files_directly_success(
        self,
        mock_listdir: Mock,
        mock_exists: Mock,
    ) -> None:
        """Test successful direct file search."""

        def exists_side_effect(path: str) -> bool:
            return "/static/js" in path or "/static/css" in path

        def listdir_side_effect(path: str) -> list[str]:
            if "js" in path:
                return ["main.abc123.js", "runtime.xyz789.js"]
            elif "css" in path:
                return ["main.def456.css", "vendor.ghi789.css"]
            return []

        mock_exists.side_effect = exists_side_effect
        mock_listdir.side_effect = listdir_side_effect

        result = _find_static_files_directly()

        expected = {
            "main_js": "js/main.abc123.js",
            "main_css": "css/main.def456.css",
        }
        assert result == expected

    @patch("os.path.exists")
    @patch("os.listdir")
    def test_find_static_files_directly_no_main_files(
        self,
        mock_listdir: Mock,
        mock_exists: Mock,
    ) -> None:
        """Test direct file search when no main files are found."""

        def exists_side_effect(path: str) -> bool:
            return "/static/js" in path or "/static/css" in path

        def listdir_side_effect(path: str) -> list[str]:
            if "js" in path:
                return ["runtime.xyz789.js", "vendor.abc123.js"]  # No main files
            elif "css" in path:
                return ["vendor.def456.css"]  # No main files
            return []

        mock_exists.side_effect = exists_side_effect
        mock_listdir.side_effect = listdir_side_effect

        result = _find_static_files_directly()

        # Should return empty dict when no main files found
        assert result == {}

    @patch("os.path.exists")
    @patch("os.listdir")
    def test_find_static_files_directly_os_error(
        self,
        mock_listdir: Mock,
        mock_exists: Mock,
    ) -> None:
        """Test direct file search with OS error."""
        mock_exists.return_value = True
        mock_listdir.side_effect = OSError("Permission denied")

        result = _find_static_files_directly()

        # Should return empty dict when OS error occurs
        assert result == {}

    @patch("os.path.exists")
    def test_find_static_files_directly_no_directories(self, mock_exists: Mock) -> None:
        """Test direct file search when directories don't exist."""
        mock_exists.return_value = False

        result = _find_static_files_directly()

        assert result == {}

    @patch("os.path.exists")
    @patch("builtins.open", new_callable=mock_open)
    def test_get_react_assets_manifest_no_main_files(
        self,
        mock_file: Mock,
        mock_exists: Mock,
    ) -> None:
        """Test get_react_assets when manifest exists but has no main files."""
        manifest_data = {
            "files": {
                "runtime.js": "/static/js/runtime.abc123.js",
                "vendor.css": "/static/css/vendor.def456.css",
                # No main.js or main.css
            },
        }
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(manifest_data)

        with patch("coalition.core.views._find_static_files_directly") as mock_direct:
            mock_direct.return_value = {
                "main_js": "js/fallback.js",
                "main_css": "css/fallback.css",
            }

            result = get_react_assets()

            # Should fall back to direct file search
            expected = {"main_js": "js/fallback.js", "main_css": "css/fallback.css"}
            assert result == expected

    @patch("os.path.exists")
    @patch("builtins.open", new_callable=mock_open)
    def test_get_react_assets_json_decode_error(
        self,
        mock_file: Mock,
        mock_exists: Mock,
    ) -> None:
        """Test get_react_assets with JSON decode error."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = "invalid json"

        with patch("coalition.core.views._find_static_files_directly") as mock_direct:
            mock_direct.return_value = {}

            result = get_react_assets()

            # Should fall back to development paths
            expected = {
                "main_js": "js/main.js",
                "main_css": "css/main.css",
            }
            assert result == expected

    @patch("os.path.exists")
    @patch("builtins.open", side_effect=FileNotFoundError())
    def test_get_react_assets_file_not_found(
        self,
        mock_file: Mock,  # noqa: ARG002
        mock_exists: Mock,
    ) -> None:
        """Test get_react_assets with file not found error."""
        mock_exists.return_value = True

        with patch("coalition.core.views._find_static_files_directly") as mock_direct:
            mock_direct.return_value = {}

            result = get_react_assets()

            # Should fall back to development paths
            expected = {
                "main_js": "js/main.js",
                "main_css": "css/main.css",
            }
            assert result == expected

    @patch("coalition.core.views.get_react_assets")
    @patch("coalition.core.views.render")
    def test_home_view_successful_render(
        self,
        mock_render: Mock,
        mock_assets: Mock,
    ) -> None:
        """Test successful home view rendering."""
        from django.http import HttpResponse

        mock_assets.return_value = {"main_js": "js/main.js", "main_css": "css/main.css"}
        mock_render.return_value = HttpResponse("Rendered template")

        request = self.factory.get("/")
        response = home(request)

        assert response.status_code == 200
        mock_render.assert_called_once()
        mock_assets.assert_called_once()

    @patch("coalition.core.views.get_react_assets")
    @patch("coalition.core.views.render")
    def test_home_view_template_error(
        self,
        mock_render: Mock,
        mock_assets: Mock,
    ) -> None:
        """Test home view with template rendering error."""
        mock_assets.return_value = {"main_js": "js/main.js", "main_css": "css/main.css"}
        mock_render.side_effect = Exception("Template not found")

        request = self.factory.get("/")
        response = home(request)

        assert response.status_code == 200
        assert "Coalition Builder" in response.content.decode()
        assert '<div id="root">Loading...</div>' in response.content.decode()

    def test_robots_txt_view(self) -> None:
        """Test robots.txt view."""
        request = self.factory.get("/robots.txt")
        response = robots_txt(request)

        assert response.status_code == 200
        content = response.content.decode()

        # Check that robots.txt contains expected directives
        assert "User-agent: *" in content
        assert "Allow: /" in content  # Allow indexing of public content
        assert "Disallow: /admin/" in content  # Block admin
        assert "Disallow: /api/" in content  # Block API
        assert "Sitemap:" in content  # Contains sitemap reference
        assert "Crawl-delay: 1" in content  # Respectful crawl delay

        assert response["Content-Type"] == "text/plain"

    @patch("coalition.core.views.connection")
    def test_health_check_database_error(self, mock_connection: Mock) -> None:
        """Test health check with database error."""
        # Mock cursor and connection properly
        mock_cursor = Mock()
        mock_cursor.execute.side_effect = Exception("Database connection failed")
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor

        request = self.factory.get("/health/")

        # Mock psutil in sys.modules
        mock_psutil = Mock()
        mock_process = Mock()
        mock_memory_info = Mock()
        mock_memory_info.rss = 100 * 1024 * 1024  # 100MB
        mock_memory_info.vms = 200 * 1024 * 1024  # 200MB
        mock_process.memory_info.return_value = mock_memory_info
        mock_psutil.Process.return_value = mock_process

        with patch.dict(sys.modules, {"psutil": mock_psutil}):
            response = health_check(request)

        assert response.status_code == 503
        data = json.loads(response.content)
        assert data["status"] == "unhealthy"
        assert data["database"]["status"] == "unhealthy"

    def test_health_check_no_psutil(self) -> None:
        """Test health check when psutil is not installed."""
        request = self.factory.get("/health/")

        # Temporarily remove psutil from sys.modules if it exists
        original_psutil = sys.modules.pop("psutil", None)

        # Patch builtins.__import__ to raise ImportError for psutil
        def import_side_effect(name: str, *args: object, **kwargs: object) -> object:
            if name == "psutil":
                raise ImportError("No module named 'psutil'")
            return __import__(name, *args, **kwargs)

        try:
            with patch("builtins.__import__", side_effect=import_side_effect):
                response = health_check(request)
        finally:
            # Restore psutil if it was there originally
            if original_psutil is not None:
                sys.modules["psutil"] = original_psutil

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data["memory"]["status"] == "psutil not installed"

    def test_health_check_psutil_error(self) -> None:
        """Test health check with psutil error."""
        request = self.factory.get("/health/")

        # Mock psutil in sys.modules to return a psutil that raises an error
        mock_psutil = Mock()
        mock_process = Mock()
        mock_process.memory_info.side_effect = Exception("Memory access failed")
        mock_psutil.Process.return_value = mock_process

        with patch.dict(sys.modules, {"psutil": mock_psutil}):
            response = health_check(request)

        assert response.status_code == 200
        data = json.loads(response.content)
        assert "error" in data["memory"]

    def test_health_check_head_method(self) -> None:
        """Test health check with HEAD method."""
        request = self.factory.head("/health/")
        response = health_check(request)

        assert response.status_code == 200
        # HEAD response should include headers and status
        assert response["Content-Type"] == "application/json"
        assert "Cache-Control" in response
        # The content will be present in Django tests, but the important thing
        # is that the status code and headers are correct for HEAD requests

    @patch("os.path.exists")
    @patch("os.listdir")
    def test_find_static_files_directly_partial_success(
        self,
        mock_listdir: Mock,
        mock_exists: Mock,
    ) -> None:
        """Test direct file search with only JS files found."""

        def exists_side_effect(path: str) -> bool:
            return "/static/js" in path

        def listdir_side_effect(path: str) -> list[str]:
            if "js" in path:
                return ["main.abc123.js"]
            return []

        mock_exists.side_effect = exists_side_effect
        mock_listdir.side_effect = listdir_side_effect

        result = _find_static_files_directly()

        expected = {
            "main_js": "js/main.abc123.js",
            "main_css": "css/main.css",  # Fallback CSS
        }
        assert result == expected

    @patch("os.path.exists")
    @patch("os.listdir")
    def test_find_static_files_directly_css_only(
        self,
        mock_listdir: Mock,
        mock_exists: Mock,
    ) -> None:
        """Test direct file search with only CSS files found."""

        def exists_side_effect(path: str) -> bool:
            return "/static/css" in path

        def listdir_side_effect(path: str) -> list[str]:
            if "css" in path:
                return ["main.def456.css"]
            return []

        mock_exists.side_effect = exists_side_effect
        mock_listdir.side_effect = listdir_side_effect

        result = _find_static_files_directly()

        expected = {
            "main_js": "js/main.js",  # Fallback JS
            "main_css": "css/main.def456.css",
        }
        assert result == expected

    def test_get_manifest_paths(self) -> None:
        """Test that _get_manifest_paths returns expected paths."""
        paths = _get_manifest_paths()
        assert isinstance(paths, list)
        assert len(paths) > 0
        # Should include Docker container path
        assert "/app/frontend/build/asset-manifest.json" in paths
