// ===== painel.js — Versão V2: ESTRUTURA ORIGINAL 100% PRESERVADA =====

const ORDEM_REGIOES  = ['NORTE','SUL','SERRA','TAQUARI'];
let todosTickets     = [];
let ticketEditando   = null;
let ticketDeletando  = null;
let sb               = null;   
let accessToken      = null; 

function limparTexto(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

async function init() {
  sb = getClient();
  const session = await getSession();

  if (!session) {
    window.location.replace('/index.html');
    return;
  }

  accessToken = session.access_token;
  const role  = sessionStorage.getItem('fb_role') || '';
  const nome  = sessionStorage.getItem('fb_nome') || session.user.email;
  document.getElementById('usuario-nome').textContent = `${nome} · ${role}`;

  if (typeof iniciarMonitorInatividade === 'function') iniciarMonitorInatividade();

  await carregarTickets();
  iniciarRealtime();
}

async function carregarTickets() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/tickets?select=id,ttk,id_servico,sp,regiao,grupo_regiao,data_inicio,cidade,tag,atualizado_em,atualizado_por&order=data_inicio.asc&limit=1000`,
      { 
        headers: { 
          apikey: SUPABASE_KEY, 
          Authorization: `Bearer ${accessToken}`
        } 
      }
    );
    if (!res.ok) throw new Error('Erro ao buscar tickets.');
    todosTickets = await res.json();
    renderTabela();
    atualizarContadores();
    marcarAtualizado();
  } catch (err) {
    document.getElementById('tabela-wrapper').innerHTML =
      `<div class="loading" style="color:#e74c3c;">❌ ${err.message}</div>`;
  }
}

function marcarAtualizado() {
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('ultima-atualizacao').textContent = 'Atualizado às ' + agora;
}

function iniciarRealtime() {
  if (!sb) return;
  const badge = document.getElementById('realtime-badge');

  sb.channel('tickets-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, payload => {
      const { eventType, new: novo, old } = payload;
      if (eventType === 'INSERT') todosTickets.push(novo);
      else if (eventType === 'UPDATE') {
        const i = todosTickets.findIndex(t => t.id === novo.id);
        if (i >= 0) todosTickets[i] = { ...todosTickets[i], ...novo };
      }
      else if (eventType === 'DELETE') todosTickets = todosTickets.filter(t => t.id !== old.id);
      
      renderTabela();
      atualizarContadores();
      marcarAtualizado();
    })
    .subscribe(status => {
      if (badge) {
        badge.textContent = status === 'SUBSCRIBED' ? '● ao vivo' : '● reconectando';
        badge.style.color = status === 'SUBSCRIBED' ? '#2ecc71' : '#f39c12';
      }
    });

  setInterval(() => { if (todosTickets.length) renderTabela(); }, 60000);
}

function atualizarContadores() {
  document.getElementById('cnt-total').textContent    = todosTickets.length;
  document.getElementById('cnt-massiva').textContent  = todosTickets.filter(t => t.tag === 'Massiva').length;
  document.getElementById('cnt-pendencia').textContent = todosTickets.filter(t => t.tag === 'Pendência Técnica').length;
  document.getElementById('cnt-crise').textContent     = todosTickets.filter(t => t.tag === 'Sala de Crise').length;
}

function calcularSLA(t) {
  if (!t.data_inicio) return null;
  const lim = (t.tag === 'Massiva' || t.tag === 'Sala de Crise') ? 8 : 24;
  const decorrido = (Date.now() - new Date(t.data_inicio)) / 3600000;
  return { pct: Math.min(Math.round(decorrido / lim * 100), 100), lim, dec: decorrido.toFixed(1) };
}

function slaBar(t) {
  const s = calcularSLA(t);
  if (!s) return `<span style="color:var(--texto-dim)">—</span>`;
  const cor = s.pct < 50 ? '#2ecc71' : s.pct < 80 ? '#f39c12' : '#e74c3c';
  return `<div class="sla-wrap" title="${s.dec}h / ${s.lim}h">
    <div class="sla-bar-bg"><div class="sla-bar-fill" style="width:${s.pct}%;background:${cor};box-shadow:0 0 6px ${cor}88"></div></div>
    <span class="sla-pct" style="color:${cor}">${s.pct}%</span></div>`;
}

function renderTabela() {
  const COLS = `<colgroup>
    <col style="width:155px"><col style="width:200px"><col style="width:60px">
    <col><col style="width:130px"><col style="width:148px">
    <col style="width:155px"><col style="width:138px"><col style="width:70px"></colgroup>`;
  const THEAD = `<thead><tr>
    <th>TTKs</th><th>ID de Serviço</th><th>SP</th><th>Observações</th>
    <th>SLA</th><th>Cidade</th><th>TAG</th><th>Dat. Início</th><th></th>
  </tr></thead>`;

  const wrapper = document.getElementById('tabela-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  wrapper.insertAdjacentHTML('beforeend',
    `<table class="tickets-table" style="margin-bottom:0;table-layout:fixed;width:100%">${COLS}${THEAD}</table>`);

  const grupos = {};
  ORDEM_REGIOES.forEach(r => { grupos[r] = []; });

  todosTickets.forEach(t => {
    const g = (t.grupo_regiao || 'SUL').toUpperCase();
    if (grupos[g]) grupos[g].push(t);
    else { if(!grupos[g]) grupos[g] = []; grupos[g].push(t); }
  });

  const ordemFinal = [...ORDEM_REGIOES, ...Object.keys(grupos).filter(k => !ORDEM_REGIOES.includes(k))];
  const prioTag = { 'Sala de Crise': 0, 'Massiva': 1, 'Pendência Técnica': 2 };

  ordemFinal.forEach(reg => {
    const lista = (grupos[reg] || []).slice().sort((a, b) => {
      const pa = prioTag[a.tag] ?? 99;
      const pb = prioTag[b.tag] ?? 99;
      if (pa !== pb) return pa - pb;
      const slaA = calcularSLA(a);
      const slaB = calcularSLA(b);
      return (slaB?.pct ?? 0) - (slaA?.pct ?? 0);
    });

    const div = document.createElement('div');
    div.className = 'grupo-regiao';

    const titulo = document.createElement('div');
    titulo.className = 'grupo-titulo';
    titulo.textContent = reg;
    div.appendChild(titulo);

    const table = document.createElement('table');
    table.className = 'tickets-table';
    table.style.cssText = 'table-layout:fixed;width:100%';
    table.innerHTML = COLS;

    const tbody = document.createElement('tbody');

    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="sem-tickets">—</td></tr>`;
    } else {
      lista.forEach(t => {
        const tTag     = limparTexto(t.tag || '—');
        const tCidade  = limparTexto(t.cidade || '—');
        const tSp      = limparTexto(t.sp || '—');
        const tTtk     = limparTexto(t.ttk || '—');
        const tId      = limparTexto(t.id_servico || '—');
        const tagCls   = tTag === 'Massiva' ? 'tag-Massiva' : tTag === 'Sala de Crise' ? 'tag-crise' : 'tag-pendencia';
        const atu      = t.atualizado_em ? new Date(t.atualizado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '';
        const nomeAutor  = t.atualizado_por ? ` por ${limparTexto(t.atualizado_por)}` : '';
        const desc     = limparTexto(t.regiao || '—');

        const btnEditar = `<button class="btn-edit-desc" data-id="${t.id}">Editar</button>
                           <button class="btn-solicitar-toggle" data-id="${t.id}" data-ttk="${tTtk}">Solicitar atualização</button>`;
        const tdAcao    = `<td class="cell-acoes"><button class="btn-delete" data-id="${t.id}" data-ttk="${tTtk}">🗑</button></td>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="cell-mono cell-center">${tTtk}</td>
          <td class="cell-mono cell-center">${tId}</td>
          <td style="white-space:normal;word-break:break-word;">${tSp}</td>
          <td class="col-descricao">
            <div class="desc-inner">
              <span class="descricao-texto" title="${desc}">${desc}</span>
              <div class="desc-footer">
                <span class="atualizado-label">${atu ? 'atualizado às ' + atu + nomeAutor : ''}</span>
                <div class="desc-footer-btns">${btnEditar}</div>
              </div>
            </div>
          </td>
          <td>${slaBar(t)}</td>
          <td class="cell-center">${tCidade}</td>
          <td class="cell-center"><span class="tag-badge ${tagCls}">${tTag}</span></td>
          <td class="cell-center">${t.data_inicio ? fmtData(t.data_inicio) : '—'}</td>
          ${tdAcao}`;
        tbody.appendChild(tr);
      });
    }

    table.appendChild(tbody);
    div.appendChild(table);
    wrapper.appendChild(div);
  });

  wrapper.querySelectorAll('.btn-edit-desc').forEach(b => b.addEventListener('click', () => abrirModalDesc(b.dataset.id)));
  wrapper.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => abrirModalDel(b.dataset.id, b.dataset.ttk)));
  wrapper.querySelectorAll('.btn-solicitar-toggle').forEach(b => b.addEventListener('click', () => abrirModalSolicitar(b.dataset.id, b.dataset.ttk)));
}

