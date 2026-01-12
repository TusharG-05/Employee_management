// js/admin.js

let currentEmployee = null;

async function adminLogin() {
  console.log("adminLogin function called");

  const emp_id = document.getElementById("emp_id").value;
  const password = document.getElementById("password").value;

  if (!emp_id || !password) {
    alert("Please enter emp_id and password");
    return;
  }

  console.log("Attempting login for:", emp_id);
  console.log("API_BASE:", API_BASE);

  try {
    const url = `${API_BASE}/employee/login`;
    console.log("Fetching URL:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emp_id, password })
    });

    console.log("Response status:", res.status);
    console.log("Response ok:", res.ok);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Invalid credentials" }));
      console.error("Login error:", errorData);
      throw new Error(errorData.detail || "Invalid credentials");
    }

    const data = await res.json();
    console.log("Login successful, token received");
    setToken(data.access_token);
    localStorage.setItem("emp_id", emp_id);
    location.href = "admin-dashboard.html";
  } catch (error) {
    console.error("Login exception:", error);
    alert("Login failed: " + error.message);
  }
}

async function loadEmployees(query = "") {
  let url = '/admin/employees?limit=100';
  if (query) url += `&name=${query}`;

  const res = await apiRequest(url);
  const data = await res.json();
  const container = document.getElementById("employees");
  container.innerHTML = "";

  if (data.list_of_employees.length === 0) {
    container.innerHTML = '<div class="text-center p-4 text-muted">No employees found</div>';
    return;
  }

  data.list_of_employees.forEach(emp => {
    const div = document.createElement("div");
    div.className = "d-flex justify-content-between align-items-center p-3 border-bottom border-secondary";
    div.style.cursor = "pointer";
    div.onclick = () => {
      localStorage.setItem("selected_emp", emp.emp_id);
      location.href = "employee-details.html";
    };

    div.innerHTML = `
      <div>
        <div class="text-white fw-bold">${emp.name}</div>
        <small class="text-muted">${emp.emp_id} &bull; ${emp.dept}</small>
      </div>
      <div>
        <span class="badge bg-primary">₹${emp.salary}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

let searchTimeout;
function searchEmployees() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = document.getElementById('employeeSearch').value;
    loadEmployees(query);
  }, 300);
}

async function createEmployee() {
  try {
    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;
    const dept = document.getElementById("dept").value;
    const salary = document.getElementById("salary").value;

    const res = await apiRequest('/admin/add-employee', {
      method: "POST",
      body: JSON.stringify({ name, age: Number(age), dept, salary: Number(salary) })
    });

    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    alert(`Employee Created!\n\nEmp ID: ${data.emp_id}\nPassword: ${data.password}`);
    location.href = "admin-dashboard.html";
  } catch (error) {
    alert("Failed to create employee.");
  }
}

async function loadLeaveRequests() {
  const container = document.getElementById('leave-requests-list');
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await apiRequest('/admin/leaves');
    const leaves = await res.json();

    if (leaves.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-4">No leave requests found</p>';
      return;
    }

    container.innerHTML = `
            <table class="table table-dark-custom align-middle">
                <thead>
                    <tr>
                        <th>Employee ID</th>
                        <th>Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody id="leave-table-body"></tbody>
            </table>
        `;

    const tbody = document.getElementById('leave-table-body');
    leaves.forEach(l => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${l.emp_id}</td>
                <td>${l.leave_date}</td>
                <td><small>${l.reason || 'N/A'}</small></td>
                <td><span class="badge ${getStatusBadgeClass(l.status)}">${l.status}</span></td>
                <td class="text-end">
                    ${l.status === 'PENDING' ? `
                        <button class="btn btn-sm btn-success me-1" onclick="updateLeave(${l.id}, 'ACCEPTED')"><i class="bi bi-check"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="updateLeave(${l.id}, 'REJECTED')"><i class="bi bi-x"></i></button>
                    ` : '<i class="bi bi-dash"></i>'}
                </td>
            `;
      tbody.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = '<p class="text-danger text-center">Failed to load leaves</p>';
  }
}

async function updateLeave(id, decision) {
  try {
    const res = await apiRequest(`/admin/leave/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ decision })
    });
    if (res.ok) {
      alert(`Leave ${decision.toLowerCase()} successfully`);
      loadLeaveRequests();
      loadNotifications();
    } else {
      const err = await res.json();
      alert(err.detail || "Update failed");
    }
  } catch (err) {
    alert("Server error");
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'present': return 'bg-success';
    case 'absent': return 'bg-danger';
    case 'leave': return 'bg-warning';
    case 'ACCEPTED': return 'bg-success';
    case 'REJECTED': return 'bg-danger';
    case 'PENDING': return 'bg-warning';
    default: return 'bg-secondary';
  }
}

async function showDepartmentsModal() {
  const res = await apiRequest('/admin/departments');
  const departments = await res.json();
  const deptList = document.getElementById('deptList');
  if (!deptList) return;
  deptList.innerHTML = '';
  departments.forEach(d => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${d.department}</td>
      <td class="text-center"><span class="badge bg-primary">${d.employee_count}</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment('${d.department}', ${d.employee_count})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    deptList.appendChild(row);
  });
}

async function deleteDepartment(name, count) {
  if (count > 0) {
    alert(`Cannot delete department '${name}' because it has ${count} employees assigned.`);
    return;
  }
  if (!confirm(`Are you sure you want to delete department '${name}'?`)) return;

  try {
    const res = await apiRequest(`/admin/departments/${name}`, { method: 'DELETE' });
    if (res.ok) {
      alert("Department deleted successfully");
      showDepartmentsModal();
    } else {
      const err = await res.json();
      alert(err.detail || "Delete failed");
    }
  } catch (err) {
    alert("Server error");
  }
}

async function loadAttendance() {
  const container = document.getElementById("attendance-list");
  if (!container) return;
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await apiRequest('/admin/attendance');
    const data = await res.json();
    container.innerHTML = "";

    if (data.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-4">No attendance records found</p>';
      return;
    }

    const table = document.createElement("table");
    table.className = "table table-dark-custom align-middle";
    table.innerHTML = `
            <thead>
                <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
    const tbody = table.querySelector("tbody");
    data.forEach(att => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${att.emp_id}</td>
                <td>${att.name}</td>
                <td><span class="badge ${getStatusBadgeClass(att.status)}">${att.status}</span></td>
            `;
      tbody.appendChild(row);
    });
    container.appendChild(table);
  } catch (err) {
    container.innerHTML = '<p class="text-danger text-center">Failed to load attendance</p>';
  }
}

function logout() {
  clearToken();
  location.href = "index.html";
}

async function loadEmployeeDetails() {
  const empId = localStorage.getItem("selected_emp");
  if (!empId) {
    location.href = "admin-dashboard.html";
    return;
  }

  try {
    const res = await apiRequest(`/admin/employee/${empId}`);
    if (!res.ok) throw new Error("Employee not found");
    const emp = await res.json();
    currentEmployee = emp;

    document.getElementById("details").innerHTML = `
      <div class="row g-3">
        <div class="col-6"><p class="text-muted mb-1">Name</p><p class="text-white fw-bold">${emp.name}</p></div>
        <div class="col-6"><p class="text-muted mb-1">ID</p><p class="text-white fw-bold">${emp.emp_id}</p></div>
        <div class="col-6"><p class="text-muted mb-1">Dept</p><p class="text-white fw-bold">${emp.dept}</p></div>
        <div class="col-6"><p class="text-muted mb-1">Age</p><p class="text-white fw-bold">${emp.age}</p></div>
        <div class="col-12"><p class="text-muted mb-1">Salary</p><p class="text-success fw-bold fs-4">₹${emp.salary}</p></div>
      </div>
    `;
  } catch (err) {
    alert("Error loading details");
    location.href = "admin-dashboard.html";
  }
}

function showEditForm() {
  if (!currentEmployee) return;
  document.getElementById("editSection").style.display = "block";
  document.getElementById("editName").value = currentEmployee.name;
  document.getElementById("editAge").value = currentEmployee.age;
  document.getElementById("editDept").value = currentEmployee.dept;
  document.getElementById("editSalary").value = currentEmployee.salary;
  window.scrollTo(0, document.body.scrollHeight);
}

async function updateEmployee() {
  const name = document.getElementById("editName").value;
  const age = document.getElementById("editAge").value;
  const dept = document.getElementById("editDept").value;
  const salary = document.getElementById("editSalary").value;

  try {
    const res = await apiRequest(`/admin/employee/${currentEmployee.emp_id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, age: Number(age), dept: dept.toUpperCase(), salary: Number(salary) })
    });

    if (res.ok) {
      alert("Updated successfully");
      loadEmployeeDetails();
      document.getElementById("editSection").style.display = "none";
    } else {
      alert("Failed to update");
    }
  } catch (err) {
    alert("Server error");
  }
}

async function deleteEmployee() {
  if (!confirm("Are you sure you want to delete this employee?")) return;

  try {
    const res = await apiRequest(`/admin/delete/${currentEmployee.emp_id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Deleted successfully");
      location.href = "admin-dashboard.html";
    } else {
      alert("Failed to delete");
    }
  } catch (err) {
    alert("Server error");
  }
}

// Make functions global for WebSocket updates
window.loadLeaveRequests = loadLeaveRequests;
