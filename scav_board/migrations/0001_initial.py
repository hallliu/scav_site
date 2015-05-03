# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField()),
                ('timestamp', models.DateTimeField()),
                ('author', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Item',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('number', models.IntegerField(db_index=True, unique=True)),
                ('page', models.IntegerField(db_index=True)),
                ('description', models.TextField()),
                ('expires', models.DateTimeField(default=None, blank=True, null=True)),
                ('done', models.BooleanField(default=False)),
                ('claimed', models.ForeignKey(default=None, to=settings.AUTH_USER_MODEL, blank=True, null=True)),
            ],
        ),
        migrations.AddField(
            model_name='comment',
            name='item',
            field=models.ForeignKey(to='scav_board.Item'),
        ),
    ]
