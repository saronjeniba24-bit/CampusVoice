import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

def _response(status, body):
    return {
        'statusCode': status,
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        'body': json.dumps(body)
    }

def lambda_handler(event, context):
    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, "")

    try:
        body = json.loads(event.get('body') or "{}")
        username = body.get('username')
        password = body.get('password')

        if not username or not password:
            return _response(400, {'message': 'username and password are required'})

        # Fetch user by UserID (partition key)
        response = table.get_item(Key={'UserID': username})
        user = response.get('Item')

        if user and user.get('Password') == password:
            # Normalize values
            role = user.get('Role', '')
            department = (user.get('Department') or "").upper()
            year = user.get('Year')
            year_str = str(year) if year is not None else ""

            response_payload = {
                'message': 'Login successful',
                'userId': user.get('UserID'),
                'role': role,
                'department': department,
                'year': year_str
            }

            return _response(200, response_payload)

        # Invalid credentials
        return _response(401, {'message': 'Invalid credentials'})

    except Exception as e:
        return _response(500, {'error': str(e)})
