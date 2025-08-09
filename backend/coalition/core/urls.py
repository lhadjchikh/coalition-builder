"""
URL configuration for labandbay project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path

from coalition.api.api import api
from coalition.content.views import active_theme_css, theme_css
from coalition.core.sitemap import sitemaps
from coalition.core.views import home, robots_txt

# Customize Django admin site headers
admin.site.site_header = f"{settings.ORGANIZATION_NAME} Administration"
admin.site.site_title = f"{settings.ORGANIZATION_NAME} Admin"
admin.site.index_title = f"Welcome to {settings.ORGANIZATION_NAME} Administration"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
    path("robots.txt", robots_txt, name="robots_txt"),
    path(
        "sitemap.xml",
        sitemap,
        {"sitemaps": sitemaps},
        name="django.contrib.sitemaps.views.sitemap",
    ),
    path("theme.css", active_theme_css, name="active_theme_css"),
    path("theme/<int:theme_id>.css", theme_css, name="theme_css"),
    path("tinymce/", include("tinymce.urls")),
    path("", home, name="home"),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Also serve from STATICFILES_DIRS
    for static_dir in settings.STATICFILES_DIRS:
        urlpatterns += static(settings.STATIC_URL, document_root=static_dir)
