// ===== auth.js — fluxo de autenticação e autorização =====

// ------------------------------------------------------------
// Helpers de navegação
// ------------------------------------------------------------
function goToLogin() {
  // Caminho absoluto a partir da raiz do site
  window.location.replace("/index.html");
}

function goToPainel() {
  window.location.replace("/app/pages/painel/painel.html");
}

function goToAcessoNegado() {
  window.location.replace("/app/pages/acesso-negado/acesso-negado.html");
}

// ------------------------------------------------------------
// Sessão e perfil
// ------------------------------------------------------------
async function getSession() {
  const c = getClient();
  if (!c) return null;

  try {
    const { data, error } = await c.auth.getSession();
    if (error) {
      
      return null;
    }
    return data?.session ?? null;
  } catch {
    
    return null;
  }
}

async function getPerfil(uid) {
  const c = getClient();
  if (!c || !uid) return null;

  try {
    const { data, error } = await c
      .from("perfis")
      .select("nome,role,ativo,email")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      
      return null;
    }

    return data ?? null;
  } catch {
    
    return null;
  }
}

function salvarContextoLocal(perfil, session) {
  const nomeFallback = session?.user?.email
    ? session.user.email.split("@")[0]
    : "usuario";

  sessionStorage.setItem("fb_role", perfil.role);
  sessionStorage.setItem("fb_nome", perfil.nome || nomeFallback);
}

function limparContextoLocal() {
  sessionStorage.removeItem("fb_role");
  sessionStorage.removeItem("fb_nome");
}

function escreverNomeNoHeader(perfil, session) {
  const elNome = document.getElementById("usuario-nome");
  if (!elNome) return;

  const nomeExibicao =
    perfil?.nome ||
    session?.user?.email ||
    "Usuário";

  elNome.textContent = `${nomeExibicao} · ${perfil?.role || "sem perfil"}`;
}

// ------------------------------------------------------------
// Guarda de rota / proteção de página
// ------------------------------------------------------------
async function guardPage(rolesPermitidas = []) {
  const session = await getSession();

  if (!session?.user?.id) {
    
    limparContextoLocal();
    goToLogin();
    return null;
  }

  const perfil = await getPerfil(session.user.id);

  if (!perfil) {
    
    limparContextoLocal();
    await logout(false);
    goToLogin();
    return null;
  }

  if (!perfil.ativo) {
    
    limparContextoLocal();
    await logout(false);
    goToLogin();
    return null;
  }

  if (Array.isArray(rolesPermitidas) && rolesPermitidas.length > 0) {
    if (!rolesPermitidas.includes(perfil.role)) {
      
      salvarContextoLocal(perfil, session);
      escreverNomeNoHeader(perfil, session);
      goToAcessoNegado();
      return null;
    }
  }

  salvarContextoLocal(perfil, session);
  escreverNomeNoHeader(perfil, session);
  iniciarMonitorInatividade();

  return { session, perfil };
}

// ------------------------------------------------------------
// Logout por inatividade
// ------------------------------------------------------------
const INATIVIDADE_MS = 1 * 60 * 60 * 1000; // 1 hora
let _inativoTimer = null;
let _monitorAtivo = false;

function resetarTimerInatividade() {
  clearTimeout(_inativoTimer);
  _inativoTimer = setTimeout(async () => {
    await logout();
  }, INATIVIDADE_MS);
}

function iniciarMonitorInatividade() {
  if (_monitorAtivo) return;

  _monitorAtivo = true;
  const eventos = ["mousemove", "keydown", "click", "touchstart", "scroll"];

  eventos.forEach((ev) => {
    document.addEventListener(ev, resetarTimerInatividade, { passive: true });
  });

  resetarTimerInatividade();
}

// ------------------------------------------------------------
// Logout manual / forçado
// ------------------------------------------------------------
async function logout(redirecionar = true) {
  const c = getClient();

  try {
    if (c) {
      await c.auth.signOut();
    }
  } catch {
    
  } finally {
    limparContextoLocal();
    if (redirecionar) {
      goToLogin();
    }
  }
}

