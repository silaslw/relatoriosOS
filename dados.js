// ==========================================================================
// CAMADA DE DADOS (SQLITE / EXPRESS API)
// ==========================================================================

const API_BASE_URL = 'http://localhost:3000/api';

let TECNICOS    = [];
let TIPOS_OS    = [];
let EQUIPAMENTOS = [];
let ERROS       = [];

async function carregarDadosIniciais() {
  try {
    const res = await fetch(`${API_BASE_URL}/configuracoes`);
    if (!res.ok) throw new Error('Falha ao conectar com o servidor');
    
    const dados = await res.json();
    TECNICOS     = dados.tecnicos || [];
    TIPOS_OS     = dados.tipos_os || [];
    EQUIPAMENTOS = dados.equipamentos || [];
    ERROS        = dados.erros || [];
  } catch (e) {
    console.error("Erro ao carregar dados do banco SQLite.", e);
    if (typeof toast === 'function') {
      toast("Aviso: Não foi possível conectar ao servidor backend.");
    }
  }
}

async function salvarDados(tipo, novaLista) {
  const listaOrdenada = [...novaLista].sort((a, b) => {
    const strA = String(a || '');
    const strB = String(b || '');
    return strA.localeCompare(strB, 'pt-BR');
  });

  try {
    const res = await fetch(`${API_BASE_URL}/configuracoes/${tipo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listaOrdenada)
    });

    if (!res.ok) throw new Error('Erro ao salvar no banco');

    // Atualiza variáveis em memória
    if (tipo === 'tecnicos') TECNICOS = listaOrdenada;
    if (tipo === 'tipos_os') TIPOS_OS = listaOrdenada;
    if (tipo === 'equipamentos') EQUIPAMENTOS = listaOrdenada;
    if (tipo === 'erros') ERROS = listaOrdenada;

  } catch (e) {
    console.error("Falha ao salvar dados no SQLite", e);
    if (typeof toast === 'function') toast("Erro ao salvar configurações no banco.");
  }
}

async function carregarHistorico() {
  try {
    const res = await fetch(`${API_BASE_URL}/historico`);
    if (!res.ok) throw new Error('Erro ao buscar histórico');
    return await res.json();
  } catch (e) {
    console.error("Erro ao carregar histórico do banco.", e);
    return [];
  }
}

async function salvarNoHistorico(dados) {
  try {
    const payload = {
      dataRef: dados.dataRef,
      tecnicos: dados.tecnicos || []
    };

    const res = await fetch(`${API_BASE_URL}/historico`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Erro ao gravar histórico');
  } catch (e) {
    console.error("Erro ao persistir histórico", e);
    if (typeof toast === 'function') toast("Erro ao salvar relatório no banco de dados.");
  }
}

async function limparHistorico() {
  try {
    await fetch(`${API_BASE_URL}/historico`, { method: 'DELETE' });
  } catch (e) {
    console.error("Erro ao limpar histórico", e);
  }
}

// Exportação CSV de Backup
function exportarBaseDeDados() {
  const listaTecnicos = TECNICOS || [];
  const listaDiagnosticos = TIPOS_OS || [];
  const listaEquipamentos = EQUIPAMENTOS || [];
  const listaErros = ERROS || [];

  const maxLength = Math.max(
    listaTecnicos.length, 
    listaDiagnosticos.length, 
    listaEquipamentos.length, 
    listaErros.length
  );

  let csvContent = "\uFEFFTECNICOS;DIAGNOSTICOS;EQUIPAMENTOS;ERROS\n";

  for (let i = 0; i < maxLength; i++) {
    const t  = (listaTecnicos[i]     || "").replace(/"/g, '""');
    const d  = (listaDiagnosticos[i] || "").replace(/"/g, '""');
    const eq = (listaEquipamentos[i] || "").replace(/"/g, '""');
    const er = (listaErros[i]        || "").replace(/"/g, '""');

    csvContent += `"${t}";"${d}";"${eq}";"${er}"\n`;
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const nomeArquivo = `Backup_BaseDeDados_OS_${dataHoje}.csv`;

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", nomeArquivo);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  if (typeof toast === 'function') {
    toast("✓ Base de dados exportada com sucesso!", 3000);
  }
}

// Executa carregamento inicial assíncrono ao script iniciar
carregarDadosIniciais();