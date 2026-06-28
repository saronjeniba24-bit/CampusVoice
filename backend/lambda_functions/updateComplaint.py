import json
import boto3
from datetime import datetime

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
        body = json.loads(event.get("body", "{}"))
        complaint_id = body.get("complaintId")
        new_status = body.get("status", "Resolved")

        if not complaint_id:
            return _response(400, {"error": "complaintId is required"})

        # Update complaint status and add resolved timestamp
        response = table.update_item(
            Key={"ComplaintID": complaint_id},
            UpdateExpression="SET #s = :status, ResolvedAt = :resolvedAt",
            ExpressionAttributeNames={"#s": "Status"},
            ExpressionAttributeValues={
                ":status": new_status,
                ":resolvedAt": datetime.utcnow().isoformat()
            },
            ReturnValues="UPDATED_NEW"
        )

        return _response(200, {
            "message": "Complaint status updated successfully",
            "ComplaintID": complaint_id,
            "UpdatedAttributes": response.get("Attributes", {})
        })

    except Exception as e:
        return _response(500, {"error": str(e)})