// ------------------------------------------------------------
// Mensagens de login
// ------------------------------------------------------------
function _msg(id, txt) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = txt;
  el.classList.remove("hidden");
}

function _msgErro(txt) {
  _msg("login-erro", txt);
  setTimeout(() => {
    document.getElementById("login-erro")?.classList.add("hidden");
  }, 5000);
}

function _msgOk(txt) {
  _msg("login-ok", txt);
}

// ------------------------------------------------------------
// Página de login
// ------------------------------------------------------------
async function iniciarPaginaLogin() {
  const c = getClient();
  if (!c) {
    
    return;
  }

  const session = await getSession();
  if (session?.user?.id) {
    const perfil = await getPerfil(session.user.id);

    if (perfil?.ativo) {
      salvarContextoLocal(perfil, session);
      goToPainel();
      return;
    }

    await logout(false);
  }

  let tentativasFalhas = 0;

  const formLogin = document.getElementById("form-login");
  
  document.getElementById("eye-login")?.addEventListener("click", () => {
    const i = document.getElementById("l-senha");
    if (!i) return;
    i.type = i.type === "password" ? "text" : "password";
  });

  async function tentarLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById("l-email")?.value.trim() || "";
    const senha = document.getElementById("l-senha")?.value || "";
    const btn = document.getElementById("btn-entrar");

    if (!email || !senha) {
      _msgErro("Preencha e-mail e senha.");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Verificando...";
    }

    try {
      const { data, error } = await c.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error || !data?.user?.id) {
        tentativasFalhas++;
        const delaySegundos =
          tentativasFalhas >= 3 ? Math.min(tentativasFalhas * 5, 30) : 0;

        if (delaySegundos > 0) {
          _msgErro(`E-mail ou senha incorretos. Aguarde ${delaySegundos}s para tentar novamente.`);

          let restante = delaySegundos;
          const intervalo = setInterval(() => {
            restante--;

            if (restante <= 0) {
              clearInterval(intervalo);
              if (btn) {
                btn.disabled = false;
                btn.textContent = "Entrar";
              }
            } else if (btn) {
              btn.textContent = `Aguarde ${restante}s...`;
            }
          }, 1000);
        } else {
          _msgErro("E-mail ou senha incorretos.");
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Entrar";
          }
        }

        return;
      }

      const perfil = await getPerfil(data.user.id);

      if (!perfil || !perfil.ativo) {
        await c.auth.signOut();
        limparContextoLocal();
        _msgErro("Conta inativa ou não encontrada. Contate o administrador.");

        if (btn) {
          btn.disabled = false;
          btn.textContent = "Entrar";
        }
        return;
      }

      tentativasFalhas = 0;
      salvarContextoLocal(perfil, { user: data.user });
      _msgOk("Login realizado com sucesso.");
      goToPainel();

    } catch {
      
      _msgErro("Erro inesperado ao tentar entrar.");

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Entrar";
      }
    }
  }

  if (formLogin) {
    formLogin.addEventListener("submit", tentarLogin);
  } else {
    document.getElementById("btn-entrar")?.addEventListener("click", tentarLogin);
  }
}

// Inicializar sempre que a página carregar
document.addEventListener("DOMContentLoaded", () => {
  // Apenas inicia a lógica de login se estiver na página correta (onde l-email existe ou index)
  if (document.getElementById("form-login") || document.getElementById("l-email")) {
    iniciarPaginaLogin();
  }
});

// ------------------------------------------------------------
// Alterar senha
// ------------------------------------------------------------
async function atualizarMinhaSenha(novaSenha) {
  if (!novaSenha || novaSenha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const c = getClient();
  const { error } = await c.auth.updateUser({ password: novaSenha });

  if (error) throw error;
  return true;
}
