# CampusVoice

CampusVoice is a full-stack complaint management system for universities.  
It enables students to submit complaints, faculty/HODs to review them, and everyone to track resolution status transparently.

---

## 🚀 Features
- Student signup/login
- Complaint submission/tracking
- Dashboards for Students, Faculty, HOD
- Public board for transparency
- Timeline view of complaint updates

---

## 🛠 Tech Stack
- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: AWS Lambda + API Gateway  
- **Database**: DynamoDB  
- **Hosting**: Netlify / AWS Amplify  

---

## 📂 Documentation
- [Project Overview](docs/Project_Overview.md)  
- [Features](docs/Features.md)  
- [Database Design](docs/Database_Design.md)  
- [AWS Architecture](docs/AWS_Architecture.md)  

---

## ⚙️ Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/CampusVoice.git
   cd CampusVoice
If your frontend uses Node tooling, install dependencies:

bash
npm install
Remove this step if there is no package.json.

Configure AWS:

Deploy Lambda functions.

Set up API Gateway routes with CORS enabled.

Update IAM roles with DynamoDB permissions.

Update frontend config:

In frontend/js/app.js, replace API_GATEWAY_URL with your deployed API Gateway endpoint.

Deploy frontend:

Netlify: drag & drop the frontend folder or connect the GitHub repo.

AWS Amplify: connect the repo and follow the Amplify setup.

📌 Project Structure
Code
CampusVoice/
├── aws/                # AWS notes and configs
├── backend/            # Lambda functions + requirements.txt
├── docs/               # Documentation (architecture, features, DB design)
├── frontend/           # HTML, CSS, JS files (login.html, signup.html, dashboard.html, complaint.html, timeline.html, js/app.js, css/style.css)
├── infra/              # DynamoDB YAML + sample JSON
└── README.md
📸 Screenshots




🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you’d like to change.

📜 License
This project is licensed under the MIT License