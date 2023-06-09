import requests 
from celery import shared_task
from celery.exceptions import TimeoutError as CeleryTimeoutError
from functools import wraps
from datetime import datetime
import logging
from django.core.cache import cache

url = "https://api.inaturalist.org/v1"

def timeStamp():
	return '[' + datetime.now().strftime('%d/%b/%Y %H:%M:%S.%f')[:24] + '] '

def rate_limit(task_group):
	def decorator_func(func):
		@wraps(func)
		def function(self, *args, **kwargs):
			if not self.request.get('task'):
				return func(self,*args,**kwargs)

			with self.app.connection_for_read() as conn:
				try:
					msg = conn.default_channel.basic_get(task_group+'_tokens', no_ack=True)
				except Exception as e:
					self.retry(countdown=1)

				if msg is None:
					self.retry(countdown=1)
				else:
					return func(self,*args,**kwargs)
		return function
	return decorator_func

@shared_task(bind=True,max_retries=None,queue='inat')
@rate_limit('inat')
def calliNatAPI(self,params,path,method,return_type):
	api_url = url + '/'.join(path)
	try:
		if method == 'post':
			response = requests.post(api_url,data=params)
		else:
			response = requests.get(api_url,params=params)
	except Exception as e:
		ret = {}
	else:
		if response.ok:
			if return_type == 'json':
				ret = response.json()
			elif return_type == 'binary':
				ret = response.content
			else:
				ret = response
		else:
			ret = {}

	return ret

def tasker(params,path,method,return_type):
	task = { 'status': 'PENDING', 'data': {}, 'id': '' }

	def getCall(taskId,val):
		task['data'] = val
	
	def message(b):
		task['id'] = b['task_id']
		task['status'] = b['status']
		logging.info(timeStamp() + b['task_id'] + ' Status: ' + b['status'])

	try:
		calliNatAPI.apply_async(args=(params,path,method,return_type)).get(callback=getCall,on_message=message)	

	except CeleryTimeoutError:
		logging.warning(timeStamp() + 'task ' + task['id'] + ' timeout'  )
	except calliNatAPI.OperationalError as exc:
		# print(timeStamp() + str(params['page']))
		logging.error('Sending task raised: ' + str(exc))
	except Exception as e:
		logging.error(e)
	finally:
		if not task['data']:
			task['data'] = calliNatAPI(params,path,method,return_type)

	return task['data']


def observation_tiles(params,path):
	return tasker(params,path,'get','binary')

def UTFGrid(params,path):
	return tasker(params,path,'get','json')

def observations(params,path=[],request='get'):
	path = ['','observations'] + path
	return tasker(params,path,request,'json')

def taxa(params,path=[]):
	ids = path[0].split(',')
	cached_taxa = cache.get_many(ids)
	uncached_ids = list(filter(lambda id: id not in list(cached_taxa.keys()), ids ))
	ret = {}

	if uncached_ids:
		path = ['','taxa'] + [",".join(uncached_ids)]
		ret = tasker({},path,'get','json')
		if ret['results']:
			new = dict(map(lambda t: ( t['id'], t ),list(ret['results'])))
			cache.set_many(new,6000)

	combined = []
	if cached_taxa:
		combined = list(cached_taxa.values()) 

	if ret.get('results'):
		combined += list(ret.get('results'))
	
	ret['total_results'] = len(combined)
	ret['results'] = combined

	return ret

def places(params,path=[]):
	key = str(params).replace(" ","")
	ret = cache.get(key)
	if not ret:
		path = ['','places'] + path
		ret = tasker(params,path,'get','json')
		cache.set(key,ret,600)
	
	return ret