function fmtData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + ' ' +
    d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}

function hdrs(extra = {}) {
  return { 'Content-Type':'application/json', apikey: SUPABASE_KEY,
    Authorization: `Bearer ${accessToken}`, Prefer:'return=minimal', ...extra };
}

async function getNomeUsuario() {
  // Só usa cache se for uma string não-vazia
  const cached = sessionStorage.getItem('fb_nome');
  if (cached && cached.trim()) return cached.trim();

  try {
    const { data } = await sb.auth.getSession();
    const session = data?.session;
    if (!session) return 'desconhecido';

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/perfis?id=eq.${session.user.id}&select=nome,email`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` } }
    );
    const perfis = await res.json();

    if (perfis && perfis.length > 0) {
      // Prioridade: nome do perfil → parte do e-mail → fallback
      const nome = (perfis[0].nome || '').trim()
               || (perfis[0].email || '').split('@')[0]
               || session.user.email?.split('@')[0]
               || 'desconhecido';

      sessionStorage.setItem('fb_nome', nome);
      return nome;
    }

    // Último recurso: e-mail da sessão
    const emailFallback = session.user.email?.split('@')[0] || 'desconhecido';
    sessionStorage.setItem('fb_nome', emailFallback);
    return emailFallback;

  } catch {
    return 'desconhecido';
  }
}

