// public/js/dashboard-admin.js

let paginator = null;
let currentTab = "alunos";
let allUsers = [];
let filteredUsers = [];
let currentUser = null;

const { resolveAppPath } = window.AppConfig;

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
  currentUser = data; // Store globally
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

// Open Profile Modal (Self-Edit)
function openProfileModal() {
  if (!currentUser) return;

  // Ensure we have the latest data for the current user from allUsers if possible, 
  // or fallback to currentUser. However, allUsers might be richer (enriched).
  // If currentUser.id is not in allUsers (e.g. freshly loaded tab?), we might need to fetch or use currentUser.
  // openEditModal expects the user to be in allUsers. 

  const userInList = allUsers.find(u => u.id === currentUser.id);
  if (userInList) {
    openEditModal(userInList.id);
  } else {
    // If not in list (unlikely if /users returns all), add temp to list or fetch?
    // Let's assume /users returns all. 
    // If fails, we might need a fallback, but let's try standard path.
    console.warn("User not found in list, trying to open with cached data");
    // Manually push to allUsers if missing?
    allUsers.push({
      id: currentUser.id,
      nome: currentUser.name || currentUser.nome,
      email: currentUser.email,
      role: currentUser.role,
      phone: currentUser.phone,
      cpf: currentUser.document || currentUser.cpf
    });
    openEditModal(currentUser.id);
  }
}


