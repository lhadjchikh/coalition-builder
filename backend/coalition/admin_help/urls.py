"""URLs for the help guide.

``admin.site.admin_view`` is the access gate for every route here: it allows only
active staff accounts and redirects everyone else to the admin login, so the guide
is visible to exactly the people who can already see the screens it describes.
"""

from django.contrib import admin
from django.urls import path

from . import views

app_name = "admin_help"

urlpatterns = [
    path("", admin.site.admin_view(views.index), name="index"),
    path("all/", admin.site.admin_view(views.all_pages), name="all"),
    path("<slug:slug>/", admin.site.admin_view(views.page), name="page"),
]
