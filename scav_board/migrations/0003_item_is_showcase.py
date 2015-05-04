# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('scav_board', '0002_auto_20150504_0017'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='is_showcase',
            field=models.BooleanField(default=False),
        ),
    ]
