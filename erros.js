// ======================== ERROS ========================
function addErro(oid) {
  const eid = nextId();
  const container = sel('erros-list-' + oid);
  const div = document.createElement('div');
  div.id = 'erro-' + eid;
  div.style.marginBottom = '8px';
  div.innerHTML = `
    <div class="erro-row">
      <div class="field">
        <label class="lbl">Erro / Pendência</label>
        <select id="erro-sel-${eid}" onchange="onErroChange('${eid}')">
          <option value="">Selecione um erro</option>
          ${selectOpts(ERROS, '')}
          <option value="__manual__">Descrever manualmente</option>
        </select>
      </div>
      <div style="padding-bottom:1px">
        <button class="btn sm danger" onclick="removeErro('${eid}')">✕</button>
      </div>
    </div>
    <div class="field hidden" id="erro-manual-wrap-${eid}" style="margin-top:4px">
      <input type="text" id="erro-manual-${eid}" placeholder="Descreva o erro...">
    </div>`;
  container.appendChild(div);
}

function onErroChange(eid) {
  sel('erro-manual-wrap-' + eid).classList.toggle('hidden', sel('erro-sel-' + eid).value !== '__manual__');
}

function removeErro(eid) {
  const el = sel('erro-' + eid);
  if (el) el.remove();
}
