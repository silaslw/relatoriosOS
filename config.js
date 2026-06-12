// ==========================================================================
// GESTÃO DA BASE DE DADOS (CONFIGURAÇÕES)
// ==========================================================================

const MAPA_DADOS = {
    'tecnicos': { lista: () => TECNICOS, label: 'Técnico / Colaborador' },
    'tipos_os': { lista: () => TIPOS_OS, label: 'Diagnóstico / Tipo' },
    'equipamentos': { lista: () => EQUIPAMENTOS, label: 'Equipamento / Peça' },
    'erros': { lista: () => ERROS, label: 'Pendência / Erro' }
};

// Alterna entre a aba do Gerador e a aba da Base de Dados
function switchTab(tabId) {
  // 1. Limpa as classes ativas de tudo
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  
  // 2. Ativa a aba atual
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');

  // 3. Controle inteligente da Action Bar
  const actionBar = document.getElementById('main-action-bar');
  if (actionBar) {
    // Só exibe a barra de gerar documentos se estiver no Gerador
    actionBar.style.display = (tabId === 'tab-gerador') ? 'flex' : 'none';
  }

  // 4. Ações específicas de cada aba
  if (tabId === 'tab-config') {
    renderTodasListasConfig();
  } else {
    refreshAllDropdowns();
  }
}  

function renderTodasListasConfig() {
    Object.keys(MAPA_DADOS).forEach(tipo => renderListaConfig(tipo));
}

function renderListaConfig(tipo) {
    const container = document.getElementById(`list-${tipo}`);
    const dados = MAPA_DADOS[tipo].lista();

    if (dados.length === 0) {
        container.innerHTML = `<div class="empty" style="padding:12px">Nenhum dado cadastrado.</div>`;
        return;
    }

    container.innerHTML = dados.map((item, index) => `
    <div class="config-item">
    <span>${item}</span>
    <button class="btn xs danger" onclick="removerItemConfig('${tipo}', ${index})">✕ Remover</button>
    </div>
    `).join('');
}

function adicionarItemConfig(tipo) {
    const input = document.getElementById(`input-${tipo}`);
    const valor = input.value.trim().toUpperCase();

    if (!valor) return toast('O campo não pode estar vazio.', 3000);

    const listaAtual = MAPA_DADOS[tipo].lista();
    if (listaAtual.includes(valor)) return toast('Este item já existe na lista.', 3000);

    listaAtual.push(valor);
    salvarDados(tipo, listaAtual);
    input.value = '';
    renderListaConfig(tipo);
    toast(`${MAPA_DADOS[tipo].label} adicionado com sucesso!`);
}

function removerItemConfig(tipo, index) {
    if(!confirm(`Tem certeza que deseja remover este item? Ele não aparecerá mais para novas OS.`)) return;

    const listaAtual = MAPA_DADOS[tipo].lista();
    listaAtual.splice(index, 1);
    salvarDados(tipo, listaAtual);
    renderListaConfig(tipo);
}

// Atualiza os <select> que já estão renderizados no DOM ao voltar para a aba principal
function refreshAllDropdowns() {
    document.querySelectorAll('[id^="tec-sel-"]').forEach(s => atualizarSelectDOM(s, TECNICOS, 'Selecione o técnico'));
    document.querySelectorAll('[id^="os-tipo-"]').forEach(s => atualizarSelectDOM(s, TIPOS_OS, 'Selecione'));
    document.querySelectorAll('[id^="equip-modelo-"]').forEach(s => atualizarSelectDOM(s, EQUIPAMENTOS, 'Selecione'));
    document.querySelectorAll('[id^="erro-sel-"]').forEach(s => atualizarSelectDOM(s, ERROS, 'Selecione um erro'));
}

function atualizarSelectDOM(selectElement, arrayDados, placeholder) {
  const valorSelecionado = selectElement.value;
  selectElement.innerHTML = `
    <option value="">${placeholder}</option>
    ${arrayDados.map(o => `<option value="${o}">${o}</option>`).join('')}
  `;
  if (arrayDados.includes(valorSelecionado)) {
    selectElement.value = valorSelecionado;
  }
}

// ==========================================================================
// IMPORTAÇÃO EM MASSA (EXCEL / XLSX / CSV)
// ==========================================================================

function abrirImportacaoXLSX() {
    // 1. Cria um input de arquivo invisível dinamicamente
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls, .csv';

    // 2. Quando o utilizador selecionar o arquivo, dispara a leitura
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        toast('Lendo arquivo, aguarde...', 2000);

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Pega a primeira aba da planilha
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Converte a aba num array de objetos de forma super limpa
                // Ex: [{ TECNICOS: "André", DIAGNOSTICOS: "Troca" }, { TECNICOS: "Carlos" }]
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                processarPlanilha(json);
            } catch (error) {
                toast('Erro ao processar planilha. Verifique o formato.', 4000);
                console.error(error);
            }
        };

        // Inicia a leitura do arquivo como um buffer de dados
        reader.readAsArrayBuffer(file);
    };

    // 3. Simula o clique para abrir a janela de seleção de ficheiros do Windows/Mac
    fileInput.click();
}

function processarPlanilha(dadosPlanilha) {
    // Usamos "Set" para fundir os dados novos com os velhos SEM CRIAR DUPLICADOS
    let novosTecnicos = new Set(TECNICOS);
    let novosTipos = new Set(TIPOS_OS);
    let novosEquipamentos = new Set(EQUIPAMENTOS);
    let novosErros = new Set(ERROS);

    let itensAdicionados = 0;

    dadosPlanilha.forEach(linha => {
        // Percorre todas as colunas da linha atual
        Object.keys(linha).forEach(nomeColuna => {
            const colunaUpper = nomeColuna.toUpperCase().trim();
            const valor = String(linha[nomeColuna]).toUpperCase().trim();

            if (!valor) return; // Ignora células vazias

            // Verifica qual é a coluna (procura por palavras-chave na Linha 1)
            if (colunaUpper.includes('TECNICO') || colunaUpper.includes('COLABORADOR')) {
                if (!novosTecnicos.has(valor)) { novosTecnicos.add(valor); itensAdicionados++; }
            }
            else if (colunaUpper.includes('DIAGNOSTICO') || colunaUpper.includes('SERVICO')) {
                if (!novosTipos.has(valor)) { novosTipos.add(valor); itensAdicionados++; }
            }
            else if (colunaUpper.includes('EQUIPAMENTO') || colunaUpper.includes('PECA')) {
                if (!novosEquipamentos.has(valor)) { novosEquipamentos.add(valor); itensAdicionados++; }
            }
            else if (colunaUpper.includes('ERRO') || colunaUpper.includes('FALHA')) {
                if (!novosErros.has(valor)) { novosErros.add(valor); itensAdicionados++; }
            }
        });
    });

    // Salva no LocalStorage e atualiza a interface
    salvarDados('tecnicos', Array.from(novosTecnicos));
    salvarDados('tipos_os', Array.from(novosTipos));
    salvarDados('equipamentos', Array.from(novosEquipamentos));
    salvarDados('erros', Array.from(novosErros));

    renderTodasListasConfig();

    if (itensAdicionados > 0) {
        toast(`✓ Sucesso! ${itensAdicionados} novos itens importados.`, 4000);
    } else {
        toast('Planilha lida. Nenhum item novo encontrado (já existiam).', 4000);
    }
}
// Dispara a aba do gerador no primeiro carregamento da página
switchTab('tab-gerador');