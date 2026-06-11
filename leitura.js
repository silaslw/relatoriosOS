// ======================== LEITURA DOS DADOS ========================
function lerDados() {
  const dataRef = raw('data-ref') || '__.__';

  const tecnicos = [];
  document.querySelectorAll('.tec-block').forEach(tb => {
    const tid = tb.id.replace('tec-', '');
    const selEl = sel('tec-sel-' + tid);
    let nome = '';
    if (selEl.value === '__outro__') nome = raw('tec-manual-' + tid).toUpperCase();
    else nome = selEl.value;
    if (!nome) return;

    const osList = [];
    tb.querySelectorAll('.os-block').forEach(ob => {
      const oid = ob.id.replace('os-', '');
      const numOS = raw('os-num-' + oid).toUpperCase();
      if (!numOS) return;

      const tipoSel = sel('os-tipo-' + oid);
      let tipo = '';
      if (tipoSel.value === '__manual__') tipo = raw('os-tipo-manual-' + oid).toUpperCase();
      else tipo = tipoSel.value;

      const obs = raw('os-obs-' + oid).toUpperCase();
      const verifChk = sel('verif-chk-' + oid);
      const paraVerif = verifChk && verifChk.checked;

      // Erros
      const erros = [];
      ob.querySelectorAll('[id^="erro-"]').forEach(er => {
        if (!er.id.startsWith('erro-sel-') && !er.id.startsWith('erro-manual-') && !er.id.startsWith('erro-manual-wrap-')) {
          const eid = er.id.replace('erro-', '');
          const esel = sel('erro-sel-' + eid);
          if (!esel) return;
          let errVal = '';
          if (esel.value === '__manual__') errVal = raw('erro-manual-' + eid).toUpperCase();
          else errVal = esel.value;
          if (errVal) erros.push(errVal);
        }
      });

      // Equipamentos
      const equips = [];
      ob.querySelectorAll('[id^="equip-modelo-"]').forEach(eq => {
        const qid = eq.id.replace('equip-modelo-', '');
        let modelo = '';
        if (eq.value === '__manual__') modelo = raw('equip-manual-' + qid).toUpperCase();
        else modelo = eq.value;
        if (!modelo) return;
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
