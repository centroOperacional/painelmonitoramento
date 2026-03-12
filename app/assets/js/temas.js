// ===== temas.js — Sistema de temas visuais =====
// Botão 🎨 flutuante no canto inferior direito.
// Cada usuário salva preferência no localStorage.

const TEMAS = {
  azul: {
    label: 'Azul',
    icone: '🔵',
    vars: {
      '--bg':                '#1a2a4a',
      '--bg2':               '#1e3258',
      '--bg3':               '#243b6a',
      '--bg4':               '#2a4478',
      '--azul':              '#4a90d9',
      '--azul-claro':        '#6aaff0',
      '--azul-glow':         'rgba(74,144,217,0.18)',
      '--azul-borda':        'rgba(74,144,217,0.4)',
      '--texto':             '#e8f0ff',
      '--texto-dim':         '#7a9abb',
      '--borda':             '#2e4a7a',
      '--borda-clara':       '#3a5a90',
      '--th-bg':             '#12192e',
      '--hover-linha':       'rgba(74,144,217,0.06)',
      '--zebra':             'rgba(255,255,255,0.018)',
      '--modal-overlay':     'rgba(0,0,0,0.6)',
      '--cell-mono-cor':     '#b0d0f0',
      '--header-titulo-cor': '#ffffff',
      '--texto-usuario':     'rgba(255,255,255,0.6)',
      '--btn-cor':           '#4a90d9',
      '--nav-hover-bg':      'rgba(74,144,217,0.18)',
      '--nav-hover-cor':     'white',
      '--nav-active-bg':     '#4a90d9',
      '--nav-active-cor':    'white',
      '--nav-active-border': '#4a90d9',
      '--hover-linha-cor-texto': '#e8f0ff',
      '--btn-neutro-bg':     '#2a4478',
      '--btn-neutro-cor':    '#e8f0ff',
      '--btn-neutro-border': '#3a5a90',
      '--btn-neutro-hover-bg': '#243b6a',
      '--btn-neutro-hover-cor': '#e8f0ff',
    }
  },
  escuro: {
    label: 'Escuro',
    icone: '⚫',
    vars: {
      '--bg':                '#0d0d0d',
      '--bg2':               '#161616',
      '--bg3':               '#1e1e1e',
      '--bg4':               '#252525',
      '--azul':              '#b0b0b0',
      '--azul-claro':        '#cccccc',
      '--azul-glow':         'rgba(180,180,180,0.10)',
      '--azul-borda':        'rgba(180,180,180,0.25)',
      '--texto':             '#e8e8e8',
      '--texto-dim':         '#888888',
      '--borda':             '#2a2a2a',
      '--borda-clara':       '#3a3a3a',
      '--th-bg':             '#080808',
      '--hover-linha':       'rgba(255,255,255,0.03)',
      '--zebra':             'rgba(255,255,255,0.012)',
      '--modal-overlay':     'rgba(0,0,0,0.75)',
      '--cell-mono-cor':     '#cccccc',
      '--header-titulo-cor': '#e8e8e8',
      '--texto-usuario':     'rgba(232,232,232,0.55)',
      '--btn-cor':           '#b0b0b0',
      '--nav-hover-bg':      'rgba(180,180,180,0.10)',
      '--nav-hover-cor':     '#e8e8e8',
      '--nav-active-bg':     '#2a2a2a',
      '--nav-active-cor':    '#e8e8e8',
      '--nav-active-border': '#3a3a3a',
      '--hover-linha-cor-texto': '#e8e8e8',
      '--btn-neutro-bg':     '#252525',
      '--btn-neutro-cor':    '#cccccc',
      '--btn-neutro-border': '#3a3a3a',
      '--btn-neutro-hover-bg': '#1a1a1a',
      '--btn-neutro-hover-cor': '#e8e8e8',
    }
  },
  claro: {
    label: 'Claro',
    icone: '☀️',
    vars: {
      '--bg':                '#f0f2f5',
      '--bg2':               '#e8eaed',
      '--bg3':               '#dde0e6',
      '--bg4':               '#d2d6de',
      '--azul':              '#20242b',
      '--azul-claro':        '#1a1e26',
      '--azul-glow':         'rgba(32,36,43,0.08)',
      '--azul-borda':        'rgba(32,36,43,0.25)',
      '--texto':             '#1a1e26',
      '--texto-dim':         '#4a5568',
      '--borda':             '#c4c9d4',
      '--borda-clara':       '#b0b7c4',
      '--th-bg':             '#e2e5ea',
      '--hover-linha':       'rgba(44,111,173,0.05)',
      '--zebra':             'rgba(0,0,0,0.018)',
      '--modal-overlay':     'rgba(0,0,0,0.45)',
      '--cell-mono-cor':     '#1a1e26',
      '--header-titulo-cor': '#1a1e26',
      '--texto-usuario':     'rgba(26,30,38,0.7)',
      '--btn-cor':           '#1a1e26',
      '--nav-hover-bg':      '#d2d6de',
      '--nav-hover-cor':     '#1a1e26',
      '--nav-active-bg':     '#c4c9d4',
      '--nav-active-cor':    '#1a1e26',
      '--nav-active-border': '#b0b7c4',
      '--hover-linha-cor-texto': '#1a1e26',
      '--btn-neutro-bg':     '#d2d6de',
      '--btn-neutro-cor':    '#1a1e26',
      '--btn-neutro-border': '#b0b7c4',
      '--btn-neutro-hover-bg': '#1a1e26',
      '--btn-neutro-hover-cor': '#f0f2f5',
    }
  }
};

