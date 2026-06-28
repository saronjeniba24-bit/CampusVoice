import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Complaints')

def _response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body)
    }

def lambda_handler(event, context):
    # Handle preflight OPTIONS request
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, "")

    try:
        body = json.loads(event.get("body") or "{}")
        complaint_id = body.get("complaintId")
        user_id = body.get("userId")

        if not complaint_id or not user_id:
            return _response(400, {"error": "complaintId and userId are required"})

        # Fetch complaint
        response = table.get_item(Key={'ComplaintID': complaint_id})
        if 'Item' not in response:
            return _response(404, {"error": "Complaint not found"})

        item = response['Item']
        reactions = item.get('Reactions', {"likes": 0, "users": []})

        # Prevent duplicate reaction
        if user_id in reactions.get("users", []):
            return _response(400, {"message": "Already reacted"})

        # Add reaction
        reactions["likes"] = reactions.get("likes", 0) + 1
        reactions.setdefault("users", []).append(user_id)

        table.update_item(
            Key={'ComplaintID': complaint_id},
            UpdateExpression="SET Reactions = :r",
            ExpressionAttributeValues={":r": reactions}
        )

        return _response(200, {"message": "Reaction added", "ComplaintID": complaint_id})

    except Exception as e:
        return _response(500, {"error": str(e)})
