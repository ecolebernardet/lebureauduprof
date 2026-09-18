// =========================================================================
// MODALE UI UNIVERSELLE — remplace prompt / confirm / alert natifs
// API :
//   modalPrompt(title, message, defaultValue)  → Promise<string|null>
//   modalConfirm(title, message)               → Promise<boolean>
//   modalAlert(title, message, type)           → Promise<void>  (type: 'info'|'success'|'error'|'warning')
// =========================================================================

(function() {

// ── Injection du CSS ──────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
#modal-ui-overlay {
    position: fixed; inset: 0; z-index: 999999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55);
    animation: modal-ui-fadein 0.15s ease;
}
@keyframes modal-ui-fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
}
#modal-ui-box {
    background: #1a1a22;
    border: 1px solid #2e2e3a;
    border-radius: 16px;
    padding: 28px 32px 24px;
    width: 420px; max-width: 92vw;
    box-shadow: 0 24px 60px rgba(0,0,0,0.6);
    display: flex; flex-direction: column; gap: 16px;
    animation: modal-ui-slidein 0.18s cubic-bezier(.4,0,.2,1);
    font-family: 'Nunito', sans-serif;
}
@keyframes modal-ui-slidein {
    from { transform: translateY(-12px); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
}
body.menu-light #modal-ui-box {
    background: #f5f6fa;
    border-color: #d0d4da;
    box-shadow: 0 24px 60px rgba(0,0,0,0.2);
}
#modal-ui-header {
    display: flex; align-items: center; gap: 10px;
}
#modal-ui-icon { font-size: 22px; flex-shrink: 0; }
#modal-ui-title {
    font-size: 15px; font-weight: 800; color: #eee;
    flex: 1;
}
body.menu-light #modal-ui-title { color: #1a1a2e; }
#modal-ui-message {
    font-size: 13px; color: #aaa; line-height: 1.5;
    white-space: pre-line;
}
body.menu-light #modal-ui-message { color: #555; }
#modal-ui-input {
    width: 100%; box-sizing: border-box;
    padding: 10px 12px; font-size: 13px;
    background: #111; color: #eee;
    border: 1px solid #3a3a4a; border-radius: 8px;
    outline: none; font-family: 'Nunito', sans-serif;
    transition: border-color .15s;
}
#modal-ui-input:focus { border-color: #4a90e2; }
body.menu-light #modal-ui-input {
    background: #fff; color: #1a1a2e; border-color: #c0c4cc;
}
body.menu-light #modal-ui-input:focus { border-color: #4a90e2; }
#modal-ui-buttons {
    display: flex; gap: 10px; justify-content: flex-end;
}
.modal-ui-btn {
    padding: 8px 20px; border-radius: 9px; font-size: 13px;
    font-weight: 700; cursor: pointer; border: 1px solid transparent;
    transition: opacity .15s, filter .15s;
    font-family: 'Nunito', sans-serif;
}
.modal-ui-btn:hover { filter: brightness(1.12); }
.modal-ui-btn-cancel {
    background: #28282f; color: #aaa; border-color: #3a3a4a;
}
body.menu-light .modal-ui-btn-cancel {
    background: #e4e6ea; color: #555; border-color: #c0c4cc;
}
.modal-ui-btn-confirm {
    background: #4a90e2; color: #fff; border-color: #4a90e2;
}
.modal-ui-btn-danger {
    background: #c0392b; color: #fff; border-color: #c0392b;
}
.modal-ui-btn-ok {
    background: #4a90e2; color: #fff; border-color: #4a90e2;
}
`;
document.head.appendChild(style);

// ── Fabrique de modale ────────────────────────────────────────────────────
function _createModal({ icon, title, message, input, buttons }) {
    // Supprimer une modale existante
    const existing = document.getElementById('modal-ui-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-ui-overlay';

    const box = document.createElement('div');
    box.id = 'modal-ui-box';

    // Header
    const header = document.createElement('div');
    header.id = 'modal-ui-header';
    const iconEl = document.createElement('span');
    iconEl.id = 'modal-ui-icon';
    iconEl.textContent = icon || '💬';
    const titleEl = document.createElement('div');
    titleEl.id = 'modal-ui-title';
    titleEl.textContent = title || '';
    header.appendChild(iconEl);
    header.appendChild(titleEl);
    box.appendChild(header);

    // Message
    if (message) {
        const msgEl = document.createElement('div');
        msgEl.id = 'modal-ui-message';
        msgEl.textContent = message;
        box.appendChild(msgEl);
    }

    // Input
    let inputEl = null;
    if (input !== undefined) {
        inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.id = 'modal-ui-input';
        inputEl.value = input;
        box.appendChild(inputEl);
    }

    // Boutons
    const btnsEl = document.createElement('div');
    btnsEl.id = 'modal-ui-buttons';
    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.className = 'modal-ui-btn ' + (btn.cls || 'modal-ui-btn-ok');
        b.textContent = btn.label;
        b.addEventListener('click', () => btn.onClick(inputEl?.value ?? null));
        btnsEl.appendChild(b);
    });
    box.appendChild(btnsEl);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Focus input ou premier bouton
    setTimeout(() => {
        if (inputEl) {
            inputEl.focus();
            inputEl.select();
        } else {
            const first = btnsEl.querySelector('.modal-ui-btn-confirm, .modal-ui-btn-ok, .modal-ui-btn-danger');
            if (first) first.focus();
        }
    }, 50);

    return overlay;
}

function _removeModal() {
    const el = document.getElementById('modal-ui-overlay');
    if (el) el.remove();
}

// ── API publique ──────────────────────────────────────────────────────────

window.modalPrompt = function(title, message, defaultValue = '') {
    return new Promise(resolve => {
        const overlay = _createModal({
            icon: '✏️',
            title,
            message,
            input: defaultValue,
            buttons: [
                { label: 'Annuler', cls: 'modal-ui-btn-cancel', onClick: () => { _removeModal(); resolve(null); } },
                { label: 'Valider', cls: 'modal-ui-btn-confirm', onClick: (val) => { _removeModal(); resolve(val); } },
            ]
        });
        // Valider avec Entrée, annuler avec Échap
        const onKey = (e) => {
            if (e.key === 'Enter')  { document.removeEventListener('keydown', onKey); _removeModal(); resolve(document.getElementById('modal-ui-input')?.value ?? ''); }
            if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); _removeModal(); resolve(null); }
        };
        document.addEventListener('keydown', onKey);
    });
};

window.modalConfirm = function(title, message, { danger = false } = {}) {
    return new Promise(resolve => {
        _createModal({
            icon: danger ? '🗑️' : '❓',
            title,
            message,
            buttons: [
                { label: 'Annuler', cls: 'modal-ui-btn-cancel', onClick: () => { _removeModal(); resolve(false); } },
                { label: 'Confirmer', cls: danger ? 'modal-ui-btn-danger' : 'modal-ui-btn-confirm', onClick: () => { _removeModal(); resolve(true); } },
            ]
        });
        const onKey = (e) => {
            if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); _removeModal(); resolve(false); }
        };
        document.addEventListener('keydown', onKey);
    });
};

window.modalAlert = function(title, message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    return new Promise(resolve => {
        _createModal({
            icon: icons[type] || 'ℹ️',
            title,
            message,
            buttons: [
                { label: 'OK', cls: 'modal-ui-btn-ok', onClick: () => { _removeModal(); resolve(); } },
            ]
        });
        const onKey = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') { document.removeEventListener('keydown', onKey); _removeModal(); resolve(); }
        };
        document.addEventListener('keydown', onKey);
    });
};

})();
