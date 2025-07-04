"""
Site Password Protection Middleware

This middleware provides a simple password protection system for the entire site
during development. It can be easily toggled on/off via environment variables.
"""

import os
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.utils.deprecation import MiddlewareMixin


class SitePasswordProtectionMiddleware(MiddlewareMixin):
    """
    Middleware to password protect the entire site during development.

    Set SITE_PASSWORD_ENABLED=true and SITE_PASSWORD=your_password in environment.
    Users will be prompted for a password before accessing any content.
    """

    # Required for Django 5.2+ compatibility
    async_mode = False

    def __init__(self, get_response: Callable) -> None:
        self.get_response = get_response
        self.enabled = os.getenv("SITE_PASSWORD_ENABLED", "false").lower() == "true"
        self.password = os.getenv("SITE_PASSWORD")
        self.session_key = "site_password_authenticated"

        # Validate configuration
        if self.enabled and not self.password:
            raise ValueError(
                "SITE_PASSWORD must be set when SITE_PASSWORD_ENABLED=true. "
                "Set SITE_PASSWORD environment variable with a secure password.",
            )

        # Paths that should be excluded from password protection
        self.excluded_paths = [
            "/health/",  # Django health check
            "/health",  # Next.js health check
            "/site-login/",  # Our login endpoint
            "/admin/",  # Keep admin accessible (has its own auth)
        ]

    def process_request(self, request: HttpRequest) -> HttpResponse | None:
        # Skip if password protection is disabled
        if not self.enabled:
            return None

        # Skip for excluded paths
        if any(request.path.startswith(path) for path in self.excluded_paths):
            return None

        # Skip if already authenticated
        if request.session.get(self.session_key):
            return None

        # Handle login form submission
        if request.path == "/site-login/" and request.method == "POST":
            return self._handle_login(request)

        # Show login form
        return self._show_login_form(request)

    def _handle_login(self, request: HttpRequest) -> HttpResponse:
        """Handle the login form submission"""
        password = request.POST.get("password", "")

        if password == self.password:
            # Password correct - mark as authenticated
            request.session[self.session_key] = True

            # Redirect to originally requested page or home
            next_url = request.POST.get("next", "/")
            return HttpResponseRedirect(next_url)
        else:
            # Password incorrect - show form with error
            return self._show_login_form(request, error="Incorrect password")

    def _show_login_form(
        self,
        request: HttpRequest,
        error: str | None = None,
    ) -> HttpResponse:
        """Show the site password login form"""

        # Simple HTML login form
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Site Access</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                                 Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                .login-container {{
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    max-width: 400px;
                    width: 90%;
                }}
                .logo {{
                    text-align: center;
                    margin-bottom: 2rem;
                }}
                .logo h1 {{
                    color: #333;
                    margin: 0;
                    font-size: 1.8rem;
                    font-weight: 600;
                }}
                .subtitle {{
                    color: #666;
                    text-align: center;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                }}
                .form-group {{
                    margin-bottom: 1.5rem;
                }}
                label {{
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #333;
                    font-weight: 500;
                }}
                input[type="password"] {{
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 1rem;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }}
                input[type="password"]:focus {{
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }}
                .btn {{
                    width: 100%;
                    padding: 0.75rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: transform 0.2s;
                }}
                .btn:hover {{
                    transform: translateY(-1px);
                }}
                .error {{
                    color: #e74c3c;
                    text-align: center;
                    margin-bottom: 1rem;
                    padding: 0.5rem;
                    background: #fdf2f2;
                    border-radius: 4px;
                    border: 1px solid #fecaca;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 2rem;
                    color: #666;
                    font-size: 0.8rem;
                }}
            </style>
        </head>
        <body>
            <div class="login-container">
                <div class="logo">
                    <h1>🏛️ Coalition Builder</h1>
                </div>
                <div class="subtitle">
                    This site is currently under development.<br>
                    Please enter the access password to continue.
                </div>
                
                {'<div class="error">' + error + '</div>' if error else ''}
                
                <form method="post" action="/site-login/">
                    <input type="hidden" name="next" value="{request.get_full_path()}">
                    
                    <div class="form-group">
                        <label for="password">Access Password</label>
                        <input type="password" id="password" name="password"
                               required autofocus>
                    </div>
                    
                    <button type="submit" class="btn">Access Site</button>
                </form>
                
                <div class="footer">
                    Site protection can be disabled by setting<br>
                    <code>SITE_PASSWORD_ENABLED=false</code>
                </div>
            </div>
            
            <script>
                // Focus password field on load
                document.addEventListener('DOMContentLoaded', function() {{
                    document.getElementById('password').focus();
                }});
            </script>
        </body>
        </html>
        """

        response = HttpResponse(html_content)
        response["Content-Type"] = "text/html; charset=utf-8"
        return response
