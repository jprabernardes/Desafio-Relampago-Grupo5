// public/js/dashboard-admin.js

let paginator = null;
let currentTab = "alunos";
let allUsers = [];
let filteredUsers = [];
let cachedPlans = []; // [{code, name, ...}]


const { resolveAppPath } = window.AppConfig;


async function fetchPlans() {
  const res = await fetch(`${API_URL}/plans`); // vai chamar /api/plans
  if (!res.ok) throw new Error("Erro ao buscar planos");
  return await res.json();
}

function populatePlanSelects(plans) {
  cachedPlans = Array.isArray(plans) ? plans : [];

  const addSelect = document.getElementById("addTipoPlano");
  const editSelect = document.getElementById("editTipoPlano");

  const optionsHtml = [
    `<option value="">Selecione...</option>`,
    ...cachedPlans.map((p) => `<option value="${p.code}">${p.name}</option>`),
  ].join("");

  if (addSelect) addSelect.innerHTML = optionsHtml;
  if (editSelect) editSelect.innerHTML = optionsHtml;
}

async function ensurePlansLoaded() {
  if (cachedPlans.length > 0) return;
  const plans = await fetchPlans();
  populatePlanSelects(plans);
}

function getPlanName(code) {
  const found = cachedPlans.find((p) => p.code === code);
  return found ? found.name : (code || "—");
}


// Lógica do Modal de Confirmação
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

async function loadUserInfo() {
  const res = await apiFetch("/auth/me");
  const data = await res.json();
  return data;
}

async function loadData() {
  try {
    const userData = await loadUserInfo();
    if (userData.error) {
      document.cookie = "";
      window.location.href = resolveAppPath("/");
    }

    // Ensure user is administrator
    if (userData.role && userData.role !== "administrador") {
      alert("Acesso negado. Você não é administrador.");
      logout();
    }

    // Adaptador: backend usa 'name', frontend usa 'nome'
    document.getElementById("userName").textContent =
      userData.name || userData.nome || "Admin";
    document.getElementById("userAvatar").textContent = (
      userData.name ||
      userData.nome ||
      "A"
    )
      .charAt(0)
      .toUpperCase();

    const [usersRes, metricsRes] = await Promise.all([
      apiFetch("/users"),
      apiFetch("/users/dashboard"),
    ]);

    const rawUsers = await usersRes.json();
    const metrics = await metricsRes.json();

    // Mapear campos do backend para frontend
    allUsers = rawUsers.map((u) => ({
      id: u.id,
      nome: u.name,
      email: u.email,
      cpf: u.document,
      role: u.role,
      tipo_plano: u.planType || u.plan_type || "mensal",
      phone: u.phone,
    }));

    filteredUsers = [...allUsers];

    if (!paginator) {
      paginator = new Paginator(filteredUsers, 10, renderTablePage);
    } else {
      paginator.updateItems(filteredUsers);
    }

    paginator.goToPage(1);
    paginator.render("paginationContainer");
  } catch (error) {
    console.error("Erro:", error);
  }
}

