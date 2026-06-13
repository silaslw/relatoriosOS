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