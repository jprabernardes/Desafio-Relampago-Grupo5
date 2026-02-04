const { resolveAppPath } = window.AppConfig;
// ...

// Função auxiliar para converter data DD-MM-YYYY, DD/MM/YYYY ou YYYY-MM-DD para objeto Date
function parseDateBR(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date();

  // Se contém 'T' (formato datetime), extrair apenas a parte da data
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }

  // Se for DD-MM-YYYY (formato backend atual)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Se for DD/MM/YYYY (formato com barras)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Se for YYYY-MM-DD (formato ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Tentar parse padrão como fallback
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
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

let currentUserId = null;
let allWorkouts = []; // Cache para os treinos do aluno
let currentUserData = null; // Armazena dados completos do usuário

const GYM_INFO = {
  name: "FITMANAGER ACADEMIA",
  address: "Rua Exemplo, 123",
  phone: "(11) 99999-9999",
};

// Verificar autenticação
// A verificação é feita via cookie pelo navegador, se falhar a API retorna 401/403
// Se necessário, podemos fazer um fetch inicial para validar, mas o loadUserInfo já faz isso.

// Navegação
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    // Remover active de todos
    document
      .querySelectorAll(".nav-item")
      .forEach((i) => i.classList.remove("active"));
    document
      .querySelectorAll(".section")
      .forEach((s) => s.classList.remove("active"));

    // Adicionar active no clicado
    item.classList.add("active");
    const sectionId = item.getAttribute("data-section");
    document.getElementById(sectionId).classList.add("active");

    // Carregar dados se necessário
    if (sectionId === "workouts") loadWorkouts();
    if (sectionId === "classes") loadAvailableClasses();
    if (sectionId === "my-classes") loadMyClasses();
    if (sectionId === "calendar") loadCalendar();
  });
});

// Função para mostrar alerta
function showAlert(message, type = "success") {
  const alert = document.getElementById("alert");
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;
  setTimeout(() => {
    alert.classList.remove("show");
  }, 10000);
}

// Carregar informações do usuário
async function loadUserInfo() {
  try {
    const response = await apiFetch("/auth/me");

    if (!response.ok) throw new Error("Não autorizado");

    const data = await response.json();
    currentUserId = data.id;
    currentUserData = data; // Armazenar dados completos
    document.getElementById("userName").textContent = data.name || data.nome;
    document.getElementById("userAvatar").textContent = (
      data.name ||
      data.nome ||
      "A"
    )
      .charAt(0)
      .toUpperCase();

    // Verificar se é aluno
    if (data.role !== "aluno") {
      showAlert("Acesso negado. Você não é aluno.", "error");
      setTimeout(() => logout(), 2000);
    }
  } catch (error) {
    console.error("Erro ao carregar usuário:", error);
    logout();
  }
}

// Carregar treinos do aluno
async function loadWorkouts() {
  try {
    const response = await apiFetch("/student/workouts");

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || errorData.message || "Erro ao carregar treinos",
      );
    }

    const workouts = await response.json();
    allWorkouts = workouts; // Salva no cache global
    const container = document.getElementById("workoutsList");

    if (workouts.length === 0) {
      container.innerHTML =
        "<p>Você ainda não possui treinos cadastrados. Procure um instrutor!</p>";
      return;
    }

    container.innerHTML = workouts
      .map(
        (workout) => `
            <div class="workout-card">
              <div class="workout-header">
                <h3 class="workout-name">${workout.name}</h3>
                <div class="workout-instructor">
                  <span class="material-symbols-outlined">person</span>
                  <span>Instrutor: ${workout.instructor_name || workout.instructor_id}</span>
                </div>
              </div>
              <div class="exercise-rows">
                ${Array.isArray(workout.exercises)
            ? workout.exercises
              .map(
                (ex) => `
                      <div class="exercise-row">
                        <span class="exercise-name">${ex.name}</span>
                        <div class="exercise-badge">
                          <span>${ex.series}×${ex.repetitions}${ex.weight ? ` • ${ex.weight}KG` : ""}</span>
                        </div>
                      </div>
                    `,
              )
              .join("")
            : `<pre>${workout.exercises}</pre>`
          }
              </div>
              <div class="workout-footer">
                <button class="btn btn-primary btn-print" onclick="printWorkout(${workout.id})">
                  <span class="material-symbols-outlined">print</span>
                  Imprimir Treino
                </button>
              </div>
            </div>
          `,
      )
      .join("");
  } catch (error) {
    console.error("Erro:", error);
    showAlert("Erro ao carregar treinos", "error");
  }
}

