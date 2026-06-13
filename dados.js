// ==========================================================================
// CAMADA DE DADOS
// ==========================================================================

let TECNICOS    = [];
let TIPOS_OS    = [];
let EQUIPAMENTOS = [];
let ERROS       = [];

const CHAVES_STORAGE = {
  tecnicos:     '_os_tecnicos',
  tipos_os:     '_os_tipos_os',
  equipamentos: '_os_equipamentos',
  erros:        '_os_erros'
};

const HISTORY_KEY = '_os_historico';

// ---------- Listas de configuração ----------

function carregarDadosIniciais() {
  TECNICOS     = JSON.parse(localStorage.getItem(CHAVES_STORAGE.tecnicos))     || [];
  TIPOS_OS     = JSON.parse(localStorage.getItem(CHAVES_STORAGE.tipos_os))     || [];
  EQUIPAMENTOS = JSON.parse(localStorage.getItem(CHAVES_STORAGE.equipamentos)) || [];
  ERROS        = JSON.parse(localStorage.getItem(CHAVES_STORAGE.erros))        || [];
}

function salvarDados(tipo, novaLista) {
  novaLista.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  localStorage.setItem(CHAVES_STORAGE[tipo], JSON.stringify(novaLista));
  carregarDadosIniciais();
}

// ---------- Histórico de gerações ----------

function carregarHistorico() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function salvarNoHistorico(dados) {
  const historico = carregarHistorico();
  historico.push({
    id:        Date.now(),
    dataRef:   dados.dataRef,
    geradoEm:  new Date().toISOString(),
    // cópia profunda para não depender do DOM após geração
    tecnicos:  JSON.parse(JSON.stringify(dados.tecnicos))
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historico));
}

function limparHistorico() {
  localStorage.removeItem(HISTORY_KEY);
}

// Inicializa na carga
carregarDadosIniciais();