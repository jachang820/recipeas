import boto3
import json
from datetime import datetime
from random import randint
from common_utils import (
    get_http_method, format_db_to_state, respond, env)

# Clients for AWS services
dynamo = boto3.client('dynamodb')
s3 = boto3.client('s3')


def generate_presigned_post(file_name, mime_type, file_size, md5):
    bucket_name = env['bucket_name']
    key = file_name
    expires_in = 5 * 60 # 5 minutes
    fields = {
        'success_action_status': '201',
        'Cache-Control': f'max-age={expires_in}',
        'Content-Type': mime_type,
        'Content-Length': str(file_size),
        'Content-MD5': md5
    }
    
    conditions = [{key: value} for key, value in fields.items()]
    conditions.append(['content-length-range', 0, 1048576]) # 1 MB max
    
    post = s3.generate_presigned_post(
        bucket_name, key, fields, conditions, expires_in)
        
    if not isinstance(post, dict):
        print('Invalid results', post)
        post = None
        
    return post
    

def generate_id():
    max_id = 16 ** 6 - 1
    random_id = hex(randint(0, max_id))[2:] # remove '0x'
    return ('000000' + random_id)[-6:] # make sure it is 6 digits


def get_timestamp():
    seconds_since_epoch = int(datetime.now().timestamp())
    return hex(seconds_since_epoch)[2:] # remove '0x'


def lambda_handler(event, context):
    
    # GET, POST, OPTIONS, etc.
    operation = get_http_method(event)
    
    # preflight request
    if operation == 'OPTIONS':
        return respond()
        
    # Unsupported HTTP methods:
    elif operation != 'POST':
        return respond(err=ValueError(f'Unsupported method "{operation}"'))
    
    # Add recipe
    else:
        payload = json.loads(event['body'])

        # Check if required fields exist
        not_in_payload = lambda field: field not in payload
        required_keys = ['mimeType', 'title', 'description', 'steps',
            'imagesLoaded']
        keys_do_not_exist = map(not_in_payload, required_keys)
        if any(keys_do_not_exist):
            return respond(err=ValueError('Required keys not found.'))
        
        # Check that there are at least 3 steps
        steps = payload['steps']
        if not isinstance(steps, list) or len(steps) < 3:
            return respond(err=ValueError(
                'Insufficient number of steps. At least 3 expected.'))
        
        # Required fields
        mime_type = payload['mimeType']
        title = payload['title']
        description = payload['description']
        
        # Check that each field contains valid data at minimum
        empty_fields = lambda field: len(field.strip()) == 0
        required_fields = [mime_type, title, description]
        required_fields.extend(steps)
        fields_not_long_enough = map(empty_fields, required_fields)
        if any(fields_not_long_enough):
            return respond(err=ValueError('Required fields cannot be empty.'))
        if mime_type not in ['image/jpeg', 'image/png', 'image/webp']:
            return respond(err=ValueError('Invalid MIME type.'))
            
        # Set image MIME type
        if mime_type == 'image/jpeg': file_ext = 'jpg'
        elif mime_type == 'image/png': file_ext = 'png'
        else: file_ext = 'webp'
        
        # Sortable key
        timestamp = get_timestamp()
        
        # Make file names not guessable to prevent exploits
        recipe_id = timestamp + generate_id()

        # Check if images uploaded
        images_uploaded = payload['imagesLoaded']
        if images_uploaded:
            # Image related fields
            image_size = payload['imageFileSize']
            thumbnail_size = payload['thumbnailFileSize']
            image_md5 = payload['imageMd5']
            thumbnail_md5 = payload['thumbnailMd5']
            
            # Use a unique id as the file name
            base_name = f'{recipe_id}.{file_ext}'
            image_file = f'{env['image_dir']}{base_name}'
            thumbnail_file = f'{env['thumb_dir']}{base_name}'
            
            # Generate presigned posts
            image_post = generate_presigned_post(
                image_file, 
                mime_type, 
                image_size, 
                image_md5)
            thumbnail_post = generate_presigned_post(
                thumbnail_file,
                mime_type,
                thumbnail_size,
                thumbnail_md5)
            
        # Check if default MIME type is valid when images not uploaded
        elif mime_type != 'image/png':
            return respond(err=ValueError('Invalid default MIME type.'))
        
        # Save rest of data to DynamoDB
        new_recipe = {
            'type': {'S': 'RECIPE'},
            'timestamp': {'S': recipe_id},
            'file_ext': {'S': file_ext},
            'has_image': {'BOOL': images_uploaded},
            'title': {'S': title},
            'description': {'S': description},
            'steps': {'S': json.dumps(steps)}
        }
        
        dynamo.put_item(
            TableName = env['table_name'],
            Item = new_recipe)
            
        result = {
            'recipe': format_db_to_state(new_recipe)
        }
        
        # Add presigned urls and forms to response
        if (images_uploaded 
            and image_post is not None 
            and thumbnail_post is not None):
                
            result['urls'] = {
                'image': image_post,
                'thumbnail': thumbnail_post
            }
        
        return respond(res=result)
