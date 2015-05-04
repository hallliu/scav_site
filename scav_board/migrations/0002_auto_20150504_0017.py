# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('scav_board', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='is_roadtrip',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='item',
            name='points',
            field=models.CharField(max_length=64, default=''),
        ),
    ]
