import json
from django.conf import settings
from .models import Item, Comment, ItemCategory
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
import datetime
import requests
from ipware.ip import get_real_ip, get_ip
from django.db.models import Q
from operator import or_
from functools import reduce


@ensure_csrf_cookie
def homepage_view(request):
    pages_available = sorted(Item.objects.values_list('page', flat=True).distinct())
    return render(request, 'scav_board/index_page.html', context={'page_list': pages_available})


def help_page_view(request):
    return render(request, 'scav_board/help_page.html')


@ensure_csrf_cookie
def registration_view(request):
    if request.method == 'GET':
        return render(request, 'scav_board/registration_page.html', context={'recaptcha_site_key': settings.RECAPTCHA_SITE_KEY})

    user_ip = get_real_ip(request)
    if user_ip is None:
        user_ip = get_ip(request)
    print(user_ip)

    validation = requests.post(settings.RECAPTCHA_URL, data={
        'secret': settings.RECAPTCHA_SECRET_KEY,
        'response': request.POST['g-recaptcha-response'],
        'remoteip': user_ip,
    })
    validation_success = validation.json()['success']
    if not validation_success:
        return render(request, 'scav_board/registration_page.html', context={'validation_failed': True})

    if User.objects.filter(username=request.POST['username']).count() > 0:
        return HttpResponse("This username already exists! Hit back to try another one.", content_type="text/plain")

    new_user = User.objects.create_user(username=request.POST['username'],
                                        first_name=request.POST['first_name'],
                                        last_name=request.POST['last_name'],
                                        email=request.POST.get('email', 'unknown@unknown.com'))
    new_user.set_password(request.POST['password'])
    new_user.save()

    new_user = authenticate(username=request.POST['username'], password=request.POST['password'])
    login(request, new_user)
    return redirect('/scav_board/')


@ensure_csrf_cookie
def add_item_view(request):
    category_names = [
        ('road-trip', "Road Trip"),
        ('showcase', "Showcase"),
        ('food', "Food"),
        ('video', "Video"),
        ('science', "Science (whatever Shelby does)"),
        ('music', "Music"),
        ('arts', "Arts"),
    ]
    if request.method == 'GET':
        return render(request, 'scav_board/add_item_page.html', context={'category_info': category_names})

    item_dict = {
        'number': int(request.POST['item-number']),
        'page': int(request.POST['item-page']),
        'description': request.POST['item-description'],
        'points': request.POST['item-points'],
    }
    if len(request.POST.get('exp-day', '')):
        day = request.POST['exp-day']
        hour = request.POST['exp-hour'] if len(request.POST['exp-hour']) else '0'
        minute = request.POST['exp-min'] if len(request.POST['exp-min']) else '0'
        expiry = datetime.datetime(2015, 5, int(day), int(hour), int(minute))
        item_dict['expires'] = expiry + datetime.timedelta(hours=5)


    new_item = Item.objects.create(**item_dict)
    for category_name, _ in category_names:
        if request.POST.get(category_name, '') == 'on':
            new_item.categories.add(ItemCategory.objects.get(category_name=category_name))

    return HttpResponse(json.dumps({'item_number': new_item.number}), content_type='application/json')


# noinspection DjangoOrm
def filtered_items(request):
    if request.method != 'GET':
        return HttpResponse("POSTing to this URL is not supported.", content_type='text/plain', status=503)
    pages = request.GET.getlist('page')
    keywords = request.GET.getlist('keyword')
    categories = request.GET.getlist('category')

    item_objs_to_return = Item.objects.all()
    page_orqs = []
    for pg in pages:
        page_orqs.append(Q(page=int(pg)))
    if len(page_orqs):
        item_objs_to_return = item_objs_to_return.filter(reduce(or_, page_orqs))

    keyword_orqs = []
    for kwd in keywords:
        keyword_orqs.append(Q(description__icontains=kwd))
    if len(keyword_orqs):
        item_objs_to_return = item_objs_to_return.filter(reduce(or_, keyword_orqs))

    category_orqs = []
    for cat in categories:
        category_orqs.append(Q(categories__category_name=cat))
    if len(category_orqs):
        item_objs_to_return = item_objs_to_return.filter(reduce(or_, category_orqs))

    response = json.dumps([{
        'id': item_obj.id,
        'title': str(item_obj.number) + ': ' + item_obj.description[:30],
        'description': item_obj.description,
        'item_number': item_obj.number,
        'points': item_obj.points,
        'done': item_obj.done,
        'page': item_obj.page,
        'expiration': item_obj.expires.strftime('%Y-%m-%dT%H:%M:%SZ') if item_obj.expires is not None else '',
        'claimedAt': item_obj.claimed_at.strftime('%Y-%m-%dT%H:%M:%SZ') if item_obj.claimed_at is not None else '',
        'categories': list(item_obj.categories.values_list('category_name', flat=True)),
        'claimedBy': item_obj.claimed.username if item_obj.claimed is not None else None,
    } for item_obj in item_objs_to_return])

    return HttpResponse(response, content_type='application/json')


