﻿#-*- coding:utf-8 -*-
import os
import re
import time
import json
import simplejson as json

from case.model import *
from case.extensions import db
from elasticsearch import Elasticsearch
"""
from utils import weiboinfo2url
from peak_detection import detect_peaks
from datetime import date, datetime
from xapian_case.utils import top_keywords
"""
from flask import Blueprint, url_for, render_template, request, abort, flash, session, redirect, make_response
from xapian_case.utils import cut, load_scws
import collections

s = load_scws()

mod = Blueprint('guming', __name__, url_prefix='/guming')

emotions_kv = {'positive': 1, 'negative': 0}

es = Elasticsearch(hosts="219.224.135.46")
index_name = "guba"
index_type = "post"


def ts2datetimestr(ts):
    return time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(ts))


def get_default_timerange():
    return u'9月 22日,2013 - 9月 22日,2013'


def get_default_field_dict():
    field_dict = {}
    for idx, field_en in enumerate(DOMAIN_LIST[9:20]):
        field_dict[field_en] = DOMAIN_ZH_LIST[idx+9]

    return field_dict


def get_default_field_name():
    return 'activer', u'活跃人士'


def _default_time_zone():
    '''默认时间段为最新一周
    '''

    end_ts = time.time()
    start_ts = end_ts - 7 * 24 * 3600

    return start_ts, end_ts

def search_count_func(start_date, end_date, sentiment, query, mode='keyword', isStockholder='1'):
    query_body = {
        "query": {
            "bool": {
                "must": [
                 { "term": { "sentiment": sentiment } },
                 { "term": { "has_sentiment": 1 } },
                 { "term": { "ad": 1 } },
                 {
                   "range": {
                       "releaseTime": {
                           "gte": start_date,
                           "lte": end_date
                        }
                    }
                 }
                ]
            }
        }
    }

    if query:
        if mode == "keyword":
            query_body["query"]["bool"]["must"].append({"match": {"content": query}})
            query_body["query"]["bool"]["must"].append({"match": {"title": query}})

        elif mode == "stockid":
            query_body["query"]["bool"]["must"].append({"term": {"stock_id": query}})

        elif mode == "stockname":
            query_body["query"]["bool"]["must"].append({"match": {"stock_name": query}})

    if isStockholder == '1':
        query_body["query"]["bool"]["must"].append({"term": {"stockholder": True}})
    elif isStockholder == '0':
        query_body["query"]["bool"]["must"].append({"term": {"stockholder": False}})
    elif not isStockholder:
        pass

    hits = es.count(index=index_name, doc_type=index_type, body=query_body)['count']
    
    return hits


def search_post_func(start_date, end_date, sentiment, query, mode='keyword', page_from=0, page_size=5):
    query_body = {
        "query": {
            "bool": {
                "must": [
                 { "term": { "sentiment": sentiment } },
                 { "term": { "has_sentiment": 1 } },
                 { "term": { "ad": 1 } },
                 {
                   "range": {
                       "releaseTime": {
                           "gte": start_date,
                           "lte": end_date
                        }
                    }
                 }
                ]
            }
        },
        "from": page_from,
        "size": page_size,
        "sort": [{'clicks': {'order': 'desc'}}]
    }
    
    if query:
        if mode == "keyword":
            query_body["query"]["bool"]["must"].append({"match": {"content": query}})
            query_body["query"]["bool"]["must"].append({"match": {"title": query}})

        elif mode == "stockid":
            query_body["query"]["bool"]["must"].append({"term": {"stock_id": query}})

        elif mode == "stockname":
            query_body["query"]["bool"]["must"].append({"match": {"stock_name": query}})

    results = es.search(index=index_name, doc_type=index_type, body=query_body)['hits']['hits']
    
    items = []
    for r in results:
        items.append(r['_source'])

    return items

