import json
from django.conf import settings
from .models import Item, Comment
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
import datetime
import requests
from ipware.ip import get_real_ip, get_ip


@ensure_csrf_cookie
def homepage_view(request):
    pages_available = sorted(Item.objects.values_list('page', flat=True).distinct())
    return render(request, 'scav_board/sample_page_backbone.html', context={'page_list': pages_available})


@ensure_csrf_cookie
def registration_view(request):
    if request.method == 'GET':
        return render(request, 'scav_board/registration_page.html')

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
    if request.method == 'GET':
        return render(request, 'scav_board/add_item_page.html')

    if request.user.id is None:
        return HttpResponse("You are not logged in! Log in to create items.", content_type="text/plain",
                            status=403)

    item_dict = {
        'number': int(request.POST['item-number']),
        'page': int(request.POST['item-page']),
        'description': request.POST['item-description'],
    }
    if len(request.POST.get('exp-day', '')):
        expiry = datetime.datetime(2015, 5, int(request.POST.get('exp-day')),
                                   int(request.POST.get('exp-hour', '0')), int(request.POST.get('exp-min', '0')))
        expiry += datetime.timedelta(hours=5)
        item_dict['expires'] = expiry

    new_item = Item.objects.create(**item_dict)
    return HttpResponse(json.dumps({'item_number': new_item.number}), content_type='application/json')


def items_on_page(request, page_num):
    item_objs_on_page = Item.objects.filter(page=page_num)
    response = json.dumps([{
        'title': str(item_obj.number) + ': ' + item_obj.description[:30],
        'description': item_obj.description,
        'item_number': item_obj.number,
    } for item_obj in item_objs_on_page])

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
    if request.user is None:
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
