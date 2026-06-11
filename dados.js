// ==========================================================================
// DADOS (Zero Data Initial State)
// ==========================================================================
let TECNICOS = [];
let TIPOS_OS = [];
let EQUIPAMENTOS = [];
let ERROS = [];

const CHAVES_STORAGE = {
  tecnicos: '_os_tecnicos',
  tipos_os: '_os_tipos_os',
  equipamentos: '_os_equipamentos',
  erros: '_os_erros'
};

function carregarDadosIniciais() {
  TECNICOS = JSON.parse(localStorage.getItem(CHAVES_STORAGE.tecnicos)) || [];
  TIPOS_OS = JSON.parse(localStorage.getItem(CHAVES_STORAGE.tipos_os)) || [];
  EQUIPAMENTOS = JSON.parse(localStorage.getItem(CHAVES_STORAGE.equipamentos)) || [];
  ERROS = JSON.parse(localStorage.getItem(CHAVES_STORAGE.erros)) || [];
}

function salvarDados(tipo, novaLista) {
  // Garante ordem alfabética para facilitar a busca nos selects
  novaLista.sort((a, b) => a.localeCompare(b));
  localStorage.setItem(CHAVES_STORAGE[tipo], JSON.stringify(novaLista));
  carregarDadosIniciais();
}

// Inicializa no carregamento do script
carregarDadosIniciais();
