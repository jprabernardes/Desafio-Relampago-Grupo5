const API_URL = "/api";

// ========== FUNÇÕES DE VALIDAÇÃO E SANITIZAÇÃO ==========

// Sanitiza entrada numérica
function sanitizeNumberInput(value, options = {}) {
  const { allowDecimals = false, max = null, min = null, step = 1 } = options;

  // Remove tudo exceto números e ponto decimal (se permitido)
  let cleaned = allowDecimals
    ? value.toString().replace(/[^\d.]/g, "")
    : value.toString().replace(/\D/g, "");

  // Se permite decimais, garante apenas um ponto
  if (allowDecimals) {
    const parts = cleaned.split(".");
    cleaned =
      parts[0] +
      (parts.length > 1 ? "." + parts.slice(1).join("").substring(0, 1) : "");
  }

  // Converte para número
  let num = allowDecimals ? parseFloat(cleaned) || 0 : parseInt(cleaned) || 0;

  // Aplica limites
  if (min !== null && num < min) num = min;
  if (max !== null && num > max) num = max;

  // Arredonda para step se necessário
  if (allowDecimals && step) {
    num = Math.round(num / step) * step;
  }

  return num;
}

// Valida formulário de exercício
function validateExerciseForm() {
  const errors = [];
  const name = document.getElementById("exName").value.trim();
  const description = document.getElementById("exDescription").value.trim();
  const series = parseInt(document.getElementById("exSeries").value) || 0;
  const repetitions =
    parseInt(document.getElementById("exRepetitions").value) || 0;
  const weight = parseFloat(document.getElementById("exWeight").value) || 0;

  // Validação de nome
  if (!name) {
    errors.push({ field: "exName", message: "Nome é obrigatório" });
  } else if (name.length < 3) {
    errors.push({
      field: "exName",
      message: "Nome deve ter no mínimo 3 caracteres",
    });
  } else if (name.length > 100) {
    errors.push({
      field: "exName",
      message: "Nome deve ter no máximo 100 caracteres",
    });
  }

  // Validação de descrição
  if (!description) {
    errors.push({ field: "exDescription", message: "Descrição é obrigatória" });
  } else if (description.length < 10) {
    errors.push({
      field: "exDescription",
      message: "Descrição deve ter no mínimo 10 caracteres",
    });
  } else if (description.length > 500) {
    errors.push({
      field: "exDescription",
      message: "Descrição deve ter no máximo 500 caracteres",
    });
  }

  // Validação de séries
  if (!series || series < 1) {
    errors.push({ field: "exSeries", message: "Séries deve ser no mínimo 1" });
  } else if (series > 20) {
    errors.push({ field: "exSeries", message: "Séries deve ser no máximo 20" });
  }

  // Validação de repetições
  if (!repetitions || repetitions < 1) {
    errors.push({
      field: "exRepetitions",
      message: "Repetições deve ser no mínimo 1",
    });
  } else if (repetitions > 100) {
    errors.push({
      field: "exRepetitions",
      message: "Repetições deve ser no máximo 100",
    });
  }

  // Validação de peso
  if (weight < 0) {
    errors.push({ field: "exWeight", message: "Peso não pode ser negativo" });
  } else if (weight > 500) {
    errors.push({
      field: "exWeight",
      message: "Peso deve ser no máximo 500kg",
    });
  }

  return { valid: errors.length === 0, errors };
}

