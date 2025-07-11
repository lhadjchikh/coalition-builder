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
from django.urls import path

from coalition.api.api import api
from coalition.content.views import active_theme_css, theme_css
from coalition.core.views import health_check, home, robots_txt

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
    path("health/", health_check, name="health_check"),
    path("robots.txt", robots_txt, name="robots_txt"),
    path("theme.css", active_theme_css, name="active_theme_css"),
    path("theme/<int:theme_id>.css", theme_css, name="theme_css"),
    path("", home, name="home"),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Also serve from STATICFILES_DIRS
    for static_dir in settings.STATICFILES_DIRS:
        urlpatterns += static(settings.STATIC_URL, document_root=static_dir)
