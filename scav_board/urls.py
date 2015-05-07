from django.conf.urls import url
from .views import *

urlpatterns = [
    url(r'api/items/(?P<item_number>[0-9]+)/comments/$', comments_on_item),
    url(r'api/items/(?P<item_number>[0-9]+)$', item),
    url(r'api/items/$', filtered_items),
    url(r'api/user_info/', user_info_view),
    url(r'api/claim_item/(?P<item_number>[0-9]+)', claim_item_view),
    url(r'api/complete_item/(?P<item_number>[0-9]+)', mark_item_done_view),
    url(r'login/', user_login),
    url(r'logout/', user_logout),
    url(r'registration/', registration_view),
    url(r'add_item/', add_item_view),
    url(r'help/', help_page_view),
    url(r'^$', homepage_view)
]
