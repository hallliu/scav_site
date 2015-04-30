import json
from .models import Item, Comment
from django.contrib.auth.models import User
from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse
import datetime


def homepage_view(request):
    return render(request, 'scav_board/sample_page_backbone.html')


def items_on_page(request, page_num):
    item_ids_on_page = Item.objects.filter(page=page_num).values_list('id', flat=True)
    return HttpResponse(json.dumps(list(item_ids_on_page)), content_type='application/json')


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
        'timestamp': new_comment_obj.timestamp.strftime('%Y-%m-%dT%H:%M:%S'),
        'author_name': new_comment_obj.author.first_name + " " + new_comment_obj.author.last_name,
        'text': new_comment_obj.text,
    })

    return HttpResponse(returned_data, content_type='application/json')


def single_comment(request, item_number, comment_id):
    def comment404():
        return HttpResponse("This item does not have a comment with that ID!", content_type='text/plain', status=404)
    try:
        requested_comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return comment404()

    if requested_comment.item.number != item_number:
        return comment404()

    returned_data = json.dumps({
        'id': comment_id,
        'author_id': requested_comment.author_id,
        'item_id': requested_comment.item_id,
        'text': requested_comment.text,
        'timestamp': requested_comment.timestamp.strftime('%Y-%m-%dT%H:%M:%S')
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
