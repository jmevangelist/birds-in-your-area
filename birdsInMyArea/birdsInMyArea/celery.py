import os

from celery import Celery
from celery.signals import setup_logging
from kombu import Queue

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'birdsInMyArea.settings')

app = Celery('birdsInMyArea')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.

#app.config_from_object('birdsInMyArea.celeryconfig')
app.config_from_object('django.conf:settings', namespace='CELERY')


# Load task modules from all registered Django apps.
app.autodiscover_tasks()
#app.autodiscover_tasks(packages=['birds.apps.BirdsConfig'], related_name='inat', force=True)

app.conf.task_queues = [
	Queue('inat'),
	Queue('inat_tokens',max_length=15)
]

@app.task
def token():
	return 1

@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
	sender.add_periodic_task(1.0,token.signature(queue='inat_tokens'))

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')