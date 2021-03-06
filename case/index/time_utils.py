# -*- coding:utf-8 -*-

import time
import datetime

def unix2hadoop_date(ts):
    return time.strftime('%Y_%m_%d', time.localtime(ts))
def ts2datetime(ts):
    return time.strftime('%Y-%m-%d', time.localtime(ts))
def datetime2ts(date):
    return time.mktime(time.strptime(date, '%Y-%m-%d'))
def window2time(window, size=24*60*60):
    return window*size
def datetimestr2ts(date):
    return time.mktime(time.strptime(date, '%Y%m%d'))
def ts2datetimestr(ts):
    return time.strftime('%Y%m%d', time.localtime(ts))
def ts2date(ts):
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ts))

