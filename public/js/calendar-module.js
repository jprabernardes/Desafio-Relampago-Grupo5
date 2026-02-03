/**
 * Módulo de Calendário Compartilhado
 * Usado por Dashboards de Instrutor, Recepcionista e Admin
 */

window.CalendarModule = (function () {
    // Estado interno
    let calendarCurrentDate = new Date();
    let calendarClasses = [];
    let loadCalendarAttempts = 0;
    const MAX_CALENDAR_ATTEMPTS = 5;
    let selectedDayForCreation = null;
    let currentUserId = null;
    let currentUserRole = null;

    // Helpers de Data
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

    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function convertDateForBackend(dateStr) {
        if (!dateStr) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split("-");
            return `${day}-${month}-${year}`;
        }
        return dateStr;
    }

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

    // Inicialização
    function init(userId, role) {
        currentUserId = userId;
        currentUserRole = role;

        // Setup listeners globais se necessário
        // (Muitos listeners são configurados no HTML onclick ou na abertura do modal)

        // Expor funções globais que o HTML espera
        window.changeCalendarMonth = changeCalendarMonth;
        window.openCreateRecurringClassModal = openCreateRecurringClassModal;
        window.closeCreateRecurringClassModal = closeCreateRecurringClassModal;
        window.openEditClassModal = openEditClassModal;
        window.closeEditClassModal = closeEditClassModal;
        window.deleteClassFromEditModal = deleteClassFromEditModal;
        window.toggleWeekdaySelector = toggleWeekdaySelector;

        setupFormListeners();
    }

    function setupFormListeners() {
        // Listener para o form de criação recorrente
        const createForm = document.getElementById("createRecurringClassForm");
        if (createForm) {
            // Remover listener antigo para não duplicar se init for chamado várias vezes
            const newForm = createForm.cloneNode(true);
            createForm.parentNode.replaceChild(newForm, createForm);

            newForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await handleCreateRecurringSubmit();
            });
        }

        // Listener para o form de edição
        const editForm = document.getElementById("editClassFormModal");
        if (editForm) {
            const newForm = editForm.cloneNode(true);
            editForm.parentNode.replaceChild(newForm, editForm);

            newForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await handleEditSubmit();
            });
        }

        // Validadores de input date (min today)
        const today = new Date().toISOString().split("T")[0];
        const inputs = [
            document.getElementById("recurringStartDate"),
            document.getElementById("recurringEndDate"),
            document.getElementById("editClassDate")
        ];
        inputs.forEach(input => {
            if (input) input.setAttribute("min", today);
        });
    }

    // ================= LOGICA DO CALENDARIO =================

    async function loadCalendar() {
        const grid = document.getElementById("calendarGrid");
        const monthLabel = document.getElementById("currentMonthLabel");

        if (!grid || !monthLabel) {
            loadCalendarAttempts++;
            if (loadCalendarAttempts < MAX_CALENDAR_ATTEMPTS) {
                setTimeout(loadCalendar, 500);
            }
            return;
        }

        loadCalendarAttempts = 0;

        try {
            const res = await apiFetch("/classes");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const allClasses = await res.json();
            console.log("CalendarModule: Fetched classes:", allClasses);

            calendarClasses = allClasses.map(cls => {
                // ... mapping logic ...
                let dateStr = cls.date;
                let timeStr = cls.time;

                if (dateStr && dateStr.includes('T')) {
                    const [datePart, timePart] = dateStr.split('T');
                    dateStr = datePart;
                    if (timePart) timeStr = timePart.substring(0, 5);
                }

                if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    const [year, month, day] = dateStr.split('-');
                    dateStr = `${day}-${month}-${year}`;
                }

                return {
                    id: cls.id,
                    name: cls.title || cls.name,
                    nome_aula: cls.title || cls.name,
                    date: dateStr,
                    data: dateStr,
                    time: timeStr,
                    hora: timeStr,
                    slots_limit: cls.max_participants || cls.slots_limit,
                    limite_vagas: cls.max_participants || cls.slots_limit,
                    instructor_id: cls.instructor_id
                };
            });

            renderCalendar(calendarCurrentDate);
        } catch (e) {
            console.error("Erro ao carregar aulas:", e);
            if (window.showAlert) window.showAlert("Erro ao carregar aulas", "error");
            renderCalendar(calendarCurrentDate);
        }
    }

    function renderCalendar(date) {
        const grid = document.getElementById("calendarGrid");
        const monthLabel = document.getElementById("currentMonthLabel");
        if (!grid || !monthLabel) return;

        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            date = new Date();
        }

        grid.innerHTML = "";
        monthLabel.textContent = date
            .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
            .replace(/^\w/, (c) => c.toUpperCase());

        // Cabeçalho
        ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach((day) => {
            const div = document.createElement("div");
            div.className = "calendar-header";
            div.textContent = day;
            grid.appendChild(div);
        });

        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Dias vazios
        for (let i = 0; i < firstDayOfMonth; i++) {
            const div = document.createElement("div");
            div.className = "calendar-day empty";
            grid.appendChild(div);
        }

        // Dias do mês
        for (let d = 1; d <= daysInMonth; d++) {
            const dayDate = new Date(year, month, d);
            const div = document.createElement("div");
            div.className = "calendar-day";

            if (dayDate.toDateString() === today.toDateString()) {
                div.classList.add("today");
            }

            div.innerHTML = `<span class="day-number">${d}</span>`;

            // Aulas do dia
            const dayClasses = (calendarClasses || []).filter((c) => {
                try {
                    const classDate = parseDateBR(c.date || c.data);
                    return classDate.toDateString() === dayDate.toDateString();
                } catch (e) { return false; }
            });

            if (dayClasses.length > 0) {
                div.classList.add("has-class");
                const classesContainer = document.createElement("div");
                classesContainer.className = "day-classes";

                dayClasses.forEach((cls) => {
                    const indicator = document.createElement("div");
                    // Highlight: se for o próprio instrutor OU usuário admin/recepcionista (que vê tudo como "editável", ou podemos usar outra cor)
                    // Para admin/recepcionista, vamos marcar como 'own-class' se eles criaram, ou dar uma cor neutra?
                    // "Este calendário deve funcionar exatamente da mesma forma que funciona para instrutores"
                    // Instrutor ver: own-class (verde), other-class (vermelho).
                    // Admin/Recep pode editar tudo. Então talvez mostrar tudo como 'editável' (verde)?
                    // Ou mostrar verde se for "minha" (criada por mim) e vermelho se for de outro, mas ainda assim editável?
                    // O requisito diz "exatamente como está presente no dashboard de instrutores".
                    // Vamos manter a lógica visual: se instructor_id == currentUserId -> own-class.
                    // Admin e Recepcionista podem editar qualquer aula, então mostramos tudo como "own-class" (azul)
                    const isOwnClass = cls.instructor_id === currentUserId || ['administrador', 'recepcionista'].includes(currentUserRole);
                    indicator.className = `class-indicator ${isOwnClass ? 'own-class' : 'other-class'}`;

                    const className = cls.name || cls.nome_aula || "Aula";
                    const classTime = cls.time || cls.hora || "";
                    indicator.textContent = `${className}${classTime ? ` - ${classTime}` : ''}`;
                    indicator.title = `${className} - ${classTime}`;
                    indicator.setAttribute('data-class-id', cls.id);
                    classesContainer.appendChild(indicator);
                });

                div.appendChild(classesContainer);

                // Click handler
                div.onclick = (e) => {
                    if (e.target.classList.contains("class-indicator")) {
                        const classId = parseInt(e.target.getAttribute('data-class-id'));
                        if (classId) openEditClassModal(classId);
                    } else {
                        openCreateRecurringClassModal(dayDate);
                    }
                };
            } else {
                div.onclick = () => openCreateRecurringClassModal(dayDate);
            }

            grid.appendChild(div);
        }
    }

    function changeCalendarMonth(delta) {
        calendarCurrentDate.setDate(1);
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + delta);
        renderCalendar(calendarCurrentDate);
    }

    // ================= MODAL DE CRIAÇÃO (RECORRENTE) =================

    function openCreateRecurringClassModal(dayDate = null) {
        selectedDayForCreation = dayDate || new Date();
        const modal = document.getElementById("createRecurringClassModal");
        const form = document.getElementById("createRecurringClassForm");
        if (!modal || !form) return;

        form.reset();

        if (selectedDayForCreation) {
            document.getElementById("recurringStartDate").value = formatDateForInput(selectedDayForCreation);
        }

        document.getElementById("recurringPreview").innerHTML = "";

        for (let i = 0; i < 7; i++) {
            const selector = document.getElementById(`day${i}`);
            if (selector) selector.classList.remove("selected");
        }

        modal.classList.add("active");

        // Setup preview listeners
        const inputs = ["recurringStartDate", "recurringEndDate"];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const newEl = el.cloneNode(true);
                el.parentNode.replaceChild(newEl, el);
                newEl.addEventListener("change", updateRecurringPreview);
                // Re-adicionar validador de data minima
                const today = new Date().toISOString().split("T")[0];
                newEl.setAttribute("min", today);
            }
        });

        for (let i = 0; i < 7; i++) {
            const selector = document.getElementById(`day${i}`);
            if (selector) {
                // Clonar para remover listeners antigos
                const newSelector = selector.cloneNode(true);
                selector.parentNode.replaceChild(newSelector, selector);
                newSelector.addEventListener("click", (e) => {
                    e.preventDefault();
                    toggleWeekdaySelector(i);
                    updateRecurringPreview();
                });
            }
        }

        updateRecurringPreview();
    }

    function closeCreateRecurringClassModal() {
        document.getElementById("createRecurringClassModal").classList.remove("active");
        selectedDayForCreation = null;
    }

    function updateRecurringPreview() {
        const startDate = document.getElementById("recurringStartDate").value;
        const endDate = document.getElementById("recurringEndDate").value;
        const preview = document.getElementById("recurringPreview");

        if (!startDate || !endDate) {
            preview.innerHTML = "";
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            preview.innerHTML = '<p style="color: #e53e3e;">Data início deve ser anterior à data fim.</p>';
            return;
        }

        const selectedDays = [];
        for (let i = 0; i < 7; i++) {
            const selector = document.getElementById(`day${i}`);
            if (selector && selector.classList.contains("selected")) selectedDays.push(i);
        }

        if (selectedDays.length === 0) {
            preview.innerHTML = '<p style="color: #d69e2e;">Selecione pelo menos um dia da semana.</p>';
            return;
        }

        const dates = [];
        const current = new Date(start);
        // Ajuste para fuso local se necessário, mas Date(yyyy-mm-dd) é UTC meia-noite normalmente. 
        // Mas para contagem de dias funciona.
        // O problema é que new Date('2023-01-01') é UTC, enquanto new Date(2023, 0, 1) é local.
        // Vamos usar a mesma logica do original.
        // O original usava `new Date(startDate)`.

        // Safety: loop limit
        let loops = 0;
        while (current <= end && loops < 1000) {
            // Correção de timezone offset se necessário (new Date input date string as UTC)
            // Mas getDay() usa hora local browser.
            // É melhor usar UTC methods se a string é UTC, ou criar data local.
            // Para simplificar, assumimos que está ok como no original.
            const day = current.getUTCDay(); // Input date é YYYY-MM-DD -> UTC
            // Mas os seletores 0=Dom serão baseados em quê? 
            // No JS `new Date('2026-02-03')` (ISO) é UTC. `new Date('2026/02/03')` é local.
            // Vamos usar helper parseDateBR do original ou criar localmente.
            // Melhor: criar components
            const d = new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());

            if (selectedDays.includes(d.getDay())) {
                dates.push(new Date(d));
            }
            current.setDate(current.getDate() + 1);
            loops++;
        }

        if (dates.length === 0) {
            preview.innerHTML = '<p style="color: #d69e2e;">Nenhuma data encontrada no intervalo selecionado.</p>';
            return;
        }

        preview.innerHTML = `
        <h4>Serão criadas ${dates.length} aula(s):</h4>
        <ul>
          ${dates.slice(0, 5).map(d => `<li>${d.toLocaleDateString("pt-BR")}</li>`).join("")}
          ${dates.length > 5 ? `<li>... e mais ${dates.length - 5} aula(s)</li>` : ""}
        </ul>
      `;
    }

    function toggleWeekdaySelector(dayIndex) {
        const selector = document.getElementById(`day${dayIndex}`);
        if (selector) selector.classList.toggle("selected");
    }

    async function handleCreateRecurringSubmit() {
        const name = document.getElementById("recurringClassName").value.trim();
        const time = document.getElementById("recurringClassTime").value;
        const slots_limit = parseInt(document.getElementById("recurringClassLimit").value);
        const startDate = document.getElementById("recurringStartDate").value;
        const endDate = document.getElementById("recurringEndDate").value;

        const daysOfWeek = [];
        for (let i = 0; i < 7; i++) {
            const selector = document.getElementById(`day${i}`);
            if (selector && selector.classList.contains("selected")) daysOfWeek.push(i);
        }

        try {
            const res = await apiFetch("/classes/recurring", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    time,
                    slots_limit,
                    daysOfWeek,
                    startDate: convertDateForBackend(startDate),
                    endDate: convertDateForBackend(endDate),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (window.showAlert) window.showAlert(`${data.count || 0} aula(s) criada(s)!`);
                closeCreateRecurringClassModal();
                await loadCalendar();
            } else {
                const err = await res.json();
                if (window.showAlert) window.showAlert(err.error || "Erro ao criar", "error");
            }
        } catch (e) {
            console.error(e);
            if (window.showAlert) window.showAlert("Erro de conexão", "error");
        }
    }

    // ================= MODAL DE EDIÇÃO =================

    async function openEditClassModal(classId) {
        try {
            const classData = calendarClasses.find((c) => c.id === classId);
            if (!classData) {
                const res = await apiFetch(`/classes/${classId}`);
                if (!res.ok) throw new Error("Aula não encontrada");
                const data = await res.json();
                populateEditModal(data);
                return;
            }
            populateEditModal(classData);
        } catch (e) {
            console.error(e);
            if (window.showAlert) window.showAlert("Erro ao carregar aula", "error");
        }
    }

    async function populateEditModal(classData) {
        // PERMISSÃO: Admin e Recep podem editar TUDO. Instrutor só a sua.
        const isAdminOrRecep = ['administrador', 'recepcionista'].includes(currentUserRole);
        const isOwnClass = classData.instructor_id === currentUserId;
        const canEdit = isAdminOrRecep || isOwnClass;

        document.getElementById("editClassId").value = classData.id;
        document.getElementById("editClassName").value = classData.name || classData.nome_aula;
        document.getElementById("editClassDate").value = convertDateFromBackend(classData.date || classData.data);
        document.getElementById("editClassTime").value = classData.time || classData.hora;
        document.getElementById("editClassLimit").value = classData.slots_limit || classData.limite_vagas;

        // Controle de campos
        const inputs = ["editClassName", "editClassDate", "editClassTime", "editClassLimit"];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = !canEdit;
        });

        const submitBtn = document.querySelector("#editClassFormModal button[type='submit']");
        const deleteBtn = document.querySelector("#editClassFormModal .btn-danger");
        const modalTitle = document.getElementById("editClassModalTitle");

        if (submitBtn) {
            submitBtn.disabled = !canEdit;
            submitBtn.style.opacity = canEdit ? "1" : "0.5";
            submitBtn.style.cursor = canEdit ? "pointer" : "not-allowed";
            submitBtn.style.display = canEdit ? "inline-block" : "none"; // Option: hide if can't edit
        }

        if (deleteBtn) deleteBtn.style.display = canEdit ? "inline-block" : "none";

        if (modalTitle) {
            modalTitle.textContent = canEdit ? "Editar Aula" : "Visualizar Aula";
        }

        // Carregar alunos (somente leitura aqui)
        const studentsList = document.getElementById("editEnrolledStudentsList");
        if (studentsList) {
            studentsList.innerHTML = '<p class="text-gray">Carregando...</p>';
            try {
                const res = await apiFetch(`/classes/${classData.id}/students`);
                if (res.ok) {
                    const students = await res.json();
                    if (!students || students.length === 0) {
                        studentsList.innerHTML = '<p class="text-gray">Nenhum aluno inscrito.</p>';
                    } else {
                        studentsList.innerHTML = students.map(s => `
                  <div class="student-list-item">
                     <div class="student-avatar-small">${(s.name || s.nome || "A").charAt(0).toUpperCase()}</div>
                     <div>
                       <div class="student-name">${s.name || s.nome}</div>
                       <div class="student-email">${s.email}</div>
                     </div>
                  </div>
                `).join("");
                    }
                }
            } catch (e) {
                studentsList.innerHTML = '<p class="text-error">Erro ao carregar alunos.</p>';
            }
        }

        document.getElementById("editClassModal").classList.add("active");
    }

    function closeEditClassModal() {
        document.getElementById("editClassModal").classList.remove("active");
    }

    async function handleEditSubmit() {
        const id = document.getElementById("editClassId").value;
        const dateValue = document.getElementById("editClassDate").value;

        // Validação básica
        const selectedDate = new Date(dateValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            if (window.showAlert) window.showAlert("Data não pode ser no passado", "error");
            return;
        }

        const data = {
            name: document.getElementById("editClassName").value,
            date: convertDateForBackend(dateValue),
            time: document.getElementById("editClassTime").value,
            slots_limit: parseInt(document.getElementById("editClassLimit").value),
        };

        try {
            const res = await apiFetch(`/classes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                if (window.showAlert) window.showAlert("Aula atualizada!");
                closeEditClassModal();
                await loadCalendar();
            } else {
                const err = await res.json();
                if (window.showAlert) window.showAlert(err.error || "Erro ao atualizar", "error");
            }
        } catch (e) {
            if (window.showAlert) window.showAlert("Erro conexão", "error");
        }
    }

    function deleteClassFromEditModal() {
        const classId = document.getElementById("editClassId").value;
        if (window.showConfirmModal) {
            window.showConfirmModal("Tem certeza?", async () => {
                try {
                    const res = await apiFetch(`/classes/${classId}`, { method: "DELETE" });
                    if (res.ok) {
                        if (window.showAlert) window.showAlert("Aula deletada!");
                        closeEditClassModal();
                        await loadCalendar();
                    } else {
                        const err = await res.json();
                        if (window.showAlert) window.showAlert(err.error || "Erro", "error");
                    }
                } catch (e) {
                    if (window.showAlert) window.showAlert("Erro conexão", "error");
                }
            });
        } else {
            if (confirm("Tem certeza?")) {
                // Fallback
            }
        }
    }

    return {
        init,
        loadCalendar
    };
})();
