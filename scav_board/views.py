import json
from .models import Item, Comment
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse


def homepage_view(request):
    return HttpResponse("Hello")


def items_on_page(request, page_num):
    item_ids_on_page = Item.objects.filter(page=page_num).values_list('id', flat=True)
    return HttpResponse(json.dumps(list(item_ids_on_page)), content_type='application/json')


def single_comment(request, comment_id):
    requested_comment = Comment.objects.get(id=comment_id)
    returned_data = json.dumps({
        'id': comment_id,
        'author_id': requested_comment.author_id,
        'item_id': requested_comment.item_id,
        'text': requested_comment.text,
        'timestamp': requested_comment.timestamp.strftime('%Y-%m-%dT%H:%M:%S')
    })
    return HttpResponse(returned_data, content_type='application/json')


def comments_on_item(request, item_number):
    relevant_comments = Comment.objects.filter(item__number=item_number)
    returned_data = json.dumps([{
        'id': comment.id,
        'author_name': comment.author.first_name + " " + comment.author.last_name,
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
    raise Exception()
    email = request.POST["email"]
    password = request.POST["password"]
    user = authenticate(email=email, password=password)
    if user is None:
        return HttpResponse(json.dumps({'success': False}), content_type='application/json', status=501)
    else:
        #login(request, user)
        return HttpResponse(json.dumps({'success': True}), content_type='application/json')


