# AWS Architecture

## Services Used
- **Lambda**: Backend functions (login, signup, submitComplaint, getComplaints, updateComplaintStatus, reactComplaint)
- **API Gateway**: Routes for frontend → backend communication
- **DynamoDB**: Tables for Users and Complaints
- **S3**: static frontend hosting
- **IAM**: Roles for Lambda execution and DynamoDB access

## Flow
1. User interacts with frontend (Netlify/Amplify hosted HTML/JS).
2. Frontend calls API Gateway endpoints.
3. API Gateway triggers Lambda functions.
4. Lambda reads/writes data in DynamoDB.
