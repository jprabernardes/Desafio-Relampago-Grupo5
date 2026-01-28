const API_URL = "http://localhost:3000/api";
// ...

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

// ... (existing code)

// Cancelar inscrição
async function cancelEnrollment(classId) {
  showConfirmModal(
    "Tem certeza que deseja cancelar sua inscrição?",
    async () => {
      console.log("Usuário confirmou cancelamento.");

      try {
        const response = await fetch(
          `${API_URL}/student/classes/${classId}/cancel`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
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
let token = localStorage.getItem("token");
let currentUserId = null;

// Verificar autenticação
if (!token) {
  window.location.href = "/";
}

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
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Não autorizado");

    const data = await response.json();
    currentUserId = data.id;
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
    const response = await fetch(`${API_URL}/student/workouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Erro ao carregar treinos");

    const workouts = await response.json();
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
              <h3>Treino ${workout.name}</h3>
              <p><strong>Instrutor:</strong> ${workout.instructor_name || workout.instructor_id}</p>
              <div class="exercises-list">
                ${
                  Array.isArray(workout.exercises)
                    ? workout.exercises
                        .map(
                          (ex) => `
                    <div style="margin-bottom: 4px;">
                      <strong>${ex.name}</strong>: ${ex.series}x${ex.repetitions} - ${ex.weight || ""}
                    </div>
                  `,
                        )
                        .join("")
                    : `<pre>${workout.exercises}</pre>`
                }
              </div>
              <div class="workout-actions">
                <button class="btn btn-primary" onclick="printWorkout(${workout.id})">🖨️ Imprimir (Check-in)</button>
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
    // Registrar check-in
    const response = await fetch(`${API_URL}/student/checkin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workout_id: workoutId }),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage =
        error.error || error.message || "Erro ao registrar check-in";

      // Se o erro for de check-in duplicado, permite imprimir mesmo assim
      if (errorMessage.includes("Você já fez check-in hoje")) {
        showAlert("Você já fez check-in hoje. Imprimindo...", "warning");
      } else {
        throw new Error(errorMessage);
      }
    } else {
      // Só mostra msg de sucesso se retornou 200 OK
      showAlert("Check-in registrado com sucesso!", "success");
    }

    // Imprimir apenas o treino específico
    const workoutContent = document
      .querySelector(
        `.workout-card button[onclick="printWorkout(${workoutId})"]`,
      )
      .closest(".workout-card").innerHTML;

    // Remover o botão de impressão do conteúdo a ser impresso
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = workoutContent;
    const btn = tempDiv.querySelector(".workout-actions");
    if (btn) btn.remove();

    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Imprimir Treino</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(
      "body { font-family: sans-serif; padding: 20px; }",
    );
    printWindow.document.write(
      ".workout-card { border: 1px solid #ccc; padding: 20px; border-radius: 8px; }",
    );
    printWindow.document.write("h3 { margin-top: 0; color: #333; }");
    printWindow.document.write("</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write('<div class="workout-card">');
    printWindow.document.write(tempDiv.innerHTML);
    printWindow.document.write("</div>");
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    // Pequeno delay para garantir que estilos carreguem
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
      fetch(`${API_URL}/student/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/student/my-classes`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
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

function renderAvailableClasses() {
  const container = document.getElementById("classesList");
  if (allAvailableClasses.length === 0) {
    container.innerHTML = "<p>Nenhuma aula disponível no momento.</p>";
    return;
  }

  container.innerHTML = allAvailableClasses
    .map((cls) => {
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

      const date = new Date(cls.date);
      const timeStr = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateStr = date.toLocaleDateString("pt-BR");

      return `
            <div class="class-card class-card-clickable" onclick="openClassModal(${cls.id})">
              <div>
                <h3 style="margin-bottom: 0.75rem;">${cls.title}</h3>
                <p style="font-size: 0.9rem; margin-bottom: 0.4rem;">📍 ${cls.location || "Sala Principal"}</p>
                <p style="font-size: 0.9rem;">📅 ${dateStr} • ⏰ ${timeStr}</p>
              </div>
              <span class="class-status ${statusClass}">${statusText}</span>
            </div>
          `;
    })
    .join("");
}

// Modal de Detalhes da Aula
function openClassModal(classId) {
  const cls = allAvailableClasses.find((c) => c.id === classId);
  if (!cls) return;

  const isInscrito = myEnrollmentIds.includes(cls.id);
  const isFull = cls.current_participants >= cls.max_participants;
  const date = new Date(cls.date);
  const timeStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
    const response = await fetch(
      `${API_URL}/student/classes/${classId}/enroll`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
    const response = await fetch(`${API_URL}/student/my-classes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Erro ao carregar inscrições");

    const classes = await response.json();
    const container = document.getElementById("myClassesList");

    if (classes.length === 0) {
      container.innerHTML = "<p>Você não está inscrito em nenhuma aula.</p>";
      return;
    }

    container.innerHTML = classes
      .map((cls) => {
        const date = new Date(cls.date);
        const isPast = date < new Date();
        const timeStr = date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const dateStr = date.toLocaleDateString("pt-BR");

        let statusLabel = isPast
          ? '<span class="class-status status-full">Encerrada</span>'
          : '<span class="class-status status-enrolled">Confirmada</span>';

        let actionBtn = !isPast
          ? `<button class="btn btn-danger btn-sm" style="margin-top: 1.5rem; width: 100%; border-radius: 6px; font-size: 0.85rem;" onclick="cancelEnrollment(${cls.id})">Cancelar Inscrição</button>`
          : "";

        return `
            <div class="class-card" style="border-left: 5px solid ${isPast ? "#dc3545" : "#28a745"}; display: flex; flex-direction: column; height: 100%;">
              <div>
                <h3 style="margin-bottom: 0.75rem;">${cls.title}</h3>
                <p style="font-size: 0.9rem; margin-bottom: 0.4rem; color: #4a5568;">📍 ${cls.location || "Sala Principal"}</p>
                <p style="font-size: 0.9rem; color: #4a5568;">📅 ${dateStr} • ⏰ ${timeStr}</p>
              </div>
              <div style="margin-top: auto; padding-top: 1rem;">
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
        const response = await fetch(
          `${API_URL}/student/classes/${classId}/cancel`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
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
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

// Inicializar
loadUserInfo();
loadWorkouts();
