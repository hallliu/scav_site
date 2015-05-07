# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('scav_board', '0005_auto_20150504_0346'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='claimed_at',
            field=models.DateTimeField(null=True, default=None, blank=True),
        ),
    ]
