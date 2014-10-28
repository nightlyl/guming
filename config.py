# -*- coding: utf-8 -*-

# the debug toolbar is only enabled in debug mode
DEBUG = True

ADMINS = frozenset(['youremail@yourdomain.com'])
SECRET_KEY = 'SecretKeyForSessionSigning'

THREADS_PER_PAGE = 8

CSRF_ENABLED = True
CSRF_SESSION_KEY= 'somethingimpossibletoguess'
