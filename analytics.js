// ==========================================================================
// ANALYTICS — Métricas · Gráficos · Exportação
// ==========================================================================

// ======================== COMPUTAÇÃO ========================

function computarMetricas(historico) {
  const m = {
    totalOS:          0,
    totalVerificacoes: 0,
    porTecnico:       {},   // { nome: { total, verificacoes } }
    errosFreq:        {},   // { erro: count }
    equipFreq:        {}    // { modelo: count }
  };

  historico.forEach(geracao => {
    geracao.tecnicos.forEach(tec => {
      if (!m.porTecnico[tec.nome]) {
        m.porTecnico[tec.nome] = { total: 0, verificacoes: 0 };
      }

      tec.osList.forEach(os => {
        m.totalOS++;
        m.porTecnico[tec.nome].total++;

        if (os.paraVerif) {
          m.totalVerificacoes++;
          m.porTecnico[tec.nome].verificacoes++;
          (os.erros || []).forEach(err => {
            if (err) m.errosFreq[err] = (m.errosFreq[err] || 0) + 1;
          });
        }

        (os.equips || []).forEach(eq => {
          if (eq.modelo) m.equipFreq[eq.modelo] = (m.equipFreq[eq.modelo] || 0) + 1;
        });
      });
    });
  });

  return m;
}

// ======================== RENDERIZAÇÃO ========================

function renderAnalytics() {
  const historico = carregarHistorico();

  if (!historico.length) {
    _setMetricCards('—', '—', '—', '—');
    _setEmpty('chart-tecnicos',  'Gere relatórios para ver dados aqui.');
    _setEmpty('chart-erros',     'Nenhuma verificação registrada.');
    _setEmpty('chart-equips',    'Nenhum equipamento registrado.');
    _setEmpty('historico-table', 'Nenhum relatório gerado ainda.');
    const mg = sel('m-total-geracoes');
    if (mg) mg.textContent = '0 gerações';
    return;
  }

  const m = computarMetricas(historico);

  // Cartões de resumo
  const pct = m.totalOS > 0
    ? Math.round(m.totalVerificacoes / m.totalOS * 100) + '%'
    : '0%';
  _setMetricCards(m.totalOS, Object.keys(m.porTecnico).length, m.totalVerificacoes, pct);

  const mg = sel('m-total-geracoes');
  if (mg) mg.textContent = historico.length + ' geração(ões)';

  // Gráficos
  _renderBarChart('chart-tecnicos', m.porTecnico, (nome, d) => ({
    label:   nome,
    value:   d.total,
    display: d.total + ' OS',
    suffix:  d.verificacoes > 0
      ? `<span class="badge warn" style="font-size:9px">${d.verificacoes} verif.</span>`
      : ''
  }), 'accent');

  _renderBarChart('chart-erros', m.errosFreq, (nome, count) => ({
    label:   nome,
    value:   count,
    display: count + 'x',
    suffix:  ''
  }), 'warn', 10);

  _renderBarChart('chart-equips', m.equipFreq, (nome, count) => ({
    label:   nome,
    value:   count,
    display: count + ' inst.',
    suffix:  ''
  }), 'success', 10);

  _renderHistoricoTable(historico);
}

// ---------- Helpers de renderização ----------

function _setMetricCards(os, tec, verif, pct) {
  const ids = ['m-total-os', 'm-total-tec', 'm-total-verif', 'm-pct-verif'];
  const vals = [os, tec, verif, pct];
  ids.forEach((id, i) => { const el = sel(id); if (el) el.textContent = vals[i]; });
}

function _setEmpty(id, msg) {
  const el = sel(id);
  if (el) el.innerHTML = `<div class="empty">${msg}</div>`;
}

/**
 * Renderiza um gráfico de barras horizontais genérico.
 * @param {string}   containerId  ID do elemento container
 * @param {object}   data         Objeto { chave: valor | objeto }
 * @param {function} mapper       (chave, valor) => { label, value, display, suffix }
 * @param {string}   colorClass   'accent' | 'warn' | 'success'
 * @param {number}   limit        Máximo de itens a exibir
 */
function _renderBarChart(containerId, data, mapper, colorClass = 'accent', limit = 20) {
  const el = sel(containerId);
  if (!el) return;

  const entries = Object.entries(data)
    .map(([k, v]) => mapper(k, v))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  if (!entries.length) {
    el.innerHTML = '<div class="empty">Nenhum dado disponível.</div>';
    return;
  }

  const max = entries[0].value || 1;

  el.innerHTML = entries.map(item => {
    const pct = Math.round(item.value / max * 100);
    return `
      <div class="chart-bar-row">
        <span class="chart-label" title="${item.label}">${item.label}</span>
        <div class="chart-bar-track">
          <div class="chart-bar-fill ${colorClass === 'accent' ? '' : colorClass}"
               style="width:${pct}%"></div>
        </div>
        <span class="chart-val">${item.display}</span>
        ${item.suffix}
      </div>`;
  }).join('');
}

