const { resolveAppPath, buildApiUrl } = window.AppConfig;

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
    if (sectionId === "create-class") {
      loadCalendarAttempts = 0;
      setTimeout(() => {
        loadCalendar();
      }, 100);
    }

    // Reset edits when switching tabs
    if (sectionId !== "create-exercise") cancelEdit();
  });
});

function showAlert(msg, type = "success") {
  const el = document.getElementById("alert");
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  setTimeout(() => el.classList.remove("show"), 3000);
}

async function logout() {
  await apiFetch("/auth/logout", { method: "DELETE" });
  window.location.href = resolveAppPath("/");
}

let currentInstructorId = null;

async function loadUserInfo() {
  const res = await apiFetch("/auth/me");
  const data = await res.json();
  document.getElementById("userName").textContent =
    data.name || data.nome || "Instrutor";

  // Armazenar ID do instrutor atual
  currentInstructorId = data.id;

  if (data.error) {
    document.cookie = "";
    window.location.href = resolveAppPath("/");
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
    const res = await apiFetch("/instructor/exercises");
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
    cardClass = "exercise-card",
    cardId = null,
  } = options;

  const series = Number(exercise.series || 0);
  const repetitions = Number(exercise.repetitions || 0);
  const weight = Number(exercise.weight || 0);

  // Clique no card
  let clickHandler = "";
  if (onClick) {
    clickHandler = `onclick="${onClick}" style="cursor: pointer;"`;
  }

  const idAttr = cardId ? `id="${cardId}"` : "";

  return `
    <div class="${cardClass}" ${clickHandler} ${idAttr}>
      ${showActions
      ? `
          <div class="exercise-card-actions" onclick="event.stopPropagation()">
            <button
              class="icon-btn icon-btn--edit"
              title="Editar"
              onclick="event.stopPropagation(); editTemplate(${exercise.id})"
              type="button"
            >
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button
              class="icon-btn icon-btn--delete"
              title="Excluir"
              onclick="event.stopPropagation(); deleteTemplate(${exercise.id})"
              type="button"
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        `
      : ""
    }

      <h3 class="exercise-card-title">${exercise.name}</h3>

      ${showDescription && exercise.description
      ? `<p class="exercise-card-description">${exercise.description}</p>`
      : ""
    }

      ${showStats
      ? `
          <div class="exercise-card-metrics">
            <div class="exercise-metric">
              <span class="material-symbols-outlined exercise-metric-icon">reorder</span>
              <div>
                <span class="exercise-metric-value">${series} séries x ${repetitions} reps</span>
                <span class="exercise-metric-label">Séries / Reps</span>
              </div>
            </div>
            <div class="exercise-metric">
              <span class="material-symbols-outlined exercise-metric-icon">weight</span>
              <div>
                <span class="exercise-metric-value">${weight} kg</span>
                <span class="exercise-metric-label">Carga sugerida</span>
              </div>
            </div>
          </div>
        `
      : ""
    }

      ${showHint ? `<p class="exercise-card-hint">Clique para selecionar e personalizar</p>` : ""}
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
      <div class="exercise-detail-modern">
        <div class="exercise-modern-header">
          <h3 class="exercise-modern-title">${exercise.name}</h3>
        </div>
        
        <div class="exercise-info-cards">
          <!-- Séries e Repetições -->
          <div class="info-card-modern">
            <div class="info-card-icon">
              <span class="material-symbols-outlined">repeat</span>
            </div>
            <div class="info-card-content">
              <span class="info-card-label">Séries e Repetições</span>
              <span class="info-card-value">${exercise.series || 0} séries x ${exercise.repetitions || 0} reps</span>
            </div>
          </div>

          <!-- Carga Sugerida -->
          <div class="info-card-modern">
            <div class="info-card-icon">
              <span class="material-symbols-outlined">fitness_center</span>
            </div>
            <div class="info-card-content">
              <span class="info-card-label">Carga Sugerida</span>
              <span class="info-card-value">${exercise.weight || 0} kg</span>
            </div>
          </div>
        </div>

        <div class="exercise-modern-description">
          <span class="description-label">Descrição</span>
          <div class="description-box-modern">
            ${exercise.description || "Sem descrição disponível."}
          </div>
        </div>

        <div class="modern-modal-actions">
          <button class="btn-modern btn-modern-primary" onclick="closeExerciseDetailModal(); editTemplate(${exercise.id})">
            Editar Exercício
          </button>
          <button class="btn-modern btn-modern-secondary" onclick="closeExerciseDetailModal()">
            Fechar
          </button>
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

// Variable page size based on screen width
function updatePageSize() {
  // Estimation of available width
  // Sidebar: 250px (only if visible? assuming yes for instructor dashboard on desktop)
  let sidebarWidth = 0;
  if (window.innerWidth > 768) {
    sidebarWidth = 250;
  }

  // Padding: 2rem left + 2rem right = approx 64px
  const containerPadding = 64;
  // Safety margin and scrollbar
  const availableWidth =
    window.innerWidth - sidebarWidth - containerPadding - 20;

  const cardMinWidth = 240; // from CSS minmax(240px, 1fr)
  const gap = 16; // 1rem

  // Calculate max columns: width = (n * card) + ((n-1) * gap)
  // n = (width + gap) / (card + gap)
  let columns = Math.floor((availableWidth + gap) / (cardMinWidth + gap));
  if (columns < 1) columns = 1;

  // Decide rows based on screen height or fixed number?
  // Let's iterate until we find a product (cols * rows) >= 20, keeping rows reasonable (e.g. 3-5)
  // Or just fix rows to 5 which gives 20 items for 4 cols.
  const rows = 5;

  const oldSize = templatesPageSize;
  templatesPageSize = columns * rows;

  // Lower bound check
  if (templatesPageSize < 6) templatesPageSize = 6;

  // Rerender if size changed
  if (oldSize !== templatesPageSize) {
    const maxPage = Math.ceil(templates.length / templatesPageSize) || 1;
    if (templatesCurrentPage > maxPage) templatesCurrentPage = maxPage;
    renderTemplates();
  }
}
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updatePageSize, 200);
});

// Initial call
updatePageSize();

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
            showHint: true,
            onClick: `openExerciseDetailModal(${t.id}, event)`,
            allowDetailView: false,
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
    const res = await apiFetch("/instructor/students");
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
    renderPagination("studentsPagination", 1, 1, () => { });
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
          <div class="student-status-badge">Ativo</div>
          <div class="student-card-icon">
            <span class="material-symbols-outlined">person</span>
          </div>
          <h4>${name}</h4>
          <p>${email}</p>
          <div class="student-card-footer">
            <span class="material-symbols-outlined">visibility</span>
            Ver detalhes e treinos
          </div>
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
let trainingTemplates = []; // Armazenar modelos de treino do instrutor
let exerciseSearchFilter = "";
let modelSearchFilter = ""; // Filtro para busca de modelos
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

    loadStudentTrainings(studentId),
    loadExercisesForTraining(),
  ]);

  // Renderizar estrutura moderna do modal
  /*
  Estrutura esperada:
  <div class="student-modal-structure">
    <div class="student-modal-header-modern">
      <div class="student-info-modern">
        <h1 class="student-name-modern">
          <span id="studentName">Nome do Aluno</span>
          <span class="student-status-chip">Ativo</span>
        </h1>
        <p class="student-email-modern" id="studentEmail">email@exemplo.com</p>
      </div>
      <button class="close-btn" onclick="closeStudentDetailModal()">&times;</button>
    </div>

    <div class="trainings-section">
      <div class="trainings-modern-header">
        <h2 class="trainings-title-modern">Treinos</h2>
        <button class="btn-create-training" onclick="openCreateTrainingModal()">
          <span class="material-symbols-outlined">add</span>
          Criar Treino
        </button>
      </div>
      <div id="trainingsGrid" class="trainings-grid">
        <!-- Cards serão inseridos aqui -->
      </div>
    </div>
    
    <div class="footer-brand">FITMANAGER PREMIUM DASHBOARD</div>
  </div>
  */

  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.innerHTML = `
        <div class="student-modal-structure">
            <div class="student-modal-header-modern">
              <div class="student-info-modern">
                <h1 class="student-name-modern">
                  <span id="studentName">Carregando...</span>
                  <span class="student-status-chip">Ativo</span>
                </h1>
                <p class="student-email-modern" id="studentEmail">Carregando...</p>
              </div>
              <button class="close-btn" onclick="closeStudentDetailModal()">&times;</button>
            </div>

            <div class="trainings-section">
              <div class="trainings-modern-header">
                <h2 class="trainings-title-modern">Treinos</h2>
                <button class="btn-create-training" onclick="openCreateTrainingModal()">
                  <span class="material-symbols-outlined">add</span>
                  Criar Treino
                </button>
              </div>
              <div id="trainingsGrid" class="trainings-grid">
                <p>Carregando treinos...</p>
              </div>
            </div>
            
            <div class="footer-brand">FITMANAGER PREMIUM DASHBOARD</div>
        </div>
     `;

    // Recarregar dados para preencher a nova estrutura
    loadStudentData(studentId);
    loadStudentTrainings(studentId); // Isso já vai renderizar os cards no #trainingsGrid novo
  }
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
    const res = await apiFetch(`/instructor/students/${studentId}`);
    if (!res.ok) throw new Error("Erro ao carregar aluno");
    const student = await res.json();
    document.getElementById("studentName").textContent =
      student.name || student.nome || "Aluno";
    // Sem emojis (usar texto simples)
    document.getElementById("studentEmail").textContent = student.email
      ? `Email: ${student.email}`
      : "";
    const phoneElement = document.getElementById("studentPhone");
    if (phoneElement) {
      phoneElement.textContent = student.phone ? `Telefone: ${student.phone}` : "";
    }
  } catch (e) {
    console.error(e);
    showStudentAlert("Erro ao carregar dados do aluno", "error");
  }
}

async function loadStudentTrainings(studentId) {
  try {
    const res = await apiFetch(
      `/instructor/students/${studentId}/trainings`,
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
    const res = await apiFetch("/instructor/exercises");
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

  if (studentTrainings.length === 0) {
    grid.innerHTML = "<p>Nenhum treino encontrado para este aluno.</p>";
    return;
  }

  grid.innerHTML = studentTrainings
    .map((t) => {
      // Formatação moderna para o card de treino
      const exerciseCount = t.exercises ? t.exercises.length : 0;

      return `
      <div class="training-card-modern" onclick="openEditTraining(${t.id})">
        <div class="training-info-modern">
          <div class="training-icon-modern">
            <span class="material-symbols-outlined">assignment</span>
          </div>
          <div class="training-details-modern">
            <h4>${t.name}</h4>
            <div class="training-meta-modern">
              <span class="material-symbols-outlined" style="font-size: 14px;">format_list_bulleted</span>
              <span>${exerciseCount} exercícios</span>
              <span class="meta-separator">•</span>
              <span class="click-hint">CLIQUE PARA EDITAR</span>
            </div>
          </div>
        </div>
        <div class="training-arrow">
          <span class="material-symbols-outlined">chevron_right</span>
        </div>
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

  document.getElementById("formTitle").textContent = "Editar Exercício"; // Renamed
  document.getElementById("saveBtn").textContent = "Salvar Alterações";

  // Show Modal
  openCreateExerciseModal();

  // No longer needed to scroll or show cancel button as it's in the modal
  // document.getElementById("cancelEditBtn").style.display = "inline-block";


  clearValidationErrors();
  // document.querySelector(".main-content").scrollTop = 0; // Scroll to top removed
};

