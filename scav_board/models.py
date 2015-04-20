from django.db import models


class User(models.Model):
    username = models.CharField(max_length=64, db_index=True, unique=True)
    first_name = models.CharField(max_length=64)
    last_name = models.CharField(max_length=64)


class Item(models.Model):
    number = models.IntegerField(db_index=True, unique=True)
    page = models.IntegerField(db_index=True)
    description = models.TextField()


class Comment(models.Model):
    text = models.TextField()
    author = models.ForeignKey(User)
    timestamp = models.DateTimeField()
    item = models.ForeignKey(Item, db_index=True)

