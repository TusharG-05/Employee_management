async function employeeLogin() {
  const emp_id = document.getElementById("emp_id").value;
  const password = document.getElementById("password").value;

  if (!emp_id || !password) {
    alert("Please enter emp_id and password");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/employee/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emp_id, password })
    });

    const data = await res.json();
    setToken(data.access_token);
    localStorage.setItem("emp_id", emp_id);
    location.href = "employee-dashboard.html";
  } catch (err) {
    alert("Invalid employee credentials");
  }
}

async function loadEmployeeDashboard() {
  const emp_id = localStorage.getItem("emp_id");
  if (!emp_id) {
    location.href = "employee-login.html";
    return;
  }

  // Profile
  const profileRes = await apiRequest(`/employee/profile/${emp_id}`);
  if (!profileRes.ok) {
    alert("Failed to load profile. Please log in again.");
    logout();
    return;
  }
  const profile = await profileRes.json();

  document.getElementById("profile").innerHTML = `
    <h5>${profile.name}</h5>
    <p>ID: ${profile.emp_id}</p>
    <p>Dept: ${profile.dept}</p>
    <p>Salary: ${profile.salary}</p>
  `;

  // Attendance
  const attRes = await apiRequest(`/employee/attendance/${emp_id}`);
  let attendanceText = "No record";
  if (attRes.ok) {
    const attendance = await attRes.json();
    if (attendance && attendance.status) {
      attendanceText = attendance.status;
    }
  }

  document.getElementById("attendance").innerHTML = `
    <h5>Attendance</h5>
    <p>Status: <b>${attendanceText}</b></p>
  `;
}

function logout() {
  localStorage.removeItem("emp_id");
  clearToken();
  location.href = "index.html";
}