window.openCreateExerciseModal = () => {
  document.getElementById("createExerciseModal").classList.add("active");
  // Clear validation when opening
  clearValidationErrors();
};

window.closeCreateExerciseModal = () => {
  document.getElementById("createExerciseModal").classList.remove("active");
  cancelEdit(); // Reset form data
};

// Renamed cancelEdit to be internal reset or keep as is but linked to modal close
window.cancelEdit = () => {
  document.getElementById("createExerciseForm").reset();
  document.getElementById("exId").value = "";
  document.getElementById("exDescription").value = "";
  document.getElementById("formTitle").textContent = "Criar Exercício";
  document.getElementById("saveBtn").textContent = "Salvar";
  // document.getElementById("cancelEditBtn").style.display = "none"; // Button removed

  clearValidationErrors();
  const counter = document.getElementById("exDescriptionCounter");
  if (counter) counter.textContent = "0/500 caracteres";
};

window.deleteTemplate = async (id) => {
  showConfirmModal(
    "Tem certeza que deseja excluir este exercício?",
    async () => {
      try {
        const res = await apiFetch(`/instructor/exercises/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          showAlert("Exercício excluído!");
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
      const endpoint = id
        ? `/instructor/exercises/${id}`
        : "/instructor/exercises";
      const method = id ? "PUT" : "POST";

      const res = await apiFetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        showAlert(id ? "Exercício atualizado!" : "Exercício criado!");
        loadTemplates();
        closeCreateExerciseModal(); // Close modal on success
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
    const res = await apiFetch("/instructor/classes");
    myClasses = await res.json();
    allClasses = [...myClasses]; // Cópia para filtro
    renderClasses();
  } catch (e) {
    console.error(e);
  }
}

// Formatar data para dd/mm/yyyy
function formatDateBR(dateStr) {
  if (!dateStr) return "";

  // Se contém 'T' (formato datetime), extrair apenas a parte da data
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }

  // Se for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }

  // Se for DD-MM-YYYY (padrão backend atual), apenas troca hífens por barras
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr.replace(/-/g, "/");
  }

  return dateStr;
}

// Converte data do input HTML (YYYY-MM-DD) para formato backend (DD-MM-YYYY)
function convertDateForBackend(dateStr) {
  if (!dateStr) return "";

  // Se vier no formato YYYY-MM-DD (input date)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  }

  return dateStr;
}

// Converte data do backend (DD-MM-YYYY) para input HTML (YYYY-MM-DD)
function convertDateFromBackend(dateStr) {
  if (!dateStr) return "";

  // Se for DD-MM-YYYY (padrão backend)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  }

  // Se já estiver em YYYY-MM-DD (caso algum dado tenha passado)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  return dateStr;
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
        const res = await apiFetch(
          `/instructor/classes/${c.id}/participants`,
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
          <div class="class-card-item" 
               onclick="openClassDetailsModal(${c.id})">
              <div class="flex-between-start">
                  <div class="flex-1">
                      <h3 class="class-card-title">${c.name || c.nome_aula}</h3>
                      <p class="class-card-info">
                        <span class="material-symbols-outlined inline-icon">calendar_month</span>
                        ${formatDateBR(c.date || c.data)}
                        <span class="class-card-sep">•</span>
                        <span class="material-symbols-outlined inline-icon">schedule</span>
                        ${c.time || c.hora}
                      </p>
                      <p class="class-card-enrollment">
                        <span class="material-symbols-outlined inline-icon">group</span>
                        ${c.enrolledCount}/${c.slots_limit || c.limite_vagas} alunos inscritos
                      </p>
                  </div>
              </div>
          </div>
      `,
    )
    .join("");
}

window.openCreateClassTab = () => {
  const navItem = document.querySelector('[data-section="create-class"]');
  if (navItem) {
    navItem.click();
  }
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

// Create/Edit Class Form (código antigo - removido, agora usamos calendário)
// Verificar se o formulário existe antes de adicionar listener
const createClassForm = document.getElementById("createClassForm");
if (createClassForm) {
  createClassForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validação
    const validation = validateClassForm();
    if (!validation.valid) {
      showValidationErrors(validation.errors);
      showAlert("Corrija os erros no formulário", "error");
      return;
    }

    clearValidationErrors();

    const idEl = document.getElementById("classId");
    const dateInput = document.getElementById("classDate");
    if (!idEl || !dateInput) {
      console.error("Elementos do formulário não encontrados");
      return;
    }

    const id = idEl.value;
    const dateValue = dateInput.value;

    // VALIDAÇÃO: Não permitir datas passadas
    if (!validateDate(dateInput)) {
      showAlert("Não é possível agendar aulas para datas passadas!", "error");
      dateInput.reportValidity(); // Mostrar mensagem customizada
      return;
    }

    const nameEl = document.getElementById("className");
    const timeEl = document.getElementById("classTime");
    const limitEl = document.getElementById("classLimit");

    if (!nameEl || !timeEl || !limitEl) {
      console.error("Elementos do formulário não encontrados");
      return;
    }

    const data = {
      name: nameEl.value,
      date: convertDateForBackend(dateValue), // Converte YYYY-MM-DD para DD-MM-YYYY
      time: timeEl.value,
      slots_limit: parseInt(limitEl.value),
    };

    try {
      const endpoint = id
        ? `/instructor/classes/${id}`
        : "/instructor/classes";
      const method = id ? "PUT" : "POST";

      const res = await apiFetch(endpoint, {
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
          const form = document.getElementById("createClassForm");
          if (form) form.reset();
        }
        loadClasses();
        loadCalendar(); // Atualizar calendário também
      } else {
        const err = await res.json();
        showAlert(err.error || "Erro ao salvar", "error");
      }
    } catch (e) {
      showAlert("Erro de conexão", "error");
    }
  });
}

window.editClass = (id) => {
  // Usar o modal de edição do calendário
  openEditClassModal(id);
};

window.cancelClassEdit = () => {
  // Função mantida para compatibilidade, mas não faz nada já que usamos calendário
  const form = document.getElementById("createClassForm");
  if (form) {
    form.reset();
  }
};

window.deleteClass = async (id) => {
  showConfirmModal("Tem certeza que deseja cancelar esta aula?", async () => {
    try {
      const res = await apiFetch(`/instructor/classes/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showAlert("Aula cancelada!");
        loadClasses();
        await loadCalendar(); // Atualizar calendário imediatamente
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
  document.getElementById("detailsClassName").value =
    classData.name || classData.nome_aula;
  document.getElementById("detailsClassDate").value = convertDateFromBackend(
    classData.date || classData.data,
  );
  document.getElementById("detailsClassTime").value =
    classData.time || classData.hora;
  document.getElementById("detailsClassLimit").value =
    classData.slots_limit || classData.limite_vagas;

  // Setar data mínima
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("detailsClassDate").setAttribute("min", today);

  // Buscar alunos inscritos
  try {
    const res = await apiFetch(
      `/instructor/classes/${classId}/participants`,
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const students = await res.json();

    const studentsList = document.getElementById("enrolledStudentsList");
    if (!students || students.length === 0) {
      studentsList.innerHTML =
        '<p class="text-gray-italic">Nenhum aluno inscrito ainda.</p>';
    } else {
      studentsList.innerHTML = students
        .map(
          (s) => `
        <div class="student-list-item">
          <div class="student-avatar-small">
            ${(s.name || s.nome || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="student-name">${s.name || s.nome || "Sem nome"}</div>
            <div class="student-email">${s.email || "Sem email"}</div>
          </div>
        </div>
      `,
        )
        .join("");
    }
  } catch (e) {
    console.error("Erro ao carregar alunos inscritos:", e);
    document.getElementById("enrolledStudentsList").innerHTML =
      `<p class="text-error">Erro ao carregar alunos: ${e.message}</p>`;
  }

  document.getElementById("classDetailsModal").classList.add("active");
}

function closeClassDetailsModal() {
  document.getElementById("classDetailsModal").classList.remove("active");
  currentClassInModal = null;
}

// Submit do formulário de edição no modal
document
  .getElementById("editClassForm")
  .addEventListener("submit", async (e) => {
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
      const res = await apiFetch(`/instructor/classes/${id}`, {
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

  // Verificar se os elementos existem antes de usar (formulário antigo pode não existir)
  const classDateInput = document.getElementById("classDate");
  if (classDateInput) {
    classDateInput.setAttribute("min", today);
    classDateInput.addEventListener("input", function () {
      validateDate(this);
    });
  }

  const detailsClassDateInput = document.getElementById("detailsClassDate");
  if (detailsClassDateInput) {
    detailsClassDateInput.setAttribute("min", today);
    detailsClassDateInput.addEventListener("input", function () {
      validateDate(this);
    });
  }

  // Configurar data mínima para campos do modal de edição
  const editClassDateInput = document.getElementById("editClassDate");
  if (editClassDateInput) {
    editClassDateInput.setAttribute("min", today);
  }

  // Configurar data mínima para campos do modal de criação recorrente
  const recurringStartDate = document.getElementById("recurringStartDate");
  const recurringEndDate = document.getElementById("recurringEndDate");
  if (recurringStartDate) {
    recurringStartDate.setAttribute("min", today);
  }
  if (recurringEndDate) {
    recurringEndDate.setAttribute("min", today);
  }
});

// --- Modal Criar/Editar Treino (do aluno) ---
// exerciseSearchFilter já declarado anteriormente

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
          <span><span class="material-symbols-outlined inline-icon">reorder</span>${ex.series || 0} séries x ${ex.repetitions || 0} repetições</span>
          <span><span class="material-symbols-outlined inline-icon">weight</span>${ex.weight || 0} kg</span>
        </div>
        <p class="exercise-hint">Clique para selecionar e personalizar</p>
        <div class="template-actions" onclick="event.stopPropagation()">
          <button class="template-action-btn" 
                  title="Ver detalhes do exercício"
                  onclick="event.stopPropagation(); event.preventDefault(); openExerciseDetailModal(${ex.id}, event); return false;"
                  type="button">
            <span class="material-symbols-outlined">info</span>
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
  const countEl = document.getElementById("selectedCount");
  if (!list) return;

  if (countEl) {
    countEl.textContent = selectedExercises.length;
  }

  if (selectedExercises.length === 0) {
    list.innerHTML = "<p class='text-gray'>Nenhum exercício selecionado</p>";
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
  const instructorInfo = document.getElementById("trainingInstructorInfo");
  if (instructorInfo) instructorInfo.textContent = "";
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
    const res = await apiFetch(`/instructor/trainings/${trainingId}`);
    if (!res.ok) throw new Error("Erro ao carregar treino");

    const fullTraining = await res.json();

    document.getElementById("modalTitle").textContent = "Editar Treino";
    const instructorInfo = document.getElementById("trainingInstructorInfo");
    if (instructorInfo && fullTraining.instructor_name) {
      instructorInfo.textContent = `(Criado por ${fullTraining.instructor_name})`;
    } else if (instructorInfo) {
      instructorInfo.textContent = "";
    }
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
      const res = await apiFetch(
        `/instructor/trainings/${currentTrainingId}`,
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
        const updateRes = await apiFetch(
          `/instructor/trainings/${currentTrainingId}`,
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

        // Exercícios atuais do treino
        const currentRes = await apiFetch(
          `/instructor/trainings/${currentTrainingId}`,
        );
        const currentTraining = await currentRes.json();
        const currentExerciseIds = currentTraining.exercises
          ? currentTraining.exercises.map((e) => e.id)
          : [];

        const newExerciseIds = selectedExercises.map((e) => e.exerciseId);

        // Remover exercícios que não estão mais selecionados
        for (const exId of currentExerciseIds) {
          if (!newExerciseIds.includes(exId)) {
            await apiFetch(
              `/instructor/trainings/${currentTrainingId}/exercises/${exId}`,
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
            await apiFetch(
              `/instructor/trainings/${currentTrainingId}/exercises`,
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
          await apiFetch(
            `/instructor/trainings/${currentTrainingId}/exercises/${sel.exerciseId}`,
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
        const createRes = await apiFetch("/instructor/trainings", {
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
          await apiFetch(
            `/instructor/trainings/${newTraining.id}/exercises`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ exerciseId: sel.exerciseId }),
            },
          );

          await apiFetch(
            `/instructor/trainings/${newTraining.id}/exercises/${sel.exerciseId}`,
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

// ========== CALENDÁRIO DE AULAS ==========
// Declarar variáveis do calendário ANTES de serem usadas
let calendarCurrentDate = new Date();
let calendarClasses = [];

loadUserInfo();
loadTemplates();
loadStudents();

// Função auxiliar para converter data DD-MM-YYYY para Date
function parseDateBR(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Formatar data para YYYY-MM-DD (input date)
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Converter YYYY-MM-DD para DD-MM-YYYY (backend)
function convertDateForBackend(dateStr) {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

// Converter DD-MM-YYYY para YYYY-MM-DD (input)
function convertDateFromBackend(dateStr) {
  if (!dateStr) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  return dateStr;
}

// ===========================================
// CALENDAR LOGIC (Delegated to CalendarModule)
// ===========================================

// Initialize Shared Calendar Module
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await apiFetch("/auth/me");
    if (res.ok) {
      const user = await res.json();
      if (window.CalendarModule) {
        console.log("Initializing Shared Calendar for Instructor");
        window.CalendarModule.init(user.id, user.role);
        window.CalendarModule.loadCalendar();
      } else {
        console.error("CalendarModule not found");
      }
    }
  } catch (e) {
    console.error("Error initializing calendar:", e);
  }
});

// Helper for other parts of dashboard if they try to call loadCalendar
window.loadCalendar = async function () {
  if (window.CalendarModule) {
    await window.CalendarModule.loadCalendar();
  }
};


// Initialize Profile Modal
document.addEventListener("DOMContentLoaded", () => {
  if (window.ProfileModalInit) {
    window.ProfileModalInit({
      avatarId: "userAvatar",
      modalId: "profileModal",
    });
  }
});

// --- Função para alternar abas no modal de criar treino ---
// --- Função para alternar abas no modal de criar treino ---
window.switchTrainingTab = function (tabName) {
  // Atualizar botões
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const activeBtn = document.getElementById(`tab-${tabName}`);
  if (activeBtn) activeBtn.classList.add("active");

  // Atualizar conteúdo
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  const activeContent = document.getElementById(`${tabName}TabContent`);
  if (activeContent) activeContent.classList.add("active");

  // Carregar dados se necessário
  if (tabName === "models") {
    loadTrainingTemplates();
  }
};

// --- Carregar Modelos (Treinos do Instrutor) ---
async function loadTrainingTemplates() {
  const grid = document.getElementById("trainingTemplatesGrid");
  if (!grid) return;

  // Se já carregou e temos filtro vazio, apenas renderiza
  if (trainingTemplates.length > 0 && (!modelSearchFilter || modelSearchFilter === "")) {
    renderTrainingTemplates();
    return;
  }

  // Mostrar loading apenas se não tiver dados
  if (trainingTemplates.length === 0) {
    grid.innerHTML = "<p>Carregando modelos...</p>";
    try {
      const res = await apiFetch("/instructor/trainings");
      if (!res.ok) throw new Error("Erro ao carregar modelos");

      trainingTemplates = await res.json();
      renderTrainingTemplates();
    } catch (error) {
      console.error(error);
      grid.innerHTML = "<p>Erro ao carregar modelos.</p>";
    }
  } else {
    renderTrainingTemplates();
  }
}

function renderTrainingTemplates() {
  const grid = document.getElementById("trainingTemplatesGrid");
  if (!grid) return;

  const searchTerm = modelSearchFilter ? modelSearchFilter.toLowerCase() : "";
  const filtered = trainingTemplates.filter(t =>
    t.name.toLowerCase().includes(searchTerm)
  );

  if (filtered.length === 0) {
    grid.innerHTML = "<p>Nenhum modelo encontrado.</p>";
    return;
  }

  grid.innerHTML = filtered.map(t => {
    const exerciseCount = t.exercises ? t.exercises.length : 0;
    return `
        <div class="template-card" onclick="importTemplate(${t.id})">
            <div class="template-info">
                <h4>${t.name}</h4>
                <p>${exerciseCount} exercícios</p>
            </div>
            <button type="button" class="btn-sm btn-outline" style="pointer-events: none;">Usar</button>
        </div>
      `;
  }).join('');
}

window.importTemplate = function (templateId) {
  const template = trainingTemplates.find(t => t.id === templateId);
  if (!template || !template.exercises) return;

  // Adicionar exercícios à seleção atual
  const newExercises = template.exercises.map(ex => {
    // Tenta pegar dados da tabela pivô (TrainingExercise) ou fallback para defaults
    const series = ex.TrainingExercise?.series || 3;
    const repetitions = ex.TrainingExercise?.repetitions || 12;
    const weight = ex.TrainingExercise?.weight || 0;

    return {
      id: ex.id,
      name: ex.name,
      imgUrl: ex.imgUrl,
      series: series,
      repetitions: repetitions,
      weight: weight
    };
  });

  // Mesclar com existentes (evitando duplicatas exatas? ou permitindo?)
  // Vamos permitir adicionar, mas filtrar se o usuário já tiver o mesmo exerciseId pode ser confuso.
  // Vamos adicionar todos. O usuário remove se quiser.

  // Evitar adicionar se ID já está na lista?
  const currentIds = new Set(selectedExercises.map(e => e.id));
  const toAdd = newExercises.filter(e => !currentIds.has(e.id));

  if (toAdd.length === 0) {
    showAlert("Esses exercícios já estão selecionados.", "info");
    return;
  }

  selectedExercises = [...selectedExercises, ...toAdd];
  renderSelectedExercises();

  // Voltar para aba de exercícios
  switchTrainingTab('exercises');

  showAlert(`${toAdd.length} exercícios adicionados do modelo.`, "success");
};

// Listener para filtro de modelos
document.addEventListener("DOMContentLoaded", () => {
  const modelInput = document.getElementById("modelSearchInput");
  if (modelInput) {
    modelInput.addEventListener("input", (e) => {
      modelSearchFilter = e.target.value;
      renderTrainingTemplates();
    });
  }
});
