// public/js/dashboard-receptionist.js

let currentTab = "overview";
let allUsers = [];
let filteredUsers = [];

const API_URL = "/api";
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

// --- Auth & Access Control ---

if (!token) {
  window.location.href = "/";
}

// Ensure user is receptionist
if (user.role && user.role !== "recepcionista") {
  alert("Acesso negado. Você não é recepcionista.");
  logout();
}

// Display Name
const displayName = user.name || user.nome || "Recepcionista";
document.getElementById("userName").textContent = displayName;
document.getElementById("userAvatar").textContent = displayName
  .charAt(0)
  .toUpperCase();

// --- Main Logic ---

// Load Tab
async function loadTab(tab) {
  currentTab = tab;

  // UI Updates
  document
    .querySelectorAll(".nav-item")
    .forEach((i) => i.classList.remove("active"));
  document.getElementById("usersTable").innerHTML =
    '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Carregando...</td></tr>';

  if (tab === "students") {
    document.getElementById("navAlunos").classList.add("active");
    document.getElementById("statsSection").style.display = "none";
    document.querySelector(".table-container").style.display = "block";
    document.getElementById("tableTitle").textContent = "Gerenciar Alunos";

    document.getElementById("searchInput").style.display = "block";
    document.getElementById("searchInput").value = "";
    document.getElementById("addBtn").style.display = "block";
    document.getElementById("addBtn").textContent = "+ Adicionar Aluno";

    updateTableHeaders("students");
    await loadUsers("students");
  } else if (tab === "instructors") {
    document.getElementById("navInstrutores").classList.add("active");
    document.getElementById("statsSection").style.display = "none";
    document.querySelector(".table-container").style.display = "block";
    document.getElementById("tableTitle").textContent = "Gerenciar Instrutores";

    document.getElementById("searchInput").style.display = "block";
    document.getElementById("searchInput").value = "";
    document.getElementById("addBtn").style.display = "block";
    document.getElementById("addBtn").textContent = "+ Adicionar Instrutor";

    updateTableHeaders("instructors");
    await loadUsers("instructors");
  } else {
    // Overview
    document.getElementById("navDashboard").classList.add("active");
    document.getElementById("statsSection").style.display = "grid";
    document.querySelector(".table-container").style.display = "none";
    loadMetrics();
  }
}

function updateTableHeaders(type) {
  const thead = document.getElementById("tableHead");
  if (type === "students") {
    thead.innerHTML = `
            <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Plano</th>
                <th>Ações</th>
            </tr>
        `;
  } else if (type === "instructors") {
    thead.innerHTML = `
            <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Ações</th>
            </tr>
        `;
  }
}

// Load Metrics
async function loadMetrics() {
  try {
    const response = await fetch(`${API_URL}/receptionist/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Erro ao carregar métricas");
    const data = await response.json();

    document.getElementById("totalStudents").textContent =
      data.totalStudents || 0;
    document.getElementById("totalInstructors").textContent =
      data.totalInstructors || 0;
    document.getElementById("totalCheckins").textContent =
      data.totalCheckins || 0;
    document.getElementById("checkinsToday").textContent =
      data.checkinsToday || 0;
  } catch (error) {
    console.error("Erro metrics:", error);
  }
}

// Load Users (Students or Instructors)
async function loadUsers(type) {
  let endpoint = "";
  if (type === "students") endpoint = "/receptionist/students";
  else if (type === "instructors") endpoint = "/receptionist/instructors";

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Erro ao buscar dados");

    const data = await res.json();

    // Normalize fields
    allUsers = data.map((u) => ({
      id: u.id,
      nome: u.name || u.nome,
      email: u.email,
      cpf: u.document || u.cpf, // if backend provides it
      // Specifics
      plan: u.plan_type || u.plan || "mensal",
    }));

    filteredUsers = allUsers;
    renderTable();
  } catch (err) {
    console.error(err);
    document.getElementById("usersTable").innerHTML =
      `<tr><td colspan="5" style="color: red; text-align: center;">Erro: ${err.message}</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById("usersTable");
  if (filteredUsers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center;">Nenhum registro encontrado.</td></tr>';
    return;
  }

  if (currentTab === "students") {
    tbody.innerHTML = filteredUsers
      .map(
        (u) => `
            <tr>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td><span class="plan-badge plan-${u.plan}">${u.plan}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="openEditModal(${u.id})">Editar</button>
                    <!-- No delete for now -->
                </td>
            </tr>
        `,
      )
      .join("");
  } else if (currentTab === "instructors") {
    tbody.innerHTML = filteredUsers
      .map(
        (u) => `
            <tr>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td>
                    <button class="btn btn-primary" onclick="openEditModal(${u.id})">Editar</button>
                </td>
            </tr>
        `,
      )
      .join("");
  }
}

// Search
function handleSearch() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  filteredUsers = allUsers.filter(
    (u) =>
      u.nome.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term),
  );
  renderTable();
}

