import json
import boto3
import uuid
import traceback
from datetime import datetime, timezone

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
    # Log the full event so you can see what API Gateway is passing
    print("Event received:", json.dumps(event))

    # Normalize httpMethod for both REST API v1 and HTTP API v2.0
    method = (event.get("httpMethod") or 
              event.get("requestContext", {}).get("http", {}).get("method", "")).upper()

    # Handle preflight OPTIONS request
    if method == "OPTIONS":
        return _response(200, "")

    # Only allow POST
    if method != "POST":
        return _response(405, {"error": "Method not allowed"})

    try:
        # Parse JSON body
        body = json.loads(event.get("body", "{}"))

        userId = body.get("userId")
        dept = (body.get("department") or "").upper()
        year = body.get("year")
        role = (body.get("role") or "").title()

        # Validate required fields
        if not userId or not dept or not year or not role:
            return _response(400, {"error": "Missing required fields"})

        # Normalize year: numeric if possible, else keep string
        try:
            if str(year).isdigit():
                year = int(year)
        except Exception:
            pass

        # Generate unique ID and timestamp
        complaint_id = "CMP-" + uuid.uuid4().hex[:8].upper()
        created_at = datetime.now(timezone.utc).isoformat()

        # Build item
        item = {
            "ComplaintID": complaint_id,
            "UserID": userId,
            "Department": dept,
            "Year": year,
            "Role": role,
            "Title": body.get("title", ""),
            "Text": body.get("text", ""),
            "Category": body.get("category", "Others"),
            "Priority": body.get("priority", "Low"),
            "Identity": body.get("identity", "Named"),
            "Visibility": body.get("visibility", "Private"),
            "Status": "Pending",
            "CreatedAt": created_at
        }

        print("Putting item:", item)  # Debug log

        # Save to DynamoDB
        table.put_item(Item=item)

        return _response(200, {
            "message": "Complaint submitted successfully",
            "ComplaintID": complaint_id
        })

    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return _response(500, {"error": str(e)})
