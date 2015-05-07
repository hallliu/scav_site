# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('scav_board', '0006_item_claimed_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='item',
            name='categories',
            field=models.ManyToManyField(to='scav_board.ItemCategory', blank=True),
        ),
    ]
