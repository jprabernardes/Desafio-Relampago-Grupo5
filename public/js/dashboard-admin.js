let currentTab = "all";
let allUsers = [];
let filteredUsers = [];

const API_URL = "/api";
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

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

if (!token || user.role !== "administrador") {
  window.location.href = "/";
}

// Adaptador: backend usa 'name', frontend usa 'nome'
document.getElementById("userName").textContent =
  user.name || user.nome || "Admin";
document.getElementById("userAvatar").textContent = (
  user.name ||
  user.nome ||
  "A"
)
  .charAt(0)
  .toUpperCase();

async function loadData() {
  try {
    const [usersRes, metricsRes] = await Promise.all([
      fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/users/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
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
      tipo_plano: u.plan_type || "mensal",
      phone: u.phone,
    }));

    document.getElementById("totalUsers").textContent = allUsers.length;
    document.getElementById("totalStudents").textContent =
      metrics.totalStudents || 0;
    document.getElementById("totalInstructors").textContent =
      metrics.totalInstructors || 0;
    document.getElementById("totalReceptionists").textContent =
      metrics.totalReceptionists || 0;

    renderUsers(allUsers);
  } catch (error) {
    console.error("Erro:", error);
  }
}

function renderUsers(users) {
  const tbody = document.getElementById("usersTable");

  if (currentTab === "alunos") {
    // Mostrar: Nome, Email, Tipo de Plano, Ações
    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td><span class="plan-badge plan-${u.tipo_plano || "mensal"}">${u.tipo_plano || "Mensal"}</span></td>
        <td>
           <button class="btn btn-primary" onclick="openEditModal(${u.id})">Editar</button>
        </td>
      </tr>
    `,
      )
      .join("");
  } else if (currentTab === "funcionarios") {
    // Mostrar: Nome, Email, Função, Ações
    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td><span class="role-badge role-${u.role}">${u.role === "instrutor" ? "Instrutor" : "Recepcionista"}</span></td>
        <td>
           <button class="btn btn-primary" onclick="openEditModal(${u.id})">Editar</button>
        </td>
      </tr>
    `,
      )
      .join("");
  } else {
    // Dashboard padrão
    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td>${u.cpf}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>
          <button class="btn btn-primary" onclick="openEditModal(${u.id})">Editar</button>
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
  } else if (tipo === "funcionarios") {
    tableHead.innerHTML = `
      <tr>
        <th>Nome</th>
        <th>Email</th>
        <th>Função</th>
        <th>Ações</th>
      </tr>
    `;
  } else {
    tableHead.innerHTML = `
      <tr>
        <th>Nome</th>
        <th>Email</th>
        <th>CPF</th>
        <th>Função</th>
        <th>Ações</th>
      </tr>
    `;
  }
}

async function loadTab(tipo = "all") {
  currentTab = tipo;

  // Atualizar navegação ativa
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (tipo === "alunos") {
    document.getElementById("navAlunos").classList.add("active");
  } else if (tipo === "funcionarios") {
    document.getElementById("navFuncionarios").classList.add("active");
  } else {
    document.getElementById("navDashboard").classList.add("active");
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
      roles = null;
      title = "Usuários do Sistema";
      updateTableHeaders("all");
      break;
  }

  document.getElementById("tableTitle").textContent = title;
  document.getElementById("searchInput").value = "";

  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
      tipo_plano: u.plan_type || "mensal",
      phone: u.phone,
    }));

    filteredUsers = roles
      ? allUsers.filter((u) => roles.includes(u.role))
      : allUsers;

    renderUsers(filteredUsers);
  } catch (error) {
    console.error(error);
  }
}

// Pesquisa
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

  renderUsers(filteredUsers);
}

