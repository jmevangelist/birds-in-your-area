from django.urls import path, re_path
from django.conf.urls import handler404, handler500

from . import views

app_name = "birds"
urlpatterns = [
    path("", views.index, name="index"),
    re_path(r"^find/(?P<category>\w+)/@(?P<lat>-?\d+\.?\d*),(?P<lng>-?\d+\.?\d*),(?P<zoom>\d+\.?\d*)z$", views.find, name="find"),
    re_path(r"^find/(?P<category>\w+)/", views.find, name="find" ),
    path("find", views.find, name="find"),
    path("side", views.side, name="side" ),
    path("get_obs", views.get_obs, name="get_obs"),
    path("about", views.about, name="about")
]



