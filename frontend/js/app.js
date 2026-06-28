console.log("JS loaded");

const BASE_URL = "https://6340scll61.execute-api.ap-south-1.amazonaws.com/prod";

// ===== SAFE GET HELPER =====
function _safeGet(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

// ===== GENERIC TOGGLE HELPER =====
function setupToggle(fieldId, toggleId) {
  const field = document.getElementById(fieldId);
  const toggle = document.getElementById(toggleId);
  if (!field || !toggle) return;

  toggle.addEventListener("click", () => {
    const type = field.getAttribute("type") === "password" ? "text" : "password";
    field.setAttribute("type", type);
    toggle.textContent = type === "password" ? "👁️" : "🙈";
  });
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
  setupToggle("signupPassword", "toggleSignupPassword");
  setupToggle("loginPassword", "toggleLoginPassword");

  setupLogin();
  setupSignup();
  setupComplaintForm();
  if (document.querySelector("#student-complaints-container")) {
    loadStudentComplaints();
  }
  if (document.querySelector("#faculty-complaints-table")) loadFacultyComplaints();
  if (document.querySelector("#timeline-table")) loadTimelineComplaints();
  if (document.querySelector("#hod-complaints-table")) loadHodComplaints();
});

// ===== LOGIN HANDLER =====
function setupLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = _safeGet("loginUsername");
    const password = _safeGet("loginPassword");

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Login response:", data);

        localStorage.setItem("userId", data.userId || "");
        localStorage.setItem("department", (data.department || "").toUpperCase());
        localStorage.setItem("year", data.year !== undefined && data.year !== null ? String(data.year) : "");
        localStorage.setItem("role", (data.role || "").toLowerCase());

        const role = (data.role || "").toLowerCase();
        if (role === "student") window.location.href = "dashboard.html";
        else if (role === "faculty") window.location.href = "faculty.html";
        else if (role === "hod") window.location.href = "hod.html";
        else if (role === "admin") window.location.href = "admin.html";
        else alert("Unknown role. Please contact admin.");
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again later.");
    }
  });
}

// ===== SIGNUP HANDLER =====
function setupSignup() {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = _safeGet("signupUsername");
    const password = _safeGet("signupPassword");
    const role = _safeGet("role");
    const department = _safeGet("department");
    const year = _safeGet("year");
    const secretCode = _safeGet("secretCode");

    try {
      const response = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, department, year, inviteCode: secretCode })
      });

      if (response.ok) {
        alert("Signup successful! You can now log in.");
        window.location.href = "login.html";
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || "Signup failed.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Something went wrong. Please try again later.");
    }
  });
}

