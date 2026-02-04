// public/js/profile-modal.js
// Simple shared profile modal: show current user info (read-only) + allow changing own password.
// Requires api.js (apiFetch) to be loaded.

(function () {
  function getEl(id) {
    return document.getElementById(id);
  }

  function isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    if (password.includes(' ')) return false;
    return password.length >= 6;
  }

  async function getMe() {
    const res = await apiFetch('/auth/me');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Erro ao carregar usuário.');
    }
    return data;
  }

  const state = {
    modalId: null,
  };

  function clearPasswordFields() {
    const current = getEl('profileCurrentPassword');
    const next = getEl('profileNewPassword');
    const confirm = getEl('profileConfirmPassword');
    if (current) current.value = '';
    if (next) next.value = '';
    if (confirm) confirm.value = '';

    const msg = getEl('profilePasswordMessage');
    if (msg) {
      msg.textContent = '';
      msg.className = 'password-message';
    }
  }

  function setMessage(text, type) {
    const msg = getEl('profilePasswordMessage');
    if (!msg) return;
    msg.textContent = text || '';
    msg.className = 'password-message' + (type ? ` ${type}` : '');
  }

  async function open() {
    if (!state.modalId) return;
    const modal = getEl(state.modalId);
    if (!modal) return;

    const section = getEl('profilePasswordSection');
    if (section) section.style.display = 'none';
    const btn = getEl('profileTogglePasswordBtn');
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined">lock</span> Mudar Senha';

    try {
      const me = await getMe();

      const name = me.name || me.nome || '-';
      const email = me.email || '-';
      const phone = me.phone || '-';
      const cpf = me.document || '-';
      const role = me.role || '-';

      const nameEl = getEl('profileInfoName');
      const emailEl = getEl('profileInfoEmail');
      const phoneEl = getEl('profileInfoPhone');
      const cpfEl = getEl('profileInfoCpf');
      const roleEl = getEl('profileInfoRole');

      if (nameEl) nameEl.textContent = name;
      if (emailEl) emailEl.textContent = email;
      if (phoneEl) phoneEl.textContent = phone;
      if (cpfEl) cpfEl.textContent = cpf;
      if (roleEl) roleEl.textContent = role;

      modal.classList.add('active');

      const current = getEl('profileCurrentPassword');
      if (current) current.focus();
    } catch (err) {
      setMessage(err.message || 'Erro ao abrir perfil.', 'error');
      modal.classList.add('active');
    }
  }

  function close() {
    if (!state.modalId) return;
    const modal = getEl(state.modalId);
    if (!modal) return;
    modal.classList.remove('active');
    clearPasswordFields();
  }

  function handleBackdropClick(event) {
    if (!state.modalId) return;
    if (event && event.target && event.target.id === state.modalId) {
      close();
    }
  }

  function togglePasswordForm() {
    const section = getEl('profilePasswordSection');
    const btn = getEl('profileTogglePasswordBtn');
    if (!section) return;

    if (section.style.display === 'none') {
      section.style.display = 'block';
      if (btn) btn.innerHTML = '<span class="material-symbols-outlined">close</span> Cancelar';
    } else {
      section.style.display = 'none';
      if (btn) btn.innerHTML = '<span class="material-symbols-outlined">lock</span> Mudar Senha';
      clearPasswordFields();
    }
  }

  async function submit() {
    const currentPassword = (getEl('profileCurrentPassword')?.value || '').trim();
    const newPassword = (getEl('profileNewPassword')?.value || '').trim();
    const confirmPassword = (getEl('profileConfirmPassword')?.value || '').trim();

    setMessage('', null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Por favor, preencha todos os campos.', 'error');
      return;
    }

    if (!isValidPassword(newPassword)) {
      setMessage('A nova senha deve ter no mínimo 6 caracteres e não pode conter espaços.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('As senhas não coincidem.', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      setMessage('A nova senha deve ser diferente da senha atual.', 'error');
      return;
    }

    try {
      const res = await apiFetch('/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Erro ao alterar senha.');
      }

      setMessage('Senha alterada com sucesso!', 'success');

      setTimeout(() => {
        close();
      }, 1200);
    } catch (err) {
      setMessage(err.message || 'Erro ao alterar senha.', 'error');
    }
  }

  function init(options) {
    const { avatarId, modalId } = options || {};
    if (!avatarId || !modalId) return;

    state.modalId = modalId;

    const avatar = getEl(avatarId);
    if (avatar) {
      avatar.addEventListener('click', open);
    }

    // Expose handlers for inline HTML hooks
    window.ProfileModal = {
      open,
      close,
      submit,
      handleBackdropClick,
      togglePasswordForm,
    };
  }

  // Make init available even before init() is called
  window.ProfileModalInit = init;
})();
