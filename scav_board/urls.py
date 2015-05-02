from django.conf.urls import url
from .views import *

urlpatterns = [
    url(r'api/items/(?P<item_number>[0-9]+)/comments/$', comments_on_item),
    url(r'api/items/(?P<item_number>[0-9]+)$', item),
    url(r'api/page/(?P<page_num>[0-9]+)/items/', items_on_page),
    url(r'login/', user_login),
    url(r'logout/', user_logout),
    url(r'api/user_info/', user_info_view),
    url(r'registration/', registration_view),
    url(r'add_item/', add_item_view),
    url(r'^$', homepage_view)
]
