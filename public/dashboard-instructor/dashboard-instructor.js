const API_URL = "/api";
let token = localStorage.getItem("token");

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

if (!token) window.location.href = "/";

// Navegação
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((i) => i.classList.remove("active"));
    document
      .querySelectorAll(".section")
      .forEach((s) => s.classList.remove("active"));
    item.classList.add("active");
    const sectionId = item.getAttribute("data-section");
    document.getElementById(sectionId).classList.add("active");

    if (sectionId === "create-exercise" || sectionId === "assign-workout")
      loadTemplates();
    if (sectionId === "classes") loadClasses();

    // Reset edits when switching tabs
    if (sectionId !== "create-exercise") cancelEdit();
    if (sectionId !== "create-class") cancelClassEdit();
  });
});

function showAlert(msg, type = "success") {
  const el = document.getElementById("alert");
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  setTimeout(() => el.classList.remove("show"), 3000);
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

async function loadUserInfo() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  document.getElementById("userName").textContent = data.name || data.nome || "Instrutor";
}

// --- Templates ---
let templates = [];

async function loadTemplates() {
  try {
    const res = await fetch(`${API_URL}/instructor/exercises`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    templates = await res.json();
    renderTemplates();
  } catch (e) {
    console.error(e);
  }
}

function renderTemplates() {
  const list = document.getElementById("templatesList");
  const assignList = document.getElementById("assignTemplatesList");

  // Renderizar para Gerenciamento (Editar/Excluir)
  list.innerHTML = templates
    .map(
      (t) => `
        <div class="template-card" onclick="toggleSelection(this, ${t.id})">
          <h4>${t.name}</h4>
          <p>${t.series}x${t.repetitions} - ${t.weight}kg</p>
          <p style="font-size:0.85rem; color:#666; margin-top:0.25rem;">${t.description || ''}</p>
          <div class="template-actions" onclick="event.stopPropagation()">
              <button class="template-action-btn" title="Editar" onclick="editTemplate(${t.id})">✏️</button>
              <button class="template-action-btn" title="Excluir" onclick="deleteTemplate(${t.id})">🗑️</button>
          </div>
        </div>
      `,
    )
    .join("");

  // Renderizar para Atribuição (Apenas Seleção)
  assignList.innerHTML = templates
    .map(
      (t) => `
        <div class="template-card" onclick="toggleSelection(this, ${t.id})">
          <h4>${t.name}</h4>
          <p>${t.series}x${t.repetitions} - ${t.weight}kg</p>
        </div>
      `,
    )
    .join("");
}

// Lógica de Edição/Exclusão
window.editTemplate = (id) => {
  const t = templates.find((x) => x.id === id);
  if (!t) return;

  document.getElementById("exId").value = t.id;
  document.getElementById("exName").value = t.name;
  document.getElementById("exDescription").value = t.description || "";
  document.getElementById("exSeries").value = t.series;
  document.getElementById("exRepetitions").value = t.repetitions;
  document.getElementById("exWeight").value = t.weight;

  document.getElementById("formTitle").textContent = "Editar Template";
  document.getElementById("saveBtn").textContent = "Atualizar Template";
  document.getElementById("cancelEditBtn").style.display = "inline-block";

  document.querySelector(".main-content").scrollTop = 0; // Scroll to top
};

window.cancelEdit = () => {
  document.getElementById("createExerciseForm").reset();
  document.getElementById("exId").value = "";
  document.getElementById("exDescription").value = "";
  document.getElementById("formTitle").textContent =
    "Criar Template de Exercício";
  document.getElementById("saveBtn").textContent = "Salvar Template";
  document.getElementById("cancelEditBtn").style.display = "none";
};

window.deleteTemplate = async (id) => {
  showConfirmModal(
    "Tem certeza que deseja excluir este template?",
    async () => {
      try {
        const res = await fetch(`${API_URL}/instructor/exercises/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          showAlert("Template excluído!");
          loadTemplates();
        } else {
          showAlert("Erro ao excluir", "error");
        }
      } catch (e) {
        console.error(e);
      }
    },
  );
};

document
  .getElementById("createExerciseForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("exId").value;
    const data = {
      name: document.getElementById("exName").value,
      description: document.getElementById("exDescription").value,
      series: parseInt(document.getElementById("exSeries").value),
      repetitions: parseInt(document.getElementById("exRepetitions").value),
      weight: parseFloat(document.getElementById("exWeight").value),
    };

    try {
      const url = id
        ? `${API_URL}/instructor/exercises/${id}`
        : `${API_URL}/instructor/exercises`;
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        showAlert(id ? "Template atualizado!" : "Template criado!");
        loadTemplates();
        cancelEdit(); // Reset form
      } else {
        const err = await res.json();
        showAlert(err.error || "Erro ao salvar", "error");
      }
    } catch (e) {
      showAlert("Erro de conexão", "error");
    }
  });

// --- Atribuição ---
let selectedTemplateIds = [];

window.toggleSelection = (el, id) => {
  el.classList.toggle("selected");
  if (el.classList.contains("selected")) {
    selectedTemplateIds.push(id);
  } else {
    selectedTemplateIds = selectedTemplateIds.filter((tid) => tid !== id);
  }
};

// Buscar Aluno (CORRIGIDO: busca por Nome, Email OU CPF)
document
  .getElementById("studentSearch")
  .addEventListener("input", async (e) => {
    const term = e.target.value;
    if (term.length < 3) {
      document.getElementById("studentSelect").style.display = "none";
      return;
    }

    try {
      const res = await fetch(`${API_URL}/instructor/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Erro ao buscar alunos");

      const allStudents = await res.json();
      
      // Mapear para garantir que temos os campos corretos
      const studentsWithNames = allStudents.map(s => ({
        id: s.id,
        name: s.name || s.nome || `Aluno ${s.id}`,
        email: s.email || "",
        document: s.document || s.cpf || ""
      }));
      
      const filtered = studentsWithNames.filter(
        (s) => {
          return s.name.toLowerCase().includes(term.toLowerCase()) ||
                 s.email.toLowerCase().includes(term.toLowerCase()) ||
                 s.document.includes(term);
        }
      );

      const select = document.getElementById("studentSelect");
      
      if (filtered.length === 0) {
        select.innerHTML = '<option disabled>Nenhum aluno encontrado</option>';
        select.style.display = "block";
      } else {
        select.innerHTML = filtered
          .map(
            (s) => `<option value="${s.id}">${s.name} - CPF: ${s.document || 'N/A'}</option>`
          )
          .join("");
        select.style.display = "block";
      }
    } catch (e) {
      console.error("Erro na busca de alunos:", e);
      const select = document.getElementById("studentSelect");
      select.innerHTML = '<option disabled>Erro ao buscar alunos</option>';
      select.style.display = "block";
    }
  });

document
  .getElementById("assignWorkoutForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const studentId = document.getElementById("studentSelect").value;
    const type = document.getElementById("trainingType").value;

    if (!studentId) return showAlert("Selecione um aluno", "error");
    if (selectedTemplateIds.length === 0)
      return showAlert("Selecione exercícios", "error");

    try {
      // 1. Criar o treino
      const trainingData = {
        name: `Treino ${type}`,
        userIds: [parseInt(studentId)]
      };

      const createRes = await fetch(`${API_URL}/instructor/trainings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trainingData),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Erro ao criar treino");
      }

      const training = await createRes.json();

      // 2. Adicionar exercícios ao treino
      for (const exerciseId of selectedTemplateIds) {
        const exerciseRes = await fetch(`${API_URL}/instructor/trainings/${training.id}/exercises`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ exerciseId }),
        });

        if (!exerciseRes.ok) {
          console.warn(`Erro ao adicionar exercício ${exerciseId}`);
        }
      }

      showAlert("Treino atribuído com sucesso!");
      selectedTemplateIds = [];
      document
        .querySelectorAll(".template-card.selected")
        .forEach((el) => el.classList.remove("selected"));
      document.getElementById("assignWorkoutForm").reset();
      document.getElementById("studentSelect").style.display = "none";
    } catch (e) {
      console.error(e);
      showAlert(e.message || "Erro ao atribuir treino", "error");
    }
  });

// --- Gerenciamento de Aulas ---
let myClasses = [];
let allClasses = [];

async function loadClasses() {
  try {
    const res = await fetch(`${API_URL}/instructor/classes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    myClasses = await res.json();
    allClasses = [...myClasses]; // Cópia para filtro
    renderClasses();
  } catch (e) {
    console.error(e);
  }
}

// Formatar data para dd/mm/yyyy
function formatDateBR(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// CORREÇÃO: Função de filtro de aulas
function filterClasses() {
  const searchTerm = document.getElementById("classSearchInput").value.toLowerCase();
  
  if (searchTerm) {
    myClasses = allClasses.filter(c => 
      (c.name || c.nome_aula || "").toLowerCase().includes(searchTerm)
    );
  } else {
    myClasses = [...allClasses];
  }
  
  renderClasses();
}

async function renderClasses() {
  const container = document.getElementById("classesContainer");
  if (myClasses.length === 0) {
    container.innerHTML = "<p>Nenhuma aula agendada.</p>";
    return;
  }

  // Para cada aula, buscar quantos alunos estão inscritos
  const classesWithEnrollments = await Promise.all(
    myClasses.map(async (c) => {
      try {
        const res = await fetch(`${API_URL}/instructor/classes/${c.id}/participants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          console.error(`Erro ao buscar alunos da aula ${c.id}: HTTP ${res.status}`);
          return { ...c, enrolledCount: '?' }; // Mostrar ? quando houver erro
        }
        
        const students = await res.json();
        console.log(`Aula ${c.id} (${c.name}): ${students.length} alunos`, students);
        return { ...c, enrolledCount: students.length || 0 };
      } catch (e) {
        console.error(`Erro ao buscar alunos da aula ${c.id}:`, e);
        return { ...c, enrolledCount: '?' }; // Mostrar ? quando houver erro
      }
    })
  );

  container.innerHTML = classesWithEnrollments
    .map(
      (c) => `
          <div style="background:#fff; padding:1.5rem; margin-bottom:1rem; border-radius:8px; border:1px solid #eee; cursor: pointer; transition: all 0.2s;" 
               onmouseover="this.style.borderColor='#667eea'" 
               onmouseout="this.style.borderColor='#eee'"
               onclick="openClassDetailsModal(${c.id})">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                      <h3 style="color:#333; margin-bottom:0.5rem;">${c.name || c.nome_aula}</h3>
                      <p style="color:#666;">📅 ${formatDateBR(c.date || c.data)} &nbsp; ⏰ ${c.time || c.hora} </p>
                      <p style="color:#667eea; font-weight: 500; margin-top: 0.5rem;">
                          👥 ${c.enrolledCount}/${c.slots_limit || c.limite_vagas} alunos inscritos
                      </p>
                  </div>
              </div>
          </div>
      `,
    )
    .join("");
}

// CORREÇÃO: Setar data mínima ao criar aula
window.openCreateClassTab = () => {
  document.querySelector('[data-section="create-class"]').click();
  
  // Setar data mínima como hoje
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("classDate").setAttribute('min', today);
  document.getElementById("classDate").value = today;
};

// Função para validar data e mostrar mensagem customizada em português
function validateDate(inputElement) {
  const selectedDate = new Date(inputElement.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    inputElement.setCustomValidity('Por favor, selecione uma data que não seja anterior a hoje.');
    return false;
  } else {
    inputElement.setCustomValidity(''); // Limpar mensagem de erro
    return true;
  }
}

// CORREÇÃO: Create/Edit Class Form com validação de data
document
  .getElementById("createClassForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("classId").value;
    const dateInput = document.getElementById("classDate");
    const dateValue = dateInput.value;
    
    // VALIDAÇÃO: Não permitir datas passadas
    if (!validateDate(dateInput)) {
      showAlert("Não é possível agendar aulas para datas passadas!", "error");
      dateInput.reportValidity(); // Mostrar mensagem customizada
      return;
    }
    
    const data = {
      name: document.getElementById("className").value,
      date: dateValue,
      time: document.getElementById("classTime").value,
      slots_limit: parseInt(document.getElementById("classLimit").value),
    };

    try {
      const url = id
        ? `${API_URL}/instructor/classes/${id}`
        : `${API_URL}/instructor/classes`;
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        showAlert(id ? "Aula atualizada!" : "Aula agendada com sucesso!");
        if (id) {
          cancelClassEdit();
        } else {
          document.getElementById("createClassForm").reset();
        }
        loadClasses();
      } else {
        const err = await res.json();
        showAlert(err.error || "Erro ao salvar", "error");
      }
    } catch (e) {
      showAlert("Erro de conexão", "error");
    }
  });

window.editClass = (id) => {
  const c = myClasses.find((x) => x.id === id);
  if (!c) return;

  // Populate Create Tab
  document.getElementById("classId").value = c.id;
  document.getElementById("className").value = c.name || c.nome_aula;
  document.getElementById("classDate").value = c.date || c.data;
  document.getElementById("classTime").value = c.time || c.hora;
  document.getElementById("classLimit").value = c.slots_limit || c.limite_vagas;

  // Switch to Create Tab
  document.querySelector('[data-section="create-class"]').click();

  // Modify UI for Edit
  document.getElementById("classFormTitle").textContent = "Editar Aula";
  document.getElementById("saveClassBtn").textContent = "Salvar Alterações";
  document.getElementById("cancelClassEditBtn").style.display = "inline-block";

  document.querySelector(".main-content").scrollTop = 0;
};

window.cancelClassEdit = () => {
  document.getElementById("createClassForm").reset();
  document.getElementById("classId").value = "";
  document.getElementById("classFormTitle").textContent = "Criar Nova Aula";
  document.getElementById("saveClassBtn").textContent = "Agendar Aula";
  document.getElementById("cancelClassEditBtn").style.display = "none";
};

window.deleteClass = async (id) => {
  showConfirmModal(
    "Tem certeza que deseja cancelar esta aula?",
    async () => {
      try {
        const res = await fetch(`${API_URL}/instructor/classes/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          showAlert("Aula cancelada!");
          loadClasses();
        } else {
          const err = await res.json();
          showAlert(err.error || "Erro ao cancelar", "error");
        }
      } catch (e) {
        console.error(e);
        showAlert("Erro de conexão", "error");
      }
    },
  );
};

// --- NOVO: Modal de Detalhes da Aula ---
let currentClassInModal = null;

async function openClassDetailsModal(classId) {
  currentClassInModal = classId;
  const classData = allClasses.find(c => c.id === classId);
  
  if (!classData) return;
  
  // Preencher dados
  document.getElementById("detailsClassId").value = classData.id;
  document.getElementById("detailsClassName").value = classData.name || classData.nome_aula;
  document.getElementById("detailsClassDate").value = classData.date || classData.data;
  document.getElementById("detailsClassTime").value = classData.time || classData.hora;
  document.getElementById("detailsClassLimit").value = classData.slots_limit || classData.limite_vagas;
  
  // Setar data mínima
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("detailsClassDate").setAttribute('min', today);
  
  // Buscar alunos inscritos
  try {
    const res = await fetch(`${API_URL}/instructor/classes/${classId}/participants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const students = await res.json();
    console.log("Alunos inscritos na aula:", students); // DEBUG
    
    const studentsList = document.getElementById("enrolledStudentsList");
    if (!students || students.length === 0) {
      studentsList.innerHTML = '<p style="color: #666; font-style: italic;">Nenhum aluno inscrito ainda.</p>';
    } else {
      studentsList.innerHTML = students.map(s => `
        <div style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
            ${(s.name || s.nome || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 500; color: #333;">${s.name || s.nome || 'Sem nome'}</div>
            <div style="font-size: 0.875rem; color: #666;">${s.email || 'Sem email'}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error("Erro ao carregar alunos inscritos:", e);
    document.getElementById("enrolledStudentsList").innerHTML = `<p style="color: #e53e3e;">Erro ao carregar alunos: ${e.message}</p>`;
  }
  
  document.getElementById("classDetailsModal").classList.add("active");
}

function closeClassDetailsModal() {
  document.getElementById("classDetailsModal").classList.remove("active");
  currentClassInModal = null;
}

// Submit do formulário de edição no modal
document.getElementById("editClassForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const id = document.getElementById("detailsClassId").value;
  const dateInput = document.getElementById("detailsClassDate");
  const dateValue = dateInput.value;
  
  // VALIDAÇÃO: Não permitir datas passadas
  if (!validateDate(dateInput)) {
    showAlert("Não é possível agendar aulas para datas passadas!", "error");
    dateInput.reportValidity(); // Mostrar mensagem customizada
    return;
  }
  
  const data = {
    name: document.getElementById("detailsClassName").value,
    date: dateValue,
    time: document.getElementById("detailsClassTime").value,
    slots_limit: parseInt(document.getElementById("detailsClassLimit").value),
  };

  try {
    const res = await fetch(`${API_URL}/instructor/classes/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      showAlert("Aula atualizada com sucesso!");
      closeClassDetailsModal();
      loadClasses();
    } else {
      const err = await res.json();
      showAlert(err.error || "Erro ao atualizar", "error");
    }
  } catch (e) {
    showAlert("Erro de conexão", "error");
  }
});

// Deletar aula do modal
function deleteClassFromModal() {
  const classId = document.getElementById("detailsClassId").value;
  closeClassDetailsModal();
  deleteClass(parseInt(classId));
}

loadUserInfo();
loadTemplates();

// Setar data mínima e adicionar validação customizada ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("classDate").setAttribute('min', today);
  
  // Adicionar listeners para validação customizada nos campos de data
  const classDateInput = document.getElementById("classDate");
  const detailsClassDateInput = document.getElementById("detailsClassDate");
  
  if (classDateInput) {
    classDateInput.addEventListener('input', function() {
      validateDate(this);
    });
  }
  
  if (detailsClassDateInput) {
    detailsClassDateInput.addEventListener('input', function() {
      validateDate(this);
    });
  }
});
