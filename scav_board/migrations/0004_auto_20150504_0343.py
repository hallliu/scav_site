# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('scav_board', '0003_item_is_showcase'),
    ]

    operations = [
        migrations.CreateModel(
            name='ItemCategory',
            fields=[
                ('id', models.AutoField(verbose_name='ID', primary_key=True, serialize=False, auto_created=True)),
                ('category_name', models.CharField(max_length=32)),
            ],
        ),
        migrations.AddField(
            model_name='item',
            name='categories',
            field=models.ManyToManyField(to='scav_board.ItemCategory'),
        ),
    ]