// Valida formulário de treino
function validateTrainingForm() {
  const errors = [];
  const name = document.getElementById("trainingName")?.value.trim() || "";
  // Acessa a variável selectedExercises do escopo do módulo ou global
  const exercises = selectedExercises || window.selectedExercises || [];

  // Validação de nome
  if (!name) {
    errors.push({
      field: "trainingName",
      message: "Nome do treino é obrigatório",
    });
  } else if (name.length < 3) {
    errors.push({
      field: "trainingName",
      message: "Nome deve ter no mínimo 3 caracteres",
    });
  } else if (name.length > 50) {
    errors.push({
      field: "trainingName",
      message: "Nome deve ter no máximo 50 caracteres",
    });
  }

  // Validação de exercícios
  if (exercises.length === 0) {
    errors.push({
      field: "selectedExercises",
      message: "Selecione pelo menos um exercício",
    });
  }

  // Validação de parâmetros de cada exercício
  exercises.forEach((sel, idx) => {
    if (sel.series < 1 || sel.series > 20) {
      errors.push({
        field: `exercise-${idx}-series`,
        message: `Séries do exercício ${idx + 1} deve ser entre 1 e 20`,
      });
    }
    if (sel.repetitions < 1 || sel.repetitions > 100) {
      errors.push({
        field: `exercise-${idx}-repetitions`,
        message: `Repetições do exercício ${idx + 1} deve ser entre 1 e 100`,
      });
    }
    if (sel.weight < 0 || sel.weight > 500) {
      errors.push({
        field: `exercise-${idx}-weight`,
        message: `Peso do exercício ${idx + 1} deve ser entre 0 e 500kg`,
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

// Valida formulário de aula
function validateClassForm() {
  const errors = [];
  const name = document.getElementById("className").value.trim();
  const date = document.getElementById("classDate").value;
  const time = document.getElementById("classTime").value;
  const limit = parseInt(document.getElementById("classLimit").value) || 0;

  // Validação de nome
  if (!name) {
    errors.push({ field: "className", message: "Nome é obrigatório" });
  } else if (name.length < 3) {
    errors.push({
      field: "className",
      message: "Nome deve ter no mínimo 3 caracteres",
    });
  } else if (name.length > 100) {
    errors.push({
      field: "className",
      message: "Nome deve ter no máximo 100 caracteres",
    });
  }

  // Validação de data
  if (!date) {
    errors.push({ field: "classDate", message: "Data é obrigatória" });
  } else {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      errors.push({
        field: "classDate",
        message: "Data não pode ser no passado",
      });
    }
  }

  // Validação de hora
  if (!time) {
    errors.push({ field: "classTime", message: "Hora é obrigatória" });
  } else {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      errors.push({
        field: "classTime",
        message: "Hora inválida. Use formato HH:MM",
      });
    }
  }

  // Validação de limite
  if (!limit || limit < 1) {
    errors.push({
      field: "classLimit",
      message: "Limite de vagas deve ser no mínimo 1",
    });
  } else if (limit > 1000) {
    errors.push({
      field: "classLimit",
      message: "Limite de vagas deve ser no máximo 1000",
    });
  }

  return { valid: errors.length === 0, errors };
}

// Exibe erros de validação
function showValidationErrors(errors) {
  // Remove erros anteriores
  document.querySelectorAll(".error-message").forEach((el) => el.remove());
  document
    .querySelectorAll(".invalid-input")
    .forEach((el) => el.classList.remove("invalid-input"));
  document
    .querySelectorAll(".valid-input")
    .forEach((el) => el.classList.remove("valid-input"));

  // Adiciona novos erros
  errors.forEach((error) => {
    const field = document.getElementById(error.field);
    if (field) {
      field.classList.add("invalid-input");
      const errorMsg = document.createElement("span");
      errorMsg.className = "error-message";
      errorMsg.textContent = error.message;
      field.parentElement.appendChild(errorMsg);
    }
  });
}

// Limpa erros de validação
function clearValidationErrors() {
  document.querySelectorAll(".error-message").forEach((el) => el.remove());
  document
    .querySelectorAll(".invalid-input")
    .forEach((el) => el.classList.remove("invalid-input"));
  document
    .querySelectorAll(".valid-input")
    .forEach((el) => el.classList.remove("valid-input"));
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

    if (sectionId === "create-exercise") loadTemplates();
    if (sectionId === "students") loadStudents();
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

async function logout() {
  await fetch(`${API_URL}/auth/logout`, { method: "DELETE" });
  window.location.href = "/";
}

async function loadUserInfo() {
  const res = await fetch(`${API_URL}/auth/me`);
  const data = await res.json();
  document.getElementById("userName").textContent =
    data.name || data.nome || "Instrutor";

  if (data.error) {
    document.cookie = "";
    window.location.href = "/";
  }

  // Ensure user is instructor
  if (data.role && data.role !== "instrutor") {
    alert("Acesso negado. Você não é instrutor.");
    logout();
  }
}

// --- Templates ---
let templates = [];

async function loadTemplates() {
  try {
    const res = await fetch(`${API_URL}/instructor/exercises`);
    templates = await res.json();
    allExercisesForDetail = templates; // Para uso no modal de detalhes
    renderTemplates();
  } catch (e) {
    console.error(e);
  }
}

// Função unificada para renderizar cards de exercício
function renderExerciseCard(exercise, options = {}) {
  const {
    showActions = false,
    showDescription = true,
    showStats = true,
    showHint = false,
    onClick = null,
    cardClass = "template-card",
    cardId = null,
    allowDetailView = true,
  } = options;

  // Determinar evento de clique apenas para seleção (não abre modal)
  let clickHandler = "";
  if (onClick) {
    clickHandler = `onclick="${onClick}" style="cursor: pointer;"`;
  }

  const idAttr = cardId ? `id="${cardId}"` : "";

  // Ícone de info para abrir modal de detalhes (sempre visível se allowDetailView)
  const infoIcon = allowDetailView
    ? `
    <button class="template-action-btn" 
            title="Ver detalhes do exercício"
                  onclick="event.stopPropagation(); event.preventDefault(); openExerciseDetailModal(${exercise.id}, event); return false;">
      ℹ️
    </button>
  `
    : "";

  return `
    <div class="${cardClass}" ${clickHandler} ${idAttr}>
      <h4>${exercise.name}</h4>
      ${showDescription && exercise.description ? `<p class="exercise-info">${exercise.description}</p>` : ""}
      ${
        showStats
          ? `
        <div class="exercise-stats">
          <span>📊 ${exercise.series || 0} séries x ${exercise.repetitions || 0} repetições</span>
          <span>⚖️ ${exercise.weight || 0} kg</span>
        </div>
      `
          : ""
      }
      ${showHint ? `<p class="exercise-hint">Clique para selecionar e personalizar</p>` : ""}
      ${
        showActions || allowDetailView
          ? `
        <div class="template-actions" onclick="event.stopPropagation()">
          ${infoIcon}
          ${
            showActions
              ? `
            <button class="template-action-btn" title="Editar" onclick="event.stopPropagation(); editTemplate(${exercise.id})">✏️</button>
            <button class="template-action-btn" title="Excluir" onclick="event.stopPropagation(); deleteTemplate(${exercise.id})">🗑️</button>
          `
              : ""
          }
        </div>
      `
          : ""
      }
    </div>
  `;
}

// Modal de detalhes do exercício
let allExercisesForDetail = [];

window.openExerciseDetailModal = (exerciseId, event) => {
  // Prevenir que o evento feche outros modais
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const exercise =
    allExercisesForDetail.find((e) => e.id === exerciseId) ||
    templates.find((t) => t.id === exerciseId) ||
    allExercisesForTraining.find((e) => e.id === exerciseId);

  if (!exercise) {
    showAlert("Exercício não encontrado", "error");
    return;
  }

  const content = document.getElementById("exerciseDetailContent");
  if (!content) return;

  content.innerHTML = `
    <div style="padding: 1rem 0;">
      <h3 style="color: #333; margin-bottom: 1rem; font-size: 1.5rem;">${exercise.name}</h3>
      
      <div style="margin-bottom: 1.5rem;">
        <h4 style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">Descrição</h4>
        <p style="color: #333; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; hyphens: auto; overflow: hidden;">${exercise.description || "Sem descrição"}</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1.5rem;">
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">Séries</div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${exercise.series || 0}</div>
        </div>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">Repetições</div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${exercise.repetitions || 0}</div>
        </div>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">Peso</div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${exercise.weight || 0} kg</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("exerciseDetailModal").classList.add("active");
};

window.closeExerciseDetailModal = () => {
  document.getElementById("exerciseDetailModal").classList.remove("active");
};

// Variáveis de paginação e busca
let templatesSearchFilter = "";
let templatesCurrentPage = 1;
let templatesPageSize = 12;
let studentsCurrentPage = 1;
let studentsPageSize = 12;

function renderTemplates() {
  const list = document.getElementById("templatesList");

  // Filtrar templates para gerenciamento
  let filteredTemplates = templates;
  if (templatesSearchFilter) {
    const searchTerm = templatesSearchFilter.toLowerCase();
    filteredTemplates = templates.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(searchTerm) ||
        (t.description || "").toLowerCase().includes(searchTerm),
    );
  }

  // Paginar templates para gerenciamento
  const totalPages = Math.ceil(filteredTemplates.length / templatesPageSize);
  const startIndex = (templatesCurrentPage - 1) * templatesPageSize;
  const paginatedTemplates = filteredTemplates.slice(
    startIndex,
    startIndex + templatesPageSize,
  );

  // Renderizar para Gerenciamento (Editar/Excluir)
  if (list) {
    if (paginatedTemplates.length === 0) {
      list.innerHTML = "<p>Nenhum template encontrado.</p>";
    } else {
      list.innerHTML = paginatedTemplates
        .map((t) =>
          renderExerciseCard(t, {
            showActions: true,
            showDescription: true,
            showStats: true,
            showHint: false,
            onClick: null,
            allowDetailView: true,
          }),
        )
        .join("");
    }
    renderPagination(
      "templatesPagination",
      templatesCurrentPage,
      totalPages,
      (page) => {
        templatesCurrentPage = page;
        renderTemplates();
      },
    );
  }
}

// --- Students (cards + search) ---
let allStudents = [];
let filteredStudents = [];

async function loadStudents() {
  try {
    const res = await fetch(`${API_URL}/instructor/students`);
    if (!res.ok) throw new Error("Erro ao carregar alunos");
    allStudents = await res.json();
    filteredStudents = allStudents;
    renderStudents();
  } catch (e) {
    console.error(e);
    const grid = document.getElementById("studentsGrid");
    if (grid) grid.innerHTML = "<p>Erro ao carregar alunos.</p>";
  }
}

function renderStudents() {
  const grid = document.getElementById("studentsGrid");
  if (!grid) return;

  if (!filteredStudents || filteredStudents.length === 0) {
    grid.innerHTML = "<p>Nenhum aluno encontrado.</p>";
    renderPagination("studentsPagination", 1, 1, () => {});
    return;
  }

  // Paginar alunos
  const totalPages = Math.ceil(filteredStudents.length / studentsPageSize);
  const startIndex = (studentsCurrentPage - 1) * studentsPageSize;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + studentsPageSize,
  );

  grid.innerHTML = paginatedStudents
    .map((s) => {
      const name = s.name || s.nome || "Aluno";
      const email = s.email || "";
      return `
        <div class="student-card" onclick="openStudent(${s.id})">
          <h4>${name}</h4>
          <p>${email}</p>
        </div>
      `;
    })
    .join("");

  renderPagination(
    "studentsPagination",
    studentsCurrentPage,
    totalPages,
    (page) => {
      studentsCurrentPage = page;
      renderStudents();
    },
  );
}

// --- Modal Detalhes do Aluno ---
let currentStudentId = null;
let studentTrainings = [];
let allExercisesForTraining = [];
let selectedExercises = []; // Array de { exerciseId, series, repetitions, weight }
window.selectedExercises = selectedExercises; // Tornar acessível globalmente
let isEditingTraining = false;
let currentTrainingId = null;

window.openStudent = async (studentId) => {
  currentStudentId = studentId;
  await openStudentDetailModal(studentId);
};

async function openStudentDetailModal(studentId) {
  currentStudentId = studentId;
  const modal = document.getElementById("studentDetailModal");
  if (!modal) {
    console.error("Modal studentDetailModal não encontrado");
    return;
  }
  modal.classList.add("active");
  await Promise.all([
    loadStudentData(studentId),
    loadStudentTrainings(studentId),
    loadExercisesForTraining(),
  ]);
}

window.closeStudentDetailModal = function () {
  const modal = document.getElementById("studentDetailModal");
  if (modal) {
    modal.classList.remove("active");
  }
  currentStudentId = null;
  studentTrainings = [];
};

async function loadStudentData(studentId) {
  try {
    const res = await fetch(`${API_URL}/instructor/students/${studentId}`);
    if (!res.ok) throw new Error("Erro ao carregar aluno");
    const student = await res.json();
    document.getElementById("studentName").textContent =
      student.name || student.nome || "Aluno";
    document.getElementById("studentEmail").textContent = student.email
      ? `📧 ${student.email}`
      : "";
    const phoneElement = document.getElementById("studentPhone");
    if (phoneElement) {
      phoneElement.textContent = student.phone ? `📞 ${student.phone}` : "";
    }
  } catch (e) {
    console.error(e);
    showStudentAlert("Erro ao carregar dados do aluno", "error");
  }
}

async function loadStudentTrainings(studentId) {
  try {
    const res = await fetch(
      `${API_URL}/instructor/students/${studentId}/trainings`,
    );
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        errorData.error || errorData.message || "Erro ao carregar treinos",
      );
    }
    studentTrainings = await res.json();
    renderStudentTrainings();
  } catch (e) {
    console.error(e);
    showStudentAlert(e.message || "Erro ao carregar treinos", "error");
    // Limpar lista para evitar dados antigos
    studentTrainings = [];
    renderStudentTrainings();
  }
}

async function loadExercisesForTraining() {
  try {
    const res = await fetch(`${API_URL}/instructor/exercises`);
    if (!res.ok) throw new Error("Erro ao carregar exercícios");
    allExercisesForTraining = await res.json();
    allExercisesForDetail = allExercisesForTraining; // Para uso no modal de detalhes
  } catch (e) {
    console.error(e);
    showStudentAlert("Erro ao carregar exercícios", "error");
  }
}

function renderStudentTrainings() {
  const grid = document.getElementById("trainingsGrid");
  if (!grid) return;

  if (!studentTrainings || studentTrainings.length === 0) {
    grid.innerHTML = "<p>Nenhum treino cadastrado.</p>";
    return;
  }

  grid.innerHTML = studentTrainings
    .map((t) => {
      const exerciseCount = t.exercises ? t.exercises.length : 0;
      return `
        <div class="training-card" onclick="openEditTrainingModal(${t.id})">
          <h3>${t.name || "Treino"}</h3>
          <p>📋 ${exerciseCount} exercício${exerciseCount !== 1 ? "s" : ""}</p>
          <p style="color: #999; font-size: 0.85rem;">Clique para editar</p>
        </div>
      `;
    })
    .join("");
}

function showStudentAlert(msg, type = "success") {
  const el = document.getElementById("studentAlert");
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  setTimeout(() => el.classList.remove("show"), 3000);
}

const studentsSearchInput = document.getElementById("studentsSearch");
// Função de paginação
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let paginationHTML = '<div class="pagination-controls">';

  // Botão anterior
  if (currentPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="(${onPageChange.toString()})(${currentPage - 1})">« Anterior</button>`;
  }

  // Números de página
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="(${onPageChange.toString()})(1)">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHTML += `<button class="pagination-btn active">${i}</button>`;
    } else {
      paginationHTML += `<button class="pagination-btn" onclick="(${onPageChange.toString()})(${i})">${i}</button>`;
    }
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="(${onPageChange.toString()})(${totalPages})">${totalPages}</button>`;
  }

  // Botão próximo
  if (currentPage < totalPages) {
    paginationHTML += `<button class="pagination-btn" onclick="(${onPageChange.toString()})(${currentPage + 1})">Próximo »</button>`;
  }

  paginationHTML += "</div>";
  container.innerHTML = paginationHTML;
}

// Event listeners para busca
document.getElementById("studentsSearch")?.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  filteredStudents = allStudents.filter(
    (s) =>
      (s.name || s.nome || "").toLowerCase().includes(term) ||
      (s.email || "").toLowerCase().includes(term),
  );
  studentsCurrentPage = 1; // Resetar para primeira página
  renderStudents();
});

// Busca de templates na aba de criar exercício
const templatesSearchInput = document.getElementById("templatesSearch");
if (templatesSearchInput) {
  templatesSearchInput.addEventListener("input", (e) => {
    templatesSearchFilter = e.target.value;
    templatesCurrentPage = 1; // Resetar para primeira página
    renderTemplates();
  });
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

  // Atualizar contador de caracteres
  const counter = document.getElementById("exDescriptionCounter");
  if (counter) {
    const length = (t.description || "").length;
    counter.textContent = `${length}/500 caracteres`;
    counter.className = "char-counter" + (length > 450 ? " warning" : "");
  }

  document.getElementById("formTitle").textContent = "Editar Template";
  document.getElementById("saveBtn").textContent = "Atualizar Template";
  document.getElementById("cancelEditBtn").style.display = "inline-block";

  clearValidationErrors();
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
  clearValidationErrors();
  const counter = document.getElementById("exDescriptionCounter");
  if (counter) counter.textContent = "0/500 caracteres";
};

window.deleteTemplate = async (id) => {
  showConfirmModal(
    "Tem certeza que deseja excluir este template?",
    async () => {
      try {
        const res = await fetch(`${API_URL}/instructor/exercises/${id}`, {
          method: "DELETE",
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

// Máscaras e validações em tempo real - Formulário de Exercício
document.getElementById("exSeries")?.addEventListener("input", (e) => {
  const sanitized = sanitizeNumberInput(e.target.value, { max: 20, min: 1 });
  e.target.value = sanitized;
  clearValidationErrors();
});

document.getElementById("exRepetitions")?.addEventListener("input", (e) => {
  const sanitized = sanitizeNumberInput(e.target.value, { max: 100, min: 1 });
  e.target.value = sanitized;
  clearValidationErrors();
});

document.getElementById("exWeight")?.addEventListener("input", (e) => {
  const sanitized = sanitizeNumberInput(e.target.value, {
    allowDecimals: true,
    max: 500,
    min: 0,
    step: 0.5,
  });
  e.target.value = sanitized;
  clearValidationErrors();
});

document.getElementById("exDescription")?.addEventListener("input", (e) => {
  const length = e.target.value.length;
  const counter = document.getElementById("exDescriptionCounter");
  if (counter) {
    counter.textContent = `${length}/500 caracteres`;
    counter.className =
      "char-counter" +
      (length > 450 ? " warning" : length > 500 ? " error" : "");
  }
  clearValidationErrors();
});

document
  .getElementById("createExerciseForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validação
    const validation = validateExerciseForm();
    if (!validation.valid) {
      showValidationErrors(validation.errors);
      showAlert("Corrija os erros no formulário", "error");
      return;
    }

    clearValidationErrors();

    const id = document.getElementById("exId").value;
    const data = {
      name: document.getElementById("exName").value.trim(),
      description: document.getElementById("exDescription").value.trim(),
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

// --- Gerenciamento de Aulas ---
let myClasses = [];
let allClasses = [];

async function loadClasses() {
  try {
    const res = await fetch(`${API_URL}/instructor/classes`);
    myClasses = await res.json();
    allClasses = [...myClasses]; // Cópia para filtro
    renderClasses();
  } catch (e) {
    console.error(e);
  }
}

// Formatar data para dd/mm/yyyy
function formatDateBR(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// Converte data do input HTML (YYYY-MM-DD) para formato backend (DD-MM-YYYY)
function convertDateForBackend(dateStr) {
  if (!dateStr) return '';
  console.log("convertDateForBackend - INPUT:", dateStr);
  const [year, month, day] = dateStr.split('-');
  const result = `${day}-${month}-${year}`;
  console.log("convertDateForBackend - OUTPUT:", result);
  return result;
}

// Converte data do backend (DD-MM-YYYY) para input HTML (YYYY-MM-DD)
function convertDateFromBackend(dateStr) {
  if (!dateStr) return '';
  console.log("convertDateFromBackend - INPUT:", dateStr);
  const [day, month, year] = dateStr.split('-');
  const result = `${year}-${month}-${day}`;
  console.log("convertDateFromBackend - OUTPUT:", result);
  return result;
}

// CORREÇÃO: Função de filtro de aulas
function filterClasses() {
  const searchTerm = document
    .getElementById("classSearchInput")
    .value.toLowerCase();

  if (searchTerm) {
    myClasses = allClasses.filter((c) =>
      (c.name || c.nome_aula || "").toLowerCase().includes(searchTerm),
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
        const res = await fetch(
          `${API_URL}/instructor/classes/${c.id}/participants`,
        );

        if (!res.ok) {
          console.error(
            `Erro ao buscar alunos da aula ${c.id}: HTTP ${res.status}`,
          );
          return { ...c, enrolledCount: "?" }; // Mostrar ? quando houver erro
        }

        const students = await res.json();
        return { ...c, enrolledCount: students.length || 0 };
      } catch (e) {
        console.error(`Erro ao buscar alunos da aula ${c.id}:`, e);
        return { ...c, enrolledCount: "?" }; // Mostrar ? quando houver erro
      }
    }),
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

window.openCreateClassTab = () => {
  document.querySelector('[data-section="create-class"]').click();

  // Setar data mínima como hoje
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("classDate").setAttribute("min", today);
  document.getElementById("classDate").value = today;
};

// Função para validar data e mostrar mensagem customizada em português
function validateDate(inputElement) {
  const selectedDate = new Date(inputElement.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    inputElement.setCustomValidity(
      "Por favor, selecione uma data que não seja anterior a hoje.",
    );
    return false;
  } else {
    inputElement.setCustomValidity(""); // Limpar mensagem de erro
    return true;
  }
}

// Máscaras e validações em tempo real - Formulário de Aula
document.getElementById("classLimit")?.addEventListener("input", (e) => {
  const sanitized = sanitizeNumberInput(e.target.value, { max: 1000, min: 1 });
  e.target.value = sanitized;
  clearValidationErrors();
});

document.getElementById("classDate")?.addEventListener("change", (e) => {
  const selectedDate = new Date(e.target.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    e.target.classList.add("invalid-input");
    const errorMsg = document.createElement("span");
    errorMsg.className = "error-message";
    errorMsg.textContent = "Data não pode ser no passado";
    if (!e.target.parentElement.querySelector(".error-message")) {
      e.target.parentElement.appendChild(errorMsg);
    }
  } else {
    e.target.classList.remove("invalid-input");
    const errorMsg = e.target.parentElement.querySelector(".error-message");
    if (errorMsg) errorMsg.remove();
  }
});

// Create/Edit Class Form
document
  .getElementById("createClassForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validação
    const validation = validateClassForm();
    if (!validation.valid) {
      showValidationErrors(validation.errors);
      showAlert("Corrija os erros no formulário", "error");
      return;
    }

    clearValidationErrors();

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
      date: convertDateForBackend(dateValue), // Converte YYYY-MM-DD para DD-MM-YYYY
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
  showConfirmModal("Tem certeza que deseja cancelar esta aula?", async () => {
    try {
      const res = await fetch(`${API_URL}/instructor/classes/${id}`, {
        method: "DELETE",
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
  });
};

let currentClassInModal = null;

async function openClassDetailsModal(classId) {
  currentClassInModal = classId;
  const classData = allClasses.find((c) => c.id === classId);

  if (!classData) return;

  // Preencher dados
  document.getElementById("detailsClassId").value = classData.id;
  document.getElementById("detailsClassName").value = classData.name || classData.nome_aula;
  document.getElementById("detailsClassDate").value = convertDateFromBackend(classData.date || classData.data);
  document.getElementById("detailsClassTime").value = classData.time || classData.hora;
  document.getElementById("detailsClassLimit").value = classData.slots_limit || classData.limite_vagas;
  
  // Setar data mínima
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("detailsClassDate").setAttribute("min", today);

  // Buscar alunos inscritos
  try {
    const res = await fetch(
      `${API_URL}/instructor/classes/${classId}/participants`,
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const students = await res.json();

    const studentsList = document.getElementById("enrolledStudentsList");
    if (!students || students.length === 0) {
      studentsList.innerHTML =
        '<p style="color: #666; font-style: italic;">Nenhum aluno inscrito ainda.</p>';
    } else {
      studentsList.innerHTML = students
        .map(
          (s) => `
        <div style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
            ${(s.name || s.nome || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 500; color: #333;">${s.name || s.nome || "Sem nome"}</div>
            <div style="font-size: 0.875rem; color: #666;">${s.email || "Sem email"}</div>
          </div>
        </div>
      `,
        )
        .join("");
    }
  } catch (e) {
    console.error("Erro ao carregar alunos inscritos:", e);
    document.getElementById("enrolledStudentsList").innerHTML =
      `<p style="color: #e53e3e;">Erro ao carregar alunos: ${e.message}</p>`;
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
  
  if (!validateDate(dateInput)) {
    showAlert("Não é possível agendar aulas para datas passadas!", "error");
    dateInput.reportValidity(); // Mostrar mensagem customizada
    return;
  }
  
  const data = {
    name: document.getElementById("detailsClassName").value,
    date: convertDateForBackend(dateValue), // Converte YYYY-MM-DD para DD-MM-YYYY
    time: document.getElementById("detailsClassTime").value,
    slots_limit: parseInt(document.getElementById("detailsClassLimit").value),
  };

    try {
      const res = await fetch(`${API_URL}/instructor/classes/${id}`, {
        method: "PUT",
        headers: {
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
window.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("classDate").setAttribute("min", today);

  // Adicionar listeners para validação customizada nos campos de data
  const classDateInput = document.getElementById("classDate");
  const detailsClassDateInput = document.getElementById("detailsClassDate");

  if (classDateInput) {
    classDateInput.addEventListener("input", function () {
      validateDate(this);
    });
  }

  if (detailsClassDateInput) {
    detailsClassDateInput.addEventListener("input", function () {
      validateDate(this);
    });
  }
});

// --- Modal Criar/Editar Treino (do aluno) ---
let exerciseSearchFilter = "";

function renderAvailableExercises() {
  const grid = document.getElementById("availableExercisesGrid");
  if (!grid) return;

  if (!allExercisesForTraining || allExercisesForTraining.length === 0) {
    grid.innerHTML =
      "<p>Nenhum exercício disponível. Crie exercícios primeiro.</p>";
    return;
  }

  // Filtrar exercícios baseado na busca
  const filteredExercises = exerciseSearchFilter
    ? allExercisesForTraining.filter((ex) => {
        const searchTerm = exerciseSearchFilter.toLowerCase();
        return (
          (ex.name || "").toLowerCase().includes(searchTerm) ||
          (ex.description || "").toLowerCase().includes(searchTerm)
        );
      })
    : allExercisesForTraining;

  if (filteredExercises.length === 0) {
    grid.innerHTML = "<p>Nenhum exercício encontrado com o termo de busca.</p>";
    return;
  }

  grid.innerHTML = filteredExercises
    .map(
      (ex) => `
      <div class="modal-exercise-card" id="ex-card-${ex.id}" 
           onclick="toggleExerciseSelection(${ex.id})"
           style="cursor: pointer;">
        <h4>${ex.name}</h4>
        ${ex.description ? `<p class="exercise-info">${ex.description}</p>` : ""}
        <div class="exercise-stats">
          <span>📊 ${ex.series || 0} séries x ${ex.repetitions || 0} repetições</span>
          <span>⚖️ ${ex.weight || 0} kg</span>
        </div>
        <p class="exercise-hint">Clique para selecionar e personalizar</p>
        <div class="template-actions" onclick="event.stopPropagation()">
          <button class="template-action-btn" 
                  title="Ver detalhes do exercício"
                  onclick="event.stopPropagation(); event.preventDefault(); openExerciseDetailModal(${ex.id}, event); return false;">
            ℹ️
          </button>
        </div>
      </div>
    `,
    )
    .join("");
}

// Event listener para busca de exercícios (adicionado dinamicamente quando necessário)
function setupExerciseSearchListener() {
  const searchInput = document.getElementById("exerciseSearchInput");
  if (searchInput && !searchInput.hasAttribute("data-listener-attached")) {
    searchInput.setAttribute("data-listener-attached", "true");
    searchInput.addEventListener("input", (e) => {
      exerciseSearchFilter = e.target.value;
      renderAvailableExercises();
    });
  }
}

window.toggleExerciseSelection = (exerciseId) => {
  const exercise = allExercisesForTraining.find((e) => e.id === exerciseId);
  if (!exercise) return;

  const card = document.getElementById(`ex-card-${exerciseId}`);
  const index = selectedExercises.findIndex((e) => e.exerciseId === exerciseId);

  if (index >= 0) {
    // Remover
    selectedExercises.splice(index, 1);
    if (card) card.classList.remove("selected");
  } else {
    // Adicionar com valores padrão do template
    selectedExercises.push({
      exerciseId: exerciseId,
      series: exercise.series || 3,
      repetitions: exercise.repetitions || 12,
      weight: exercise.weight || 0,
    });
    if (card) card.classList.add("selected");
  }

  // Atualizar referência global
  window.selectedExercises = selectedExercises;

  renderSelectedExercises();
};

function renderSelectedExercises() {
  const list = document.getElementById("selectedExercisesList");
  if (!list) return;

  if (selectedExercises.length === 0) {
    list.innerHTML = "<p style='color: #666;'>Nenhum exercício selecionado</p>";
    return;
  }

  list.innerHTML = selectedExercises
    .map((sel, idx) => {
      const exercise = allExercisesForTraining.find(
        (e) => e.id === sel.exerciseId,
      );
      if (!exercise) return "";

      return `
        <div class="exercise-item">
          <div class="exercise-item-info">
            <h4>${exercise.name}</h4>
          </div>
          <div class="exercise-item-params">
            <div class="param-group">
              <label>Séries</label>
              <input
                type="number"
                min="1"
                max="20"
                value="${sel.series}"
                oninput="const val = sanitizeNumberInput(this.value, { max: 20, min: 1 }); this.value = val; updateExerciseParam(${idx}, 'series', val)"
              />
            </div>
            <div class="param-group">
              <label>Repetições</label>
              <input
                type="number"
                min="1"
                max="100"
                value="${sel.repetitions}"
                oninput="const val = sanitizeNumberInput(this.value, { max: 100, min: 1 }); this.value = val; updateExerciseParam(${idx}, 'repetitions', val)"
              />
            </div>
            <div class="param-group">
              <label>Carga (kg)</label>
              <select onchange="updateExerciseParam(${idx}, 'weight', this.value)">
                ${generateWeightOptions(sel.weight)}
              </select>
            </div>
            <button
              type="button"
              class="remove-exercise-btn"
              onclick="removeExerciseFromSelection(${idx})"
            >
              Remover
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function generateWeightOptions(currentWeight) {
  const options = [];
  for (let i = 0; i <= 500; i += 2.5) {
    options.push(
      `<option value="${i}" ${i === currentWeight ? "selected" : ""}>${i} kg</option>`,
    );
  }
  return options.join("");
}

window.updateExerciseParam = (index, param, value) => {
  if (selectedExercises[index]) {
    if (param === "weight") {
      const sanitized = sanitizeNumberInput(value, {
        allowDecimals: true,
        max: 500,
        min: 0,
        step: 0.5,
      });
      selectedExercises[index][param] = parseFloat(sanitized);
    } else if (param === "series") {
      const sanitized = sanitizeNumberInput(value, { max: 20, min: 1 });
      selectedExercises[index][param] = parseInt(sanitized);
    } else if (param === "repetitions") {
      const sanitized = sanitizeNumberInput(value, { max: 100, min: 1 });
      selectedExercises[index][param] = parseInt(sanitized);
    }
    window.selectedExercises = selectedExercises; // Atualizar referência global
  }
};

window.removeExerciseFromSelection = (index) => {
  const exerciseId = selectedExercises[index].exerciseId;
  selectedExercises.splice(index, 1);
  window.selectedExercises = selectedExercises; // Atualizar referência global
  const card = document.getElementById(`ex-card-${exerciseId}`);
  if (card) card.classList.remove("selected");
  renderSelectedExercises();
};

window.openCreateTrainingModal = () => {
  if (!currentStudentId) return;
  isEditingTraining = false;
  currentTrainingId = null;
  selectedExercises = [];
  window.selectedExercises = selectedExercises; // Atualizar referência global
  exerciseSearchFilter = ""; // Limpar filtro de busca
  document.getElementById("modalTitle").textContent = "Criar Treino";
  document.getElementById("trainingId").value = "";
  document.getElementById("trainingName").value = "";
  document.getElementById("deleteTrainingBtn").style.display = "none";
  const searchInput = document.getElementById("exerciseSearchInput");
  if (searchInput) searchInput.value = "";
  setupExerciseSearchListener(); // Configurar listener de busca
  document.getElementById("trainingModal").classList.add("active");
  renderAvailableExercises();
  renderSelectedExercises();
};

window.openEditTrainingModal = async (trainingId) => {
  try {
    isEditingTraining = true;
    currentTrainingId = trainingId;
    const training = studentTrainings.find((t) => t.id === trainingId);
    if (!training) {
      showStudentAlert("Treino não encontrado", "error");
      return;
    }

    // Carregar detalhes completos do treino (com exercícios e parâmetros)
    const res = await fetch(`${API_URL}/instructor/trainings/${trainingId}`);
    if (!res.ok) throw new Error("Erro ao carregar treino");

    const fullTraining = await res.json();

    document.getElementById("modalTitle").textContent = "Editar Treino";
    document.getElementById("trainingId").value = trainingId;
    document.getElementById("trainingName").value = fullTraining.name || "";
    document.getElementById("deleteTrainingBtn").style.display = "inline-block";
    exerciseSearchFilter = ""; // Limpar filtro de busca
    const searchInput = document.getElementById("exerciseSearchInput");
    if (searchInput) searchInput.value = "";
    setupExerciseSearchListener(); // Configurar listener de busca

    // Preencher exercícios selecionados com seus parâmetros
    selectedExercises = [];
    if (fullTraining.exercises && fullTraining.exercises.length > 0) {
      for (const ex of fullTraining.exercises) {
        selectedExercises.push({
          exerciseId: ex.id,
          series: ex.series || 3,
          repetitions: ex.repetitions || 12,
          weight: ex.weight || 0,
        });
      }
    }
    window.selectedExercises = selectedExercises; // Atualizar referência global

    renderAvailableExercises();
    renderSelectedExercises();
    document.getElementById("trainingModal").classList.add("active");
  } catch (e) {
    console.error(e);
    showStudentAlert("Erro ao carregar treino", "error");
  }
};

window.closeTrainingModal = () => {
  document.getElementById("trainingModal").classList.remove("active");
  selectedExercises = [];
  isEditingTraining = false;
  currentTrainingId = null;
};

window.deleteTraining = async () => {
  if (!currentTrainingId) return;

  showConfirmModal("Tem certeza que deseja deletar este treino?", async () => {
    try {
      const res = await fetch(
        `${API_URL}/instructor/trainings/${currentTrainingId}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        showStudentAlert("Treino deletado com sucesso!");
        closeTrainingModal();
        await loadStudentTrainings(currentStudentId);
      } else {
        const err = await res.json();
        showStudentAlert(err.error || "Erro ao deletar treino", "error");
      }
    } catch (e) {
      console.error(e);
      showStudentAlert("Erro ao deletar treino", "error");
    }
  });
};

// Event listener do formulário de treino
document
  .getElementById("trainingForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validação
    const validation = validateTrainingForm();
    if (!validation.valid) {
      validation.errors.forEach((err) => {
        showStudentAlert(err.message, "error");
      });
      return;
    }

    const name = document.getElementById("trainingName").value.trim();

    try {
      if (isEditingTraining && currentTrainingId) {
        // Atualizar treino existente
        const updateRes = await fetch(
          `${API_URL}/instructor/trainings/${currentTrainingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
          },
        );

        if (!updateRes.ok) {
          const err = await updateRes.json();
          throw new Error(err.error || "Erro ao atualizar treino");
        }

        // Buscar exercícios atuais do treino
        const currentRes = await fetch(
          `${API_URL}/instructor/trainings/${currentTrainingId}`,
        );
        const currentTraining = await currentRes.json();
        const currentExerciseIds = currentTraining.exercises
          ? currentTraining.exercises.map((e) => e.id)
          : [];

        const newExerciseIds = selectedExercises.map((e) => e.exerciseId);

        // Remover exercícios que não estão mais selecionados
        for (const exId of currentExerciseIds) {
          if (!newExerciseIds.includes(exId)) {
            await fetch(
              `${API_URL}/instructor/trainings/${currentTrainingId}/exercises/${exId}`,
              {
                method: "DELETE",
              },
            );
          }
        }

        // Adicionar/atualizar exercícios selecionados
        for (const sel of selectedExercises) {
          const exists = currentExerciseIds.includes(sel.exerciseId);
          if (!exists) {
            await fetch(
              `${API_URL}/instructor/trainings/${currentTrainingId}/exercises`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ exerciseId: sel.exerciseId }),
              },
            );
          }

          // Atualizar parâmetros do exercício no treino
          await fetch(
            `${API_URL}/instructor/trainings/${currentTrainingId}/exercises/${sel.exerciseId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                series: sel.series,
                repetitions: sel.repetitions,
                weight: sel.weight,
              }),
            },
          );
        }

        showStudentAlert("Treino atualizado com sucesso!");
      } else {
        // Criar novo treino
        const createRes = await fetch(`${API_URL}/instructor/trainings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            userIds: [parseInt(currentStudentId)],
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(err.error || "Erro ao criar treino");
        }

        const newTraining = await createRes.json();

        // Adicionar exercícios com parâmetros
        for (const sel of selectedExercises) {
          await fetch(
            `${API_URL}/instructor/trainings/${newTraining.id}/exercises`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ exerciseId: sel.exerciseId }),
            },
          );

          await fetch(
            `${API_URL}/instructor/trainings/${newTraining.id}/exercises/${sel.exerciseId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                series: sel.series,
                repetitions: sel.repetitions,
                weight: sel.weight,
              }),
            },
          );
        }

        showStudentAlert("Treino criado com sucesso!");
      }

      closeTrainingModal();
      await loadStudentTrainings(currentStudentId);
    } catch (e) {
      console.error(e);
      showStudentAlert(e.message || "Erro ao salvar treino", "error");
    }
  });

loadUserInfo();
loadTemplates();
loadStudents();
