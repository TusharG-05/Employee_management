let currentEmployee = null;

function adminLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (
    email === ADMIN_CREDENTIALS.email &&
    password === ADMIN_CREDENTIALS.password
  ) {
    location.href = "admin-dashboard.html";
  } else {
    alert("Invalid admin credentials");
  }
}

async function loadEmployees() {
  const res = await fetch(`${API_BASE}/admin/employees`);
  const data = await res.json();

  const container = document.getElementById("employees");
  container.innerHTML = "";

  data.forEach(emp => {
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
        <small class="text-muted">${emp.emp_id} • ${emp.dept}</small>
      </div>
      <div>
        <span class="badge bg-primary">$${emp.salary}</span>
      </div>
    `;
    
    container.appendChild(div);
  });
}

function addEmployee() {
  alert("Next step: Add Employee form");
}

async function createEmployee() {
  try {
    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;
    const dept = document.getElementById("dept").value;
    const salary = document.getElementById("salary").value;

    if (!name || !age || !dept || !salary) {
      alert("All fields are required");
      return;
    }

    const res = await fetch(`${API_BASE}/admin/add-employee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        age: Number(age),
        dept,
        salary: Number(salary)
      })
    });

    if (!res.ok) {
      throw new Error("Backend error");
    }

    const data = await res.json();

    alert(
      `Employee Created!\n\nEmp ID: ${data.emp_id}\nPassword: ${data.password}`
    );

    location.href = "admin-dashboard.html";

  } catch (error) {
    alert(
      "❌ Backend is not running.\n\nPlease start the backend server first."
    );
  }
}


async function loadEmployeeDetails() {
  const emp_id = localStorage.getItem("selected_emp");

  if (!emp_id) {
    location.href = "admin-dashboard.html";
    return;
  }

  const res = await fetch(`${API_BASE}/admin/employee/${emp_id}`);
  const emp = await res.json();

  // ✅ STORE EMPLOYEE
  currentEmployee = emp;

  document.getElementById("details").innerHTML = `
    <p><b>Emp ID:</b> ${emp.emp_id}</p>
    <p><b>Name:</b> <span id="name">${emp.name}</span></p>
    <p><b>Age:</b> <span id="age">${emp.age}</span></p>
    <p><b>Department:</b> <span id="dept">${emp.dept}</span></p>
    <p><b>Salary:</b> <span id="salary">${emp.salary}</span></p>
    <p><b>Password:</b> ${emp.password}</p>
  `;
}


function enableEdit() {
  // Prefill with currentEmployee details to avoid wiping data accidentally
  if (!currentEmployee) {
    alert("No employee loaded to edit.");
    return;
  }

  document.getElementById("details").innerHTML = `
    <input id="name" placeholder="Name" value="${currentEmployee.name}">
    <input id="age" type="number" placeholder="Age" value="${currentEmployee.age}">
    <select id="dept">
      <option value="">Select Department</option>
    </select>
    <input id="salary" type="number" placeholder="Salary" value="${currentEmployee.salary}">

    <button onclick="saveEmployee()">Save</button>
  `;

  // populate department dropdown and pre-select current value
  loadDepartmentOptionsInto("dept", currentEmployee.dept);
}

async function saveEmployee() {
  const emp_id = localStorage.getItem("selected_emp");

  if (!emp_id) {
    alert("No employee selected to save.");
    return;
  }

  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;
  const dept = document.getElementById("dept").value;
  const salary = document.getElementById("salary").value;

  await fetch(`${API_BASE}/admin/employee/${emp_id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      age: Number(age),
      dept,
      salary: Number(salary)
    })
  });

  alert("Employee updated");
  location.reload();
}

async function deleteEmployee() {
  const emp_id = localStorage.getItem("selected_emp");

  if (!emp_id) {
    alert("No employee selected to delete.");
    return;
  }

  if (!confirm("Delete this employee permanently?")) return;

  await fetch(`${API_BASE}/admin/delete/${emp_id}`, {
    method: "DELETE"
  });

  alert("Employee deleted");
  localStorage.removeItem("selected_emp");
  location.href = "admin-dashboard.html";
}

async function loadAttendance() {
  const res = await fetch(`${API_BASE}/admin/attendance`);
  const data = await res.json();

  const container = document.getElementById("attendance-list");
  container.innerHTML = "";

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "employee-card";
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <div class="emp-id">${item.emp_id}</div>

      <select onchange="updateAttendance('${item.emp_id}', this.value)">
        <option ${item.status === "Present" ? "selected" : ""}>Present</option>
        <option ${item.status === "Absent" ? "selected" : ""}>Absent</option>
        <option ${item.status === "Leave" ? "selected" : ""}>Leave</option>
      </select>
    `;

    container.appendChild(div);
  });
}

