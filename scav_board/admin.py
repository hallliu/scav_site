from django.contrib import admin
from .models import *


class ItemAdmin(admin.ModelAdmin):
    search_fields = ['description']


admin.site.register(ItemCategory)
admin.site.register(Item, ItemAdmin)
admin.site.register(Comment)