function _renderHistoricoTable(historico) {
  const el = sel('historico-table');
  if (!el) return;

  const rows = [...historico].reverse().map(g => {
    const totalOS    = g.tecnicos.reduce((a, t) => a + t.osList.length, 0);
    const totalVerif = g.tecnicos.reduce(
      (a, t) => a + t.osList.filter(o => o.paraVerif).length, 0
    );
    const nomes = g.tecnicos.map(t => t.nome).join(', ');
    const dt    = new Date(g.geradoEm).toLocaleString('pt-BR');
    return `
      <tr>
        <td><strong>${g.dataRef}</strong></td>
        <td style="color:var(--text3); font-size:11px">${dt}</td>
        <td>${nomes}</td>
        <td style="text-align:center"><strong>${totalOS}</strong></td>
        <td style="text-align:center">
          ${totalVerif > 0
            ? `<span class="badge warn">${totalVerif}</span>`
            : '<span style="color:var(--text3)">—</span>'}
        </td>
      </tr>`;
  }).join('');

  el.innerHTML = `
    <table class="hist-table">
      <thead>
        <tr>
          <th>Data Ref</th>
          <th>Gerado Em</th>
          <th>Técnicos</th>
          <th style="text-align:center">OS</th>
          <th style="text-align:center">Verificações</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ======================== EXPORTAÇÃO ========================

function exportarCSV() {
  const historico = carregarHistorico();
  if (!historico.length) return toast('Nenhum dado para exportar.', 3000);

  const cabecalho = [
    'Data Ref','Gerado Em','Técnico','Nº OS','Tipo',
    'Para Verificação','Erros','Equipamentos','Observação'
  ];
  const linhas = [cabecalho];

  historico.forEach(g => {
    g.tecnicos.forEach(tec => {
      tec.osList.forEach(os => {
        linhas.push([
          g.dataRef,
          new Date(g.geradoEm).toLocaleString('pt-BR'),
          tec.nome,
          os.numOS,
          os.tipo || '',
          os.paraVerif ? 'SIM' : 'NÃO',
          (os.erros  || []).join('; '),
          (os.equips || []).map(e => `${e.modelo}(${e.serial})`).join('; '),
          os.obs || ''
        ]);
      });
    });
  });

  const csv = '\ufeff' + linhas
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'historico_os.csv');
  toast('✓ CSV exportado!');
}

function exportarXML() {
  const historico = carregarHistorico();
  if (!historico.length) return toast('Nenhum dado para exportar.', 3000);

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<historico>\n';

  historico.forEach(g => {
    xml += `  <geracao id="${g.id}" dataRef="${esc(g.dataRef)}" geradoEm="${esc(g.geradoEm)}">\n`;
    g.tecnicos.forEach(tec => {
      xml += `    <tecnico nome="${esc(tec.nome)}">\n`;
      tec.osList.forEach(os => {
        xml += `      <os num="${esc(os.numOS)}" tipo="${esc(os.tipo || '')}" verificacao="${os.paraVerif}">\n`;
        (os.erros  || []).forEach(err => { xml += `        <erro>${esc(err)}</erro>\n`; });
        (os.equips || []).forEach(eq  => {
          xml += `        <equipamento modelo="${esc(eq.modelo)}" serial="${esc(eq.serial)}" status="${esc(eq.status || '')}"/>\n`;
        });
        if (os.obs) xml += `        <obs>${esc(os.obs)}</obs>\n`;
        xml += `      </os>\n`;
      });
      xml += `    </tecnico>\n`;
    });
    xml += `  </geracao>\n`;
  });

  xml += '</historico>';
  downloadBlob(new Blob([xml], { type: 'application/xml;charset=utf-8' }), 'historico_os.xml');
  toast('✓ XML exportado!');
}

function exportarXLSX() {
  const historico = carregarHistorico();
  if (!historico.length) return toast('Nenhum dado para exportar.', 3000);

  // Aba 1 — Dados brutos completos
  const raw1 = [['Data Ref','Gerado Em','Técnico','Nº OS','Tipo',
                  'Para Verificação','Erros','Equipamentos','Observação']];
  historico.forEach(g => {
    g.tecnicos.forEach(tec => {
      tec.osList.forEach(os => {
        raw1.push([
          g.dataRef,
          new Date(g.geradoEm).toLocaleString('pt-BR'),
          tec.nome,
          os.numOS,
          os.tipo || '',
          os.paraVerif ? 'SIM' : 'NÃO',
          (os.erros  || []).join('; '),
          (os.equips || []).map(e => `${e.modelo}(${e.serial})`).join('; '),
          os.obs || ''
        ]);
      });
    });
  });

  // Aba 2 — OS por técnico
  const m    = computarMetricas(historico);
  const raw2 = [['Técnico','Total OS','Verificações','Taxa (%)']];
  Object.entries(m.porTecnico)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([nome, d]) => {
      raw2.push([nome, d.total, d.verificacoes,
        d.total > 0 ? Math.round(d.verificacoes / d.total * 100) : 0]);
    });

  // Aba 3 — Erros mais frequentes
  const raw3 = [['Erro / Pendência','Ocorrências']];
  Object.entries(m.errosFreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([e, n]) => raw3.push([e, n]));

  // Aba 4 — Equipamentos mais instalados
  const raw4 = [['Equipamento','Instalações']];
  Object.entries(m.equipFreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([e, n]) => raw4.push([e, n]));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(raw1), 'Histórico');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(raw2), 'Por Técnico');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(raw3), 'Erros Frequentes');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(raw4), 'Equipamentos');
  XLSX.writeFile(wb, 'historico_os.xlsx');
  toast('✓ XLSX exportado!');
}

function confirmarLimparHistorico() {
  if (!confirm('Todo o histórico de métricas será apagado permanentemente. Continuar?')) return;
  limparHistorico();
  renderAnalytics();
  toast('Histórico apagado.', 2500);
}