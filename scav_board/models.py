from django.db import models
from django.contrib.auth.models import User


class Item(models.Model):
    number = models.IntegerField(db_index=True, unique=True)
    page = models.IntegerField(db_index=True)
    description = models.TextField()


class Comment(models.Model):
    text = models.TextField()
    author = models.ForeignKey(User, blank=True)
    timestamp = models.DateTimeField()
    item = models.ForeignKey(Item, db_index=True)