function renderTablePage(pageItems) {
  const tbody = document.getElementById("usersTable");

  if (pageItems.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center-padded-gray">Nenhum registro encontrado.</td></tr>';
    return;
  }

  if (currentTab === "alunos") {
    // Mostrar: Nome, Email, Tipo de Plano, Ações
    tbody.innerHTML = pageItems
      .map(
        (u) => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td>
  <span class="plan-badge plan-${u.tipo_plano || "unknown"}">
    ${getPlanName(u.tipo_plano)}
  </span>
</td>

        <td>
           <button class="btn btn-primary" onclick="openEditModal(${u.id})">✏️ Editar</button>
        </td>
      </tr>
    `,
      )
      .join("");
  } else if (currentTab === "funcionarios") {
    // Mostrar: Nome, Email, Função, Ações
    tbody.innerHTML = pageItems
      .map(
        (u) => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td><span class="role-badge role-${u.role}">${u.role === "instrutor" ? "Instrutor" : "Recepcionista"}</span></td>
        <td>
           <button class="btn btn-primary" onclick="openEditModal(${u.id})">✏️ Editar</button>
        </td>
      </tr>
    `,
      )
      .join("");
  } else {
    // Dashboard padrão
    tbody.innerHTML = pageItems
      .map(
        (u) => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td>${u.cpf}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>
          <button class="btn btn-primary" onclick="openEditModal(${u.id})">✏️ Editar</button>
        </td>
      </tr>
    `,
      )
      .join("");
  }
}

// Atualizar cabeçalhos da tabela
function updateTableHeaders(tipo) {
  const tableHead = document.getElementById("tableHead");
  if (tipo === "alunos") {
    tableHead.innerHTML = `
      <tr>
        <th>Nome</th>
        <th>Email</th>
        <th>Tipo de Plano</th>
        <th>Ações</th>
      </tr>
    `;
  } else {
    // funcionarios
    tableHead.innerHTML = `
      <tr>
        <th>Nome</th>
        <th>Email</th>
        <th>Função</th>
        <th>Ações</th>
      </tr>
    `;
  }
}

async function loadTab(tipo = "alunos") {
  currentTab = tipo;

  let userData = null;
  try {
    // Carregar informações do usuário logado
    userData = await loadUserInfo();
    if (userData.error) {
      document.cookie = "";
      window.location.href = resolveAppPath("/");
      return;
    }

    // Ensure user is administrator
    if (userData.role && userData.role !== "administrador") {
      alert("Acesso negado. Você não é administrador.");
      logout();
      return;
    }

    // Exibir nome e avatar do usuário
    const displayName = userData.name || userData.nome || "Admin";
    document.getElementById("userName").textContent = displayName;
    document.getElementById("userAvatar").textContent = displayName
      .charAt(0)
      .toUpperCase();
  } catch (error) {
    console.error("Erro ao carregar informações do usuário:", error);
    window.location.href = resolveAppPath("/");
    return;
  }

  // Atualizar navegação ativa
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (tipo === "alunos") {
    document.getElementById("navAlunos").classList.add("active");
  } else if (tipo === "funcionarios") {
    document.getElementById("navFuncionarios").classList.add("active");
  } else if (tipo === "classes") {
    document.getElementById("navAulas").classList.add("active");
  }

  // Toggle Views
  const classesView = document.getElementById("classesView");
  const tableContainer = document.querySelector(".table-container");

  if (tipo === "classes") {
    if (classesView) classesView.classList.remove("hidden");
    if (tableContainer) tableContainer.style.display = "none";

    // Init Calendar
    console.log("Admin Dashboard: Switching to Classes Tab. Checking CalendarModule:", !!window.CalendarModule);
    if (window.CalendarModule) {
      console.log("Admin Dashboard: Initializing CalendarModule with", userData.id, userData.role);
      window.CalendarModule.init(userData.id, userData.role);
      window.CalendarModule.loadCalendar();
    } else {
      console.error("Admin Dashboard: window.CalendarModule is missing!");
    }
    return; // Stop here, don't load user table
  } else {
    if (classesView) classesView.classList.add("hidden");
    if (tableContainer) tableContainer.style.display = "block";
  }

  let roles = null;
  let title = "Usuários do Sistema";

  switch (tipo) {
    case "alunos":
      roles = ["aluno"];
      title = "Alunos";
      updateTableHeaders("alunos");
      break;

    case "funcionarios":
      roles = ["instrutor", "recepcionista"];
      title = "Funcionários";
      updateTableHeaders("funcionarios");
      break;

    default:
      roles = ["aluno"]; // Default para alunos
      title = "Alunos";
      updateTableHeaders("alunos");
      break;
  }

  document.getElementById("tableTitle").textContent = title;
  document.getElementById("searchInput").value = "";

  // Mostrar loading
  document.getElementById("usersTable").innerHTML =
    '<tr><td colspan="5" class="text-center-padded">Carregando...</td></tr>';

  try {
    const res = await apiFetch("/users");

    if (!res.ok) {
      throw new Error("Erro ao buscar usuários");
    }

    const rawUsers = await res.json();

    // Mapear campos do backend para frontend
    allUsers = rawUsers.map((u) => ({
      id: u.id,
      nome: u.name,
      email: u.email,
      cpf: u.document,
      role: u.role,
      tipo_plano: u.planType || u.plan_type || "fit",

      phone: u.phone,
    }));

    filteredUsers = roles
      ? allUsers.filter((u) => roles.includes(u.role))
      : allUsers;

    if (!paginator) {
      paginator = new Paginator(filteredUsers, 10, renderTablePage);
    } else {
      paginator.updateItems(filteredUsers);
    }

    paginator.goToPage(1);
    paginator.render("paginationContainer");
  } catch (error) {
    console.error(error);
    document.getElementById("usersTable").innerHTML =
      `<tr><td colspan="5" class="text-error-center">Erro: ${error.message}</td></tr>`;
  }
}

// MODIFICADO: Pesquisa com Paginação
function handleSearch() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  let baseUsers;
  if (currentTab === "alunos") {
    baseUsers = allUsers.filter((u) => u.role === "aluno");
  } else if (currentTab === "funcionarios") {
    baseUsers = allUsers.filter(
      (u) => u.role === "instrutor" || u.role === "recepcionista",
    );
  } else {
    baseUsers = allUsers;
  }

  if (searchTerm) {
    filteredUsers = baseUsers.filter(
      (u) =>
        u.nome.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm),
    );
  } else {
    filteredUsers = baseUsers;
  }

  if (paginator) {
    paginator.updateItems(filteredUsers);
    paginator.render("paginationContainer");
  }
}

// Modal Adicionar
async function openAddModal() {
  await ensurePlansLoaded();

  document.getElementById("addModal").classList.add("active");
  document.getElementById("addForm").reset();
  document.getElementById("addAlertContainer").innerHTML = "";

  if (currentTab === "alunos") {
    document.getElementById("addModalTitle").textContent = "Adicionar Aluno";
    document.getElementById("addCpfGroup").classList.remove("hidden");
    document.getElementById("addCpf").required = true;
    document.getElementById("addRoleGroup").classList.add("hidden");
    document.getElementById("addRole").required = false;
    document.getElementById("addTipoPlanoGroup").classList.remove("hidden");
    document.getElementById("addTipoPlano").required = true;
    document.getElementById("addTipoFuncionarioGroup").classList.add("hidden");
    document.getElementById("addTipoFuncionario").required = false;
  } else if (currentTab === "funcionarios") {
    document.getElementById("addModalTitle").textContent =
      "Adicionar Funcionário";
    document.getElementById("addCpfGroup").classList.remove("hidden");
    document.getElementById("addCpf").required = true;
    document.getElementById("addRoleGroup").classList.add("hidden");
    document.getElementById("addRole").required = false;
    document.getElementById("addTipoPlanoGroup").classList.add("hidden");
    document.getElementById("addTipoPlano").required = false;
    document
      .getElementById("addTipoFuncionarioGroup")
      .classList.remove("hidden");
    document.getElementById("addTipoFuncionario").required = true;
  } else {
    document.getElementById("addModalTitle").textContent = "Adicionar Usuário";
    document.getElementById("addCpfGroup").classList.remove("hidden");
    document.getElementById("addCpf").required = true;
    document.getElementById("addRoleGroup").classList.remove("hidden");
    document.getElementById("addRole").required = true;
    document.getElementById("addTipoPlanoGroup").classList.add("hidden");
    document.getElementById("addTipoPlano").required = false;
    document.getElementById("addTipoFuncionarioGroup").classList.add("hidden");
    document.getElementById("addTipoFuncionario").required = false;
  }
}

function closeAddModal() {
  document.getElementById("addModal").classList.remove("active");
  document.getElementById("addAlertContainer").innerHTML = "";
}

function showAddAlert(message, type = "error") {
  const alert = document.getElementById("addAlertContainer");
  alert.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => (alert.innerHTML = ""), 5000);
}

// Modal Editar
async function openEditModal(userId) {
  await ensurePlansLoaded();
  const userToEdit = allUsers.find((u) => u.id === userId);
  if (!userToEdit) return;

  document.getElementById("editUserId").value = userId;
  document.getElementById("editNome").value = userToEdit.nome;
  document.getElementById("editEmail").value = userToEdit.email;
  document.getElementById("editCpf").value = userToEdit.cpf;
  document.getElementById("editTelefone").value = userToEdit.phone || "";

  if (currentTab === "alunos") {
    document.getElementById("editModalTitle").textContent = "Editar Aluno";
    document.getElementById("editNovaSenhaGroup").classList.add("hidden");
    document.getElementById("editTipoPlanoGroup").classList.remove("hidden");
    document.getElementById("editTipoPlano").value = userToEdit.tipo_plano || "fit";

    document.getElementById("editTipoPlano").required = true;

    document.getElementById("editCpfGroup").classList.remove("hidden");
    document.getElementById("editRoleGroup").classList.add("hidden");
  } else if (currentTab === "funcionarios") {
    document.getElementById("editModalTitle").textContent =
      "Editar Funcionário";
    document.getElementById("editNovaSenhaGroup").classList.remove("hidden");
    document.getElementById("editNovaSenha").value = "";
    document.getElementById("editTipoPlanoGroup").classList.add("hidden");
    document.getElementById("editTipoPlano").required = false;

    document.getElementById("editCpfGroup").classList.remove("hidden");
    document.getElementById("editRoleGroup").classList.remove("hidden");
    document.getElementById("editRole").value = userToEdit.role;

    // Hide "Aluno" option if in employees tab
    const roleSelect = document.getElementById("editRole");
    for (let i = 0; i < roleSelect.options.length; i++) {
      if (roleSelect.options[i].value === "aluno") {
        roleSelect.options[i].hidden = true;
      } else {
        roleSelect.options[i].hidden = false;
      }
    }
  } else {
    document.getElementById("editModalTitle").textContent = "Editar Usuário";
    document.getElementById("editNovaSenhaGroup").classList.remove("hidden");
    document.getElementById("editNovaSenha").value = "";
    document.getElementById("editTipoPlanoGroup").classList.add("hidden");
    document.getElementById("editTipoPlano").required = false;

    document.getElementById("editCpfGroup").classList.remove("hidden");
    document.getElementById("editRoleGroup").classList.remove("hidden");
    document.getElementById("editRole").value = userToEdit.role;

    // Show all options
    const roleSelect = document.getElementById("editRole");
    for (let i = 0; i < roleSelect.options.length; i++) {
      roleSelect.options[i].hidden = false;
    }
  }

  document.getElementById("editModal").classList.add("active");
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("active");
  document.getElementById("editAlertContainer").innerHTML = "";
}

function showEditAlert(message, type = "error") {
  const alert = document.getElementById("editAlertContainer");
  alert.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => (alert.innerHTML = ""), 5000);
}

// Confirmar deleção do modal de edição
function confirmDeleteUser() {
  const userId = document.getElementById("editUserId").value;
  showConfirmModal("Tem certeza que deseja deletar esta conta?", async () => {
    await deleteUser(userId);
  });
}

// Deletar usuário
async function deleteUser(id) {
  try {
    const res = await apiFetch(`/users/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      showEditAlert("Conta deletada com sucesso!", "success");
      setTimeout(async () => {
        closeEditModal();
        await loadTab(currentTab);
      }, 1500);
    } else {
      const data = await res.json();
      showEditAlert(data.error || "Erro ao deletar");
    }
  } catch (e) {
    showEditAlert("Erro de conexão");
  }
}

