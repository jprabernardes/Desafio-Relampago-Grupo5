const { resolveAppPath } = window.AppConfig;

function togglePassword() {
  const senhaInput = document.getElementById("senha");
  const toggleIcon = document.querySelector(".toggle-password");
  
  if (senhaInput.type === "password") {
    senhaInput.type = "text";
    toggleIcon.textContent = "visibility";
  } else {
    senhaInput.type = "password";
    toggleIcon.textContent = "visibility_off";
  }
}

function forgotPassword() {
  const email = document.getElementById("email").value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email || !emailRegex.test(email)) {
    showAlert("Insira seu email", "error");
    return;
  }
  showAlert(
    "Informações para recuperação de senha foram enviados para o seu email",
    "success",
  );
}

let alertTimeout;

function showAlert(message, type = "error") {
  const alert = document.getElementById("alert");
  alert.textContent = message;
  alert.className = `alert ${type} show`;

  if (alertTimeout) {
    clearTimeout(alertTimeout);
  }

  alertTimeout = setTimeout(() => {
    alert.classList.remove("show");
    alertTimeout = null;
  }, 10000);
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("senha").value;

  try {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Redirecionar baseado no perfil (role)
      const role = data.user.role;
      switch (role) {
        case "administrador":
          window.location.href = resolveAppPath("/dashboard-admin.html");
          break;
        case "recepcionista":
          window.location.href = resolveAppPath("/dashboard-receptionist.html");
          break;
        case "instrutor":
          window.location.href = resolveAppPath("/dashboard-instructor.html");
          break;
        case "aluno":
          window.location.href = resolveAppPath("/dashboard-student.html");
          break;
        default:
          showAlert("Role desconhecido");
      }
    } else {
      showAlert(data.error || "Erro ao fazer login");
    }
  } catch (error) {
    showAlert("Erro ao conectar com o servidor");
  }
});
