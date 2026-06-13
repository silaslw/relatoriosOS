// ==========================================================================
// GESTÃO DE ABAS E BASE DE DADOS
// ==========================================================================

const MAPA_DADOS = {
  tecnicos:     { lista: () => TECNICOS,     label: 'Técnico / Colaborador' },
  tipos_os:     { lista: () => TIPOS_OS,     label: 'Diagnóstico / Tipo'    },
  equipamentos: { lista: () => EQUIPAMENTOS, label: 'Equipamento / Peça'    },
  erros:        { lista: () => ERROS,        label: 'Pendência / Erro'       }
};

// ---------- Roteamento de abas ----------

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');

  // A action bar só faz sentido no Gerador
  const actionBar = sel('main-action-bar');
  if (actionBar) actionBar.style.display = tabId === 'tab-gerador' ? 'flex' : 'none';

  if (tabId === 'tab-config') {
    renderTodasListasConfig();
  } else if (tabId === 'tab-analytics') {
    renderAnalytics();
  } else {
    refreshAllDropdowns();
  }
}

// ---------- Renderização das listas ----------

function renderTodasListasConfig() {
  Object.keys(MAPA_DADOS).forEach(tipo => renderListaConfig(tipo));
}

function renderListaConfig(tipo) {
  const container = document.getElementById('list-' + tipo);
  const dados     = MAPA_DADOS[tipo].lista();

  if (!dados.length) {
    container.innerHTML = `<div class="empty" style="padding:12px">Nenhum dado cadastrado.</div>`;
    return;
  }

  container.innerHTML = dados.map((item, index) => `
    <div class="config-item">
      <span>${item}</span>
      <button class="btn xs danger" onclick="removerItemConfig('${tipo}', ${index})">✕ Remover</button>
    </div>`
  ).join('');
}

// ---------- Adicionar / Remover itens ----------

function adicionarItemConfig(tipo) {
  const input     = document.getElementById('input-' + tipo);
  const valor     = input.value.trim().toUpperCase();
  const listaAtual = MAPA_DADOS[tipo].lista();

  if (!valor)                     return toast('O campo não pode estar vazio.', 3000);
  if (listaAtual.includes(valor)) return toast('Este item já existe na lista.', 3000);

  listaAtual.push(valor);
  salvarDados(tipo, listaAtual);
  input.value = '';
  renderListaConfig(tipo);
  toast(`${MAPA_DADOS[tipo].label} adicionado com sucesso!`);
}

function removerItemConfig(tipo, index) {
  if (!confirm('Tem certeza que deseja remover este item?')) return;
  const listaAtual = MAPA_DADOS[tipo].lista();
  listaAtual.splice(index, 1);
  salvarDados(tipo, listaAtual);
  renderListaConfig(tipo);
}

// ---------- Refresh dos selects no Gerador ----------

function refreshAllDropdowns() {
  document.querySelectorAll('[id^="tec-sel-"]').forEach(s =>
    _atualizarSelect(s, TECNICOS, 'Selecione o técnico'));
  document.querySelectorAll('[id^="os-tipo-"]').forEach(s =>
    _atualizarSelect(s, TIPOS_OS, 'Selecione'));
  document.querySelectorAll('[id^="equip-modelo-"]').forEach(s =>
    _atualizarSelect(s, EQUIPAMENTOS, 'Selecione', true));
  document.querySelectorAll('[id^="erro-sel-"]').forEach(s =>
    _atualizarSelect(s, ERROS, 'Selecione', true));
}

function _atualizarSelect(selectEl, dados, placeholder, comManual = false) {
  const valorAtual = selectEl.value;
  const extra = comManual ? `<option value="__manual__">Outro (manual)</option>` : '';
  selectEl.innerHTML =
    `<option value="">${placeholder}</option>` +
    dados.map(o => `<option value="${o}">${o}</option>`).join('') +
    extra;
  if (dados.includes(valorAtual)) selectEl.value = valorAtual;
}

// ==========================================================================
// IMPORTAÇÃO EM MASSA (XLSX / CSV)
// ==========================================================================

function abrirImportacaoXLSX() {
  const fileInput   = document.createElement('input');
  fileInput.type    = 'file';
  fileInput.accept  = '.xlsx,.xls,.csv';

  fileInput.onchange = function (event) {
    const file = event.target.files[0];
    if (!file) return;
    toast('Lendo arquivo, aguarde...', 2000);

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data      = new Uint8Array(e.target.result);
        const workbook  = XLSX.read(data, { type: 'array' });
        const sheet     = workbook.Sheets[workbook.SheetNames[0]];
        const json      = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        processarPlanilha(json);
      } catch (err) {
        toast('Erro ao processar planilha. Verifique o formato.', 4000);
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  fileInput.click();
}

function processarPlanilha(linhas) {
  const sets = {
    tecnicos:     new Set(TECNICOS),
    tipos_os:     new Set(TIPOS_OS),
    equipamentos: new Set(EQUIPAMENTOS),
    erros:        new Set(ERROS)
  };

  let adicionados = 0;

  linhas.forEach(linha => {
    Object.keys(linha).forEach(col => {
      const chave  = col.toUpperCase().trim();
      const valor  = String(linha[col]).toUpperCase().trim();
      if (!valor) return;

      let alvo = null;
      if (chave.includes('TECNICO') || chave.includes('COLABORADOR')) alvo = 'tecnicos';
      else if (chave.includes('DIAGNOSTICO') || chave.includes('SERVICO'))  alvo = 'tipos_os';
      else if (chave.includes('EQUIPAMENTO') || chave.includes('PECA'))     alvo = 'equipamentos';
      else if (chave.includes('ERRO') || chave.includes('FALHA'))           alvo = 'erros';

      if (alvo && !sets[alvo].has(valor)) {
        sets[alvo].add(valor);
        adicionados++;
      }
    });
  });

  Object.keys(sets).forEach(tipo => salvarDados(tipo, Array.from(sets[tipo])));
  renderTodasListasConfig();

  toast(adicionados > 0
    ? `✓ ${adicionados} novo(s) item(ns) importado(s).`
    : 'Planilha lida. Nenhum item novo encontrado.',
    4000
  );
}

// Inicializa na aba Gerador
switchTab('tab-gerador');