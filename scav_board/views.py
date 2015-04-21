import json
from .models import User, Item, Comment
from django.http import HttpResponse

def user(request, username):
    requested_user = User.objects.get(username=username)
    returned_data = json.dumps({
        'id': requested_user.id,
        'first_name': requested_user.first_name,
        'last_name': requested_user.last_name
    })
    return HttpResponse(returned_data, content_type='application/json')

def users_posts(request, username):
    requested_user = User.objects.get(username=username)
    all_posts_by_user = requested_user.comment_set.values_list('id', flat=True)[:request.GET.get('limit', 10)]
    return HttpResponse(json.dumps(list(all_posts_by_user)), content_type='application/json')


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


def comments_on_item(request, item_id):
    relevant_comments = Comment.objects.filter(item_id=item_id)
    returned_data = json.dumps([{
        'id': comment.comment_id,
        'author_id': comment.author_id,
        'item_id': comment.item_id,
        'text': comment.text,
        'timestamp': comment.timestamp.strftime('%Y-%m-%dT%H:%M:%S')
    } for comment in relevant_comments])
    return