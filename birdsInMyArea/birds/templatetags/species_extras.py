from django import template

register = template.Library()

red_list = {
	'EX': {'text': 'Extinct', 'class': 'text-danger'},
	'EW': {'text': 'Extinct in the wild', 'class': 'text-danger'},
	'CR': {'text': 'Critically endangered', 'class': 'text-danger'},
	'EN': {'text': 'Endangered', 'class': 'text-danger'},
	'VU': {'text': 'Vulnerable', 'class': 'text-warning'},
	'NT': {'text': 'Near threatened', 'class': 'text-warning'},
	'LC': {'text': 'Least concern', 'class': 'text-body'},
	'DD': {'text': 'Data deficient', 'class': 'text-body'},
	'NE': {'text': 'Not evaluated', 'class': 'text-body'}
}


@register.filter
def red_list_text(code):

	if red_list.get(code):
		ret = red_list.get(code).get('text',code)
	else:
		ret = code		

	return ret

@register.simple_tag
def red_list_class(code):

	if red_list.get(code):
		ret = red_list.get(code).get('class','text-body')
	else:
		ret = 'text-body'

	return ret

@register.filter
def truncate(text):
	return text[:5] + '...'