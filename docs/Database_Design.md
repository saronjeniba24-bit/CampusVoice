# Database Design

## Tables

### Users
- **UserID** (Partition Key)
- Name
- Role (Student, Faculty, HOD)
- Department
- Year
- PasswordHash

### Complaints
- **ComplaintID** (Partition Key)
- UserID (Student who submitted)
- Title
- Description
- Department
- Year
- Status (Pending, In Progress, Resolved)
- Timestamp

## Indexes
- **DeptYearIndex**: Query complaints by Department + Year
