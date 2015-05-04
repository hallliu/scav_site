# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('scav_board', '0004_auto_20150504_0343'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='item',
            name='is_roadtrip',
        ),
        migrations.RemoveField(
            model_name='item',
            name='is_showcase',
        ),
    ]
