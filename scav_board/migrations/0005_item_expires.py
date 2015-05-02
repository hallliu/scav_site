# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('scav_board', '0004_auto_20150430_0135'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='expires',
            field=models.DateTimeField(default=None, blank=True),
        ),
    ]
