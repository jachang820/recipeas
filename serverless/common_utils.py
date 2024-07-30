import json


# Some environmental variables, easier to import them from here.
env = {
    # S3 settings
    'bucket_name': 'recipe-share-app',
    'domain': f'https://recipe-share-app.s3.amazonaws.com/',
    'image_dir': 'images/',
    'thumb_dir': 'thumbnails/',

    # Dynamo settings
    'table_name': 'recipe'
}

# Find the HTTP method from the event objects that the
# API Gateway or Lambda function generates.
def get_http_method(event):
    try:
        # Using API Gateway
        return event['httpMethod']
    except:
        try:
            # Using Lambda function V 2.0
            return event['requestContext']['http']['method']
        
        except:
            return None
        

# Convert the 'recipe' table object to RecipeState type used
# in the front end.
def format_db_to_state(db_recipe):
    
    recipe_id = db_recipe['timestamp']['S']
    extension = db_recipe['file_ext']['S']
    has_image = db_recipe['has_image']['BOOL']
    filename = f'{recipe_id}.{extension}'
    
    get_filename = lambda type: env['domain'] + env[f'{type}_dir'] + filename
    if extension == 'jpg': mime_type = 'image/jpeg'
    elif extension == 'png': mime_type = 'image/png'
    else: mime_type = 'image/webp'
    
    state = {
        'id': recipe_id,
        'title': db_recipe['title']['S'],
        'description': db_recipe['description']['S'],
        'mimeType': mime_type,
        'steps': json.loads(db_recipe['steps']['S'])
    }
    
    if has_image:
        state['imageUrl'] = get_filename('image')
        state['thumbnailUrl'] = get_filename('thumb')
    
    return state
    

# Produce a response with status code, headers and payload
# depending on whether errors or a payload are given.
def respond(err=None, res=None):
    
    if err is not None:
        status_code = '400' # Error
        payload = json.dumps({'errorMessage': str(err)})
    
    elif res is None or len(res) == 0:
        status_code = '204' # No content
        payload = ""
        
    else:
        status_code = '200' # OK
        payload = json.dumps(res)
    
    return {
        'statusCode': status_code,
        'body': payload,
        'headers': {
            'Content-Type': 'application/json'
        },
    }
