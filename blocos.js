// ==========================================================================
// BLOCOS UI — Técnicos · OS · Verificação · Equipamentos · Erros
// Consolida: tecnicos.js + ordens.js + verificacao.js + equipamentos.js + erros.js
// ==========================================================================

// ======================== TÉCNICOS ========================

function getTecnicosUsados(excludeTid) {
  const usados = new Map();
  document.querySelectorAll('.tec-block').forEach(block => {
    const tid = block.id.replace('tec-', '');
    if (tid === excludeTid) return;
    const s = sel('tec-sel-' + tid);
    if (s && s.value) usados.set(s.value, tid);
  });
  return usados;
}

function refreshTecnicosOptions() {
  document.querySelectorAll('.tec-block').forEach(block => {
    const tid = block.id.replace('tec-', '');
    const s   = sel('tec-sel-' + tid);
    if (!s) return;
    const usados = getTecnicosUsados(tid);
    Array.from(s.options).forEach(opt => {
      if (!opt.value) return;
      opt.disabled = usados.has(opt.value);
    });
  });
}

function addTecnico() {
  const container = sel('tecnicos-container');
  if (!container) return;

  // GATEKEEPING: Evita a criação de múltiplos blocos vazios
  const lastBlock = container.querySelector('.tec-block:last-child');
  if (lastBlock) {
    const lastTid = lastBlock.id.replace('tec-', '');
    const lastTecSelect = sel('tec-sel-' + lastTid);
    
    if (lastTecSelect && !lastTecSelect.value) {
      toast('⚠️ Defina o nome do técnico atual antes de adicionar outro.', 3500);
      lastTecSelect.focus();
      lastTecSelect.style.outline = '2px solid #ef4444';
      setTimeout(() => lastTecSelect.style.outline = '', 2500);
      return; // Impede a criação
    }
  }

  const empty = container.querySelector('.empty');
  if (empty) empty.remove();

  const tid = nextId();
  const div = document.createElement('div');
  div.className = 'tec-block';
  div.id = 'tec-' + tid;

  div.innerHTML = `
    <div class="tec-header" onclick="toggleTecnico('${tid}')">
      <span class="tec-header-left">
        <span class="tec-chevron">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
        <span class="tec-name" id="tec-label-${tid}">Novo técnico</span>
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
          ${selectOpts(TECNICOS, '')}
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
  updateActionInfo();
  refreshTecnicosOptions();
  
  // Foca no select do técnico assim que o bloco é criado
  setTimeout(() => {
    div.scrollIntoView({ behavior: 'smooth', block: 'start' });
    sel('tec-sel-' + tid).focus();
  }, 50);
}

function removeTecnico(tid) {
  const el = sel('tec-' + tid);
  if (el) el.remove();
  const container = sel('tecnicos-container');
  if (container && !container.querySelector('.tec-block')) {
    container.innerHTML = '<div class="empty">Clique em "Adicionar técnico" para começar.</div>';
  }
  updateActionInfo();
  refreshTecnicosOptions();
}

function toggleTecnico(tid) {
  const block       = sel('tec-' + tid);
  const isCollapsed = block.classList.toggle('collapsed');
  const osCount     = block.querySelectorAll('.os-block').length;
  const badge       = sel('tec-os-count-' + tid);
  if (badge) {
    badge.textContent  = osCount + ' OS';
    badge.style.display = isCollapsed && osCount > 0 ? '' : 'none';
  }
}

function finalizarTecnico(tid) {
  const block = sel('tec-' + tid);
  if (block && !block.classList.contains('collapsed')) toggleTecnico(tid);
}

function updateTecLabel(tid) {
  const s   = sel('tec-sel-' + tid);
  const lbl = sel('tec-label-' + tid);
  if (lbl) lbl.textContent = (s && s.value) ? s.value : 'Novo técnico';
}

// ======================== ORDENS DE SERVIÇO ========================

function addOS(tid) {
  // 1. GATEKEEPING: Valida se o técnico possui um nome selecionado
  const tecSelect = sel('tec-sel-' + tid);
  if (tecSelect && !tecSelect.value) {
    toast('⚠️ Selecione o nome do técnico antes de abrir uma OS.', 3500);
    tecSelect.focus();
    tecSelect.style.outline = '2px solid #ef4444'; // Feedback visual rápido (vermelho)
    setTimeout(() => tecSelect.style.outline = '', 2500);
    return; // Interrompe a execução
  }

  // 2. GATEKEEPING: Valida integridade das Ordens de Serviço anteriores deste técnico
  const osListContainer = sel('os-list-' + tid);
  if (osListContainer) {
    const existingOS = osListContainer.querySelectorAll('.os-block');
    let hasValidationError = false;

    existingOS.forEach(osBlock => {
      const oid = osBlock.id.replace('os-', '');
      const numInput = sel('os-num-' + oid);
      const tipoSelect = sel('os-tipo-' + oid);

      const isNumEmpty = !numInput.value.trim();
      const isTipoEmpty = !tipoSelect.value;

      if (isNumEmpty || isTipoEmpty) {
        hasValidationError = true;
        
        // Aplica o feedback visual nos campos vazios
        if (isNumEmpty) {
          numInput.style.outline = '2px solid #ef4444';
          setTimeout(() => numInput.style.outline = '', 2500);
        }
        if (isTipoEmpty) {
          tipoSelect.style.outline = '2px solid #ef4444';
          setTimeout(() => tipoSelect.style.outline = '', 2500);
        }
      }
    });

    if (hasValidationError) {
      toast('⚠️ Preencha o Número e o Diagnóstico das OS anteriores antes de adicionar uma nova.', 4000);
      return; // Interrompe a execução
    }
  }

  // 3. EXECUÇÃO: Se passou pelas validações, constrói a nova OS
  const oid       = nextId();
  const container = sel('os-list-' + tid);
  const div       = document.createElement('div');
  div.className   = 'os-block';
  div.id          = 'os-' + oid;

  div.innerHTML = `
    <div class="os-header">
      <span class="os-num-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        OS <span id="os-num-label-${oid}" style="color:var(--text3); font-weight:400"></span>
      </span>
      <div style="display:flex; gap:6px; align-items:center">
        <span id="verif-badge-${oid}" class="badge warn" style="display:none">⚠ Verificação</span>
        <button class="btn xs danger" onclick="removeOS('${oid}')">✕ Remover</button>
      </div>
    </div>

    <div class="os-body">
      <div class="row2">
        <div class="field">
          <label class="lbl">Número da OS</label>
          <input type="text" id="os-num-${oid}" placeholder="ex: 1223031"
                 oninput="onNumOS('${oid}')">
        </div>
        <div class="field">
          <label class="lbl">Tipo / Diagnóstico</label>
          <select id="os-tipo-${oid}">
            <option value="">Selecione</option>
            ${selectOpts(TIPOS_OS, '')}
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
                  rows="2"></textarea>
      </div>

      <div class="divider"></div>

      <div class="verif-mark">
        <input type="checkbox" id="verif-chk-${oid}" onchange="toggleVerif('${oid}')">
        <label for="verif-chk-${oid}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Marcar para verificação
        </label>
      </div>

      <div class="verif-reason" id="verif-reason-${oid}">
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

  container.appendChild(div);
  _syncOSCount(tid);
  updateActionInfo();
  
  // Opcional: foca automaticamente no campo Número da OS recém-criada
  setTimeout(() => {
    const novoInput = sel('os-num-' + oid);
    if(novoInput) novoInput.focus();
  }, 50);
}