// Submit Adicionar
document.getElementById("addForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Mapear campos frontend -> backend
  const data = {
    name: document.getElementById("addNome").value,
    email: document.getElementById("addEmail").value,
    password: document.getElementById("addSenha").value,
    document: document.getElementById("addCpf").value || "00000000000",
    phone: document.getElementById("addTelefone").value,
  };

  let planType = null;

  if (currentTab === "alunos") {
    data.role = "aluno";
    planType = document.getElementById("addTipoPlano").value;
  } else if (currentTab === "funcionarios") {
    data.role = document.getElementById("addTipoFuncionario").value;
  } else {
    data.role = document.getElementById("addRole").value;
  }

  try {
    const res = await apiFetch("/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...data, planType }),
    });

    const result = await res.json();

    if (res.ok) {
      showAddAlert("Conta criada com sucesso!", "success");
      setTimeout(async () => {
        closeAddModal();
        await loadTab(currentTab);
      }, 1500);
    } else {
      showAddAlert(result.error || "Erro ao criar conta");
    }
  } catch (error) {
    showAddAlert("Erro ao conectar com o servidor");
  }
});

// Listener para exibir campo de plano quando selecionar "Aluno" no modal de adição geral
document.getElementById("addRole").addEventListener("change", function () {
  const role = this.value;
  const planGroup = document.getElementById("addTipoPlanoGroup");
  const planInput = document.getElementById("addTipoPlano");

  // Apenas se estiver na tab geral, pois nas outras tabs o comportamento é hardcoded no openAddModal
  if (currentTab === "all" || !currentTab) {
    if (role === "aluno") {
      planGroup.classList.remove("hidden");
      planInput.required = true;
    } else {
      planGroup.classList.add("hidden");
      planInput.required = false;
    }
  }
});

