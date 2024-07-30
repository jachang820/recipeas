import boto3
import json
from common_utils import get_http_method, format_db_to_state, respond, env

dynamo = boto3.client('dynamodb')

def lambda_handler(event, context):
    
    # GET, POST, OPTIONS, etc.
    operation = get_http_method(event)
    
    # preflight request
    if operation == 'OPTIONS':
        return respond()
        
    # Unsupported HTTP methods:
    elif operation != 'GET':
        return respond(err=ValueError(f'Unsupported method "{operation}"'))
    
    # Add recipe
    else:
        # Get pagination bookmark
        start_key = None
        if 'queryStringParameters' in event:
            options = event['queryStringParameters']
            if options is not None and 'lastKey' in options:
                start_key = options['lastKey']
        
        # Set query parameters to search table by descending timestamp.
        # For some reason, the API can't set the query key directly, and has
        # to use aliases to substitute the actual value. Since the partition
        # key 'type' is a keyword, it must be substituted with an alias
        # beginning with '#', like '#t' but not #type (BUG?). The value must be
        # subtituted by an alias beginning with ':', like ':recipe' for 'RECIPE'.
        params = {
            'TableName': env['table_name'],
            'Limit': 10,
            'ScanIndexForward': False,
            'KeyConditionExpression': '#t = :recipe',
            'ExpressionAttributeNames': {'#t': 'type'},
            'ExpressionAttributeValues': {':recipe': {'S': 'RECIPE'}}
        }
        
        # If there was a prior pagination from LastEvaluatedKey returned, then
        # if it's passed as a parameter, the next search should start from that 
        # key using ExclusiveStartKey.
        if start_key is not None:
            params['ExclusiveStartKey'] = {'S': start_key};
        
        # Execute the query
        query_response = dynamo.query(**params)
        
        # Convert each response item to state format in front end
        result = {}
        result['recipes'] = list(map(format_db_to_state, query_response['Items']))

        # The start of next set of items for pagination
        if 'LastEvaluatedKey' in query_response:
            if query_response['LastEvaluatedKey'] is not None:
                result['lastKey'] = query_response['LastEvaluatedKey']['S']
        
        return respond(res=result)