async function updateAttendance(emp_id, status) {
  const res = await fetch(`${API_BASE}/admin/attendance/${emp_id}`, {
    method: "PUT", // ✅ MUST BE PUT
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: status // ✅ MUST MATCH BACKEND SCHEMA
    })
  });

  if (!res.ok) {
    console.error("Attendance update failed");
    alert("Failed to update attendance");
  }
}

function showEditForm() {
  document.getElementById("editSection").style.display = "block";
  document.getElementById("editName").value = currentEmployee.name;
  document.getElementById("editAge").value = currentEmployee.age;
  const editDeptEl = document.getElementById("editDept");
  if (editDeptEl && editDeptEl.tagName === "INPUT") {
    // replace input with select for departments
    const select = document.createElement("select");
    select.id = "editDept";
    select.className = editDeptEl.className;
    editDeptEl.replaceWith(select);
    loadDepartmentOptionsInto("editDept", currentEmployee.dept);
  } else {
    loadDepartmentOptionsInto("editDept", currentEmployee.dept);
  }
  document.getElementById("editSalary").value = currentEmployee.salary;
}

async function updateEmployee() {
  await fetch(`${API_BASE}/admin/employee/${currentEmployee.emp_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("editName").value,
      age: Number(document.getElementById("editAge").value),
      dept: document.getElementById("editDept").value,
      salary: Number(document.getElementById("editSalary").value)
    })
  });

  alert("Employee updated successfully");
  loadEmployeeDetails();
  document.getElementById("editSection").style.display = "none";
}

// ===== NEW DEPARTMENT FUNCTIONS =====
async function showDepartmentsModal() {
  const res = await fetch(`${API_BASE}/admin/departments`);
  const departments = await res.json();

  const deptList = document.getElementById('deptList');
  deptList.innerHTML = '';

  departments.forEach(d => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${d.department}</td>
      <td class="text-center"><span class="badge bg-primary">${d.employee_count}</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editDept('${d.department}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment('${d.department}', ${d.employee_count})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    deptList.appendChild(row);
  });
}

function editDept(deptName) {
  const newName = prompt(`Edit department name:`, deptName);
  if (newName && newName !== deptName) {
    updateAllEmployeesDept(deptName, newName);
  }
}

async function updateAllEmployeesDept(oldDept, newDept) {
  const res = await fetch(`${API_BASE}/admin/employees`);
  const employees = await res.json();
  const oldKey = (oldDept || "").trim().toUpperCase();
  const toUpdate = employees.filter(e => (e.dept || "").trim().toUpperCase() === oldKey);
  
  for (const emp of toUpdate) {
    await fetch(`${API_BASE}/admin/employee/${emp.emp_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dept: newDept })
    });
  }
  
  alert(`Updated ${toUpdate.length} employees to "${newDept}"`);
  loadEmployees();
  // refresh departments modal list so the renamed department and counts are updated
  showDepartmentsModal();
}

async function addDepartment() {
  const name = prompt("Enter new department name:");
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) {
    alert("Department name cannot be empty.");
    return;
  }
  const res = await fetch(`${API_BASE}/admin/departments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: trimmed })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err.detail || "Failed to add department");
    return;
  }
  alert("Department added successfully");
  showDepartmentsModal();
}

async function deleteDepartment(deptName, employeeCount) {
  if (employeeCount > 0) {
    alert(`Cannot delete department "${deptName}" because ${employeeCount} employee(s) are assigned to it.`);
    return;
  }
  if (!confirm(`Delete department "${deptName}"? This cannot be undone.`)) return;
  const res = await fetch(`${API_BASE}/admin/departments/${encodeURIComponent(deptName)}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err.detail || "Failed to delete department");
    return;
  }
  alert("Department deleted successfully");
  showDepartmentsModal();
}

async function loadDepartmentOptionsInto(selectId, selectedDept) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const res = await fetch(`${API_BASE}/admin/departments`);
  const departments = await res.json();
  const current = (selectedDept || "").toUpperCase();
  select.innerHTML = `<option value="">Select Department</option>`;
  departments.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.department;
    opt.textContent = d.department;
    if (d.department.toUpperCase() === current) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

async function loadDepartmentOptions() {
  // used on Add Employee page (simple case, no pre-selected value)
  await loadDepartmentOptionsInto("dept", null);
}
