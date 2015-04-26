from django.conf.urls import url
from .views import *

urlpatterns = [
    url(r'api/comments/item/(?P<item_number>[0-9]+)', comments_on_item),
    url(r'api/items/(?P<item_number>[0-9]+)', item),
    url(r'api/comments/(?P<comment_id>[0-9]+)', single_comment),
    url(r'api/page/(?P<page_num>[0-9]+)', items_on_page),
    url(r'login/', user_login),
    url(r'', homepage_view)
]