def search_stock_count_func(start_date, end_date, topk, query, mode):
    query_body = {
        "query": {
            "bool": {
                "must": [
                 {
                   "range": {
                       "releaseTime": {
                           "gte": start_date,
                           "lte": end_date
                        }
                    }
                 }
                ]
            }
        },
        "size": 0,
        "aggs" : {
            "group_by_stock_id" : {
                "terms" : { "field" : "stock_id", "size": topk },
                "aggs": {
                    "group_by_sentiment": {
                        "terms": { "field": "sentiment" }
                    }
                }
            }
        }
    }

    if query:
        if mode == "keyword":
            query_body["query"]["bool"]["must"].append({"match": {"content": query}})
            query_body["query"]["bool"]["must"].append({"match": {"title": query}})

        elif mode == "stockid":
            query_body["query"]["bool"]["must"].append({"term": {"stock_id": query}})

        elif mode == "stockname":
            query_body["query"]["bool"]["must"].append({"match": {"stock_name": query}})


    results = es.search(index=index_name, doc_type=index_type, body=query_body)["aggregations"]["group_by_stock_id"]["buckets"]
    
    stock_result = []
    for r in results:
        sentiment_results = r['group_by_sentiment']['buckets']
        negative_count = 0
        for s in sentiment_results:
            if s["key"] == 0:
                negative_count = s["doc_count"]
        
        query = {
            "query": {
                "bool": {
                    "must": [
                        { "term": { "_id": r['key'] } }
                    ]
                }
            }
        }
        result = es.search(index=index_name, doc_type="stock", body=query)['hits']['hits'][0]['_source']
        stock_result.append((result['stock_name'], r['doc_count'], negative_count))

    return stock_result

def search_keywords_func(start_date, end_date, sentiment, query, mode, page_from, page_size, topk):
    query_body = {
        "query": {
            "bool": {
                "must": [
                 { "term": { "sentiment": sentiment } },
                 { "term": { "has_sentiment": 1 } },
                 { "term": { "ad": 1 } },
                 {
                   "range": {
                       "releaseTime": {
                           "gte": start_date,
                           "lte": end_date
                        }
                    }
                 }
                ]
            }
        },
        "from": page_from,
        "size": page_size,
        "sort": [{'clicks': {'order': 'desc'}}]
    }
    
    if query:
        if mode == "keyword":
            query_body["query"]["bool"]["must"].append({"match": {"content": query}})
            query_body["query"]["bool"]["must"].append({"match": {"title": query}})

        elif mode == "stockid":
            query_body["query"]["bool"]["must"].append({"term": {"stock_id": query}})

        elif mode == "stockname":
            query_body["query"]["bool"]["must"].append({"match": {"stock_name": query}})

    results = es.search(index=index_name, doc_type=index_type, body=query_body)['hits']['hits']
    
    keywords = []
    for r in results:
        content = r['_source']['content'].encode('utf-8')
        title = r['_source']['title'].encode('utf-8')
        keywords.extend(cut(s, content))
        keywords.extend(cut(s, title))

    ct = collections.Counter(keywords)
    keywords = ct.most_common(topk)

    return keywords

@mod.route('/stock_pie_count/', methods=['GET', 'POST'])
def stock_pie_count():
    """
    """
    topk = int(request.args.get('topk', 10))
    query = request.args.get('query', None)
    mode = request.args.get('mode', 'keyword')

    if query:
        query = query.strip()

    if query == "None":
        query = None

    if query:
        if query.split(':')[0] == 'id':
            query = query.split(':')[1]
            mode = 'stockid'
        elif query.split(':')[0] == 'name':
            query = query.split(':')[1]
            mode = 'stockname'

    during = request.args.get('during', 3600) # 计算粒度，默认为15分钟
    during = int(during)
    ts = request.args.get('ts', '')
    ts = long(ts)
    begin_ts = ts - during
    end_ts = ts

    start_date = ts2datetimestr(begin_ts) # "2014-10-10 10:30:00"
    end_date = ts2datetimestr(end_ts) # "2014-10-10 11:30:00" 

    results = search_stock_count_func(start_date, end_date, topk, query, mode)

    return json.dumps(results)


