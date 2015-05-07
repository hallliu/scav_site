from django.db import models
from django.contrib.auth.models import User


class ItemCategory(models.Model):
    category_name = models.CharField(max_length=32)

    def __unicode__(self):
        return self.category_name

    def __str__(self):
        return self.category_name


class Item(models.Model):
    number = models.IntegerField(db_index=True, unique=True)
    page = models.IntegerField(db_index=True)
    description = models.TextField()
    expires = models.DateTimeField(blank=True, default=None, null=True)
    claimed = models.ForeignKey(User, default=None, null=True, blank=True)
    claimed_at = models.DateTimeField(blank=True, default=None, null=True)
    done = models.BooleanField(default=False)
    points = models.CharField(max_length=512, default="")
    categories = models.ManyToManyField(ItemCategory, blank=True)

    def __unicode__(self):
        return "Item {}: {}".format(self.number, self.description[:20])

    def __str__(self):
        return "Item {}: {}".format(self.number, self.description[:20])


class Comment(models.Model):
    text = models.TextField()
    author = models.ForeignKey(User)
    timestamp = models.DateTimeField()
    item = models.ForeignKey(Item, db_index=True)

    def __unicode__(self):
        return "{}'s comment on {}: {}".format(self.author.username, self.item.number, self.text[:20])

    def __str__(self):
        return "{}'s comment on {}: {}".format(self.author.username, self.item.number, self.text[:20])