function removeOS(oid) {
  const el = sel('os-' + oid);
  if (!el) return;
  const parent = el.closest('.tec-block');
  el.remove();
  if (parent) _syncOSCount(parent.id.replace('tec-', ''));
  updateActionInfo();
}

function onNumOS(oid) {
  const n   = raw('os-num-' + oid);
  const lbl = sel('os-num-label-' + oid);
  if (lbl) lbl.textContent = n ? '— ' + n.toUpperCase() : '';
}

// Sincroniza o badge de contagem de OS no header do bloco técnico
function _syncOSCount(tid) {
  const block = sel('tec-' + tid);
  if (!block) return;
  const count = block.querySelectorAll('.os-block').length;
  const badge = sel('tec-os-count-' + tid);
  if (badge) {
    badge.textContent   = count + ' OS';
    badge.style.display = block.classList.contains('collapsed') && count > 0 ? '' : 'none';
  }
}

// ======================== VERIFICAÇÃO ========================

function toggleVerif(oid) {
  const chk    = sel('verif-chk-' + oid);
  const reason = sel('verif-reason-' + oid);
  const badge  = sel('verif-badge-' + oid);
  reason.classList.toggle('show', chk.checked);
  if (badge) badge.style.display = chk.checked ? '' : 'none';
}

// ======================== EQUIPAMENTOS ========================

