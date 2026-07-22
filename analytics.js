// ==========================================================================
// ANALYTICS — Métricas · Gráficos · Exportação
// ==========================================================================

// ======================== ESTADO ========================

let tecnicosSortState = { column: 'os', direction: 'desc' };
let filtroAtual = 'geral'; // 'geral' ou 'mes'
let mesSelecionado = null; // { mes: 7, ano: 2026, nome: 'Julho' }

// ======================== COMPUTAÇÃO ========================

function computarMetricas(historico) {
  const m = {
    totalOS: 0,
    totalVerificacoes: 0,
    porTecnico: {},
    errosFreq: {},
    equipFreq: {}
  };

  historico.forEach(geracao => {
    (geracao.tecnicos || []).forEach(tec => {
      if (!tec.nome) return;
      if (!m.porTecnico[tec.nome]) {
        m.porTecnico[tec.nome] = { total: 0, verificacoes: 0 };
      }

      (tec.osList || []).forEach(os => {
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

function computarMetricasPorMes(historico, mes, ano) {
  const m = {
    totalOS: 0,
    totalVerificacoes: 0,
    porTecnico: {},
    errosFreq: {},
    equipFreq: {}
  };

  historico.forEach(geracao => {
    const dataRef = geracao.dataRef || '';
    const partes = dataRef.split('.');
    
    let mesGeracao = null;
    let anoGeracao = null;
    
    if (partes.length >= 2) {
      mesGeracao = parseInt(partes[1], 10);
      const anoStr = partes[2] || '';
      if (anoStr.length === 2) {
        anoGeracao = 2000 + parseInt(anoStr, 10);
      } else if (anoStr.length === 4) {
        anoGeracao = parseInt(anoStr, 10);
      } else {
        anoGeracao = new Date().getFullYear();
      }
    } else if (geracao.geradoEm) {
      const dataGeracao = new Date(geracao.geradoEm);
      mesGeracao = dataGeracao.getMonth() + 1;
      anoGeracao = dataGeracao.getFullYear();
    }

    if (mesGeracao !== mes || anoGeracao !== ano) return;

    (geracao.tecnicos || []).forEach(tec => {
      if (!tec.nome) return;
      if (!m.porTecnico[tec.nome]) {
        m.porTecnico[tec.nome] = { total: 0, verificacoes: 0 };
      }

      (tec.osList || []).forEach(os => {
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

// Extrai todos os meses únicos do histórico
function extrairMesesDisponiveis(historico) {
  const meses = new Map();
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  historico.forEach(geracao => {
    const dataRef = geracao.dataRef || '';
    const partes = dataRef.split('.');
    
    let mes = null;
    let ano = null;
    
    if (partes.length >= 2) {
      mes = parseInt(partes[1], 10);
      const anoStr = partes[2] || '';
      if (anoStr.length === 2) {
        ano = 2000 + parseInt(anoStr, 10);
      } else if (anoStr.length === 4) {
        ano = parseInt(anoStr, 10);
      } else {
        ano = new Date().getFullYear();
      }
    } else if (geracao.geradoEm) {
      const data = new Date(geracao.geradoEm);
      mes = data.getMonth() + 1;
      ano = data.getFullYear();
    }

    if (mes && ano) {
      const key = `${ano}-${mes}`;
      if (!meses.has(key)) {
        meses.set(key, {
          mes: mes,
          ano: ano,
          nome: nomesMeses[mes - 1],
          label: `${nomesMeses[mes - 1]} ${ano}`
        });
      }
    }
  });

  // Ordena do mais recente para o mais antigo
  return Array.from(meses.values()).sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });
}

// ======================== RENDERIZAÇÃO ========================

async function renderAnalytics() {
  const historico = await carregarHistorico();

  if (!historico.length) {
    _setMetricCards('—', '—', '—', '—');
    _setEmpty('chart-tecnicos', 'Nenhum dado disponível. Gere relatórios para ver métricas.');
    _setEmpty('chart-erros', 'Nenhuma verificação registrada.');
    _setEmpty('chart-equips', 'Nenhum equipamento registrado.');
    _setEmpty('historico-table', 'Nenhum relatório gerado ainda.');
    const mg = sel('m-total-geracoes');
    if (mg) mg.textContent = '0 gerações';
    return;
  }

  // Dados gerais
  const mGeral = computarMetricas(historico);
  
  // Meses disponíveis
  const mesesDisponiveis = extrairMesesDisponiveis(historico);
  
  // Se não tem mês selecionado, seleciona o mais recente
  if (!mesSelecionado && mesesDisponiveis.length > 0) {
    mesSelecionado = mesesDisponiveis[0];
  }

  // Dados do mês selecionado
  let mMes = { porTecnico: {} };
  if (mesSelecionado) {
    mMes = computarMetricasPorMes(historico, mesSelecionado.mes, mesSelecionado.ano);
  }

  // Cartões de resumo (sempre mostram dados gerais)
  const pct = mGeral.totalOS > 0
    ? Math.round(mGeral.totalVerificacoes / mGeral.totalOS * 100) + '%'
    : '0%';
  _setMetricCards(mGeral.totalOS, Object.keys(mGeral.porTecnico).length, mGeral.totalVerificacoes, pct);

  const mg = sel('m-total-geracoes');
  if (mg) mg.textContent = historico.length + ' geração(ões)';

  // Renderiza o painel de técnicos com toggle
  _renderTecnicosPanel('chart-tecnicos', mGeral.porTecnico, mMes.porTecnico, mesesDisponiveis);

  // Outros gráficos (sempre usam dados gerais)
  _renderBarChart('chart-erros', mGeral.errosFreq, (nome, count) => ({
    label: nome,
    value: count,
    display: count + 'x',
    suffix: ''
  }), 'warn', 10);

  _renderBarChart('chart-equips', mGeral.equipFreq, (nome, count) => ({
    label: nome,
    value: count,
    display: count + ' inst.',
    suffix: ''
  }), 'success', 10);

  _renderHistoricoTable(historico);
}

// NOVO: Renderiza painel de técnicos com toggle
function _renderTecnicosPanel(containerId, dadosGeral, dadosMes, mesesDisponiveis) {
  const el = sel(containerId);
  if (!el) return;

  const dadosAtuais = filtroAtual === 'geral' ? dadosGeral : dadosMes;
  const temDados = Object.keys(dadosAtuais).length > 0;

  // Botão do mês ativo ou não
  const mesAtivo = filtroAtual === 'mes';
  const mesLabel = mesSelecionado ? mesSelecionado.nome.toUpperCase() : 'MÊS';

  // Gera opções do dropdown
  const dropdownHtml = mesesDisponiveis.length > 0 ? `
    <div class="mes-dropdown-options" id="mes-dropdown">
      ${mesesDisponiveis.map(m => `
        <div class="mes-option ${mesSelecionado && mesSelecionado.mes === m.mes && mesSelecionado.ano === m.ano ? 'active' : ''}" 
             onclick="selecionarMes(${m.mes}, ${m.ano}, '${m.nome}')">
          ${m.nome} ${m.ano}
        </div>
      `).join('')}
    </div>
  ` : '';

  el.innerHTML = `
    <div class="tecnicos-panel-container">
      <div class="tecnicos-panel-header">
        <div class="tecnicos-toggle-group">
          <button class="tecnicos-toggle ${filtroAtual === 'geral' ? 'active' : ''}" onclick="setFiltroTecnicos('geral')">
            TODO O PERÍODO
          </button>
          <button class="tecnicos-toggle ${mesAtivo ? 'active' : ''} with-dropdown" onclick="toggleMesDropdown()">
            ${mesLabel}
            <svg class="toggle-arrow ${mesAtivo ? 'open' : ''}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>${dropdownHtml}
        </div>
      </div>
      <div class="tecnicos-panel-content">
        ${temDados ? _renderTecnicosTableHtml(dadosAtuais) : 
          '<div class="empty" style="padding:40px">Nenhum dado para o período selecionado.</div>'}
      </div>
    </div>
  `;
}

// Gera HTML da tabela de técnicos
function _renderTecnicosTableHtml(data) {
  const entries = Object.entries(data).map(([nome, d]) => ({
    nome: nome,
    os: d.total,
    verificacoes: d.verificacoes
  }));

  // Ordena
  entries.sort((a, b) => {
    const col = tecnicosSortState.column;
    const dir = tecnicosSortState.direction === 'asc' ? 1 : -1;
    if (a[col] < b[col]) return -1 * dir;
    if (a[col] > b[col]) return 1 * dir;
    return 0;
  });

  const getSortIcon = (col) => {
    if (tecnicosSortState.column !== col) return '⇅';
    return tecnicosSortState.direction === 'asc' ? '↑' : '↓';
  };

  return `
    <table class="tecnicos-table">
      <thead>
        <tr>
          <th class="sortable" onclick="_sortTecnicosTable('nome')">
            Técnico <span class="sort-icon">${getSortIcon('nome')}</span>
          </th>
          <th class="sortable" onclick="_sortTecnicosTable('os')">
            O.S. <span class="sort-icon">${getSortIcon('os')}</span>
          </th>
          <th class="sortable" onclick="_sortTecnicosTable('verificacoes')">
            Verificações <span class="sort-icon">${getSortIcon('verificacoes')}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(item => `
          <tr>
            <td class="tec-nome">${item.nome}</td>
            <td class="tec-os">${item.os}</td>
            <td class="tec-verif">
              ${item.verificacoes > 0 
                ? `<span class="badge warn">${item.verificacoes}</span>` 
                : '<span class="zero-val">—</span>'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ======================== CONTROLES ========================

// Define o filtro ativo (geral ou mes)
window.setFiltroTecnicos = function(filtro) {
  filtroAtual = filtro;
  renderAnalytics();
};

// Seleciona um mês específico
window.selecionarMes = function(mes, ano, nome) {
  mesSelecionado = { mes, ano, nome };
  filtroAtual = 'mes';
  renderAnalytics();
};

// Toggle do dropdown de meses
window.toggleMesDropdown = function() {
  const dropdown = sel('mes-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
};

// Fecha dropdown ao clicar fora
document.addEventListener('click', (e) => {
  const dropdown = sel('mes-dropdown');
  const toggle = e.target.closest('.tecnicos-toggle.with-dropdown');
  if (dropdown && !toggle && !e.target.closest('.mes-dropdown-options')) {
    dropdown.classList.remove('show');
  }
});

// Ordenação da tabela
window._sortTecnicosTable = function(column) {
  if (tecnicosSortState.column === column) {
    tecnicosSortState.direction = tecnicosSortState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    tecnicosSortState.column = column;
    tecnicosSortState.direction = 'desc';
  }
  renderAnalytics();
};

// ---------- Outros helpers (mantidos) ----------

function _setMetricCards(os, tec, verif, pct) {
  const ids = ['m-total-os', 'm-total-tec', 'm-total-verif', 'm-pct-verif'];
  const vals = [os, tec, verif, pct];
  ids.forEach((id, i) => { const el = sel(id); if (el) el.textContent = vals[i]; });
}

function _setEmpty(id, msg) {
  const el = sel(id);
  if (el) el.innerHTML = `<div class="empty">${msg}</div>`;
}

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
  const fillClass = colorClass === 'accent' ? '' : colorClass;

  el.innerHTML = entries.map(item => {
    const pct = Math.round(item.value / max * 100);
    return `
      <div class="chart-bar-row">
        <span class="chart-label" title="${item.label}">${item.label}</span>
        <div class="chart-bar-track">
          <div class="chart-bar-fill ${fillClass}" style="width:${pct}%"></div>
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
    const totalOS = (g.tecnicos || []).reduce((a, t) => a + (t.osList || []).length, 0);
    const totalVerif = (g.tecnicos || []).reduce(
      (a, t) => a + (t.osList || []).filter(o => o.paraVerif).length, 0
    );
    const nomes = (g.tecnicos || []).map(t => t.nome).join(', ');
    const dt = new Date(g.geradoEm).toLocaleString('pt-BR');
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

// Exportações (mantidas)
async function exportarCSV() {
  const historico = await carregarHistorico();
  if (!historico.length) return toast('Nenhum dado para exportar.', 3000);

  const linhas = _buildExportRows(historico);
  const csv = '\ufeff' + linhas
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'historico_os.csv');
  toast('✓ CSV exportado!');
}

async function exportarXML() {
  const historico = await carregarHistorico();
  if (!historico.length) return toast('Nenhum dado para exportar.', 3000);

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<historico>\n';

  historico.forEach(g => {
    xml += `  <geracao id="${g.id}" dataRef="${esc(g.dataRef)}" geradoEm="${esc(g.geradoEm)}">\n`;
    (g.tecnicos || []).forEach(tec => {
      xml += `    <tecnico nome="${esc(tec.nome)}">\n`;
      (tec.osList || []).forEach(os => {
        xml += `      <os num="${esc(os.numOS)}" tipo="${esc(os.tipo || '')}" verificacao="${os.paraVerif}">\n`;
        (os.erros || []).forEach(err => { xml += `        <erro>${esc(err)}</erro>\n`; });
        (os.equips || []).forEach(eq => {
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

async function exportarXLSX() {
  const historico = await carregarHistorico();
  if (!historico.length) return toast('Nenhum dado para exportar.', 3000);

  const raw1 = _buildExportRows(historico);
  const m = computarMetricas(historico);
  const raw2 = [['Técnico', 'Total OS', 'Verificações', 'Taxa (%)']];

  Object.entries(m.porTecnico)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([nome, d]) => {
      raw2.push([nome, d.total, d.verificacoes,
        d.total > 0 ? Math.round(d.verificacoes / d.total * 100) : 0]);
    });

  const raw3 = [['Erro / Pendência', 'Ocorrências']];
  Object.entries(m.errosFreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([e, n]) => raw3.push([e, n]));

  const raw4 = [['Equipamento', 'Instalações']];
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

async function confirmarLimparHistorico() {
  if (!confirm('Todo o histórico de métricas será apagado permanentemente. Continuar?')) return;
  await limparHistorico();
  await renderAnalytics();
  toast('Histórico apagado.', 2500);
}

function _buildExportRows(historico) {
  const header = [
    'Data Ref', 'Gerado Em', 'Técnico', 'Nº OS', 'Tipo',
    'Para Verificação', 'Erros', 'Equipamentos', 'Observação'
  ];
  const rows = [header];

  historico.forEach(g => {
    (g.tecnicos || []).forEach(tec => {
      (tec.osList || []).forEach(os => {
        rows.push([
          g.dataRef,
          new Date(g.geradoEm).toLocaleString('pt-BR'),
          tec.nome,
          os.numOS,
          os.tipo || '',
          os.paraVerif ? 'SIM' : 'NÃO',
          (os.erros || []).join('; '),
          (os.equips || []).map(e => `${e.modelo}(${e.serial})`).join('; '),
          os.obs || ''
        ]);
      });
    });
  });

  return rows;
}