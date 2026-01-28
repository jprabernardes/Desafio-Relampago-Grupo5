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

// Buscar Aluno
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
      if (!res.ok) throw new Error("Erro");

      const allStudents = await res.json();
      const filtered = allStudents.filter(
        (s) =>
          (s.name || s.nome || "").toLowerCase().includes(term.toLowerCase()) ||
          s.email.includes(term),
      );

      const select = document.getElementById("studentSelect");
      select.innerHTML = filtered
        .map(
          (s) =>
            `<option value="${s.id}">${s.name || s.nome} (${s.email})</option>`,
        )
        .join("");
      select.style.display = "block";
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
      showAlert(e.message || "Erro ao atribuir treino", "error");
    }
  });

// --- Gerenciamento de Aulas (Criar/Editar/Excluir) ---
let myClasses = [];

async function loadClasses() {
  try {
    const res = await fetch(`${API_URL}/instructor/classes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    myClasses = await res.json();
    renderClasses();
  } catch (e) {
    console.error(e);
  }
}

function renderClasses() {
  const container = document.getElementById("classesContainer");
  if (myClasses.length === 0) {
    container.innerHTML = "<p>Nenhuma aula agendada.</p>";
    return;
  }

  container.innerHTML = myClasses
    .map(
      (c) => `
          <div style="background:#fff; padding:1.5rem; margin-bottom:1rem; border-radius:8px; border:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
              <div>
                  <h3 style="color:#333; margin-bottom:0.5rem;">${c.name || c.nome_aula}</h3>
                  <p style="color:#666;">📅 ${new Date(c.date || c.data).toLocaleDateString()} &nbsp; ⏰ ${c.time || c.hora} </p>
                  <p style="color:#666; font-size:0.9rem;">👥 ${c.slots_limit || c.limite_vagas} vagas</p>
              </div>
              <div class="template-actions" style="position:static;">
                   <button class="template-action-btn" title="Editar" onclick="editClass(${c.id})">✏️</button>
                   <button class="template-action-btn" title="Cancelar Aula" onclick="deleteClass(${c.id})" style="color:#e53e3e;">🗑️</button>
              </div>
          </div>
      `,
    )
    .join("");
}

// Create/Edit Class Form
document
  .getElementById("createClassForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("classId").value;
    const data = {
      name: document.getElementById("className").value,
      date: document.getElementById("classDate").value,
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
  document.getElementById("saveClassBtn").textContent =
    "Salvar Alterações";
  document.getElementById("cancelClassEditBtn").style.display =
    "inline-block";

  document.querySelector(".main-content").scrollTop = 0;
};

window.cancelClassEdit = () => {
  document.getElementById("createClassForm").reset();
  document.getElementById("classId").value = "";
  document.getElementById("classFormTitle").textContent =
    "Criar Nova Aula";
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

loadUserInfo();
loadTemplates();