// Submit Editar
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const userId = document.getElementById("editUserId").value;

  // Mapear campos frontend -> backend
  const data = {
    name: document.getElementById("editNome").value,
    email: document.getElementById("editEmail").value,
    phone: document.getElementById("editTelefone").value,
    document: document.getElementById("editCpf").value,
  };

  // Só adicionar senha se o campo de nova senha estiver preenchido
  if (currentTab === "funcionarios") {
    const newPassword = document.getElementById("editNovaSenha").value;
    if (newPassword) {
      data.password = newPassword;
    }
    data.role = document.getElementById("editRole").value;
  } else if (currentTab !== "alunos") {
    const newPassword = document.getElementById("editNovaSenha").value;
    if (newPassword) {
      data.password = newPassword;
    }
    data.role = document.getElementById("editRole").value;
  }

  // Atualizar plan_type do aluno
  if (currentTab === "alunos") {
    data.planType = document.getElementById("editTipoPlano").value;
  }

  try {
    const res = await apiFetch(`/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
      showEditAlert("Conta atualizada com sucesso!", "success");
      setTimeout(async () => {
        closeEditModal();
        await loadTab(currentTab);
      }, 1500);
    } else {
      showEditAlert(result.error || "Erro ao atualizar conta");
    }
  } catch (error) {
    showEditAlert("Erro ao conectar com o servidor");
  }
});

async function logout() {
  await apiFetch("/auth/logout", { method: "DELETE" });
  window.location.href = resolveAppPath("/");
}

// Função para formatar telefone
function formatPhoneNumber(value) {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);

  if (value.length > 2) {
    if (value.length <= 10) {
      // (XX)XXXXXXXX
      return `(${value.slice(0, 2)})${value.slice(2)}`;
    } else {
      // (XX)9XXXXXXXX
      return `(${value.slice(0, 2)})${value.slice(2)}`;
    }
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

ensurePlansLoaded();
loadTab("alunos");