function addEquip(oid) {
  const qid       = nextId();
  const container = sel('equip-list-' + oid);
  const div       = document.createElement('div');
  div.id          = 'equip-' + qid;
  div.className   = 'sub-item';

  div.innerHTML = `
    <div class="equip-row">
      <div class="field">
        <label class="lbl">Modelo</label>
        <select id="equip-modelo-${qid}" onchange="onEquipChange('${qid}')">
          <option value="">Selecione</option>
          ${selectOpts(EQUIPAMENTOS, '')}
          <option value="__manual__">Outro (manual)</option>
        </select>
      </div>
      <div class="field">
        <label class="lbl">Serial / MAC</label>
        <input type="text" id="equip-serial-${qid}" placeholder="ex: 485754AB1C2D">
      </div>
      <div class="field">
        <label class="lbl">Status</label>
        <select id="equip-status-${qid}">
          <option value="">—</option>
          <option value="(EMPRESTADO)">(EMPRESTADO)</option>
          <option value="(BAIXA)">(BAIXA)</option>
        </select>
      </div>
      <div style="align-self:flex-end; padding-bottom:1px">
        <button class="btn sm danger" onclick="removeEquip('${qid}')">✕</button>
      </div>
    </div>
    <div class="field hidden" id="equip-manual-wrap-${qid}" style="margin-top:4px">
      <input type="text" id="equip-manual-${qid}" placeholder="Descreva o equipamento manualmente">
    </div>`;

  container.appendChild(div);
}

function onEquipChange(qid) {
  const wrap = sel('equip-manual-wrap-' + qid);
  const val  = sel('equip-modelo-' + qid).value;
  if (wrap) wrap.classList.toggle('hidden', val !== '__manual__');
}

function removeEquip(qid) {
  const el = sel('equip-' + qid);
  if (el) el.remove();
}

// ======================== ERROS / PENDÊNCIAS ========================

function addErro(oid) {
  const eid       = nextId();
  const container = sel('erros-list-' + oid);
  const div       = document.createElement('div');
  div.id          = 'erro-' + eid;
  div.className   = 'sub-item';

  div.innerHTML = `
    <div class="erro-row">
      <div class="field">
        <label class="lbl">Erro / Pendência</label>
        <select id="erro-sel-${eid}" onchange="onErroChange('${eid}')">
          <option value="">Selecione</option>
          ${selectOpts(ERROS, '')}
          <option value="__manual__">Descrever manualmente</option>
        </select>
      </div>
      <div style="align-self:flex-end; padding-bottom:1px">
        <button class="btn sm danger" onclick="removeErro('${eid}')">✕</button>
      </div>
    </div>
    <div class="field hidden" id="erro-manual-wrap-${eid}" style="margin-top:4px">
      <input type="text" id="erro-manual-${eid}" placeholder="Descreva o erro manualmente...">
    </div>`;

  container.appendChild(div);
}

function onErroChange(eid) {
  const wrap = sel('erro-manual-wrap-' + eid);
  const val  = sel('erro-sel-' + eid).value;
  if (wrap) wrap.classList.toggle('hidden', val !== '__manual__');
}

function removeErro(eid) {
  const el = sel('erro-' + eid);
  if (el) el.remove();
}