const TEMA_KEY = 'fb_tema';

// ── Aplica tema no :root ─────────────────────────────────────────────────────
function aplicarTema(nome) {
  const tema = TEMAS[nome] || TEMAS['azul'];
  const root = document.documentElement;
  Object.entries(tema.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  localStorage.setItem(TEMA_KEY, nome);

  // Atualiza visual dos botões no painel flutuante
  document.querySelectorAll('.fb-tema-opt').forEach(btn => {
    const ativo = btn.dataset.tema === nome;
    btn.style.borderColor = ativo ? 'var(--azul)' : 'var(--borda)';
    btn.style.background  = ativo ? 'var(--azul-glow)' : 'var(--bg3)';
    btn.style.color       = ativo ? 'var(--texto)' : 'var(--texto-dim)';
    btn.style.fontWeight  = ativo ? '700' : '500';
  });

  // Fecha painel após escolha
  setTimeout(() => {
    document.getElementById('fb-tema-painel')?.classList.add('fb-tema-hidden');
  }, 280);
}

// ── Carrega e aplica tema salvo (IMEDIATO — antes do render) ─────────────────
function carregarTema() {
  const salvo = localStorage.getItem(TEMA_KEY) || 'azul';
  const tema  = TEMAS[salvo] || TEMAS['azul'];
  const root  = document.documentElement;
  Object.entries(tema.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  return salvo;
}

// ── Injeta botão flutuante 🎨 no DOM ─────────────────────────────────────────
function iniciarSeletorTema() {
  const atual = localStorage.getItem(TEMA_KEY) || 'azul';

  const style = document.createElement('style');
  style.textContent = `
    #fb-tema-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }
    #fb-tema-toggle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid var(--borda-clara);
      background: var(--bg3);
      font-size: 1.2rem;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #fb-tema-toggle:hover {
      background: var(--bg4);
      border-color: var(--azul-borda);
      transform: scale(1.08);
    }
    #fb-tema-painel {
      background: var(--bg2);
      border: 1px solid var(--borda-clara);
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.35);
      min-width: 130px;
      transition: opacity 0.15s, transform 0.15s;
    }
    #fb-tema-painel.fb-tema-hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
    }
    #fb-tema-titulo {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--texto-dim);
      padding: 0 4px 4px;
      border-bottom: 1px solid var(--borda);
      margin-bottom: 2px;
    }
    .fb-tema-opt {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: 6px;
      border: 1px solid;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 500;
      transition: all 0.15s;
      text-align: left;
    }
    .fb-tema-opt:hover {
      border-color: var(--azul-borda) !important;
      color: var(--texto) !important;
      background: var(--bg4) !important;
    }
    .fb-tema-icone { font-size: 1rem; line-height: 1; }
  `;
  document.head.appendChild(style);

  const wrapper = document.createElement('div');
  wrapper.id = 'fb-tema-wrapper';
  wrapper.innerHTML = `
    <button id="fb-tema-toggle" onclick="toggleTemaPainel()" title="Trocar tema">🎨</button>
    <div id="fb-tema-painel" class="fb-tema-hidden">
      <div id="fb-tema-titulo">Tema</div>
      ${Object.entries(TEMAS).map(([key, t]) => {
        const ativo = key === atual;
        return `<button
          class="fb-tema-opt"
          data-tema="${key}"
          onclick="aplicarTema('${key}')"
          style="
            border-color:${ativo ? 'var(--azul)' : 'var(--borda)'};
            background:${ativo ? 'var(--azul-glow)' : 'var(--bg3)'};
            color:${ativo ? 'var(--texto)' : 'var(--texto-dim)'};
            font-weight:${ativo ? '700' : '500'};
          ">
          <span class="fb-tema-icone">${t.icone}</span>
          <span>${t.label}</span>
        </button>`;
      }).join('')}
    </div>
  `;
  document.body.appendChild(wrapper);
}

function toggleTemaPainel() {
  document.getElementById('fb-tema-painel')?.classList.toggle('fb-tema-hidden');
}

// Fecha ao clicar fora
document.addEventListener('click', e => {
  const w = document.getElementById('fb-tema-wrapper');
  if (w && !w.contains(e.target)) {
    document.getElementById('fb-tema-painel')?.classList.add('fb-tema-hidden');
  }
});

// ── Execução imediata — sem flash de tema errado ──────────────────────────────
carregarTema();
// Não exibe o botão em páginas que definirem esta flag (ex: login)
if (!window.FB_TEMA_SEM_BOTAO) {
  document.addEventListener('DOMContentLoaded', iniciarSeletorTema);
}
