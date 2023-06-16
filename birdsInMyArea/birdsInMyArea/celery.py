import os

from celery import Celery
from celery.signals import setup_logging
from kombu import Queue
from django.conf import settings

import redis

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'birdsInMyArea.settings')
app = Celery('birdsInMyArea')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.

#app.config_from_object('birdsInMyArea.celeryconfig')
app.config_from_object('django.conf:settings', namespace='CELERY')

if settings.DEBUG:
	r = redis.Redis(host=settings.REDIS_HOST,port=settings.REDIS_PORT)
else:
	creds_provider = redis.UsernamePasswordCredentialProvider(settings.REDIS_USERNAME, settings.REDIS_PASSWORD)
	r = redis.Redis(host=settings.REDIS_HOST,port=settings.REDIS_PORT,credential_provider=creds_provider)

# Load task modules from all registered Django apps.
app.autodiscover_tasks()
#app.autodiscover_tasks(packages=['birds.apps.BirdsConfig'], related_name='inat', force=True)

app.conf.task_queues = [
	Queue('inat'),
	Queue('inat_tokens',max_length=15) #max_length only works on RabbitMQ
]

@app.task
def token():
	return 1

@app.task
def limit_tokens(ignore_result=True):
	a = r.ltrim('inat_tokens',0,50)
	return a

@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
	sender.add_periodic_task(1.0,token.signature(queue='inat_tokens'))
	sender.add_periodic_task(.9,limit_tokens.signature(queue='inat'))

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')