async function log(acao, ttk, detalhe = '') {
  const usuario = await getNomeUsuario();
  fetch(`${SUPABASE_URL}/rest/v1/logs`, {
    method:'POST', headers: hdrs(),
    body: JSON.stringify({ acao, ttk, detalhe, usuario })
  }).catch(() => {});
}

function alerta(msg, erro = false) {
  const el = document.getElementById('alerta');
  if (!el) return;
  el.textContent = msg;
  el.className = 'alerta' + (erro ? ' erro' : '');
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function abrirModalDesc(id) {
  ticketEditando = todosTickets.find(t => t.id == id);
  if (!ticketEditando) return;
  document.getElementById('modal-ttk').textContent = ticketEditando.ttk;
  document.getElementById('modal-texto').value     = ticketEditando.regiao || '';
  document.getElementById('modal-regiao').classList.remove('hidden');
}

document.getElementById('modal-cancelar')?.addEventListener('click', () => {
  document.getElementById('modal-regiao').classList.add('hidden');
  ticketEditando = null;
});

document.getElementById('modal-salvar')?.addEventListener('click', async () => {
  if (!ticketEditando) return;
  const txt = limparTexto(document.getElementById('modal-texto').value);
  const btn = document.getElementById('modal-salvar');
  btn.disabled = true;
  try {
    const nomeAutor = await getNomeUsuario();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticketEditando.id}`, {
      method:'PATCH', headers: hdrs(),
      body: JSON.stringify({ regiao: txt, atualizado_em: new Date().toISOString(), atualizado_por: nomeAutor })
    });
    if (!r.ok) throw new Error('Erro ao salvar alteração.');
    log('EDIÇÃO', ticketEditando.ttk, 'Observação atualizada');
    document.getElementById('modal-regiao').classList.add('hidden');
    ticketEditando = null;
    alerta('✅ Observação atualizada!');
  } catch(e) { alerta('❌ ' + e.message, true); }
  finally { btn.disabled = false; }
});

function abrirModalDel(id, ttk) {
  ticketDeletando = id;
  document.getElementById('delete-ttk').textContent = ttk;
  document.getElementById('modal-delete').classList.remove('hidden');
}

document.getElementById('delete-cancelar')?.addEventListener('click', () => {
  document.getElementById('modal-delete').classList.add('hidden');
  ticketDeletando = null;
});

document.getElementById('delete-finalizar')?.addEventListener('click', async () => {
  if (!ticketDeletando) return;
  const btn = document.getElementById('delete-finalizar');
  if (btn.disabled) return;
  btn.disabled = true;

  const btnDel = document.getElementById('delete-confirmar');
  const btnCan = document.getElementById('delete-cancelar');
  if (btnDel) btnDel.disabled = true;
  if (btnCan) btnCan.disabled = true;

  const textoOriginal = btn.innerHTML;
  btn.innerHTML = `⏳ Finalizando...`;

  const t   = todosTickets.find(x => x.id == ticketDeletando);
  const sla = t ? calcularSLA(t) : null;
  
  try {
    if (!t) throw new Error("Ticket não encontrado.");

    const resEnc = await fetch(`${SUPABASE_URL}/functions/v1/salvar-encerrado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        ttk: t.ttk, id_servico: t.id_servico || t.sp, cidade: t.cidade, tag: t.tag,
        sla_pct: sla?.pct ?? null, data_inicio: t.data_inicio, grupo_regiao: t.grupo_regiao || 'SUL',
      })
    });
    if (!resEnc.ok) throw new Error('Erro ao salvar na planilha.');

    const mensagemFinal = `✅ <b>Finalizado ${t.tag} de ${t.cidade} - ${t.ttk}</b>`;
    await fetch(`${SUPABASE_URL}/functions/v1/enviar-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ grupo_regiao: t.grupo_regiao || 'SUL', mensagem: mensagemFinal, regiao: t.grupo_regiao || 'SUL' }),
    }).catch(() => {});

    const r = await fetch(`${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticketDeletando}`, { method:'DELETE', headers: hdrs() });
    if (!r.ok) throw new Error('Erro ao remover do painel.');

    log('ENCERRADO', t?.ttk, `SLA Final: ${sla ? sla.pct+'%' : '—'}`);
    document.getElementById('modal-delete').classList.add('hidden');
    ticketDeletando = null;
    alerta('✅ Ticket finalizado com sucesso.');
  } catch(e) { 
    alerta('❌ ' + e.message, true);
  } finally {
    btn.innerHTML = textoOriginal;
    btn.disabled = false;
    if (btnDel) btnDel.disabled = false;
    if (btnCan) btnCan.disabled = false;
  }
});

document.getElementById('delete-confirmar')?.addEventListener('click', async () => {
  if (!ticketDeletando) return;
  const btn = document.getElementById('delete-confirmar');
  btn.disabled = true;
  const t = todosTickets.find(x => x.id == ticketDeletando);
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticketDeletando}`, { method:'DELETE', headers: hdrs() });
    if (!r.ok) throw new Error('Erro ao eliminar ticket.');
    log('DELETE', t?.ttk, 'Removido sem encerrar');
    document.getElementById('modal-delete').classList.add('hidden');
    ticketDeletando = null;
    alerta('🗑️ Ticket removido.');
  } catch(e) { alerta('❌ ' + e.message, true); }
  finally { btn.disabled = false; }
});

