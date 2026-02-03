// public/js/dashboard-receptionist.js

let currentTab = "students";
let allUsers = [];
let filteredUsers = [];
let paginator = null;

const { resolveAppPath } = window.AppConfig;

// --------------------
// Plans
// --------------------
let plansCache = []; // [{id, code, name, ...}]

async function fetchPlans() {
  const res = await fetch(`${API_URL}/plans`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Erro ao buscar planos");

  // garante array e somente ativos
  const list = Array.isArray(data) ? data : [];
  plansCache = list.filter((p) => p && p.active); // active pode ser true/1/"1"
  return plansCache;
}

function getPlanNameByCode(code) {
  const found = plansCache.find((p) => p.code === code);
  return found ? found.name : code; // fallback: mostra o code
}

function fillPlanSelect(selectId, selectedCode = "") {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  // fallback se plansCache não carregou
  const source =
    plansCache.length > 0
      ? plansCache
      : [
          { code: "fit", name: "Fit" },
          { code: "fit_pro", name: "Fit Pro" },
          { code: "fit_diamond", name: "Fit Diamond" },
        ];

  sel.innerHTML = `
    <option value="">Selecione...</option>
    ${source
      .map((p) => {
        const selected = p.code === selectedCode ? "selected" : "";
        return `<option value="${p.code}" ${selected}>${p.name}</option>`;
      })
      .join("")}
  `;
}

/**
 * transforma code em classe CSS segura
 * fit_pro -> fit-pro
 */
function toPlanClassFromCode(planCode) {
  if (!planCode) return "unknown";
  return planCode.toString().trim().toLowerCase().replace(/_/g, "-");
}

async function loadUserInfo() {
  const res = await apiFetch("/auth/me");
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
  if (pendingConfirmAction) pendingConfirmAction();
  closeConfirmModal();
}

// --- Main Logic ---

async function loadTab(tab) {
  try {
    const userData = await loadUserInfo();
    if (userData.error) {
      document.cookie = "";
<<<<<<< HEAD
      window.location.href = "/";
      return;
=======
      window.location.href = resolveAppPath("/");
>>>>>>> main
    }

    if (userData.role && userData.role !== "recepcionista") {
      alert("Acesso negado. Você não é recepcionista.");
      logout();
      return;
    }

    const displayName = userData.name || userData.nome || "Recepcionista";
    document.getElementById("userName").textContent = displayName;
    document.getElementById("userAvatar").textContent = displayName.charAt(0).toUpperCase();
  } catch (error) {
    console.error("Erro:", error);
<<<<<<< HEAD
    window.location.href = "/";
    return;
=======
    window.location.href = resolveAppPath("/");
>>>>>>> main
  }

  currentTab = tab;

  document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
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

    // carregar planos uma vez
    try {
      if (!plansCache.length) await fetchPlans();
    } catch (e) {
      console.error("Falha ao carregar planos:", e);
      // segue com fallback
    }

    // preencher selects
    fillPlanSelect("addTipoPlano");
    fillPlanSelect("editTipoPlano");

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

async function loadUsers(type) {
  let endpoint = "";
  if (type === "students") endpoint = "/receptionist/students";
  else if (type === "instructors") endpoint = "/receptionist/instructors";

  try {
<<<<<<< HEAD
    const res = await fetch(`${API_URL}${endpoint}`);
=======
    const res = await apiFetch(endpoint);

>>>>>>> main
    if (!res.ok) throw new Error("Erro ao buscar dados");

    const data = await res.json();

    allUsers = (data || []).map((u) => {
      const planCode = u.planType || u.plan_type || u.planCode || u.plan || "fit"; // sempre code
      return {
        id: u.id,
        nome: u.name || u.nome,
        email: u.email,
        cpf: u.document || u.cpf,
        phone: u.phone,
        planCode,
        planName: getPlanNameByCode(planCode),
      };
    });

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
      .map((u) => {
        const planClass = toPlanClassFromCode(u.planCode);
        return `
          <tr>
            <td>${u.nome}</td>
            <td>${u.email}</td>
            <td><span class="plan-badge plan-${planClass}">${u.planName}</span></td>
            <td>
              <button class="btn btn-primary" onclick="openEditModal(${u.id})">✏️ Editar</button>
            </td>
          </tr>
        `;
      })
      .join("");
  } else {
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
        `
      )
      .join("");
  }
}

function handleSearch() {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();

  filteredUsers = !term
    ? [...allUsers]
    : allUsers.filter(
        (u) => u.nome.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      );

  if (paginator) {
    paginator.updateItems(filteredUsers);
    paginator.render("paginationContainer");
  }
}

// --- Modals ---

function openAddModal() {
  document.getElementById("addModal").classList.add("active");
  document.getElementById("addForm").reset();
  document.getElementById("addAlertContainer").innerHTML = "";

  const isStudent = currentTab === "students";

  // só mostra plano se for aluno
  const addPlanGroup = document.getElementById("addTipoPlanoGroup");
  if (addPlanGroup) {
    if (isStudent) addPlanGroup.classList.remove("hidden");
    else addPlanGroup.classList.add("hidden");
  }

  const addPlanSelect = document.getElementById("addTipoPlano");
  if (addPlanSelect) {
    addPlanSelect.required = isStudent;
    if (isStudent) fillPlanSelect("addTipoPlano", "fit");
  }
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

    if (!body.planType) {
      showAddAlert("Selecione um plano.", "error");
      return;
    }

    endpoint = "/receptionist/students";
  } else {
    body.role = "instrutor";
    endpoint = "/receptionist/instructors";
  }

  try {
    const res = await apiFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  document.getElementById("addAlertContainer").innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

async function openEditModal(id) {
  const userToEdit = allUsers.find((u) => u.id === id);
  if (!userToEdit) return;

  document.getElementById("editUserId").value = id;
  document.getElementById("editNome").value = userToEdit.nome;
  document.getElementById("editEmail").value = userToEdit.email;
  document.getElementById("editCpf").value = userToEdit.cpf || "";
  document.getElementById("editTelefone").value = userToEdit.phone || "";
  document.getElementById("editAlertContainer").innerHTML = "";

  const isStudent = currentTab === "students";
  const editGroup = document.getElementById("editTipoPlanoGroup");

  if (editGroup) {
    if (isStudent) editGroup.classList.remove("hidden");
    else editGroup.classList.add("hidden");
  }

  if (isStudent) {
    try {
      if (!plansCache.length) await fetchPlans();
    } catch (e) {
      console.error("Falha ao carregar planos:", e);
    }
    // seleciona pelo CODE
    fillPlanSelect("editTipoPlano", userToEdit.planCode || "fit");
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

    if (!body.planType) {
      showEditAlert("Selecione um plano.", "error");
      return;
    }
  }

  try {
    const res = await apiFetch(`/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.message || json.error || "Erro ao atualizar");

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
<<<<<<< HEAD
    const res = await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
=======
    const res = await apiFetch(`/users/${id}`, {
      method: "DELETE",
    });
>>>>>>> main

    if (res.ok) {
      showEditAlert("Conta deletada com sucesso!", "success");
      setTimeout(async () => {
        closeEditModal();
        await loadUsers(currentTab);
      }, 1500);
    } else {
      const data = await res.json();
      showEditAlert(data.error || "Erro ao deletar", "error");
    }
  } catch (e) {
    showEditAlert("Erro de conexão", "error");
  }
}

function showEditAlert(msg, type) {
  document.getElementById("editAlertContainer").innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

async function logout() {
  await apiFetch("/auth/logout", { method: "DELETE" });
  window.location.href = resolveAppPath("/");
}

// telefone mask
function formatPhoneNumber(value) {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);

  if (value.length > 2) return `(${value.slice(0, 2)})${value.slice(2)}`;
  if (value.length > 0) return `(${value}`;
  return value;
}

["addTelefone", "editTelefone"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", (e) => {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
});

// Init
loadTab("students");
