// ======================== LEITURA DOS DADOS ========================
function lerDados() {
  const dataRef = raw('data-ref') || '__.__';
  const tecnicos = [];

  document.querySelectorAll('.tec-block').forEach(tb => {
    const tid = tb.id.replace('tec-', '');
    const selEl = sel('tec-sel-' + tid);
    const nome = selEl.value;
    if (!nome) return;

    const osList = [];
    tb.querySelectorAll('.os-block').forEach(ob => {
      const oid = ob.id.replace('os-', '');
      const numOS = raw('os-num-' + oid).toUpperCase();
      if (!numOS) return;

      const tipoSel = sel('os-tipo-' + oid);
      const tipo = tipoSel.value;
      const obs = raw('os-obs-' + oid).toUpperCase();
      const verifChk = sel('verif-chk-' + oid);
      const paraVerif = verifChk && verifChk.checked;

      // Erros
      const erros = [];
      ob.querySelectorAll('[id^="erro-"]').forEach(er => {
        if (!er.id.startsWith('erro-sel-')) return;
        const errVal = sel(er.id).value;
        if (errVal && errVal !== '__manual__') erros.push(errVal);
      });

      // Equipamentos
      const equips = [];
      ob.querySelectorAll('[id^="equip-modelo-"]').forEach(eq => {
        const modelo = eq.value;
        if (!modelo || modelo === '__manual__') return;
        
        const qid = eq.id.replace('equip-modelo-', '');
        const serial = raw('equip-serial-' + qid).toUpperCase() || 'S/N NAO INFORMADO';
        const status = sel('equip-status-' + qid) ? sel('equip-status-' + qid).value : '';
        equips.push({ modelo, serial, status });
      });

      osList.push({ numOS, tipo, obs, paraVerif, erros, equips });
    });

    tecnicos.push({ nome, osList });
  });

  return { dataRef, tecnicos };
}