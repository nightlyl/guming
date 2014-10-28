#-*- coding:utf-8 -*-


import json
import time
import datetime
from case.model import *
from case.extensions import db
from time_utils import ts2datetime, ts2date
from flask import Blueprint, url_for, render_template, request, abort, flash, session, redirect, make_response


mod = Blueprint('case', __name__, url_prefix='/index')

def get_default_timerange():
    return u'20130902-20130907'

def get_default_topic():
    return u'东盟,博览会'

def get_default_pointInterval():
    return {'zh': u'1小时', 'en': 3600}

def get_pointIntervals():
    return [{'zh': u'15分钟', 'en': 900}, {'zh': u'1小时', 'en': 3600}, {'zh': u'1天', 'en': 3600 * 24}]

def get_gaishu_yaosus():
    return {'yaosu': (('gaishu', u'概述分析'), ('zhibiao', u'指标分析'))}

def get_deep_yaosus():
    return {'yaosu': (('time', u'时间分析'), ('area', u'地域分析'), \
                      ('moodlens', u'情绪分析'), ('network', u'网络分析'), \
                      ('semantic', u'语义分析'))}

default_timerange = get_default_timerange()
default_topic = get_default_topic()
default_pointInterval = get_default_pointInterval()
pointIntervals = get_pointIntervals()
gaishu_yaosus = get_gaishu_yaosus()
deep_yaosus = get_deep_yaosus()


@mod.route('/moodlens/')
def moodlens():
    # 要素
    yaosu = 'moodlens'

    # 话题关键词
    topic = request.args.get('query', default_topic)

    # 时间范围: 20130901-20130901
    time_range = request.args.get('time_range', default_timerange)

    # 时间粒度: 3600
    point_interval = request.args.get('point_interval', None)
    if not point_interval:
        point_interval = default_pointInterval
    else:
        for pi in pointIntervals:
            if pi['en'] == int(point_interval):
                point_interval = pi
                break

    return render_template('index/moodlens.html', yaosu=yaosu, time_range=time_range, \
            topic=topic, pointInterval=point_interval, pointIntervals=pointIntervals, \
            gaishu_yaosus=gaishu_yaosus, deep_yaosus=deep_yaosus)


@mod.route('/zhibiao/')
def zhibiao():
        # 要素
    yaosu = 'zhibiao'

    # 话题关键词
    topic = request.args.get('query', default_topic)

    # 时间范围: 20130901-20130901
    time_range = request.args.get('time_range', default_timerange)

    # 时间粒度: 3600
    point_interval = request.args.get('point_interval', None)
    if not point_interval:
        point_interval = default_pointInterval
    else:
        for pi in pointIntervals:
            if pi['en'] == int(point_interval):
                point_interval = pi
                break

    return render_template('index/zhibiao.html', yaosu=yaosu, time_range=time_range, \
            topic=topic, pointInterval=point_interval, pointIntervals=pointIntervals, \
            gaishu_yaosus=gaishu_yaosus, deep_yaosus=deep_yaosus)

