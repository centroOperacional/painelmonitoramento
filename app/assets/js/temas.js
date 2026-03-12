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
      '--bg':                '#121212',
      '--bg2':               '#1c1c1c',
      '--bg3':               '#262626',
      '--bg4':               '#303030',
      '--azul':              '#b3b3b3',
      '--azul-claro':        '#ffffff',
      '--azul-glow':         'rgba(255,255,255,0.08)',
      '--azul-borda':        'rgba(255,255,255,0.2)',
      '--texto':             '#f0f0f0',
      '--texto-dim':         '#999999',
      '--borda':             '#333333',
      '--borda-clara':       '#444444',
      '--th-bg':             '#181818',
      '--hover-linha':       'rgba(255,255,255,0.04)',
      '--zebra':             'rgba(255,255,255,0.015)',
      '--modal-overlay':     'rgba(0,0,0,0.8)',
      '--cell-mono-cor':     '#cccccc',
      '--header-titulo-cor': '#ffffff',
      '--texto-usuario':     'rgba(255,255,255,0.6)',
      '--btn-cor':           '#b3b3b3',
      '--nav-hover-bg':      'rgba(255,255,255,0.08)',
      '--nav-hover-cor':     '#ffffff',
      '--nav-active-bg':     '#333333',
      '--nav-active-cor':    '#ffffff',
      '--nav-active-border': '#555555',
      '--hover-linha-cor-texto': '#ffffff',
      '--btn-neutro-bg':     '#303030',
      '--btn-neutro-cor':    '#ffffff',
      '--btn-neutro-border': '#444444',
      '--btn-neutro-hover-bg': '#404040',
      '--btn-neutro-hover-cor': '#ffffff',
    }
  },
  claro: {
    label: 'Claro',
    icone: '☀️',
    vars: {
      '--bg':                '#f5f5f5',
      '--bg2':               '#ffffff',
      '--bg3':               '#ebebeb',
      '--bg4':               '#e0e0e0',
      '--azul':              '#333333',
      '--azul-claro':        '#000000',
      '--azul-glow':         'rgba(0,0,0,0.08)',
      '--azul-borda':        'rgba(0,0,0,0.2)',
      '--texto':             '#1a1a1a',
      '--texto-dim':         '#666666',
      '--borda':             '#cccccc',
      '--borda-clara':       '#bbbbbb',
      '--th-bg':             '#fafafa',
      '--hover-linha':       'rgba(0,0,0,0.04)',
      '--zebra':             'rgba(0,0,0,0.02)',
      '--modal-overlay':     'rgba(0,0,0,0.5)',
      '--cell-mono-cor':     '#333333',
      '--header-titulo-cor': '#000000',
      '--texto-usuario':     'rgba(0,0,0,0.7)',
      '--btn-cor':           '#1a1a1a',
      '--nav-hover-bg':      '#e0e0e0',
      '--nav-hover-cor':     '#000000',
      '--nav-active-bg':     '#cccccc',
      '--nav-active-cor':    '#000000',
      '--nav-active-border': '#aaaaaa',
      '--hover-linha-cor-texto': '#000000',
      '--btn-neutro-bg':     '#e0e0e0',
      '--btn-neutro-cor':    '#000000',
      '--btn-neutro-border': '#cccccc',
      '--btn-neutro-hover-bg': '#d0d0d0',
      '--btn-neutro-hover-cor': '#000000',
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
