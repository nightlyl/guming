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
    return u'股票'

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
default_topic = None
default_pointInterval = get_default_pointInterval()
pointIntervals = get_pointIntervals()
gaishu_yaosus = get_gaishu_yaosus()
deep_yaosus = get_deep_yaosus()


@mod.route('/moodlens/')
def moodlens():
    # 话题关键词
    topic = request.args.get('query', default_topic)
    if topic == 'None':
        topic = None

    end_ts = request.args.get('ts', int(time.time()))

    # 时间粒度: 3600
    point_interval = int(request.args.get('during', 3600))
    if not point_interval:
        point_interval = default_pointInterval

    return render_template('index/moodlens.html', end_ts=end_ts, \
            topic=topic, pointInterval=point_interval)


@mod.route('/zhibiao/')
def zhibiao():
    # 话题关键词
    topic = request.args.get('query', default_topic)
    if topic == 'None':
        topic = None

    end_ts = request.args.get('ts', int(time.time()))

    # 时间粒度: 3600
    point_interval = int(request.args.get('during', 3600))
    if not point_interval:
        point_interval = default_pointInterval

    return render_template('index/zhibiao.html', end_ts=end_ts, \
            topic=topic, pointInterval=point_interval)

