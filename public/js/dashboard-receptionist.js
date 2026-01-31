// public/js/dashboard-receptionist.js

let currentTab = "students";
let allUsers = [];
let filteredUsers = [];
let paginator = null;

const API_URL = "/api";

async function loadUserInfo() {
  const res = await fetch(`${API_URL}/auth/me`);
  const data = await res.json();
  return data;
}

// --- Modal Logic ---
let pendingConfirmAction = null;

function showConfirmModal(message, action) {
  document.getElementById("confirmMessage").textContent = message;
  pendingConfirmAction = action;
  document.getElementById("confirmModal").classList.add("active");
}

function closeConfirmModal() {
  document.getElementById("confirmModal").classList.remove("active");
  pendingConfirmAction = null;
}

function confirmAction() {
  if (pendingConfirmAction) {
    pendingConfirmAction();
  }
  closeConfirmModal();
}

// --- Main Logic ---

// Load Tab
async function loadTab(tab) {
  try {
    const userData = await loadUserInfo();
    if (userData.error) {
      document.cookie = "";
      window.location.href = "/";
    }

    // Ensure user is receptionist
    if (userData.role && userData.role !== "recepcionista") {
      alert("Acesso negado. Você não é recepcionista.");
      logout();
    }

    // Display Name
    const displayName = userData.name || userData.nome || "Recepcionista";
    document.getElementById("userName").textContent = displayName;
    document.getElementById("userAvatar").textContent = displayName
      .charAt(0)
      .toUpperCase();
  } catch (error) {
    console.error("Erro:", error);
    window.location.href = "/";
  }

  currentTab = tab;

  // UI Updates
  document
    .querySelectorAll(".nav-item")
    .forEach((i) => i.classList.remove("active"));
  document.getElementById("usersTable").innerHTML =
    '<tr><td colspan="5" class="text-center-padded">Carregando...</td></tr>';

  if (tab === "students") {
    document.getElementById("navAlunos").classList.add("active");
    document.querySelector(".table-container").style.display = "block";
    document.getElementById("tableTitle").textContent = "Gerenciar Alunos";

    document.getElementById("searchInput").classList.remove("hidden");
    document.getElementById("searchInput").value = "";
    document.getElementById("addBtn").classList.remove("hidden");
    document.getElementById("addBtn").textContent = "+ Adicionar Aluno";

    updateTableHeaders("students");
    await loadUsers("students");
  } else if (tab === "instructors") {
    document.getElementById("navInstrutores").classList.add("active");
    document.querySelector(".table-container").style.display = "block";
    document.getElementById("tableTitle").textContent = "Gerenciar Instrutores";

    document.getElementById("searchInput").classList.remove("hidden");
    document.getElementById("searchInput").value = "";
    document.getElementById("addBtn").classList.remove("hidden");
    document.getElementById("addBtn").textContent = "+ Adicionar Instrutor";

    updateTableHeaders("instructors");
    await loadUsers("instructors");
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

// MODIFICADO: Load Users com Paginação
async function loadUsers(type) {
  let endpoint = "";
  if (type === "students") endpoint = "/receptionist/students";
  else if (type === "instructors") endpoint = "/receptionist/instructors";

  try {
    const res = await fetch(`${API_URL}${endpoint}`);

    if (!res.ok) throw new Error("Erro ao buscar dados");

    const data = await res.json();

    // Normalize fields
    allUsers = data.map((u) => ({
      id: u.id,
      nome: u.name || u.nome,
      email: u.email,
      cpf: u.document || u.cpf,
      phone: u.phone,
      plan: u.plan_type || u.plan || "mensal",
    }));

    filteredUsers = [...allUsers];

    if (!paginator) {
      paginator = new Paginator(filteredUsers, 10, renderTablePage);
    } else {
      paginator.updateItems(filteredUsers);
    }

    paginator.goToPage(1);
    paginator.render("paginationContainer");
  } catch (err) {
    console.error(err);
    document.getElementById("usersTable").innerHTML =
      `<tr><td colspan="5" class="text-error-center">Erro: ${err.message}</td></tr>`;
  }
}

function renderTablePage(pageItems) {
  const tbody = document.getElementById("usersTable");

  if (pageItems.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center-padded-gray">Nenhum registro encontrado.</td></tr>';
    return;
  }

  if (currentTab === "students") {
    tbody.innerHTML = pageItems
      .map(
        (u) => `
            <tr>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td><span class="plan-badge plan-${u.plan}">${u.plan}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="openEditModal(${u.id})">✏️ Editar</button>
                </td>
            </tr>
        `,
      )
      .join("");
  } else if (currentTab === "instructors") {
    tbody.innerHTML = pageItems
      .map(
        (u) => `
            <tr>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td>
                    <button class="btn btn-primary" onclick="openEditModal(${u.id})">✏️ Editar</button>
                </td>
            </tr>
        `,
      )
      .join("");
  }
}

function handleSearch() {
  const term = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();

  if (!term) {
    filteredUsers = [...allUsers];
  } else {
    filteredUsers = allUsers.filter(
      (u) =>
        u.nome.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term),
    );
  }

  if (paginator) {
    paginator.updateItems(filteredUsers);
    paginator.render("paginationContainer");
  }
}

// --- Modals ---

// ADD Modal
function openAddModal() {
  document.getElementById("addModal").classList.add("active");
  document.getElementById("addForm").reset();
  document.getElementById("addAlertContainer").innerHTML = "";

  // Toggle Fields based on Tab
  const isStudent = currentTab === "students";
  if (isStudent) {
    document.getElementById("addTipoPlanoGroup").classList.remove("hidden");
  } else {
    document.getElementById("addTipoPlanoGroup").classList.add("hidden");
  }
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
  const phone = document.getElementById("addTelefone").value;

  let body = { name, email, password, document: documentStr, phone };
  let endpoint = "";

  if (currentTab === "students") {
    body.role = "aluno";
    body.planType = document.getElementById("addTipoPlano").value;
    endpoint = "/receptionist/students";
  } else {
    body.role = "instrutor";
    endpoint = "/receptionist/instructors";
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
  document.getElementById("editCpf").value = userToEdit.cpf || "";
  document.getElementById("editTelefone").value = userToEdit.phone || "";
  document.getElementById("editAlertContainer").innerHTML = "";

  const isStudent = currentTab === "students";
  if (isStudent) {
    document.getElementById("editTipoPlanoGroup").classList.remove("hidden");
  } else {
    document.getElementById("editTipoPlanoGroup").classList.add("hidden");
  }

  if (isStudent) {
    document.getElementById("editTipoPlano").value =
      userToEdit.plan.toLowerCase();
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
  const phone = document.getElementById("editTelefone").value;
  const documentStr = document.getElementById("editCpf").value;

  let body = { name, email, phone, document: documentStr };

  if (currentTab === "students") {
    body.planType = document.getElementById("editTipoPlano").value;
  }

  try {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
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

function confirmDeleteUser() {
  const userId = document.getElementById("editUserId").value;
  showConfirmModal("Tem certeza que deseja deletar esta conta?", async () => {
    await deleteUser(userId);
  });
}

async function deleteUser(id) {
  try {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      showEditAlert("Conta deletada com sucesso!", "success");
      setTimeout(async () => {
        closeEditModal();
        await loadUsers(currentTab);
      }, 1500);
    } else {
      const data = await res.json();
      showEditAlert(data.error || "Erro ao deletar");
    }
  } catch (e) {
    showEditAlert("Erro de conexão");
  }
}

function showEditAlert(msg, type) {
  const el = document.getElementById("editAlertContainer");
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

async function logout() {
  await fetch(`${API_URL}/auth/logout`, { method: "DELETE" });
  window.location.href = "/";
}

// Função para formatar telefone
function formatPhoneNumber(value) {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);

  if (value.length > 2) {
    return `(${value.slice(0, 2)})${value.slice(2)}`;
  } else if (value.length > 0) {
    return `(${value}`;
  }
  return value;
}

// Aplicar máscara nos campos de telefone
const phoneInputs = ["addTelefone", "editTelefone"];
phoneInputs.forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", (e) => {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
});

// Init
loadTab("students");