function renderTablePage(pageItems) {
  const tbody = document.getElementById("usersTable");

  if (pageItems.length === 0) {
    const colspan = currentTab === "financeiro" ? 9 : 5;
    tbody.innerHTML =
      `<tr><td colspan="${colspan}" class="text-center-padded-gray">Nenhum registro encontrado.</td></tr>`;
    return;
  }

  const nameCell = (u) => `
    <span class="clickable-name" onclick="openEditModal(${u.id})" style="cursor: pointer; color: var(--primary); font-weight: 500;">
      ${u.nome}
    </span>`;

  if (currentTab === "alunos") {
    // Mostrar: Nome, Email, Tipo de Plano, Ações
    tbody.innerHTML = pageItems
      .map(
        (u) => `
      <tr>
        <td>${nameCell(u)}</td>
        <td>${u.email}</td>
        <td><span class="plan-badge plan-${u.tipo_plano || "mensal"}">${u.tipo_plano || "Mensal"}</span></td>
        <td>
           <button class="btn btn-primary" onclick="openEditModal(${u.id})">
             <span class="material-symbols-outlined">edit</span> Editar
           </button>
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
        <td>${nameCell(u)}</td>
        <td>${u.email}</td>
        <td><span class="role-badge role-${u.role}">${u.role === "instrutor" ? "Instrutor" : "Recepcionista"}</span></td>
        <td>
           <button class="btn btn-primary" onclick="openEditModal(${u.id})">
             <span class="material-symbols-outlined">edit</span> Editar
           </button>
        </td>
      </tr>
    `,
      )
      .join("");
  } else if (currentTab === "financeiro") {
    tbody.innerHTML = pageItems
      .map(
        (u) => `
            <tr>
                <td>${nameCell(u)}</td>
                <td>${u.email}</td>
                <td>${u.phone || "-"}</td>
                <td>${u.cpf || "-"}</td>
                <td>${u.paymentDay || 10}</td>
                <td>${formatDateBR(u.paidUntil)}</td>
                <td>${formatDateBR(u.nextDueDate)}</td>
                <td>${renderPaymentBadge(u.situation)}</td>
                <td>
                  <button class="btn btn-secondary" onclick="registerPayment(${u.id})">Registrar pagamento</button>
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
        <td>${nameCell(u)}</td>
        <td>${u.email}</td>
        <td>${u.cpf}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>
          <button class="btn btn-primary" onclick="openEditModal(${u.id})">
            <span class="material-symbols-outlined">edit</span> Editar
          </button>
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
  } else if (tipo === "financeiro") {
    tableHead.innerHTML = `
            <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>CPF</th>
                <th>Dia Pgto</th>
                <th>Pago até</th>
                <th>Próximo</th>
                <th>Situação</th>
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

async function loadTab(tipo = "home") {
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

  const navMap = {
    home: "navHome",
    alunos: "navAlunos",
    funcionarios: "navFuncionarios",
    classes: "navAulas",
    financeiro: "navFinance"
  };

  if (navMap[tipo]) {
    const navEl = document.getElementById(navMap[tipo]);
    if (navEl) navEl.classList.add("active");
  }

  // Get Views
  const homeView = document.getElementById("homeView");
  const classesView = document.getElementById("classesView");
  const financeView = document.getElementById("financeView");
  const tableContainer = document.querySelector(".table-container");

  // Reset Views
  if (homeView) homeView.classList.add("hidden");
  if (classesView) classesView.classList.add("hidden");
  if (financeView) financeView.classList.add("hidden");
  if (tableContainer) tableContainer.style.display = "none";

  // Reset Search visibility if needed (Admin dashboard always shows search in table container, but home view shouldn't)
  // But search bar is INSIDE table-container in admin HTML structure? 
  // Let's assume table-container contains the header and search.

  if (tipo === "home") {
    if (homeView) homeView.classList.remove("hidden");
    // Load Home Data
    await loadHomeMetrics();
    await loadWeekdayChart("weekdayChartHome", 30);
    return;
  } else if (tipo === "classes") {
    if (classesView) classesView.classList.remove("hidden");

    // Init Calendar
    console.log("Admin Dashboard: Switching to Classes Tab. Checking CalendarModule:", !!window.CalendarModule);
    if (window.CalendarModule) {
      console.log("Admin Dashboard: Initializing CalendarModule with", userData.id, userData.role);
      window.CalendarModule.init(userData.id, userData.role);
      window.CalendarModule.loadCalendar();
    } else {
      console.error("Admin Dashboard: window.CalendarModule is missing!");
    }
    return;
  } else if (tipo === "financeiro") {
    if (financeView) financeView.classList.remove("hidden");
    if (tableContainer) tableContainer.style.display = "block";
    document.getElementById("tableTitle").textContent = "Financeiro";

    document.getElementById("usersTable").innerHTML =
      '<tr><td colspan="9" class="text-center-padded">Carregando...</td></tr>';
    updateTableHeaders("financeiro");
    await loadFinance();
    return;
  } else {
    // Alunos or Funcionarios
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

  const titleEl = document.getElementById("tableTitle");
  if (titleEl) titleEl.textContent = title;

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";

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
      tipo_plano: u.planType || u.plan_type || "mensal",
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
      `< tr > <td colspan="5" class="text-error-center">Erro: ${error.message}</td></tr > `;
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
function openAddModal() {
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
  alert.innerHTML = `< div class="alert alert-${type}" > ${message}</div > `;
  setTimeout(() => (alert.innerHTML = ""), 5000);
}

// Modal Editar
async function openEditModal(userId) {
  const userToEdit = allUsers.find((u) => u.id === userId);
  if (!userToEdit) return;

  document.getElementById("editUserId").value = userId;
  document.getElementById("editNome").value = userToEdit.nome;
  document.getElementById("editEmail").value = userToEdit.email;
  document.getElementById("editCpf").value = userToEdit.cpf;
  document.getElementById("editTelefone").value = userToEdit.phone || "";

  // Sempre permitir editar senha (deixar em branco se não quiser alterar)
  document.getElementById("editNovaSenhaGroup").classList.remove("hidden");
  document.getElementById("editNovaSenha").value = "";

  // Logic override for Admin Role
  if (userToEdit.role === 'administrador') {
    document.getElementById("editModalTitle").textContent = "Editar Administrador";

    // Admins don't have plans
    document.getElementById("editTipoPlanoGroup").classList.add("hidden");
    document.getElementById("editTipoPlano").required = false;

    // Show Role/CPF?
    document.getElementById("editCpfGroup").classList.remove("hidden");

    // Allow changing role? Maybe not for self if it removes admin access. 
    // But let's show it as per "General" layout but maybe disabled?
    // User request: "ver as informações e alterar a senha igual de aluno e instrutor"
    // Taking it literally: show info + allow password change.

    document.getElementById("editRoleGroup").classList.remove("hidden");
    document.getElementById("editRole").value = userToEdit.role;

    // Show all roles in select
    const roleSelect = document.getElementById("editRole");
    for (let i = 0; i < roleSelect.options.length; i++) {
      roleSelect.options[i].hidden = false;
    }

  } else if (currentTab === "alunos") {
    document.getElementById("editModalTitle").textContent = "Editar Aluno";
    document.getElementById("editTipoPlanoGroup").classList.remove("hidden");
    document.getElementById("editTipoPlano").value =
      userToEdit.tipo_plano || "mensal";
    document.getElementById("editTipoPlano").required = true;

    document.getElementById("editCpfGroup").classList.remove("hidden");
    document.getElementById("editRoleGroup").classList.add("hidden");
  } else if (currentTab === "funcionarios") {
    document.getElementById("editModalTitle").textContent =
      "Editar Funcionário";
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
  alert.innerHTML = `< div class="alert alert-${type}" > ${message}</div > `;
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
    const res = await apiFetch(`/ users / ${id} `, {
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

  // Check for password update
  const newPassword = document.getElementById("editNovaSenha").value;
  if (newPassword) {
    data.password = newPassword;
  }

  // Só adicionar role se não for aluno
  if (currentTab === "funcionarios" || currentTab !== "alunos") {
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
      return `(${value.slice(0, 2)})${value.slice(2)} `;
    } else {
      // (XX)9XXXXXXXX
      return `(${value.slice(0, 2)})${value.slice(2)} `;
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



// --- Finance Helper Functions ---


function formatDateBR(dateStr) {
  if (!dateStr) return "-";
  // YYYY-MM-DD -> DD/MM/YYYY
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function renderPaymentBadge(situation) {
  const isPaid = situation === "adimplente";
  const cls = isPaid ? "status-active" : "status-inactive";
  const label = isPaid ? "Adimplente" : "Inadimplente";
  return `<span class="status-badge ${cls}"><span class="dot"></span>${label}</span>`;
}

function showMainAlert(message, type) {
  const el = document.getElementById("alert");
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.remove("success", "error", "alert-success", "alert-error");
  el.classList.add(type === 'success' ? 'alert-success' : 'alert-error'); // Map to CSS classes
  el.textContent = message;

  setTimeout(() => {
    el.classList.add("hidden");
  }, 3000);
}

async function loadFinance() {
  try {
    const [summaryRes, studentsRes] = await Promise.all([
      apiFetch("/receptionist/finance/summary"),
      apiFetch("/receptionist/finance/students"),
    ]);

    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      document.getElementById("financeAdimplentes").textContent = summary.adimplentes || 0;
      document.getElementById("financeInadimplentes").textContent = summary.inadimplentes || 0;
      document.getElementById("financeTotal").textContent = summary.total || 0;
    }

    if (!studentsRes.ok) throw new Error("Erro ao buscar alunos do financeiro");
    const data = await studentsRes.json();

    allUsers = data.map((s) => ({
      id: s.id,
      nome: s.name,
      email: s.email,
      phone: s.phone,
      cpf: s.document,
      paymentDay: s.payment_day,
      paidUntil: s.paid_until,
      nextDueDate: s.next_due_date,
      dueDate: s.due_date,
      situation: s.situation,
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
      `< tr > <td colspan="9" class="text-error-center">Erro: ${err.message}</td></tr > `;
  }
}


async function registerPayment(studentId) {
  try {
    const res = await apiFetch(`/receptionist/finance/students/${studentId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ months: 1 }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erro ao registrar pagamento");

    showMainAlert("Pagamento registrado com sucesso!", "success");
    await loadFinance();
  } catch (err) {
    showMainAlert(err.message || "Erro ao registrar pagamento", "error");
  }
}

let weekdayChartMode = 'vertical';
const weekdayChartCache = {};

async function loadHomeMetrics() {
  try {
    const res = await apiFetch("/users/dashboard");
    if (!res.ok) throw new Error("Erro ao buscar métricas");

    const data = await res.json();

    document.getElementById("metricTotalStudents").textContent = data.totalStudents || 0;

    const totalStaff = (data.totalInstructors || 0) + (data.totalReceptionists || 0) + (data.totalAdmins || 0);
    document.getElementById("metricTotalStaff").textContent = totalStaff;

    document.getElementById("metricCheckinsToday").textContent = data.checkinsToday || 0;

    try {
      const finRes = await apiFetch("/receptionist/finance/summary");
      if (finRes.ok) {
        const fin = await finRes.json();
        document.getElementById("metricPaidPercent").textContent = `${fin.adimplentesPercent || 0}%`;
        document.getElementById("metricUnpaidPercent").textContent = `${fin.inadimplentesPercent || 0}%`;
      } else {
        document.getElementById("metricPaidPercent").textContent = "--%";
        document.getElementById("metricUnpaidPercent").textContent = "--%";
      }
    } catch {
      document.getElementById("metricPaidPercent").textContent = "--%";
      document.getElementById("metricUnpaidPercent").textContent = "--%";
    }

  } catch (err) {
    console.error("Erro ao carregar métricas:", err);
  }
}

async function loadWeekdayChart(containerId, days) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = '<div class="weekday-empty">Carregando gráfico...</div>';

  try {
    const res = await apiFetch(`/receptionist/checkins/weekday?days=${Number(days || 30)}`);
    if (!res.ok) throw new Error('Erro ao buscar estatísticas de check-in');
    const json = await res.json();

    const data = json.data || [];
    weekdayChartCache[containerId] = data;
    renderWeekdayChart(el, data, weekdayChartMode);
  } catch (err) {
    el.innerHTML = `<div class="weekday-empty">Não foi possível carregar o gráfico.</div>`;
  }
}

function renderWeekdayChart(containerEl, data, mode = 'vertical') {
  if (!Array.isArray(data) || data.length === 0) {
    containerEl.classList.remove('weekday-chart--thick', 'weekday-chart--vertical');
    containerEl.innerHTML = '<div class="weekday-empty">Sem dados de check-ins.</div>';
    return;
  }

  const max = Math.max(...data.map((d) => Number(d.checkinCount || 0)), 1);

  containerEl.classList.remove('weekday-chart--thick', 'weekday-chart--vertical');
  containerEl.classList.add('weekday-chart--vertical'); // Force vertical for home view

  containerEl.innerHTML = data
    .map((d) => {
      const checkins = Number(d.checkinCount || 0);
      const students = Number(d.studentCount || 0);
      const pct = Math.round((checkins / max) * 100);

      return `
          <div class="weekday-col" title="${students} alunos únicos / ${checkins} check-ins">
            <div class="weekday-col-count">${checkins}</div>
            <div class="weekday-col-bar">
              <div class="weekday-col-fill" style="height: ${pct}%;"></div>
            </div>
            <div class="weekday-col-label">${d.label}</div>
          </div>
        `;
    })
    .join('');
}

loadTab("home");
