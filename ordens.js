// ======================== RENDER OS ========================
function addOS(tid) {
  const oid = nextId();
  const container = sel('os-list-' + tid);
  const div = document.createElement('div');
  div.className = 'os-block';
  div.id = 'os-' + oid;
  div.innerHTML = `
    <div class="os-header">
      <span class="os-num-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        OS <span id="os-num-label-${oid}" style="color:var(--text3);font-weight:400"></span>
      </span>
      <div style="display:flex;gap:6px;align-items:center">
        <span id="verif-badge-${oid}" class="badge warn" style="display:none">⚠ Para verificação</span>
        <button class="btn xs danger" onclick="removeOS('${oid}')">Remover</button>
      </div>
    </div>
    <div class="os-body">

      <!-- LINHA 1: número + tipo -->
      <div class="row2">
        <div class="field">
          <label class="lbl">Número da OS</label>
          <input type="text" id="os-num-${oid}" placeholder="ex: 1223031" oninput="onNumOS('${oid}')">
        </div>
        <div class="field">
          <label class="lbl">Tipo / Diagnóstico</label>
          <select id="os-tipo-${oid}">
            <option value="">Selecione</option>
            ${selectOpts(TIPOS_OS, '')}
            <option value="__manual__">Outro (manual)</option>
          </select>
        </div>
      </div>

      <!-- TIPO MANUAL -->
      <div class="field hidden" id="os-tipo-manual-wrap-${oid}">
        <label class="lbl">Diagnóstico manual</label>
        <input type="text" id="os-tipo-manual-${oid}" placeholder="DESCREVA O DIAGNÓSTICO">
      </div>

      <!-- EQUIPAMENTOS -->
      <div class="sec-label">Equipamentos instalados / envolvidos</div>
      <div id="equip-list-${oid}"></div>
      <div class="add-row">
        <button class="btn sm" onclick="addEquip('${oid}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Equipamento
        </button>
      </div>

      <!-- INFORMAÇÕES ADICIONAIS -->
      <div class="sec-label">Informações adicionais</div>
      <div class="field">
        <textarea id="os-obs-${oid}" placeholder="Observações, diagnóstico detalhado, situação do cliente..." rows="2"></textarea>
      </div>

      <!-- MARCAR PARA VERIFICAÇÃO -->
      <div class="divider"></div>
      <div class="verif-mark">
        <input type="checkbox" id="verif-chk-${oid}" onchange="toggleVerif('${oid}')">
        <label for="verif-chk-${oid}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Marcar para verificação
        </label>
      </div>
      <div class="verif-reason" id="verif-reason-${oid}">
        <div class="sec-label" style="margin-top:8px">Motivo da verificação / Erro identificado</div>
        <div id="erros-list-${oid}"></div>
        <div class="add-row" style="margin-bottom:8px">
          <button class="btn sm" onclick="addErro('${oid}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar erro
          </button>
        </div>
      </div>

    </div>`;
  container.appendChild(div);
  // refresh badge on parent tec block
  const parentTec = container.closest('.tec-block');
  if (parentTec) { const tid2 = parentTec.id.replace('tec-',''); const b = sel('tec-os-count-'+tid2); if(b){const c=parentTec.querySelectorAll('.os-block').length; b.textContent=c+' OS'; b.style.display=parentTec.classList.contains('collapsed')&&c>0?'':'none';} }

  // listener para tipo manual
  sel('os-tipo-' + oid).addEventListener('change', function() {
    const wrap = sel('os-tipo-manual-wrap-' + oid);
    wrap.classList.toggle('hidden', this.value !== '__manual__');
  });

  updateActionInfo();
}

function removeOS(oid) {
  const el = sel('os-' + oid);
  if (el) el.remove();
  updateActionInfo();
}

function onNumOS(oid) {
  const n = raw('os-num-' + oid);
  sel('os-num-label-' + oid).textContent = n ? '— ' + n : '';
}
