// ======================== EQUIPAMENTOS ========================
function addEquip(oid) {
  const qid = nextId();
  const container = sel('equip-list-' + oid);
  const div = document.createElement('div');
  div.id = 'equip-' + qid;
  div.style.marginBottom = '8px';
  div.innerHTML = `
    <div class="equip-row">
      <div class="field">
        <label class="lbl">Modelo</label>
        <select id="equip-modelo-${qid}">
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
      <div style="padding-bottom:1px">
        <button class="btn sm danger" onclick="removeEquip('${qid}')">✕</button>
      </div>
    </div>
    <div class="field hidden" id="equip-manual-wrap-${qid}" style="margin-top:4px">
      <input type="text" id="equip-manual-${qid}" placeholder="Descreva o equipamento manualmente">
    </div>`;
  container.appendChild(div);

  sel('equip-modelo-' + qid).addEventListener('change', function() {
    sel('equip-manual-wrap-' + qid).classList.toggle('hidden', this.value !== '__manual__');
  });
}

function removeEquip(qid) {
  const el = sel('equip-' + qid);
  if (el) el.remove();
}
