#!/bin/bash

# This script automates the deploy process. It runs all the necessary commands to refresh the running code

git pull
pip install -r requirements.txt
echo yes | python manage.py collectstatic
python manage.py migrate
touch scav_site/wsgi.py
