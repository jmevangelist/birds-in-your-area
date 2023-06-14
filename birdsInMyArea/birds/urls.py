from django.urls import path, re_path
from django.conf.urls import handler404, handler500

from . import views

app_name = "birds"
urlpatterns = [
    path("", views.index, name="index"),
    re_path(r"^find/(?P<category>\w+)/@(?P<lat>-?\d+\.?\d*),(?P<lng>-?\d+\.?\d*),(?P<zoom>\d+\.?\d*)z$", views.find, name="find"),
    re_path(r"^find/(?P<category>\w+)/", views.find, name="find" ),
    path("find", views.find, name="find"),
    path("species", views.species, name="species" ),
    path("about", views.about, name="about"),
    path("get_obs", views.get_obs, name="get_obs"),
    path("heatmap/<str:z>/<str:x>/<str:y>.png", views.obs_tiles, name="tiles_heatmap"),
    path("points/<str:z>/<str:x>/<str:y>.png", views.obs_tiles, name="tiles_points"),
    path("heatmap/<int:z>/<int:x>/<int:y>.grid.json", views.utf_grid, name="json_heatmap"),
    path("points/<int:z>/<int:x>/<int:y>.grid.json", views.utf_grid, name="json_points")
]



