from django.conf.urls import include, url
from .views import *

urlpatterns = [
    url(r'user/(?P<username> \w+)', user)
]