def save_single_comment(request, item_number):
    incoming_comment_data = json.loads(request.body.decode('utf-8'))
    try:
        comment_item = Item.objects.get(number=item_number)
    except Item.DoesNotExist:
        return HttpResponse("No such user or item exists!", content_type='text/plain', status=404)

    try:
        comment_author = User.objects.get(username=incoming_comment_data.get('username'))
    except User.DoesNotExist:
        comment_author = User.objects.get(username='anonymous')

    if comment_author.username != 'anonymous' and comment_author.id != request.user.id:
        return HttpResponse("The specified user is the incorrect user.", content_type='text/plain', status=403)

    new_comment = {
        'text': incoming_comment_data['text'],
        'author_id': comment_author.id,
        'timestamp': datetime.datetime.utcnow(),
        'item_id': comment_item.id,
    }

    new_comment_obj = Comment.objects.create(**new_comment)
    returned_data = json.dumps({
        'id': new_comment_obj.id,
        'timestamp': new_comment_obj.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'author_name': new_comment_obj.author.first_name + " " + new_comment_obj.author.last_name,
        'text': new_comment_obj.text,
    })

    return HttpResponse(returned_data, content_type='application/json')


def comments_on_item(request, item_number):
    if request.method == 'POST':
        return save_single_comment(request, item_number)
    elif request.method == 'GET':
        relevant_comments = Comment.objects.filter(item__number=item_number)
        returned_data = json.dumps([{
            'id': comment.id,
            'author_name': comment.author.first_name + " " + comment.author.last_name,
            'author_username': comment.author.username,
            'text': comment.text,
            'timestamp': comment.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')
        } for comment in relevant_comments])
        return HttpResponse(returned_data, content_type='application/json')


def claim_item_view(request, item_number):
    try:
        item_in_question = Item.objects.get(number=item_number)
    except Item.DoesNotExist:
        return HttpResponse("Invalid item number: {}".format(request.POST["item-number"]), status=500,
                            content_type="text/plain")
    now = datetime.datetime.utcnow()

    if item_in_question.claimed is None:
        if request.user.id is None:
            item_in_question.claimed = User.objects.get(username="anonymous")
            item_in_question.claimed_at = now
            item_in_question.save()
            return HttpResponse(json.dumps({"claimedBy": "anonymous",
                                            "claimedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ")}),
                                content_type="application/json")
        else:
            item_in_question.claimed = request.user
            item_in_question.claimed_at = now
            item_in_question.save()
            return HttpResponse(json.dumps({"claimedBy": "anonymous",
                                            "claimedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ")}),
                                content_type="application/json")
    else:
        if item_in_question.claimed.username == "anonymous":
            item_in_question.claimed = None
            item_in_question.save()
            return HttpResponse(json.dumps({"claimedBy": None}), content_type="application/json")
        else:
            if request.user.id != item_in_question.claimed.id:
                return HttpResponse("You can't unclaim this from another user!", content_type="text/plain", status=403)
            else:
                item_in_question.claimed = None
                item_in_question.save()
                return HttpResponse(json.dumps({"claimedBy": None}), content_type="application/json")


def mark_item_done_view(request, item_number):
    try:
        item_in_question = Item.objects.get(number=item_number)
    except Item.DoesNotExist:
        return HttpResponse("Invalid item number: {}".format(request.POST["item-number"]), status=500,
                            content_type="text/plain")

    item_in_question.done = not item_in_question.done
    item_in_question.save()
    return HttpResponse(json.dumps({"done": item_in_question.done}), content_type="application/json")


def item(request, item_number):
    requested_item = Item.objects.get(number=item_number)
    returned_data = json.dumps({
        'id': requested_item.id,
        'page': requested_item.page,
        'title': requested_item.description[:30],
        'description': requested_item.description,
    })
    return HttpResponse(returned_data, content_type='application/json')


def user_login(request):
    username = request.POST["username"]
    password = request.POST["password"]
    user = authenticate(username=username, password=password)
    if user is None:
        return HttpResponse(json.dumps({'success': False}), content_type='application/json', status=403)
    else:
        login(request, user)
        return HttpResponse(json.dumps({'success': True,
                                        'username': username,
                                        'first_name': user.first_name,
                                        'last_name': user.last_name}), content_type='application/json')


def user_logout(request):
    username = request.POST["username"]
    if username != request.user.username:
        return HttpResponse('You are not the user you are logging out', content_type='text/plain', status=501)
    logout(request)
    return HttpResponse(json.dumps({'success': True}), content_type='application/json')


def user_info_view(request):
    if request.user.id is None:
        response_dict = {
            'username': 'anonymous',
            'first_name': 'Anonymous',
            'last_name': 'Scavvie',
            'loggedin': False,
        }
    else:
        response_dict = {
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'loggedin': True,
        }
    return HttpResponse(json.dumps(response_dict), content_type='application/json')