// ===== COMPLAINT SUBMISSION =====
function setupComplaintForm() {
  const complaintForm = document.getElementById("complaintForm");
  if (!complaintForm) return;

  // ✅ Prevent attaching multiple listeners
  if (complaintForm.dataset.bound === "true") return;
  complaintForm.dataset.bound = "true";

  complaintForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = _safeGet("title") || "";
    const description = _safeGet("description") || "";
    const category = _safeGet("category") || "Others";
    const priority = _safeGet("priority") || "Low";
    const identity = _safeGet("identity") || "Named";
    const visibility = _safeGet("visibility") || "Private";

    const role = (localStorage.getItem("role") || "").toLowerCase();
    let year = localStorage.getItem("year") || "";
    if (role === "hod") year = "NA";

    const payload = {
      userId: localStorage.getItem("userId") || "",
      department: (localStorage.getItem("department") || "").toUpperCase(),
      year,
      role,
      title,
      text: description,
      category,
      priority,
      identity,
      visibility
    };

    try {
      const response = await fetch(`${BASE_URL}/submitComplaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Complaint submitted successfully!");
        complaintForm.reset();
        window.location.href = "dashboard.html";
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || "Error submitting complaint.");
      }
    } catch (error) {
      console.error("Complaint error:", error);
      alert("Something went wrong. Please try again later.");
    }
  });
}

async function loadStudentComplaints() {
  console.log("Loading complaints…"); 
  try {
    const role = "Student";
    const userId = encodeURIComponent(localStorage.getItem("userId") || "");

    const url = `${BASE_URL}/getComplaints?role=${encodeURIComponent(role)}&userId=${userId}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to load complaints:", response.status);
      return;
    }

    // ✅ Your API already returns an array
    const complaints = await response.json();

    const container = document.querySelector("#student-complaints-container");
    if (!container) return;
    container.innerHTML = "";

    if (!Array.isArray(complaints) || complaints.length === 0) {
      container.innerHTML = "<p>No complaints found.</p>";
      return;
    }

    // Sort newest first
    complaints.sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0));

    // Render cards
    complaints.forEach(c => {
      const card = document.createElement("div");
      card.className = "complaint-card";
      const statusClass = (c.Status || "Pending") === "Resolved" ? "status-resolved" : "status-pending";
      const identityDisplay = c.Identity === "Anonymous" ? "Anonymous" : (c.UserID || "Unknown");
      card.innerHTML = `
        <h3>${c.Title || "Untitled Complaint"}</h3>
        <p><strong>Category:</strong> ${c.Category || "-"}</p>
        <p><strong>Priority:</strong> ${c.Priority || "-"}</p>
        <p><strong>Text:</strong> ${c.Text || "-"}</p>
        <p><strong>Identity:</strong> ${identityDisplay}</p>
        <p><strong>Visibility:</strong> ${c.Visibility || "-"}</p>
        <p><strong>Status:</strong> <span class="${statusClass}">${c.Status || "Pending"}</span></p>
        <p><strong>Created At:</strong> ${
          c.CreatedAtIST
            ? new Date(c.CreatedAtIST).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : (c.CreatedAt ? new Date(c.CreatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-")
        }</p>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading student complaints:", err);
  }
}


// ===== FACULTY DASHBOARD COMPLAINTS =====
async function loadFacultyComplaints() {
  try {
    const role = "Faculty";
    const dept = encodeURIComponent(localStorage.getItem("department") || "");
    const facultyYear = encodeURIComponent(localStorage.getItem("year") || "");

    const url = `${BASE_URL}/getComplaints?role=Faculty&department=${dept}&year=${facultyYear}&timeline=true`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to load faculty complaints:", response.status);
      return;
    }

    const complaints = await response.json();
    const tableBody = document.querySelector("#faculty-complaints-table tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const yearLabel = document.querySelector("#faculty-year-label");
    if (yearLabel) {
      yearLabel.textContent = `Faculty Dashboard - Year ${localStorage.getItem("year") || "-"}`;
    }

    complaints.sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0));

    complaints.forEach(c => {
      const row = document.createElement("tr");
      const statusClass = (c.Status || "Pending") === "Resolved" ? "status-resolved" : "status-pending";

      row.innerHTML = `
        <td>${c.ComplaintID || "-"}</td>
        <td>${c.Identity === "Anonymous" ? "Anonymous" : (c.UserID || "-")}</td>
        <td>${String(c.Year || "-")}</td>
        <td>${c.Category || "-"}</td>
        <td>${c.Priority || "-"}</td>
        <td>${c.Text || "-"}</td>
        <td><span class="${statusClass}">${c.Status || "Pending"}</span></td>
        <td>${c.CreatedAt ? new Date(c.CreatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}</td>
        <td>${(c.Status || "") !== "Resolved" ? `<button onclick="resolveComplaint('${c.ComplaintID}')">Resolve</button>` : ""}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading faculty complaints:", err);
  }
}

// ===== TIMELINE COMPLAINTS =====
async function loadTimelineComplaints() {
  try {
    const role = (localStorage.getItem("role") || "").toLowerCase();
    const dept = encodeURIComponent((localStorage.getItem("department") || "").toUpperCase());
    const year = encodeURIComponent(localStorage.getItem("year") || "");
    const userId = encodeURIComponent(localStorage.getItem("userId") || "");

    let url = "";

    if (role === "faculty") {
      // Faculty timeline → department + year, include private complaints
      url = `${BASE_URL}/getComplaints?role=Faculty&department=${dept}&year=${year}&timeline=true`;
    } else if (role === "hod") {
      // HOD timeline → all years in their department
      url = `${BASE_URL}/getComplaints?role=Hod&department=${dept}&timeline=true`;
    } else if (role === "student") {
      // Students don’t have timeline, fallback to their own complaints
      url = `${BASE_URL}/getComplaints?role=Student&userId=${userId}`;
    } else {
      // Admin/global timeline → all public complaints
      url = `${BASE_URL}/getComplaints?role=Timeline`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to load timeline complaints:", response.status);
      return;
    }

    const complaints = await response.json();
    const tableBody = document.querySelector("#timeline-table tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    complaints.sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0));

    complaints.forEach(c => {
      const row = document.createElement("tr");
      const statusClass = (c.Status || "Pending") === "Resolved" ? "status-resolved" : "status-pending";

      row.innerHTML = `
        <td>${c.ComplaintID || "-"}</td>
        <td>${c.Identity === "Anonymous" ? "Anonymous" : (c.UserID || "-")}</td>
        <td>${c.Department || "-"}</td>
        <td>${String(c.Year || "-")}</td>
        <td>${c.Category || "-"}</td>
        <td>${c.Priority || "-"}</td>
        <td>${c.Text || "-"}</td>
        <td><span class="${statusClass}">${c.Status || "Pending"}</span></td>
        <td>${c.CreatedAt ? new Date(c.CreatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading timeline complaints:", err);
  }
}

// ===== HOD COMPLAINTS =====
async function loadHodComplaints() {
  try {
    const deptRaw = localStorage.getItem("department") || "";
    const dept = encodeURIComponent(deptRaw.toUpperCase());

    const response = await fetch(`${BASE_URL}/getComplaints?role=HOD&department=${dept}&timeline=true`);

    if (!response.ok) {
      console.error("Failed to load HOD complaints:", response.status);
      return;
    }

    const complaints = await response.json();
    const tableBody = document.querySelector("#hod-complaints-table tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const deptLabel = document.querySelector("#hod-dept-label");
    if (deptLabel) {
      deptLabel.textContent = `HOD Dashboard - Department ${deptRaw.toUpperCase() || "-"}`;
    }

    complaints.sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0));

    complaints.forEach(c => {
      const row = document.createElement("tr");
      const statusClass = (c.Status || "Pending") === "Resolved" ? "status-resolved" : "status-pending";

      row.innerHTML = `
        <td>${c.ComplaintID || "-"}</td>
        <td>${c.Identity === "Anonymous" ? "Anonymous" : (c.UserID || "-")}</td>
        <td>${String(c.Year || "-")}</td>
        <td>${c.Category || "-"}</td>
        <td>${c.Priority || "-"}</td>
        <td>${c.Text || "-"}</td>
        <td><span class="${statusClass}">${c.Status || "Pending"}</span></td>
        <td>${c.CreatedAt ? new Date(c.CreatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}</td>
        <td>${(c.Status || "") !== "Resolved" ? `<button onclick="resolveComplaint('${c.ComplaintID}')">Resolve</button>` : ""}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading HOD complaints:", err);
  }
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
  setupToggle("password", "togglePassword");
  setupToggle("secretCode", "toggleSecretCode");
  setupLogin();
  setupSignup();
  setupComplaintForm();

  // Load dashboards only if their containers exist
  if (document.querySelector("#faculty-complaints-table")) loadFacultyComplaints();
  if (document.querySelector("#timeline-table")) loadTimelineComplaints();
  if (document.querySelector("#hod-complaints-table")) loadHodComplaints();
});
// ===== Resolve Complaint =====
async function resolveComplaint(complaintId) {
  try {
    const response = await fetch(`${BASE_URL}/updateComplaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId })
    });

    if (response.ok) {
      alert("Complaint resolved successfully!");
      if (typeof loadHodComplaints === "function") loadHodComplaints();
      if (typeof loadFacultyComplaints === "function") loadFacultyComplaints();
      if (typeof loadStudentComplaints === "function") loadStudentComplaints();
    } else {
      const data = await response.json().catch(() => ({}));
      alert(data.message || "Error resolving complaint.");
    }
  } catch (err) {
    console.error("Error resolving complaint:", err);
    alert("Something went wrong.");
  }
}

// ===== PUBLIC BOARD =====
async function loadPublicComplaints() {
  try {
    const dept = encodeURIComponent(localStorage.getItem("department") || "");
    const year = encodeURIComponent(localStorage.getItem("year") || "");
    const url = `${BASE_URL}/getComplaints?visibility=Public&department=${dept}&year=${year}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to load public complaints:", response.status);
      return;
    }

    let complaints = await response.json();
    const sortOption = document.getElementById("sortOption")?.value;

    if (sortOption === "likes") {
      complaints.sort((a, b) => (b.Reactions?.likes || 0) - (a.Reactions?.likes || 0));
    } else {
      complaints.sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0));
    }

    const container = document.getElementById("public-complaints-container");
    if (!container) return;
    container.innerHTML = "";

    complaints.forEach(c => {
      const card = document.createElement("div");
      card.className = "complaint-card";
      const likes = c.Reactions?.likes || 0;
      card.innerHTML = `
        <h3 class="complaint-title">${c.Title || "Untitled Complaint"}</h3>
        <p class="complaint-text">${c.Text || "-"}</p>
        <div class="complaint-meta">
          <span>📚 Dept: ${c.Department || "-"}</span>
          <span>🎓 Year: ${c.Year || "-"}</span>
          <span>🏷️ Category: ${c.Category || "-"}</span>
          <span>⚡ Priority: ${c.Priority || "-"}</span>
          <span>📅 ${c.CreatedAt ? new Date(c.CreatedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}) : "-"}</span>
        </div>
        <div class="reaction-bar">
          <button class="reaction-btn" data-complaint="${c.ComplaintID}" onclick="reactComplaint('${c.ComplaintID}')">👍 Support</button>
          <span class="reaction-count" id="rc-${c.ComplaintID}">${likes} students</span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading public complaints:", err);
  }
}

// ===== React to complaint =====
async function reactComplaint(complaintId) {
  try {
    const userId = localStorage.getItem("userId") || "";
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (!userId || role !== "student") {
      alert("Only students can react.");
      return;
    }

    const response = await fetch(`${BASE_URL}/reactComplaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId, userId })
    });

    if (response.ok) {
      await loadPublicComplaints();
      const badge = document.getElementById(`rc-${complaintId}`);
      if (badge) {
        badge.classList.add("pulse");
        setTimeout(() => badge.classList.remove("pulse"), 600);
      }
    } else {
      const data = await response.json().catch(() => ({}));
      alert(data.message || "Error reacting.");
    }
  } catch (err) {
    console.error("Reaction error:", err);
    alert("Something went wrong.");
  }
}
