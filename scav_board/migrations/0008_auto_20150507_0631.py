# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('scav_board', '0007_auto_20150507_0622'),
    ]

    operations = [
        migrations.AlterField(
            model_name='item',
            name='points',
            field=models.CharField(max_length=512, default=''),
        ),
    ]
