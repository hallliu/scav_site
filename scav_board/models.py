from django.db import models
from django.contrib.auth.models import User


class Item(models.Model):
    number = models.IntegerField(db_index=True, unique=True)
    page = models.IntegerField(db_index=True)
    description = models.TextField()
    expires = models.DateTimeField(blank=True, default=None, null=True)
    claimed = models.ForeignKey(User, default=None, null=True, blank=True)
    done = models.BooleanField(default=False)


class Comment(models.Model):
    text = models.TextField()
    author = models.ForeignKey(User)
    timestamp = models.DateTimeField()
    item = models.ForeignKey(Item, db_index=True)