// ========= MODAL SOLICITAR ATUALIZAÇÃO =========

let ticketSolicitando = null;

function abrirModalSolicitar(id, ttk) {
  ticketSolicitando = id;
  document.getElementById('solicitar-ttk').textContent = ttk;
  document.getElementById('modal-solicitar').classList.remove('hidden');
}

document.getElementById('solicitar-cancelar')?.addEventListener('click', () => {
  document.getElementById('modal-solicitar').classList.add('hidden');
  ticketSolicitando = null;
});

document.getElementById('solicitar-confirmar')?.addEventListener('click', async () => {
  if (!ticketSolicitando) return;
  const btn = document.getElementById('solicitar-confirmar');
  btn.disabled = true; btn.textContent = '⏳ Enviando...';

  try {
    const t = todosTickets.find(x => x.id == ticketSolicitando);
    if (!t) throw new Error('Ticket não encontrado.');

    const msg = `Temos atualizações de <b>${t.cidade}</b>, sobre a <b>${t.tag}</b>, do <b>${t.ttk}</b> e SP <b>${t.sp}</b>?`;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/enviar-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ grupo_regiao: t.grupo_regiao || 'SUL', mensagem: msg, regiao: t.grupo_regiao || 'SUL' }),
    });
    if (!res.ok) throw new Error('Erro no envio ao Telegram.');

    log('SOLICITAÇÃO', t.ttk, 'Atualização solicitada via Telegram');
    alerta('✅ Solicitação enviada ao grupo!');
    document.getElementById('modal-solicitar').classList.add('hidden');
    ticketSolicitando = null;
  } catch(e) {
    alerta('❌ ' + e.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Solicitar Atualização';
  }
});

function abrirModalSenha() {
  document.getElementById('modal-senha').classList.remove('hidden');
}

function fecharModalSenha() {
  document.getElementById('modal-senha').classList.add('hidden');
  document.getElementById('nova-senha-input').value = '';
}

async function confirmarTrocaSenha() {
  const nova = document.getElementById('nova-senha-input').value;
  try {
    await sb.auth.updateUser({ password: nova });
    alerta("✅ Senha alterada com sucesso!");
    fecharModalSenha();
  } catch (e) { alerta("❌ " + e.message, true); }
}


init();
