import json
import boto3
import decimal
from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime, timezone, timedelta

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Complaints')

# Helper to convert DynamoDB Decimals into int/float for JSON
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)

def _response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }

def _bad_request(msg):
    return _response(400, {"error": msg})

def _safe_int(val):
    try:
        return int(val)
    except Exception:
        return None

def _normalize_dept(val):
    if not val:
        return None
    return str(val).strip().upper()

def _normalize_role(val):
    if not val:
        return None
    return str(val).strip().title()  # Student, Faculty, Hod, Timeline, etc.

def lambda_handler(event, context):
    # Handle preflight OPTIONS request
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, "")

    params = event.get("queryStringParameters", {}) or {}
    role = _normalize_role(params.get("role"))
    dept = _normalize_dept(params.get("department"))
    year = _safe_int(params.get("year"))
    userId = params.get("userId")
    visibility = params.get("visibility")
    timeline_flag = str(params.get("timeline", "")).lower() == "true"
    scope_all = str(params.get("scope", "")).lower() == "all"

    try:
        items = []

        # STUDENT: only their own complaints
        if role == "Student":
            if not userId:
                return _bad_request("Missing userId for Student role")
            resp = table.query(
                IndexName="UserIndex",
                KeyConditionExpression=Key("UserID").eq(userId)
            )
            items = resp.get("Items", [])

        # FACULTY
        elif role == "Faculty":
            if not dept or year is None:
                return _bad_request("Missing department or year for Faculty")
            if timeline_flag:
                resp = table.query(
                    IndexName="DeptYearIndex",
                    KeyConditionExpression=Key("Department").eq(dept) & Key("Year").eq(year)
                )
            else:
                resp = table.query(
                    IndexName="DeptYearIndex",
                    KeyConditionExpression=Key("Department").eq(dept) & Key("Year").eq(year),
                    FilterExpression=Attr("Visibility").eq("Public")
                )
            items = resp.get("Items", [])

        # HOD
        elif role == "Hod":
            if not dept:
                return _bad_request("Missing department for HOD")
            if timeline_flag and year is not None:
                resp = table.query(
                    IndexName="DeptYearIndex",
                    KeyConditionExpression=Key("Department").eq(dept) & Key("Year").eq(year)
                )
            elif timeline_flag:
                resp = table.query(
                    IndexName="DepartmentIndex",
                    KeyConditionExpression=Key("Department").eq(dept)
                )
            else:
                resp = table.query(
                    IndexName="DepartmentIndex",
                    KeyConditionExpression=Key("Department").eq(dept),
                    FilterExpression=Attr("Visibility").eq("Public")
                )
            items = resp.get("Items", [])

        # TIMELINE: only Public complaints
        elif role == "Timeline":
            resp = table.scan(
                FilterExpression=Attr("Visibility").eq("Public")
            )
            items = resp.get("Items", [])

        # PUBLIC BOARD
        elif visibility == "Public":
            if scope_all or (role and role.lower() == "admin"):
                resp = table.scan(FilterExpression=Attr("Visibility").eq("Public"))
            elif dept and year is not None:
                resp = table.query(
                    IndexName="DeptYearIndex",
                    KeyConditionExpression=Key("Department").eq(dept) & Key("Year").eq(year),
                    FilterExpression=Attr("Visibility").eq("Public")
                )
            elif dept:
                resp = table.query(
                    IndexName="DepartmentIndex",
                    KeyConditionExpression=Key("Department").eq(dept),
                    FilterExpression=Attr("Visibility").eq("Public")
                )
            else:
                resp = table.scan(FilterExpression=Attr("Visibility").eq("Public"))
            items = resp.get("Items", [])

        # Fallback
        else:
            resp = table.scan(FilterExpression=Attr("Visibility").eq("Public"))
            items = resp.get("Items", [])

        # Respect anonymity + convert CreatedAt to IST
        for item in items:
            if item.get("Identity") == "Anonymous":
                item["UserID"] = "Anonymous"

            if "CreatedAt" in item:
                try:
                    dt = datetime.fromisoformat(item["CreatedAt"].replace("Z", "+00:00"))
                    ist_offset = timedelta(hours=5, minutes=30)
                    ist_time = dt.astimezone(timezone(ist_offset))
                    item["CreatedAtIST"] = ist_time.isoformat()
                except Exception:
                    pass

        return _response(200, items)

    except Exception as e:
        return _response(500, {"error": str(e)})