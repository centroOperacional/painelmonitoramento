// ===== form.js — Versão com Proteção de Dados, JWT e Gestão de Erros =====

// 1. Funções Auxiliares e Sanitização
function limparTexto(html) {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML.trim();
}

function mostrarAlerta(msg, erro = false) {
  const el = document.getElementById("alerta");
  if (!el) return;
  el.textContent = msg;
  el.className = "alerta" + (erro ? " erro" : "");
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 5000);
}

// Auto-fill sigla e grupo ao selecionar cidade
document.getElementById("cidade")?.addEventListener("change", function () {
  const sel = this.options[this.selectedIndex];
  document.getElementById("sigla").value = sel.dataset.sigla || "";
});

// Auto-format field TTK
document.getElementById("ttk")?.addEventListener("input", function (e) {
  let val = e.target.value;
  val = val.toUpperCase().replace(/\s/g, "");
  e.target.value = val;
});

// Define data atual no formato local para o input
const dataInput = document.getElementById("data_inicio");
function setDataAtual() {
  if (!dataInput) return;
  const agora = new Date();
  const pad = n => String(n).padStart(2, "0");
  const local = `${agora.getFullYear()}-${pad(agora.getMonth()+1)}-${pad(agora.getDate())}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
  dataInput.value = local;
}
setDataAtual();

function gerarMaps(rua, bairro, cidade) {
  if (!rua && !bairro && !cidade) return "";
  return "https://www.google.com/maps/search/?api=1&query=" + 
    encodeURIComponent(`${rua}, ${bairro}, ${cidade}`);
}

// 2. Geração da Máscara
function gerarMascara(d) {
  const maps = gerarMaps(d.rua, d.bairro, d.cidade);
  const sla  = d.tag === "Massiva" || d.tag === "Sala de Crise" ? "8 Horas" : "24 Horas";
  const obsEquipe = d.obs ? d.obs : "";
  const causa = d.causa_raiz || "Equipe deve preencher com a causa no local";

  return `

TTK: ${d.ttk}
ID Serviço: ${d.id_servico}
Causa Raiz: ${causa}
TAG: ${d.tag}
ARD: ${d.ard}
SP: ${d.sp}
CTOs: ${d.cto}
Clientes Afetados: ${d.clientes}
Rua: ${d.rua}
Bairro: ${d.bairro}
Cidade: ${d.cidade}
Localização: ${maps}
Data Inicio: ${d.data_inicio_fmt}
Data Fim: 
Observações para a equipe: ${obsEquipe}

SLA: ${sla}
Material gasto: 

SIM: ( ) Não alterar escrita, apenas coloque o X sem espaço se gasto material FiBrasil
NÃO: ( ) Não alterar escrita, apenas coloque o X sem espaço se gasto material FiBrasil

Endereço complementar da atividade realizada:
Metragem cabo aplicado: 
Metragem cabo retirado: 

DESCREVA SUA ATIVIDADE:
    
Causa da falha identificada no local?

Equipe:`;
}

// 3. Gestão de Fotos e Interface
let fotosEnvio = [];

document.getElementById("foto-drop")?.addEventListener("click", () => document.getElementById("foto-input").click());

document.getElementById("foto-input")?.addEventListener("change", (e) => {
  adicionarFotos(Array.from(e.target.files));
  e.target.value = "";
});

function adicionarFotos(arquivos) {
  const imagens = arquivos.filter(f => f.type.startsWith("image/"));
  for (const img of imagens) {
    if (fotosEnvio.length >= 2) break;
    fotosEnvio.push(img);
  }
  renderizarPreviews();
}

function renderizarPreviews() {
  const preview = document.getElementById("foto-preview");
  if (!preview) return;
  preview.innerHTML = "";
  fotosEnvio.forEach((foto, i) => {
    const url = URL.createObjectURL(foto);
    const div = document.createElement("div");
    div.className = "foto-thumb";
    div.innerHTML = `
      <img src="${url}" style="height:80px;width:80px;object-fit:cover;border-radius:6px;">
      <button type="button" onclick="removerFoto(${i})" class="btn-remove-foto">✕</button>`;
    preview.appendChild(div);
  });
  document.getElementById("foto-drop").style.display = fotosEnvio.length >= 2 ? "none" : "";
}

window.removerFoto = (i) => {
  fotosEnvio.splice(i, 1);
  renderizarPreviews();
};

// 4. Drag-and-drop de fotos
document.getElementById("foto-drop")?.addEventListener("dragover", (e) => {
  e.preventDefault();
  document.getElementById("foto-drop").style.borderColor = "var(--azul)";
});
document.getElementById("foto-drop")?.addEventListener("dragleave", () => {
  document.getElementById("foto-drop").style.borderColor = "";
});
document.getElementById("foto-drop")?.addEventListener("drop", (e) => {
  e.preventDefault();
  document.getElementById("foto-drop").style.borderColor = "";
  if (e.dataTransfer?.files?.length) adicionarFotos(Array.from(e.dataTransfer.files));
});

// 5. ENVIO PARA O TELEGRAM
document.getElementById("btn-telegram")?.addEventListener("click", async () => {
  const txt = document.getElementById("mascara-texto");
  if (!txt || !txt.value.trim()) {
    mostrarAlerta("⚠️ Gere a máscara antes de enviar.", true);
    return;
  }

  const cidadeSelect = document.getElementById("cidade");
  const cidadeOpt    = cidadeSelect.options[cidadeSelect.selectedIndex];
  const grupo_regiao = cidadeOpt.dataset.grupo;

  if (!grupo_regiao) {
    mostrarAlerta("⚠️ Selecione uma cidade antes de enviar.", true);
    return;
  }

  const btn = document.getElementById("btn-telegram");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const c = getClient();
    const { data: { session } } = await c.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Sessão expirada. Faça login novamente.");

    let res;
    const authHeaders = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${token}`
    };

    if (fotosEnvio.length > 0) {
      // Multipart: envia fotos + mensagem juntos
      const formData = new FormData();
      formData.append("regiao",    grupo_regiao);
      formData.append("mensagem",  txt.value);
      fotosEnvio.forEach((foto, i) => formData.append(`foto${i}`, foto, foto.name));

      res = await fetch(`${SUPABASE_URL}/functions/v1/enviar-telegram`, {
        method: "POST",
        headers: authHeaders,   // SEM Content-Type — o browser define o boundary do multipart
        body: formData,
      });
    } else {
      // JSON sem fotos
      res = await fetch(`${SUPABASE_URL}/functions/v1/enviar-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ regiao: grupo_regiao, mensagem: txt.value }),
      });
    }

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Erro ao enviar ao Telegram");
    }

    mostrarAlerta(`✅ Enviado para o grupo ${grupo_regiao}!`);
    // Limpa fotos após envio bem-sucedido
    fotosEnvio = [];
    renderizarPreviews();

  } catch (err) {
    mostrarAlerta("❌ " + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "📤 Telegram";
  }
});

// 5.1 COPIAR TEXTO DA MÁSCARA
document.getElementById("btn-copiar")?.addEventListener("click", async () => {
  const txt = document.getElementById("mascara-texto");
  if (!txt || !txt.value) {
    mostrarAlerta("⚠️ Não há texto para copiar.", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(txt.value);
    const btn = document.getElementById("btn-copiar");
    const oldText = btn.textContent;
    btn.textContent = "✅ Copiado!";
    btn.style.background = "var(--azul-claro)";
    btn.style.color = "#fff";
    btn.style.borderColor = "var(--azul)";
    setTimeout(() => {
      btn.textContent = oldText;
      btn.style.background = "";
      btn.style.color = "";
      btn.style.borderColor = "";
    }, 2000);
  } catch (e) {
    mostrarAlerta("❌ Falha ao copiar texto.", true);
  }
});

// 6. ENVIO DO FORMULÁRIO (SALVAMENTO NO BANCO)
document.getElementById("form-ticket")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-enviar");
  btn.disabled = true;
  btn.textContent = "A gravar...";

  try {
    const tag = document.querySelector('input[name="tag"]:checked');
    if (!tag) throw new Error("Selecione uma TAG.");

    const cidadeSelect = document.getElementById("cidade");
    const cidadeOpt    = cidadeSelect.options[cidadeSelect.selectedIndex];
    const dataRaw      = document.getElementById("data_inicio").value;

    const dados = {
      ttk: limparTexto(document.getElementById("ttk").value),
      id_servico: limparTexto(document.getElementById("id_servico").value),
      ard: limparTexto(document.getElementById("ard").value),
      sp: limparTexto(document.getElementById("sp").value),
      cto: limparTexto(document.getElementById("cto").value),
      clientes: document.getElementById("clientes").value,
      rua: limparTexto(document.getElementById("rua").value),
      bairro: limparTexto(document.getElementById("bairro").value),
      cidade: cidadeSelect.value,
      sigla: document.getElementById("sigla").value.toUpperCase(),
      tag: tag.value,
      causa_raiz: document.getElementById("causa_raiz").value,
      regiao: limparTexto(document.getElementById("regiao").value),
      obs: limparTexto(document.getElementById("obs").value),
      grupo_regiao: cidadeOpt.dataset.grupo || "SUL",
    };

    const c = getClient();
    const { data: { session } } = await c.auth.getSession();
    const nomeUsuario = sessionStorage.getItem('fb_nome') || session?.user.email.split('@')[0];

    const payload = {
      ttk: dados.ttk,
      id_servico: dados.id_servico,
      sp: dados.sp || null,
      regiao: dados.regiao,
      grupo_regiao: dados.grupo_regiao,
      data_inicio: dataRaw ? new Date(dataRaw).toISOString() : null,
      cidade: dados.cidade,
      sigla: dados.sigla,
      tag: dados.tag,
      atualizado_em: new Date().toISOString(),
      atualizado_por: nomeUsuario
    };

    const { error: errTicket } = await c.from('tickets').insert([payload]);
    if (errTicket) throw errTicket;

    await c.from('logs').insert([{ acao: "INSERÇÃO", ttk: dados.ttk, detalhe: dados.cidade, usuario: nomeUsuario }]);

    const dataFmt = dataRaw ? new Date(dataRaw).toLocaleString('pt-BR').replace(',', '') : "";
    dados.data_inicio_fmt = dataFmt;
    document.getElementById("mascara-texto").value = gerarMascara(dados);
    mostrarAlerta("✅ Ticket salvo e máscara gerada.");

  } catch (err) {
    mostrarAlerta("❌ " + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "✅ Salvar e Gerar Máscara";
  }
});

// Botão Limpar
document.getElementById("btn-limpar")?.addEventListener("click", () => {
  document.getElementById("form-ticket").reset();
  document.getElementById("mascara-texto").value = "";
  document.getElementById("causa_raiz").value = "";
  fotosEnvio = [];
  renderizarPreviews();
  setDataAtual();
});
