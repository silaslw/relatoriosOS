// ======================== RENDER TÉCNICO ========================
// Retorna um Map de { nome -> tid } para técnicos já selecionados
function getTecnicosUsados(excludeTid) {
  const usados = new Map();
  document.querySelectorAll('.tec-block').forEach(block => {
    const tid = block.id.replace('tec-', '');
    if (tid === excludeTid) return;
    const s = sel('tec-sel-' + tid);
    if (s && s.value && s.value !== '__outro__' && s.value !== '') {
      usados.set(s.value, tid);
    }
  });
  return usados;
}

// Atualiza options de todos os selects de técnicos,
// desabilitando os já escolhidos em outros blocos
function refreshTecnicosOptions(changedTid) {
  document.querySelectorAll('.tec-block').forEach(block => {
    const tid = block.id.replace('tec-', '');
    const s = sel('tec-sel-' + tid);
    if (!s) return;
    const usados = getTecnicosUsados(tid); // usados pelos OUTROS
    const valorAtual = s.value;
    Array.from(s.options).forEach(opt => {
      if (opt.value === '' || opt.value === '__outro__') return;
      opt.disabled = usados.has(opt.value);
    });
  });
}

function addTecnico() {
  const container = document.getElementById('tecnicos-container'); // Use getElementById explicitamente
  if (!container) return; // Segurança

  const empty = container.querySelector('.empty');
  if (empty) empty.remove();

  const tid = nextId();
  const div = document.createElement('div');
  div.className = 'tec-block';
  div.id = 'tec-' + tid;
  div.innerHTML = `
    <div class="tec-header" style="cursor:pointer" onclick="toggleTecnico('${tid}')">
      <span style="display:flex;align-items:center;gap:8px;flex:1">
        <span class="tec-chevron">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
        <span class="tec-name" id="tec-label-${tid}">Novo técnico</span>
        <span class="badge num" id="tec-os-count-${tid}" style="display:none"></span>
      </span>
      <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
        <button class="btn sm" id="tec-min-btn-${tid}" style="border-color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.15);color:#fff" onclick="toggleTecnico('${tid}')">
          <svg id="tec-min-icon-${tid}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          <span id="tec-min-label-${tid}">Minimizar</span>
        </button>
        <button class="btn sm danger" style="border-color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);color:#fff" onclick="removeTecnico('${tid}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          Remover
        </button>
      </div>
    </div>
    <div class="tec-body">
      <div class="row2" style="margin-bottom:12px">
        <div class="field">
          <label class="lbl">Técnico</label>
          <select id="tec-sel-${tid}" onchange="onTecnicoChange('${tid}')">
            <option value="">Selecione o técnico</option>
            ${TECNICOS.map(n => `<option value="${n}">${n}</option>`).join('')}
            <option value="__outro__">Outro (digitar manualmente)</option>
          </select>
        </div>
        <div class="field hidden" id="tec-manual-wrap-${tid}">
          <label class="lbl">Nome manual</label>
          <input type="text" id="tec-manual-${tid}" placeholder="NOME COMPLETO" oninput="updateTecLabel('${tid}')">
        </div>
      </div>
      <div id="os-list-${tid}"></div>
      <div class="add-row" style="justify-content:space-between;align-items:center">
        <button class="btn sm" onclick="addOS('${tid}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar OS
        </button>
        <button class="btn sm" style="border-color:var(--success);color:var(--success);background:var(--success-bg)" onclick="finalizarTecnico('${tid}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Finalizar
        </button>
      </div>
    </div>`;
  container.appendChild(div);
  updateActionInfo();
  refreshTecnicosOptions(tid);
  setTimeout(() => div.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

function removeTecnico(tid) {
  const el = sel('tec-' + tid);
  if (el) el.remove();
  const container = sel('tecnicos-container');
  if (!container.querySelector('.tec-block')) {
    container.innerHTML = '<div class="empty">Clique em "Adicionar técnico" para começar.</div>';
  }
  updateActionInfo();
  refreshTecnicosOptions(null);
}

function toggleTecnico(tid) {
  const block = sel('tec-' + tid);
  const isCollapsed = block.classList.toggle('collapsed');
  // Atualiza ícone do chevron no header
  const chevron = sel('tec-min-icon-' + tid);
  if (chevron) chevron.style.transform = isCollapsed ? 'rotate(-90deg)' : '';
  // Atualiza label Minimizar / Expandir
  const label = sel('tec-min-label-' + tid);
  if (label) label.textContent = isCollapsed ? 'Expandir' : 'Minimizar';
  // Atualiza badge com contagem de OS
  const osCount = block.querySelectorAll('.os-block').length;
  const badge = sel('tec-os-count-' + tid);
  if (badge) {
    badge.textContent = osCount + ' OS';
    badge.style.display = isCollapsed && osCount > 0 ? '' : 'none';
  }
}

function finalizarTecnico(tid) {
  const block = sel('tec-' + tid);
  if (!block) return;
  // Só minimiza se ainda não estiver collapsed
  if (!block.classList.contains('collapsed')) {
    toggleTecnico(tid);
  }
}

function onTecnicoChange(tid) {
  const s = sel('tec-sel-' + tid);
  const wrap = sel('tec-manual-wrap-' + tid);
  if (s.value === '__outro__') {
    wrap.classList.remove('hidden');
  } else {
    wrap.classList.add('hidden');
  }
  updateTecLabel(tid);
  refreshTecnicosOptions(tid);
}

function updateTecLabel(tid) {
  const s = sel('tec-sel-' + tid);
  const lbl = sel('tec-label-' + tid);
  let nome = '';
  if (s.value === '__outro__') {
    nome = raw('tec-manual-' + tid).toUpperCase() || 'Técnico manual';
  } else {
    nome = s.value || 'Novo técnico';
  }
  lbl.textContent = nome;
}