@mod.route('/sentiment/', methods=['GET','POST'])
def sentiment_data():
    """分类情感数据--绝对值
    """
    query = request.args.get('query', None) # 输入topic
    emotion = request.args.get('emotion', 'global') # 情绪类型, 默认负类
    isStockholder = request.args.get('stockholder', '1') # 是否股东, 默认股东
    mode = request.args.get('mode', 'keyword')

    if query:
        query = query.strip()

    if query == "None":
        query = None

    if query:
        if query.split(':')[0] == 'id':
            query = query.split(':')[1]
            mode = 'stockid'
        elif query.split(':')[0] == 'name':
            query = query.split(':')[1]
            mode = 'stockname'

    during = request.args.get('during', 3600) # 计算粒度，默认为15分钟
    during = int(during)
    ts = request.args.get('ts', '')
    ts = long(ts)
    begin_ts = ts - during
    end_ts = ts

    start_date = ts2datetimestr(begin_ts) # "2014-10-10 10:30:00"
    end_date = ts2datetimestr(end_ts) # "2014-10-10 11:30:00" 

    results = {}

    if emotion == 'global':
        for k, v in emotions_kv.iteritems():
            results[k] = search_count_func(start_date, end_date, v, query, mode, isStockholder)
    else:
        if emotion != 'positive' and emotion != 'negative':
            _emotion, isStockholder = emotion.split('_')
            if isStockholder == 'stock':
                isStockholder = '1'
            else:
                isStockholder = '0'
            results[emotion] = search_count_func(start_date, end_date, emotions_kv[_emotion], query, mode, isStockholder)
        else:
            results[emotion] = search_count_func(start_date, end_date, emotions_kv[emotion], query, mode, None)

    return json.dumps(results)


@mod.route('/sentiment_post/', methods=['GET','POST'])
def sentiment_post():
    """相关帖子
    """
    query = request.args.get('query', None) # 输入topic
    emotion = request.args.get('emotion', 'global') # 情绪类型,
    isStockholder = request.args.get('stockholder', '1') # 是否股东, 默认股东
    mode = request.args.get('mode', 'keyword')
    page_from = int(request.args.get('from', 0))
    page_size = int(request.args.get('size', 5))

    if query:
        query = query.strip()

    if query == "None":
        query = None
    
    if query:
        if query.split(':')[0] == 'id':
            query = query.split(':')[1]
            mode = 'stockid'
        elif query.split(':')[0] == 'name':
            query = query.split(':')[1]
            mode = 'stockname'

    during = request.args.get('during', 3600) # 计算粒度，默认为15分钟
    during = int(during)
    ts = request.args.get('ts', '')
    ts = long(ts)
    begin_ts = ts - during
    end_ts = ts

    start_date = ts2datetimestr(begin_ts) # "2014-10-10 10:30:00"
    end_date = ts2datetimestr(end_ts) # "2014-10-10 11:30:00" 

    results = {}

    if emotion == 'global':
        for k, v in emotions_kv.iteritems():
            results[k] = search_post_func(start_date, end_date, v, query, mode, page_from, page_size)
    else:
        results[emotion] = search_post_func(start_date, end_date, emotions_kv[emotion], query, mode, page_from, page_size)

    return json.dumps(results)

@mod.route("/keywords_data/", methods=['GET','POST'])
def sentiment_keywords_data():
    """关键词
    """
    topk = request.args.get('topk', 50)
    query = request.args.get('query', None) # 输入topic
    emotion = request.args.get('emotion', 'global') # 情绪类型,
    mode = request.args.get('mode', 'keyword')
    page_from = int(request.args.get('from', 0))
    page_size = int(request.args.get('size', 1000))

    if query:
        query = query.strip()

    if query == "None":
        query = None

    if query:
        if query.split(':')[0] == 'id':
            query = query.split(':')[1]
            mode = 'stockid'
        elif query.split(':')[0] == 'name':
            query = query.split(':')[1]
            mode = 'stockname'

    during = request.args.get('during', 3600) # 计算粒度，默认为15分钟
    during = int(during)
    ts = request.args.get('ts', '')
    ts = long(ts)
    begin_ts = ts - during
    end_ts = ts

    start_date = ts2datetimestr(begin_ts) # "2014-10-10 10:30:00"
    end_date = ts2datetimestr(end_ts) # "2014-10-10 11:30:00" 

    results = {}

    if emotion == 'global':
        for k, v in emotions_kv.iteritems():
            results[k] = search_keywords_func(start_date, end_date, v, query, mode, page_from, page_size, topk)
    else:
        results[emotion] = search_keywords_func(start_date, end_date, emotions_kv[emotion], query, mode, page_from, page_size, topk)

    return json.dumps(results)