// Imprimir treino (registra check-in)
async function printWorkout(workoutId) {
  try {
    // Registrar check-in na API
    const response = await apiFetch("/student/checkin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workout_id: workoutId }),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage =
        error.error || error.message || "Erro ao registrar check-in";

      if (errorMessage.includes("Você já fez check-in hoje")) {
        showAlert("Você já fez check-in hoje. Imprimindo...", "warning");
      } else {
        throw new Error(errorMessage);
      }
    } else {
      showAlert("Check-in registrado com sucesso!", "success");
    }

    // NOVA LÓGICA DE IMPRESSÃO (48 COLUNAS - DESIGN CLEAN)
    const workout = allWorkouts.find((w) => w.id === workoutId);
    if (!workout) throw new Error("Treino não encontrado para impressão.");

    const studentName = document.getElementById("userName").textContent;

    const printWindow = window.open("", "", "height=600,width=400");
    printWindow.document.write(`
        <html>
        <head>
          <title>Imprimir Treino</title>
          <style>
            @page { margin: 0; }
            body { 
              width: 260px; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 11px;
              margin: 0; padding: 15px;
              color: #000;
              line-height: 1.5;
            }
            .header { text-align: center; margin-bottom: 12px; }
            .gym-name { font-size: 16px; font-weight: 900; display: block; border-bottom: 2px solid #000; margin-bottom: 5px; }
            .gym-sub { font-size: 8px; text-transform: uppercase; font-weight: bold; }
            
            .divider { text-align: center; margin: 10px 0; border-top: 1px dashed #000; }
            
            .info-section { text-align: left; font-size: 10px; margin-bottom: 10px; }
            .label { font-weight: bold; text-transform: uppercase; }
            
            .workout-title { text-align: center; font-size: 13px; font-weight: bold; background: #000; color: #fff; padding: 3px; margin: 10px 0; }
            
            .exercise-item { border-bottom: 1px solid #ccc; padding: 6px 0; }
            .ex-header { font-weight: bold; font-size: 12px; display: block; }
            .ex-details { font-size: 12px; margin-top: 2px; font-weight: bold; color: #333; }
            
            .footer { text-align: center; margin-top: 20px; font-size: 9px; }
            .footer-line { border-top: 1px solid #000; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="gym-name">${GYM_INFO.name}</span>
            <span class="gym-sub">${GYM_INFO.address.toUpperCase()}</span><br>
            <span class="gym-sub">TEL: ${GYM_INFO.phone}</span>
          </div>

          <div class="info-section">
            <span class="label">ALUNO:</span> ${studentName.toUpperCase()}<br>
            <span class="label">INSTRUTOR:</span> ${(workout.instructor_name || workout.instructor_id).toString().toUpperCase()}<br>
            <span class="label">DATA :</span> ${new Date().toLocaleDateString("pt-BR")}
          </div>

          <div class="workout-title">${workout.name.toUpperCase()}</div>

          <div class="section">
            ${Array.isArray(workout.exercises) && workout.exercises.length > 0
        ? workout.exercises
          .map(
            (ex) => `
              <div class="exercise-item">
                <span class="ex-header">${ex.name}</span>
                <div class="ex-details">
                  ${ex.series} x ${ex.repetitions}${ex.weight ? ` - ${ex.weight}KG` : ""}
                </div>
              </div>
            `,
          )
          .join("")
        : '<div class="text-center">Sem exercícios cadastrados.</div>'
      }
          </div>

          <div class="footer">
            <div class="footer-line"></div>
            <strong>BOM TREINO!</strong><br>
            FitManager Pro - Gestão Inteligente
          </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  } catch (error) {
    console.error("Erro:", error);
    showAlert(error.message, "error");
  }
}

let allAvailableClasses = [];
let myEnrollmentIds = [];

// Carregar aulas disponíveis
async function loadAvailableClasses() {
  try {
    const [classesRes, myClassesRes] = await Promise.all([
      apiFetch("/student/classes"),
      apiFetch("/student/my-classes"),
    ]);

    if (!classesRes.ok || !myClassesRes.ok)
      throw new Error("Erro ao carregar dados das aulas");

    allAvailableClasses = await classesRes.json();
    const myClasses = await myClassesRes.json();
    myEnrollmentIds = myClasses.map((c) => c.id);

    renderAvailableClasses();
  } catch (error) {
    console.error("Erro:", error);
    showAlert("Erro ao carregar aulas", "error");
  }
}

// Keep track of active category across re-renders
let currentActiveCategoryName = null;

// Função para renderizar as categorias de aulas
function renderAvailableClasses() {
  const categoriesContainer = document.getElementById("classCategoriesContainer");
  const sessionsContainer = document.getElementById("classSessionsContainer");
  const sessionsTitle = document.getElementById("sessionsTitle");

  // Limpar containers
  categoriesContainer.innerHTML = "";
  // IMPORTANT: Do *not* clear sessionsContainer yet if we are going to restore state
  // But we need to rebuild categories anyway.

  // Filtrar aulas: do dia atual até os próximos 15 dias
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 15);

  const filteredClasses = allAvailableClasses.filter((cls) => {
    try {
      const classDate = parseDateBR(cls.date);
      classDate.setHours(0, 0, 0, 0);
      return classDate >= today && classDate <= maxDate;
    } catch (e) {
      console.warn("Erro ao processar data da aula:", cls, e);
      return false;
    }
  });

  if (filteredClasses.length === 0) {
    categoriesContainer.innerHTML = "<p>Nenhuma aula disponível nos próximos 15 dias.</p>";
    return;
  }

  // Agrupar por nome (Case Insensitive)
  // Agrupar por nome (Case Insensitive) e Forçar Capitalização no Display
  const grouped = {};
  filteredClasses.forEach(cls => {
    const rawName = (cls.title || cls.name || "Aula").trim();
    const key = rawName.toLowerCase();

    if (!grouped[key]) {
      // Formatar nome para exibição: Primeira letra maiúscula, resto como está na chave (minúsculo)
      // Isso unifica "Yoga", "yoga", "YOGA" em "Yoga"
      const displayName = key.charAt(0).toUpperCase() + key.slice(1);

      grouped[key] = {
        name: displayName,
        key: key,
        classes: []
      };
    }
    grouped[key].classes.push(cls);
  });

  // Renderizar Cards de Categoria
  Object.values(grouped).forEach(group => {
    const card = document.createElement("div");
    card.className = "category-card";

    // Restore active state if matches
    if (currentActiveCategoryName === group.name) {
      card.classList.add("active");
    }

    card.innerHTML = `
      <div class="category-name">${group.name}</div>
      <div class="category-count">${group.classes.length} sessões</div>
    `;

    card.onclick = () => {
      // Update state
      currentActiveCategoryName = group.name;

      // Remover active de todos
      document.querySelectorAll(".category-card").forEach(c => c.classList.remove("active"));
      // Ativar atual
      card.classList.add("active");

      renderClassSessions(group.classes);
    };

    categoriesContainer.appendChild(card);
  });

  // If we have an active category in state, re-render its sessions
  if (currentActiveCategoryName) {
    const key = currentActiveCategoryName.toLowerCase();
    if (grouped[key]) {
      // If the category still exists (has classes)
      renderClassSessions(grouped[key].classes);
    } else {
      // Reset if category no longer has classes
      currentActiveCategoryName = null;
      sessionsContainer.innerHTML = "";
      sessionsTitle.style.display = "none";
    }
  } else {
    // Ensure cleared if no active category
    sessionsContainer.innerHTML = "";
    sessionsTitle.style.display = "none";
  }
}

// Renderizar as sessões específicas de uma categoria selecionada
function renderClassSessions(classesList) {
  const container = document.getElementById("classSessionsContainer");
  const title = document.getElementById("sessionsTitle");

  title.style.display = "block";
  container.innerHTML = "";

  // Ordenar por data
  classesList.sort((a, b) => {
    const da = parseDateBR(a.date);
    const db = parseDateBR(b.date);
    return da - db;
  });

  container.innerHTML = classesList.map((cls) => {
    const isInscrito = myEnrollmentIds.includes(cls.id);
    const isFull = cls.current_participants >= cls.max_participants;

    let statusText = "";
    let statusClass = "";

    if (isInscrito) {
      statusText = "Inscrito";
      statusClass = "status-enrolled";
    } else if (isFull) {
      statusText = "Sem vagas";
      statusClass = "status-full";
    } else {
      statusText = `${cls.current_participants || 0} / ${cls.max_participants}`;
      statusClass = "status-available";
    }

    const date = parseDateBR(cls.date);
    let timeStr = "--:--";
    if (cls.date && cls.date.includes('T')) {
      const timePart = cls.date.split('T')[1];
      timeStr = timePart ? timePart.substring(0, 5) : "--:--";
    }
    const dateStr = date.toLocaleDateString("pt-BR");

    return `
            <div class="class-card class-card-clickable" onclick="openClassModal(${cls.id})">
              <div>
                <h3 class="card-title">${cls.title}</h3>
                <p class="card-location">
                  <span class="material-symbols-outlined">location_on</span>
                  ${cls.location || "Sala Principal"}
                </p>
                <p class="card-date">
                  <span class="material-symbols-outlined">calendar_today</span> ${dateStr} 
                  <span class="material-symbols-outlined">schedule</span> ${timeStr}
                </p>
                <p class="card-subtitle" style="margin-top:0.5rem;">
                   <span class="material-symbols-outlined" style="font-size: 1rem;">person</span>
                   ${cls.instructor_name || "Instrutor"}
                </p>
              </div>
              <span class="class-status ${statusClass}">${statusText}</span>
            </div>
          `;
  }).join("");

  // Scroll suave até a sessão
  title.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Modal de Detalhes da Aula
function openClassModal(classId) {
  const cls = allAvailableClasses.find((c) => c.id === classId);
  if (!cls) return;

  const isInscrito = myEnrollmentIds.includes(cls.id);
  const isFull = cls.current_participants >= cls.max_participants;
  const date = parseDateBR(cls.date);
  // Extrair horário da string original se contiver 'T'
  let timeStr = "--:--";
  if (cls.date && cls.date.includes('T')) {
    const timePart = cls.date.split('T')[1];
    timeStr = timePart ? timePart.substring(0, 5) : "--:--";
  }
  const dateStr = date.toLocaleDateString("pt-BR");

  document.getElementById("modalClassTitle").textContent = cls.title;
  document.getElementById("modalClassInfo").textContent =
    `${cls.location || "Sala Principal"} • ${dateStr} às ${timeStr}`;
  document.getElementById("modalClassDescription").textContent =
    cls.description || "Sem descrição disponível.";

  const statusContainer = document.getElementById("modalClassStatus");
  const actionsContainer = document.getElementById("modalClassActions");

  if (isInscrito) {
    statusContainer.innerHTML =
      '<span class="class-status status-enrolled">Inscrito</span>';
    actionsContainer.innerHTML =
      '<button class="btn btn-secondary" onclick="closeClassModal()">Fechar</button>';
  } else if (isFull) {
    statusContainer.innerHTML =
      '<span class="class-status status-full">Sem vagas</span>';
    actionsContainer.innerHTML =
      '<button class="btn btn-secondary" onclick="closeClassModal()">Fechar</button>';
  } else {
    statusContainer.innerHTML = `<span class="class-status status-available">Vagas: ${cls.current_participants || 0} / ${cls.max_participants}</span>`;
    actionsContainer.innerHTML = `
          <button class="btn btn-secondary" onclick="closeClassModal()">Cancelar</button>
          <button class="btn btn-success" onclick="enrollFromModal(${cls.id})">Inscrever-se</button>
        `;
  }

  document.getElementById("classDetailsModal").classList.add("active");
}

function closeClassModal() {
  document.getElementById("classDetailsModal").classList.remove("active");
}

async function enrollFromModal(classId) {
  const btn = document.querySelector("#modalClassActions .btn-success");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Inscrevendo...";
  }

  try {
    await enrollClass(classId, true);
    // Após sucesso, o modal será atualizado ou fechado pela função enrollClass
  } catch (error) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Inscrever-se";
    }
  }
}

// Inscrever-se em aula (atualizada para suportar modal)
async function enrollClass(classId, fromModal = false) {
  try {
    const response = await apiFetch(
      `/student/classes/${classId}/enroll`,
      {
        method: "POST",
        headers: {
          // Authorization not needed for Cookie auth
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Erro ao se inscrever");
    }

    showAlert("Inscrição realizada com sucesso!", "success");

    // Atualizar dados e UI
    await loadAvailableClasses();
    await loadMyClasses();

    if (fromModal) {
      // Atualizar o modal para mostrar o estado "Inscrito"
      openClassModal(classId);
    }
  } catch (error) {
    console.error("Erro:", error);
    showAlert(error.message, "error");
    throw error;
  }
}

// Carregar minhas inscrições
async function loadMyClasses() {
  try {
    const response = await apiFetch("/student/my-classes");

    if (!response.ok) throw new Error("Erro ao carregar inscrições");

    const classes = await response.json();
    const container = document.getElementById("myClassesList");

    if (classes.length === 0) {
      container.innerHTML = "<p>Você não está inscrito em nenhuma aula.</p>";
      return;
    }

    container.innerHTML = classes
      .map((cls) => {
        const date = parseDateBR(cls.date);
        const isPast = date < new Date();
        // Extrair horário da string original se contiver 'T'
        let timeStr = "--:--";
        if (cls.date && cls.date.includes('T')) {
          const timePart = cls.date.split('T')[1];
          timeStr = timePart ? timePart.substring(0, 5) : "--:--";
        }
        const dateStr = date.toLocaleDateString("pt-BR");

        let statusLabel = isPast
          ? '<span class="class-status status-full">Encerrada</span>'
          : '<span class="class-status status-enrolled">Confirmada</span>';

        let actionBtn = !isPast
          ? `<button class="btn btn-danger btn-compact" onclick="cancelEnrollment(${cls.id})">Cancelar Inscrição</button>`
          : "";

        return `
            <div class="class-card flex-col-full ${isPast ? "class-card-past" : "class-card-future"}">
              <div>
                <h3 class="card-title">${cls.title}</h3>
                <p class="card-location">
                  <span class="material-symbols-outlined">location_on</span>
                  ${cls.location || "Sala Principal"}
                </p>
                <p class="card-date">
                  <span class="material-symbols-outlined">calendar_today</span> ${dateStr} 
                  <span class="material-symbols-outlined">schedule</span> ${timeStr}
                </p>
              </div>
              <div class="mt-auto-pt-4">
                ${statusLabel}
                ${actionBtn}
              </div>
            </div>
          `;
      })
      .join("");
  } catch (error) {
    console.error("Erro:", error);
    showAlert("Erro ao carregar suas inscrições", "error");
  }
}

// Cancelar inscrição
// Cancelar inscrição
async function cancelEnrollment(classId) {
  showConfirmModal(
    "Tem certeza que deseja cancelar sua inscrição?",
    async () => {
      console.log("Usuário confirmou cancelamento.");

      try {
        const response = await apiFetch(
          `/student/classes/${classId}/cancel`,
          {
            method: "DELETE",
            headers: {
              // Authorization not needed for Cookie auth
            },
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error || error.message || "Erro ao cancelar inscrição",
          );
        }

        showAlert("Inscrição cancelada com sucesso!", "success");
        loadAvailableClasses();
        loadMyClasses();
      } catch (error) {
        console.error("Erro:", error);
        showAlert(error.message, "error");
      }
    },
  );
}

// Logout
async function logout() {
  await apiFetch("/auth/logout", { method: "DELETE" });
  window.location.href = resolveAppPath("/");
}

// Inicializar
loadUserInfo();
loadWorkouts();

// --- Calendar Logic ---

let currentDate = new Date();
let checkinHistory = []; // Mock data store
let classHistory = []; // Mock data store

async function loadCalendar() {
  // Mock fetching history data (simulating API calls)
  // In a real app, this would be: await apiFetch('/student/history');

  // Reuse existing data if possible, or mock additional past data for demonstration
  await loadHistoryData();

  renderCalendar(currentDate);
  updateStats();
}

async function loadHistoryData() {
  // Carregar check-ins reais da API
  try {
    const checkinResponse = await apiFetch("/student/checkins");
    if (checkinResponse.ok) {
      const checkins = await checkinResponse.json();
      checkinHistory = checkins.map((checkin) => ({
        date: new Date(
          checkin.check_in_time || checkin.checkinTime || checkin.date,
        ),
        type: "workout",
        name: checkin.training_name || checkin.trainingName || "Treino",
        exercises: [], // Pode ser expandido se necessário
      }));
    } else {
      console.warn("Não foi possível carregar check-ins");
      checkinHistory = [];
    }
  } catch (e) {
    console.error("Erro ao carregar histórico de check-ins", e);
    checkinHistory = [];
  }

  // Carregar aulas inscritas
  try {
    const response = await apiFetch("/student/my-classes");
    if (response.ok) {
      const myClasses = await response.json();
      classHistory = myClasses.map((cls) => ({
        date: parseDateBR(cls.date),
        type: "class",
        title: cls.title,
        time: cls.date && cls.date.includes('T') ? cls.date.split('T')[1].substring(0, 5) : "--:--",
      }));
    } else {
      console.warn("Não foi possível carregar histórico de aulas");
      classHistory = [];
    }
  } catch (e) {
    console.error("Erro ao carregar histórico de aulas para o calendário", e);
    classHistory = [];
  }
}

function updateStats() {
  // Count total checks in history (mock + real if we had it)
  document.getElementById("totalCheckins").textContent = checkinHistory.length;
  document.getElementById("totalClasses").textContent = classHistory.length;
}

function renderCalendar(date) {
  const grid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("currentMonthLabel");
  grid.innerHTML = "";

  const year = date.getFullYear();
  const month = date.getMonth();

  monthLabel.textContent = date
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  // Calendar Header (Days of Week)
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  daysOfWeek.forEach((day) => {
    const div = document.createElement("div");
    div.className = "calendar-header";
    div.textContent = day;
    grid.appendChild(div);
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty cells for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    const div = document.createElement("div");
    div.className = "calendar-day empty";
    grid.appendChild(div);
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month, d);
    const div = document.createElement("div");
    div.className = "calendar-day";

    // Check if today
    const today = new Date();
    if (dayDate.toDateString() === today.toDateString()) {
      div.classList.add("today");
    }

    div.innerHTML = `<span class="day-number">${d}</span>`;

    // Add Markers
    const dayCheckins = checkinHistory.filter(
      (c) => c.date.toDateString() === dayDate.toDateString(),
    );
    const dayClasses = classHistory.filter(
      (c) => c.date.toDateString() === dayDate.toDateString(),
    );

    if (dayCheckins.length > 0 || dayClasses.length > 0) {
      if (dayCheckins.length > 0) div.classList.add("has-activity");
      const markers = document.createElement("div");
      markers.className = "day-markers";

      if (dayCheckins.length > 0) {
        markers.innerHTML += `<span class="material-symbols-outlined check-mark" title="Check-in">check_circle</span>`;
      }
      if (dayClasses.length > 0) {
        markers.innerHTML += `<span class="material-symbols-outlined class-mark" title="Aula">event</span>`;
      }
      div.appendChild(markers);

      // Interaction
      div.onclick = () => openCalendarModal(dayDate, dayCheckins, dayClasses);
    }

    grid.appendChild(div);
  }
}

function changeMonth(delta) {
  // Fix: Set day to 1 to avoid skipping months (e.g., Jan 30 -> Feb 30 -> Mar 2)
  currentDate.setDate(1);
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderCalendar(currentDate);
}

function openCalendarModal(date, workouts, classes) {
  const modal = document.getElementById("calendarModal");
  const dateTitle = document.getElementById("calendarModalDate");
  const body = document.getElementById("calendarModalBody");

  dateTitle.textContent = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  body.innerHTML = "";

  if (workouts.length === 0 && classes.length === 0) {
    body.innerHTML =
      '<p class="text-center text-gray">Nenhuma atividade registrada.</p>';
  } else {
    // Render Workouts
    workouts.forEach((w) => {
      const div = document.createElement("div");
      div.className = "modal-list-item workout";
      div.innerHTML = `
                <h4><span class="material-symbols-outlined">check_circle</span> Check-in: ${w.name || "Treino"}</h4>
            `;
      body.appendChild(div);
    });

    // Render Classes
    classes.forEach((c) => {
      const div = document.createElement("div");
      div.className = "modal-list-item class";
      div.innerHTML = `
                <h4><span class="material-symbols-outlined">event</span> Aula: ${c.title}</h4>
                <p><span class="material-symbols-outlined" style="font-size: 1rem !important;">schedule</span> Horário: ${c.time}</p>
            `;
      body.appendChild(div);
    });
  }

  modal.classList.add("active");
}

function closeCalendarModal() {
  document.getElementById("calendarModal").classList.remove("active");
}

function openCloseMenu() {
  const body = document.querySelector("body");
  if (body.classList.contains("closed-menu")) {
    body.classList.remove("closed-menu");
  } else {
    body.classList.add("closed-menu");
  }
}

// Funções do Modal de Informações do Aluno
function openStudentInfoModal() {
  if (!currentUserData) {
    showAlert("Carregando informações...", "error");
    return;
  }

  // Preencher informações do aluno
  document.getElementById("studentInfoName").textContent = currentUserData.name || currentUserData.nome || "-";
  document.getElementById("studentInfoEmail").textContent = currentUserData.email || "-";
  document.getElementById("studentInfoPhone").textContent = currentUserData.phone || "-";
  document.getElementById("studentInfoCpf").textContent = currentUserData.document || "-";

  // Formatar tipo de plano
  const planType = currentUserData.planType || currentUserData.plan_type || "mensal";
  const planTypeMap = {
    mensal: "Mensal",
    trimestral: "Trimestral",
    semestral: "Semestral",
    anual: "Anual"
  };
  document.getElementById("studentInfoPlanType").textContent = planTypeMap[planType] || planType;

  // Ocultar formulário de mudança de senha se estiver visível
  document.getElementById("changePasswordSection").style.display = "none";

  // Limpar mensagens e campos
  document.getElementById("passwordMessage").textContent = "";
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";

  // Abrir modal
  document.getElementById("studentInfoModal").classList.add("active");
}

function closeStudentInfoModal() {
  document.getElementById("studentInfoModal").classList.remove("active");
  // Ocultar formulário de mudança de senha
  document.getElementById("changePasswordSection").style.display = "none";
  // Limpar campos
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  document.getElementById("passwordMessage").textContent = "";
}

function handleStudentModalClick(event) {
  // Fechar modal se clicar no backdrop (fora do modal-content)
  if (event.target.id === "studentInfoModal") {
    closeStudentInfoModal();
  }
}

function toggleChangePasswordForm() {
  const section = document.getElementById("changePasswordSection");
  if (section.style.display === "none") {
    section.style.display = "block";
  } else {
    section.style.display = "none";
    // Limpar campos ao ocultar
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    document.getElementById("passwordMessage").textContent = "";
  }
}

function cancelChangePassword() {
  toggleChangePasswordForm();
}

// Validação de senha (mesmas regras do backend)
function isValidPassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  if (password.includes(' ')) {
    return false;
  }
  return password.length >= 6;
}

async function changePassword() {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const messageEl = document.getElementById("passwordMessage");

  // Limpar mensagem anterior
  messageEl.textContent = "";
  messageEl.className = "password-message";

  // Validações
  if (!currentPassword || !newPassword || !confirmPassword) {
    messageEl.textContent = "Por favor, preencha todos os campos.";
    messageEl.classList.add("error");
    return;
  }

  if (!isValidPassword(newPassword)) {
    messageEl.textContent = "A nova senha deve ter no mínimo 6 caracteres e não pode conter espaços.";
    messageEl.classList.add("error");
    return;
  }

  if (newPassword !== confirmPassword) {
    messageEl.textContent = "As senhas não coincidem.";
    messageEl.classList.add("error");
    return;
  }

  if (currentPassword === newPassword) {
    messageEl.textContent = "A nova senha deve ser diferente da senha atual.";
    messageEl.classList.add("error");
    return;
  }

  try {
    const response = await apiFetch("/auth/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Erro ao alterar senha");
    }

    // Sucesso
    messageEl.textContent = "Senha alterada com sucesso!";
    messageEl.classList.add("success");

    // Limpar campos após 2 segundos
    setTimeout(() => {
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
      messageEl.textContent = "";
      messageEl.className = "password-message";
      // Ocultar formulário após sucesso
      document.getElementById("changePasswordSection").style.display = "none";
    }, 2000);
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    messageEl.textContent = error.message || "Erro ao alterar senha. Tente novamente.";
    messageEl.classList.add("error");
  }
}