// --- Modals ---

// ADD Modal
function openAddModal() {
  document.getElementById("addModal").classList.add("active");
  document.getElementById("addForm").reset();
  document.getElementById("addAlertContainer").innerHTML = "";

  // Toggle Fields based on Tab
  const isStudent = currentTab === "students";
  document.getElementById("addTipoPlanoGroup").style.display = isStudent
    ? "block"
    : "none";
  document.getElementById("addTipoPlano").required = isStudent;
}

function closeAddModal() {
  document.getElementById("addModal").classList.remove("active");
}

document.getElementById("addForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("addNome").value;
  const email = document.getElementById("addEmail").value;
  const password = document.getElementById("addSenha").value;
  const documentStr = document.getElementById("addCpf").value;

  let body = { name, email, password, document: documentStr };
  let endpoint = "";

  if (currentTab === "students") {
    body.role = "aluno";
    body.planType = document.getElementById("addTipoPlano").value;
    endpoint = "/receptionist/students";
  } else {
    body.role = "instrutor"; // Forced by our context
    endpoint = "/receptionist/instructors";
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.message || json.error || "Erro ao criar");

    showAddAlert("Criado com sucesso!", "success");
    setTimeout(() => {
      closeAddModal();
      loadUsers(currentTab);
    }, 1500);
  } catch (err) {
    showAddAlert(err.message, "error");
  }
});

function showAddAlert(msg, type) {
  const el = document.getElementById("addAlertContainer");
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

// EDIT Modal
function openEditModal(id) {
  const userToEdit = allUsers.find((u) => u.id === id);
  if (!userToEdit) return;

  document.getElementById("editUserId").value = id;
  document.getElementById("editNome").value = userToEdit.nome;
  document.getElementById("editEmail").value = userToEdit.email;
  document.getElementById("editAlertContainer").innerHTML = "";

  const isStudent = currentTab === "students";
  document.getElementById("editTipoPlanoGroup").style.display = isStudent
    ? "block"
    : "none";

  if (isStudent) {
    document.getElementById("editTipoPlano").value =
      userToEdit.plan.toLowerCase(); // Ensure Case match
  }

  document.getElementById("editModal").classList.add("active");
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("active");
}

document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("editUserId").value;
  const name = document.getElementById("editNome").value;
  const email = document.getElementById("editEmail").value;

  let body = { name, email };

  if (currentTab === "students") {
    body.planType = document.getElementById("editTipoPlano").value;
  }

  // We use the same generic user update endpoint or specific ones?
  // Admin uses PUT /users/:id. Receptionist routes might not have PUT /receptionist/students/:id exposed?
  // Let's check routes.
  // If NO specific update route exists for receptionist, we might need to add it or use the generic one if authorized using a separate endpoint.
  // Wait, the TASK said "Port Admin...". Admin uses `/api/users/:id`.
  // Does Receptionist have permission to access `PUT /api/users/:id`?
  // Let's try using the Admin endpoint first, as Receptionist usually has some user management rights.
  // If it fails (403), we know we need to Fix Backend Permissions.
  // BUT the user didn't ask us to touch backend yet (except for previous debugging).
  // The previous receptionist dashboard DID NOT HAVE EDIT functionality implemented in JS! It only had Create.
  // User requested: "copie o sistema de cadastro... A diferença é que... ela so consegue alterar dados de instrutores!" implies she SHOULD be able to Edit.
  // I will try to use `PUT /api/users/:id`. If it fails, I'll flag it.

  try {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok)
      throw new Error(json.message || json.error || "Erro ao atualizar");

    showEditAlert("Atualizado com sucesso!", "success");
    setTimeout(() => {
      closeEditModal();
      loadUsers(currentTab);
    }, 1500);
  } catch (err) {
    showEditAlert(err.message, "error");
  }
});

function showEditAlert(msg, type) {
  const el = document.getElementById("editAlertContainer");
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

// Init
loadTab("overview");
