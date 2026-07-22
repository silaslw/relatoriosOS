// ==========================================================================
// CORE — Utilitários DOM · Estado · Info Bar · Leitura de Dados
// Consolida: helpers.js + estado.js + ui.js + leitura.js
// ==========================================================================

// ---- DOM helpers ----

function sel(id)  { return document.getElementById(id); }
function raw(id)  { const e = sel(id); return e ? e.value.trim() : ''; }

function selectOpts(arr, selected) {
  return arr.map(o =>
    `<option value="${o}"${o === selected ? ' selected' : ''}>${o}</option>`
  ).join('');
}

function toast(msg, dur = 2500) {
  const t = sel('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._toastTimer);
  t._toastTimer = setTimeout(() => t.classList.remove('show'), dur);
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ---- Estado (ID único por sessão) ----

let _idCounter = 0;
function nextId() { return 'id' + (++_idCounter); }

// ---- Info bar ----

function updateActionInfo() {
  const tecCount = document.querySelectorAll('.tec-block').length;
  const osCount  = document.querySelectorAll('.os-block').length;
  const el = sel('action-info');
  if (el) el.textContent = `${tecCount} técnico(s) · ${osCount} OS cadastrada(s)`;
}

// ---- Leitura de dados do formulário ----

function lerDados() {
  const dataRef  = raw('data-ref') || '__.__';
  const tecnicos = [];

  document.querySelectorAll('.tec-block').forEach(tb => {
    const tid   = tb.id.replace('tec-', '');
    const selEl = sel('tec-sel-' + tid);
    const nome  = selEl ? selEl.value : '';
    if (!nome) return;

    const osList = [];

    tb.querySelectorAll('.os-block').forEach(ob => {
      const oid   = ob.id.replace('os-', '');
      const numOS = raw('os-num-' + oid).toUpperCase();
      if (!numOS) return;

      const tipoEl  = sel('os-tipo-' + oid);
      const tipo    = tipoEl ? tipoEl.value : '';
      const obs     = raw('os-obs-' + oid).toUpperCase();
      const chk     = sel('verif-chk-' + oid);
      const paraVerif = chk ? chk.checked : false;

      // Erros — suporta valor de select e entrada manual
      const erros = [];
      ob.querySelectorAll('[id^="erro-sel-"]').forEach(erEl => {
        const v = erEl.value;
        if (!v) return;
        if (v === '__manual__') {
          const eid    = erEl.id.replace('erro-sel-', '');
          const manual = raw('erro-manual-' + eid).toUpperCase();
          if (manual) erros.push(manual);
        } else {
          erros.push(v);
        }
      });

      // Equipamentos — suporta valor de select e entrada manual
      const equips = [];
      ob.querySelectorAll('[id^="equip-modelo-"]').forEach(eqEl => {
        const modelo = eqEl.value;
        if (!modelo) return;
        const qid = eqEl.id.replace('equip-modelo-', '');

        let modeloFinal = modelo;
        if (modelo === '__manual__') {
          modeloFinal = raw('equip-manual-' + qid).toUpperCase();
          if (!modeloFinal) return;
        }

        const serial   = raw('equip-serial-' + qid).toUpperCase() || 'S/N NAO INFORMADO';
        const statusEl = sel('equip-status-' + qid);
        const status   = statusEl ? statusEl.value : '';
        equips.push({ modelo: modeloFinal, serial, status });
      });

      osList.push({ numOS, tipo, obs, paraVerif, erros, equips });
    });

    if (osList.length) tecnicos.push({ nome, osList });
  });

  return { dataRef, tecnicos };
}
// ==========================================================================
// AUTO-SAVE — Preservar relatório em andamento
// ==========================================================================

const AUTOSAVE_KEY = 'os_report_draft';

/**
 * Salva o estado atual do relatório no localStorage
 */
function salvarRascunho() {
  const dados = lerDados();
  if (!dados.tecnicos.length && !dados.dataRef) return; // Não salva vazio
  
  const rascunho = {
    dataRef: dados.dataRef,
    tecnicos: [],
    timestamp: Date.now()
  };

  // Percorre todos os técnicos e salva o estado completo
  document.querySelectorAll('.tec-block').forEach(tb => {
    const tid = tb.id.replace('tec-', '');
    const selEl = sel('tec-sel-' + tid);
    const nome = selEl ? selEl.value : '';
    
    const tecData = {
      nome: nome,
      osList: [],
      collapsed: tb.classList.contains('collapsed')
    };

    // Salva todas as OS deste técnico
    tb.querySelectorAll('.os-block').forEach(ob => {
      const oid = ob.id.replace('os-', '');
      const numOS = raw('os-num-' + oid);
      const tipo = sel('os-tipo-' + oid)?.value || '';
      const obs = raw('os-obs-' + oid);
      const paraVerif = sel('verif-chk-' + oid)?.checked || false;

      const osData = {
        numOS: numOS,
        tipo: tipo,
        obs: obs,
        paraVerif: paraVerif,
        erros: [],
        equips: []
      };

      // Salva erros
      ob.querySelectorAll('[id^="erro-sel-"]').forEach(erEl => {
        const eid = erEl.id.replace('erro-sel-', '');
        const val = erEl.value;
        if (!val) return;
        if (val === '__manual__') {
          const manual = raw('erro-manual-' + eid);
          if (manual) osData.erros.push({ manual: true, valor: manual });
        } else {
          osData.erros.push({ manual: false, valor: val });
        }
      });

      // Salva equipamentos
      ob.querySelectorAll('[id^="equip-modelo-"]').forEach(eqEl => {
        const qid = eqEl.id.replace('equip-modelo-', '');
        const modelo = eqEl.value;
        if (!modelo) return;
        
        const equipData = {
          modelo: modelo,
          manual: modelo === '__manual__' ? raw('equip-manual-' + qid) : null,
          serial: raw('equip-serial-' + qid),
          status: sel('equip-status-' + qid)?.value || ''
        };
        osData.equips.push(equipData);
      });

      tecData.osList.push(osData);
    });

    rascunho.tecnicos.push(tecData);
  });

  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(rascunho));
}

/**
 * Restaura o relatório salvo do localStorage
 */
function restaurarRascunho() {
  const salvo = localStorage.getItem(AUTOSAVE_KEY);
  if (!salvo) return false;

  try {
    const rascunho = JSON.parse(salvo);
    if (!rascunho.tecnicos || !rascunho.tecnicos.length) return false;

    // Limpa o container primeiro
    const container = sel('tecnicos-container');
    if (container) {
      container.innerHTML = '';
    }

    // Restaura a data de referência
    if (rascunho.dataRef && sel('data-ref')) {
      sel('data-ref').value = rascunho.dataRef;
    }

    // Restaura cada técnico
    rascunho.tecnicos.forEach(tecData => {
      // Cria o bloco do técnico
      const tid = nextId();
      const div = document.createElement('div');
      div.className = 'tec-block';
      div.id = 'tec-' + tid;
      if (tecData.collapsed) div.classList.add('collapsed');

      div.innerHTML = `
        <div class="tec-header" onclick="toggleTecnico('${tid}')">
          <span class="tec-header-left">
            <span class="tec-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
            <span class="tec-name" id="tec-label-${tid}">${tecData.nome || 'Novo técnico'}</span>
            <span class="badge num" id="tec-os-count-${tid}" style="display:none"></span>
          </span>
          <div class="tec-header-actions" onclick="event.stopPropagation()">
            <button class="btn-ghost-header" onclick="finalizarTecnico('${tid}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Finalizar
            </button>
            <button class="btn-ghost-header danger" onclick="removeTecnico('${tid}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
              Remover
            </button>
          </div>
        </div>

        <div class="tec-body">
          <div class="field" style="margin-bottom:12px">
            <label class="lbl">Técnico / Colaborador</label>
            <select id="tec-sel-${tid}"
                    onchange="updateTecLabel('${tid}'); refreshTecnicosOptions()">
              <option value="">Selecione o técnico</option>
              ${selectOpts(TECNICOS, tecData.nome)}
            </select>
          </div>
          <div id="os-list-${tid}"></div>
          <div class="add-row">
            <button class="btn sm" onclick="addOS('${tid}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Adicionar OS
            </button>
          </div>
        </div>`;

      container.appendChild(div);

      // Restaura as OS deste técnico
      const osContainer = sel('os-list-' + tid);
      tecData.osList.forEach(osData => {
        const oid = nextId();
        const osDiv = document.createElement('div');
        osDiv.className = 'os-block';
        osDiv.id = 'os-' + oid;

        osDiv.innerHTML = `
          <div class="os-header">
            <span class="os-num-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              OS <span id="os-num-label-${oid}" style="color:var(--text3); font-weight:400">${osData.numOS ? '— ' + osData.numOS : ''}</span>
            </span>
            <div style="display:flex; gap:6px; align-items:center">
              <span id="verif-badge-${oid}" class="badge warn" style="display:${osData.paraVerif ? '' : 'none'}">⚠ Verificação</span>
              <button class="btn xs danger" onclick="removeOS('${oid}')">✕ Remover</button>
            </div>
          </div>

          <div class="os-body">
            <div class="row2">
              <div class="field">
                <label class="lbl">Número da OS</label>
                <input type="text" id="os-num-${oid}" placeholder="ex: 1223031"
                       oninput="onNumOS('${oid}')" value="${osData.numOS || ''}">
              </div>
              <div class="field">
                <label class="lbl">Tipo / Diagnóstico</label>
                <select id="os-tipo-${oid}">
                  <option value="">Selecione</option>
                  ${selectOpts(TIPOS_OS, osData.tipo)}
                </select>
              </div>
            </div>

            <div class="sec-label">Equipamentos instalados / envolvidos</div>
            <div id="equip-list-${oid}"></div>
            <div class="add-row">
              <button class="btn sm" onclick="addEquip('${oid}')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Equipamento
              </button>
            </div>

            <div class="sec-label">Informações adicionais</div>
            <div class="field">
              <textarea id="os-obs-${oid}"
                        placeholder="Observações, diagnóstico detalhado, situação do cliente..."
                        rows="2">${osData.obs || ''}</textarea>
            </div>

            <div class="divider"></div>

            <div class="verif-mark">
              <input type="checkbox" id="verif-chk-${oid}" ${osData.paraVerif ? 'checked' : ''} onchange="toggleVerif('${oid}')">
              <label for="verif-chk-${oid}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Marcar para verificação
              </label>
            </div>

            <div class="verif-reason ${osData.paraVerif ? 'show' : ''}" id="verif-reason-${oid}">
              <div class="sec-label" style="margin-top:8px">Motivos da verificação / Erros</div>
              <div id="erros-list-${oid}"></div>
              <div class="add-row" style="margin-bottom:8px">
                <button class="btn sm" onclick="addErro('${oid}')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Adicionar motivo
                </button>
              </div>
            </div>
          </div>`;

        osContainer.appendChild(osDiv);

        // Restaura equipamentos
        const equipContainer = sel('equip-list-' + oid);
        osData.equips.forEach(equipData => {
          const qid = nextId();
          const eqDiv = document.createElement('div');
          eqDiv.id = 'equip-' + qid;
          eqDiv.className = 'sub-item';

          const isManual = equipData.manual !== null;
          
          eqDiv.innerHTML = `
            <div class="equip-row">
              <div class="field">
                <label class="lbl">Modelo</label>
                <select id="equip-modelo-${qid}" onchange="onEquipChange('${qid}')">
                  <option value="">Selecione</option>
                  ${selectOpts(EQUIPAMENTOS, isManual ? '__manual__' : equipData.modelo)}
                  <option value="__manual__" ${isManual ? 'selected' : ''}>Outro (manual)</option>
                </select>
              </div>
              <div class="field">
                <label class="lbl">Serial / MAC</label>
                <input type="text" id="equip-serial-${qid}" placeholder="ex: 485754AB1C2D" value="${equipData.serial || ''}">
              </div>
              <div class="field">
                <label class="lbl">Status</label>
                <select id="equip-status-${qid}">
                  <option value="">—</option>
                  <option value="(EMPRESTADO)" ${equipData.status === '(EMPRESTADO)' ? 'selected' : ''}>(EMPRESTADO)</option>
                  <option value="(BAIXA)" ${equipData.status === '(BAIXA)' ? 'selected' : ''}>(BAIXA)</option>
                </select>
              </div>
              <div style="align-self:flex-end; padding-bottom:1px">
                <button class="btn sm danger" onclick="removeEquip('${qid}')">✕</button>
              </div>
            </div>
            <div class="field ${isManual ? '' : 'hidden'}" id="equip-manual-wrap-${qid}" style="margin-top:4px">
              <input type="text" id="equip-manual-${qid}" placeholder="Descreva o equipamento manualmente" value="${isManual ? equipData.manual : ''}">
            </div>`;

          equipContainer.appendChild(eqDiv);
        });

        // Restaura erros
        const errosContainer = sel('erros-list-' + oid);
        osData.erros.forEach(erroData => {
          const eid = nextId();
          const erDiv = document.createElement('div');
          erDiv.id = 'erro-' + eid;
          erDiv.className = 'sub-item';

          const isManual = erroData.manual;
          
          erDiv.innerHTML = `
            <div class="erro-row">
              <div class="field">
                <label class="lbl">Erro / Pendência</label>
                <select id="erro-sel-${eid}" onchange="onErroChange('${eid}')">
                  <option value="">Selecione</option>
                  ${selectOpts(ERROS, isManual ? '' : erroData.valor)}
                  <option value="__manual__" ${isManual ? 'selected' : ''}>Descrever manualmente</option>
                </select>
              </div>
              <div style="align-self:flex-end; padding-bottom:1px">
                <button class="btn sm danger" onclick="removeErro('${eid}')">✕</button>
              </div>
            </div>
            <div class="field ${isManual ? '' : 'hidden'}" id="erro-manual-wrap-${eid}" style="margin-top:4px">
              <input type="text" id="erro-manual-${eid}" placeholder="Descreva o erro manualmente..." value="${isManual ? erroData.valor : ''}">
            </div>`;

          errosContainer.appendChild(erDiv);
        });
      });

      _syncOSCount(tid);
    });

    updateActionInfo();
    refreshTecnicosOptions();
    
    // Mostra toast informando que restaurou
    toast('✓ Rascunho restaurado automaticamente', 3000);
    
    return true;
  } catch (e) {
    console.error('Erro ao restaurar rascunho:', e);
    return false;
  }
}

/**
 * Limpa o rascunho salvo (chamar após gerar documentos com sucesso)
 */
function limparRascunho() {
  localStorage.removeItem(AUTOSAVE_KEY);
}

/**
 * Verifica se existe rascunho salvo
 */
function temRascunho() {
  return !!localStorage.getItem(AUTOSAVE_KEY);
}

// Auto-save a cada 30 segundos e antes de sair da página
setInterval(() => {
  if (document.querySelectorAll('.os-block').length > 0) {
    salvarRascunho();
  }
}, 30000);

// Salva antes de recarregar/fechar
window.addEventListener('beforeunload', () => {
  if (document.querySelectorAll('.os-block').length > 0) {
    salvarRascunho();
  }
});