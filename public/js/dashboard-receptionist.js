// public/js/dashboard-receptionist.js

let currentTab = "students";
let allUsers = [];
let filteredUsers = [];
let paginator = null;

// Weekday chart UI state
// Mantemos apenas a versão em colunas (vertical)
let weekdayChartMode = 'vertical';
const weekdayChartCache = {};

const { resolveAppPath } = window.AppConfig;

// --------------------
// Plans
// --------------------
let plansCache = []; // [{id, code, name, ...}]

async function fetchPlans() {
  const res = await apiFetch("/plans");
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
  let userData = null;
  try {
    userData = await loadUserInfo();
    if (userData.error) {
      document.cookie = "";
      window.location.href = resolveAppPath("/");
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
    await loadWeekdayChart("weekdayChartHome", 30);
  } else if (tab === "students") {
    document.getElementById("navAlunos").classList.add("active");
    document.querySelector(".table-container").style.display = "block";
    document.getElementById("tableTitle").textContent = "Gerenciar Alunos";

    document.getElementById("searchInput").classList.remove("hidden");
    document.getElementById("searchInput").placeholder = "Pesquisar...";
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

    document.getElementById("usersTable").innerHTML =
      '<tr><td colspan="5" class="text-center-padded">Carregando...</td></tr>';
    updateTableHeaders("students");
    await loadUsers("students");
  } else if (tab === "instructors") {
    document.getElementById("navInstrutores").classList.add("active");
    document.querySelector(".table-container").style.display = "block";
    document.getElementById("tableTitle").textContent = "Gerenciar Instrutores";

    document.getElementById("searchInput").classList.remove("hidden");
    document.getElementById("searchInput").placeholder = "Pesquisar...";
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
    document.getElementById("searchInput").placeholder = "Buscar aluno";
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

async function loadWeekdayChart(containerId, days) {
  const el = document.getElementById(containerId);
  if (!el) return;

  // Loading state
  el.innerHTML = '<div class="weekday-empty">Carregando gráfico...</div>';

  try {
    const res = await apiFetch(`/receptionist/checkins/weekday?days=${Number(days || 30)}`);
    if (!res.ok) throw new Error('Erro ao buscar estatísticas de check-in');
    const json = await res.json();

    const data = json.data || [];
    weekdayChartCache[containerId] = data;
    renderWeekdayChart(el, data, weekdayChartMode);
    updateWeekdayChartControls();
  } catch (err) {
    el.innerHTML = `<div class="weekday-empty">Não foi possível carregar o gráfico.</div>`;
  }
}

function setWeekdayChartMode(mode) {
  weekdayChartMode = mode || 'horizontal';
  updateWeekdayChartControls();

  const containerId = 'weekdayChartHome';
  const el = document.getElementById(containerId);
  if (!el) return;

  const data = weekdayChartCache[containerId];
  if (!data) return;

  renderWeekdayChart(el, data, weekdayChartMode);
}

function updateWeekdayChartControls() {
  const controls = document.getElementById('weekdayChartControls');
  if (!controls) return;

  controls.querySelectorAll('button[data-mode]')
    .forEach((btn) => {
      const mode = btn.getAttribute('data-mode');
      if (mode === weekdayChartMode) btn.classList.add('active');
      else btn.classList.remove('active');
    });
}

function renderWeekdayChart(containerEl, data, mode = 'horizontal') {
  if (!Array.isArray(data) || data.length === 0) {
    containerEl.classList.remove('weekday-chart--thick', 'weekday-chart--vertical');
    containerEl.innerHTML = '<div class="weekday-empty">Sem dados de check-ins.</div>';
    return;
  }

  // Usar volume de check-ins para evidenciar diferença entre dias.
  // Alunos únicos continuam disponíveis via tooltip.
  const max = Math.max(...data.map((d) => Number(d.checkinCount || 0)), 1);

  containerEl.classList.remove('weekday-chart--thick', 'weekday-chart--vertical');

  if (mode === 'vertical') {
    containerEl.classList.add('weekday-chart--vertical');

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

    return;
  }

  if (mode === 'horizontalThick') {
    containerEl.classList.add('weekday-chart--thick');
  }

  containerEl.innerHTML = data
    .map((d) => {
      const checkins = Number(d.checkinCount || 0);
      const students = Number(d.studentCount || 0);
      const pct = Math.round((checkins / max) * 100);
      return `
        <div class="weekday-row" title="${students} alunos únicos / ${checkins} check-ins">
          <div class="weekday-label">${d.label}</div>
          <div class="weekday-bar">
            <div class="weekday-bar-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="weekday-count">${checkins}</div>
        </div>
      `;
    })
    .join('');
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

async function loadUsers(type) {
  let endpoint = "";
  if (type === "students") endpoint = "/receptionist/students";
  else if (type === "instructors") endpoint = "/receptionist/instructors";

  try {
    const res = await apiFetch(endpoint);

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
  else {
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

function openAddModal() {
  document.getElementById("addModal").classList.add("active");
  document.getElementById("addForm").reset();
  document.getElementById("addAlertContainer").innerHTML = "";

  const isStudent = currentTab === "students";
  if (isStudent) {
    document.getElementById("addTipoPlanoGroup").classList.remove("hidden");
    document.getElementById("addPaymentDayGroup").classList.remove("hidden");
  } else {
    document.getElementById("addTipoPlanoGroup").classList.add("hidden");
    document.getElementById("addPaymentDayGroup").classList.add("hidden");
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
loadTab("home");
