// public/js/dashboard-receptionist.js

let currentTab = "students";
let allUsers = [];
let filteredUsers = [];
let paginator = null;

const { resolveAppPath } = window.AppConfig;

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
  if (pendingConfirmAction) {
    pendingConfirmAction();
  }
  closeConfirmModal();
}

// --- Main Logic ---

// Load Tab
async function loadTab(tab) {
  let userData = null;
  try {
    userData = await loadUserInfo();
    if (userData.error) {
      document.cookie = "";
      window.location.href = resolveAppPath("/");
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
    window.location.href = resolveAppPath("/");
  }

  currentTab = tab;

  // UI Updates
  document
    .querySelectorAll(".nav-item")
    .forEach((i) => i.classList.remove("active"));

  // Hide all main containers first
  document.querySelector(".table-container").style.display = "none";
  document.getElementById("homeView").classList.add("hidden");
  document.getElementById("financeView").classList.add("hidden");
  document.getElementById("classesView").classList.add("hidden");

  // Reset search and add button visibility
  document.getElementById("searchInput").classList.add("hidden");
  document.getElementById("addBtn").classList.add("hidden");

  if (tab === "home") {
    document.getElementById("navHome").classList.add("active");
    document.getElementById("homeView").classList.remove("hidden");
    document.getElementById("tableTitle").textContent = "Visão Geral";
    await loadHomeMetrics();
  } else if (tab === "students") {
    document.getElementById("navAlunos").classList.add("active");
    document.querySelector(".table-container").style.display = "block";
    document.getElementById("tableTitle").textContent = "Gerenciar Alunos";

    document.getElementById("searchInput").classList.remove("hidden");
    document.getElementById("searchInput").value = "";
    document.getElementById("addBtn").classList.remove("hidden");
    document.getElementById("addBtn").textContent = "+ Adicionar Aluno";

    document.getElementById("usersTable").innerHTML =
      '<tr><td colspan="5" class="text-center-padded">Carregando...</td></tr>';
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

    document.getElementById("usersTable").innerHTML =
      '<tr><td colspan="5" class="text-center-padded">Carregando...</td></tr>';
    updateTableHeaders("instructors");
    await loadUsers("instructors");
  } else if (tab === "financeiro") {
    document.getElementById("navFinance").classList.add("active");
    document.getElementById("financeView").classList.remove("hidden");
    document.querySelector(".table-container").style.display = "block";
    document.getElementById("tableTitle").textContent = "Financeiro";

    document.getElementById("searchInput").classList.remove("hidden");
    document.getElementById("searchInput").placeholder = "Buscar aluno por nome, email ou CPF...";
    document.getElementById("searchInput").value = "";

    document.getElementById("usersTable").innerHTML =
      '<tr><td colspan="9" class="text-center-padded">Carregando...</td></tr>';
    updateTableHeaders("financeiro");
    await loadFinance();
  } else if (tab === "classes") {
    document.getElementById("navAulas").classList.add("active");
    document.getElementById("classesView").classList.remove("hidden");
    document.getElementById("tableTitle").textContent = "Calendário de Aulas";

    // Init Calendar
    console.log("Recep Dashboard: Switching to Classes Tab. Checking CalendarModule:", !!window.CalendarModule);
    if (window.CalendarModule) {
      // Pass ID and Role to module
      console.log("Recep Dashboard: Initializing CalendarModule with", userData.id, userData.role);
      window.CalendarModule.init(userData.id, userData.role);
      window.CalendarModule.loadCalendar();
    } else {
      console.error("Recep Dashboard: window.CalendarModule is missing!");
    }
  }
}

async function loadHomeMetrics() {
  try {
    const res = await apiFetch("/receptionist/metrics");
    if (!res.ok) throw new Error("Erro ao buscar métricas");

    const data = await res.json();

    // Atualizar UI com dados reais
    document.getElementById("metricTotalStudents").textContent = data.totalStudents || 0;

    // Total funcionários = instrutores + recepcionistas + admins
    const totalStaff = (data.totalInstructors || 0) + (data.totalReceptionists || 0) + (data.totalAdmins || 0);
    document.getElementById("metricTotalStaff").textContent = totalStaff;

    document.getElementById("metricCheckinsToday").textContent = data.checkinsToday || 0;

    // Financeiro (real)
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
  } else if (type === "financeiro") {
    thead.innerHTML = `
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
  }
}

// MODIFICADO: Load Users com Paginação
async function loadUsers(type) {
  let endpoint = "";
  if (type === "students") endpoint = "/receptionist/students";
  else if (type === "instructors") endpoint = "/receptionist/instructors";

  try {
    const res = await apiFetch(endpoint);

    if (!res.ok) throw new Error("Erro ao buscar dados");

    const data = await res.json();

    // Normalize fields
    allUsers = data.map((u) => ({
      id: u.id,
      nome: u.name || u.nome,
      email: u.email,
      cpf: u.document || u.cpf,
      phone: u.phone,
      plan: u.planType || u.plan_type || u.plan || "mensal",
      paymentDay: u.paymentDay || u.payment_day || 10,
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
  el.classList.remove("hidden");
  el.classList.remove("success", "error", "alert-success", "alert-error");
  el.classList.add(type);
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
      `<tr><td colspan="9" class="text-error-center">Erro: ${err.message}</td></tr>`;
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

function renderTablePage(pageItems) {
  const tbody = document.getElementById("usersTable");

  if (pageItems.length === 0) {
    const colspan = currentTab === "financeiro" ? 9 : 5;
    tbody.innerHTML =
      `<tr><td colspan="${colspan}" class="text-center-padded-gray">Nenhum registro encontrado.</td></tr>`;
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
  } else if (currentTab === "financeiro") {
    tbody.innerHTML = pageItems
      .map(
        (u) => `
            <tr>
                <td>${u.nome}</td>
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
    filteredUsers = allUsers.filter((u) => {
      const nome = (u.nome || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const cpf = (u.cpf || "").toLowerCase();
      return nome.includes(term) || email.includes(term) || cpf.includes(term);
    });
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
    document.getElementById("addPaymentDayGroup").classList.remove("hidden");
  } else {
    document.getElementById("addTipoPlanoGroup").classList.add("hidden");
    document.getElementById("addPaymentDayGroup").classList.add("hidden");
  }
  document.getElementById("addTipoPlano").required = isStudent;
  document.getElementById("addPaymentDay").required = isStudent;
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
    body.paymentDay = Number(document.getElementById("addPaymentDay").value || 10);
    endpoint = "/receptionist/students";
  } else {
    body.role = "instrutor";
    endpoint = "/receptionist/instructors";
  }

  try {
    const res = await apiFetch(endpoint, {
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
    document.getElementById("editPaymentDayGroup").classList.remove("hidden");
  } else {
    document.getElementById("editTipoPlanoGroup").classList.add("hidden");
    document.getElementById("editPaymentDayGroup").classList.add("hidden");
  }

  if (isStudent) {
    document.getElementById("editTipoPlano").value =
      userToEdit.plan.toLowerCase();
    document.getElementById("editPaymentDay").value = String(userToEdit.paymentDay || 10);
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
    body.paymentDay = Number(document.getElementById("editPaymentDay").value || 10);
  }

  try {
    const res = await apiFetch(`/users/${id}`, {
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
    const res = await apiFetch(`/users/${id}`, {
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
  await apiFetch("/auth/logout", { method: "DELETE" });
  window.location.href = resolveAppPath("/");
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
loadTab("home");