// Modal Adicionar
function openAddModal() {
  document.getElementById("addModal").classList.add("active");
  document.getElementById("addForm").reset();

  if (currentTab === "alunos") {
    document.getElementById("addModalTitle").textContent = "Adicionar Aluno";
    document.getElementById("addCpfGroup").style.display = "block";
    document.getElementById("addCpf").required = true;
    document.getElementById("addRoleGroup").style.display = "none";
    document.getElementById("addRole").required = false;
    document.getElementById("addTipoPlanoGroup").style.display = "block";
    document.getElementById("addTipoPlano").required = true;
    document.getElementById("addTipoFuncionarioGroup").style.display = "none";
    document.getElementById("addTipoFuncionario").required = false;
  } else if (currentTab === "funcionarios") {
    document.getElementById("addModalTitle").textContent =
      "Adicionar Funcionário";
    document.getElementById("addCpfGroup").style.display = "block";
    document.getElementById("addCpf").required = true;
    document.getElementById("addRoleGroup").style.display = "none";
    document.getElementById("addRole").required = false;
    document.getElementById("addTipoPlanoGroup").style.display = "none";
    document.getElementById("addTipoPlano").required = false;
    document.getElementById("addTipoFuncionarioGroup").style.display = "block";
    document.getElementById("addTipoFuncionario").required = true;
  } else {
    document.getElementById("addModalTitle").textContent = "Adicionar Usuário";
    document.getElementById("addCpfGroup").style.display = "block";
    document.getElementById("addCpf").required = true;
    document.getElementById("addRoleGroup").style.display = "block";
    document.getElementById("addRole").required = true;
    document.getElementById("addTipoPlanoGroup").style.display = "none";
    document.getElementById("addTipoPlano").required = false;
    document.getElementById("addTipoFuncionarioGroup").style.display = "none";
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
  const userToEdit = allUsers.find((u) => u.id === userId);
  if (!userToEdit) return;

  document.getElementById("editUserId").value = userId;
  document.getElementById("editNome").value = userToEdit.nome;
  document.getElementById("editEmail").value = userToEdit.email;
  document.getElementById("editTelefone").value = userToEdit.phone || "";

  if (currentTab === "alunos") {
    document.getElementById("editModalTitle").textContent = "Editar Aluno";
    document.getElementById("editNovaSenhaGroup").style.display = "none";
    document.getElementById("editTipoPlanoGroup").style.display = "block";
    document.getElementById("editTipoPlano").value =
      userToEdit.tipo_plano || "mensal";
    document.getElementById("editTipoPlano").required = true;
  } else if (currentTab === "funcionarios") {
    document.getElementById("editModalTitle").textContent =
      "Editar Funcionário";
    document.getElementById("editNovaSenhaGroup").style.display = "block";
    document.getElementById("editNovaSenha").value = "";
    document.getElementById("editTipoPlanoGroup").style.display = "none";
    document.getElementById("editTipoPlano").required = false;
  } else {
    document.getElementById("editModalTitle").textContent = "Editar Usuário";
    document.getElementById("editNovaSenhaGroup").style.display = "block";
    document.getElementById("editNovaSenha").value = "";
    document.getElementById("editTipoPlanoGroup").style.display = "none";
    document.getElementById("editTipoPlano").required = false;
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
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
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
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
      planGroup.style.display = "block";
      planInput.required = true;
    } else {
      planGroup.style.display = "none";
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
  };

  // Só adicionar senha se o campo de nova senha estiver preenchido
  if (currentTab === "funcionarios") {
    const newPassword = document.getElementById("editNovaSenha").value;
    if (newPassword) {
      data.password = newPassword;
    }
  } else if (currentTab !== "alunos") {
    const newPassword = document.getElementById("editNovaSenha").value;
    if (newPassword) {
      data.password = newPassword;
    }
  }

  // Atualizar plan_type do aluno
  if (currentTab === "alunos") {
    data.planType = document.getElementById("editTipoPlano").value;
  }

  try {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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

function logout() {
  localStorage.clear();
  window.location.href = "/";
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

loadData();
