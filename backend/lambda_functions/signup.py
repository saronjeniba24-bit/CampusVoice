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
        role = body.get('role')
        department = body.get('department')
        year = body.get('year')
        invite_code = body.get('inviteCode')

        # Validate required fields
        if not username or not password or not role or not department:
            return _response(400, {"message": "Missing required fields"})

        # Check if user already exists
        response = table.get_item(Key={'UserID': username})
        if 'Item' in response:
            return _response(400, {"message": "User already exists"})

        # Role-specific rules
        if role == "Student":
            if year not in ["1", "2", "3", "4"]:
                return _response(400, {"message": "Student must have a valid year (1-4)"})
            year_val = int(year)

        elif role == "Faculty":
            if invite_code != "FACULTY2026":
                return _response(403, {"message": "Invalid secret code for Faculty signup"})
            if year not in ["1", "2", "3", "4"]:
                return _response(400, {"message": "Faculty must have a valid year (1-4)"})
            year_val = int(year)

        elif role == "HOD":
            if invite_code != "HOD2026":
                return _response(403, {"message": "Invalid secret code for HOD signup"})
            year_val = "NA"  # HOD year is always NA

        else:
            return _response(400, {"message": "Invalid role"})

        # Insert new user (normalize department to uppercase)
        table.put_item(Item={
            'UserID': username,
            'Password': password,
            'Role': role,
            'Department': department.upper(),
            'Year': year_val
        })

        return _response(200, {"message": "Signup successful"})

    except Exception as e:
        return _response(500, {"error": str(e)})
