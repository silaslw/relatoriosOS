// ==========================================================================
// CAMADA DE DADOS (OTIMIZADA E PROTEGIDA)
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
const MAX_HISTORY_ITEMS = 50; // Evita o estouro dos 5MB do localStorage

function carregarDadosIniciais() {
  try {
    TECNICOS     = JSON.parse(localStorage.getItem(CHAVES_STORAGE.tecnicos))     || [];
    TIPOS_OS     = JSON.parse(localStorage.getItem(CHAVES_STORAGE.tipos_os))     || [];
    EQUIPAMENTOS = JSON.parse(localStorage.getItem(CHAVES_STORAGE.equipamentos)) || [];
    ERROS        = JSON.parse(localStorage.getItem(CHAVES_STORAGE.erros))        || [];
  } catch (e) {
    console.error("Erro ao carregar dados do localStorage. Resetando estruturas locais.", e);
    toast("Aviso: Falha ao ler configurações locais. Dados corrompidos.");
  }
}

function salvarDados(tipo, novaLista) {
  if (!CHAVES_STORAGE[tipo]) return;
  
  // Cria uma cópia rasa para evitar mutação indesejada fora da função
  const listaOrdenada = [...novaLista].sort((a, b) => {
    const strA = String(a || '');
    const strB = String(b || '');
    return strA.localeCompare(strB, 'pt-BR');
  });

  try {
    localStorage.setItem(CHAVES_STORAGE[tipo], JSON.stringify(listaOrdenada));
    
    // Atualiza apenas a variável global em memória correspondente, otimizando I/O
    if (tipo === 'tecnicos') TECNICOS = listaOrdenada;
    if (tipo === 'tipos_os') TIPOS_OS = listaOrdenada;
    if (tipo === 'equipamentos') EQUIPAMENTOS = listaOrdenada;
    if (tipo === 'erros') ERROS = listaOrdenada;
    
  } catch (e) {
    console.error("Falha ao salvar dados no localStorage", e);
    toast("Erro ao salvar configurações no navegador.");
  }
}

function carregarHistorico() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch (e) {
    console.error("Histórico corrompido.", e);
    return [];
  }
}

function salvarNoHistorico(dados) {
  try {
    const historico = carregarHistorico();
    
    historico.push({
      id:        Date.now(),
      dataRef:   dados.dataRef,
      geradoEm:  new Date().toISOString(),
      tecnicos:  JSON.parse(JSON.stringify(dados.tecnicos || []))
    });

    // Estratégia de rotação (Cap) para impedir o travamento QuotaExceededError
    if (historico.length > MAX_HISTORY_ITEMS) {
      historico.shift(); 
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(historico));
  } catch (e) {
    console.error("Erro ao persistir histórico", e);
    toast("Aviso: Limite de histórico atingido. Limpe o histórico antigo nas Métricas.");
  }
}

function limparHistorico() {
  localStorage.removeItem(HISTORY_KEY);
}

// Inicialização segura
carregarDadosIniciais();

// ==========================================================================
// EXPORTAÇÃO DA BASE DE DADOS (BACKUP / MIGRAÇÃO)
// ==========================================================================

function exportarBaseDeDados() {
  // 1. Pega as listas globais atuais em memória
  const listaTecnicos = TECNICOS || [];
  const listaDiagnosticos = TIPOS_OS || []; // No seu código anterior chamava TIPOS_OS
  const listaEquipamentos = EQUIPAMENTOS || [];
  const listaErros = ERROS || [];

  // 2. Encontra qual é a maior lista. 
  // Isso é vital porque as colunas terão tamanhos diferentes.
  const maxLength = Math.max(
    listaTecnicos.length, 
    listaDiagnosticos.length, 
    listaEquipamentos.length, 
    listaErros.length
  );

  // 3. Inicia o conteúdo do arquivo
  // O "\uFEFF" é o BOM (Byte Order Mark) do UTF-8. 
  // Ele força o Excel a ler os acentos corretos (ex: "Manutenção", "João").
  let csvContent = "\uFEFF"; 
  
  // Cabeçalho (Linha 1) - Usamos ponto e vírgula (;) pois é o padrão do Excel no Brasil
  csvContent += "TECNICOS;DIAGNOSTICOS;EQUIPAMENTOS;ERROS\n";

  // 4. Preenche as linhas seguintes, mapeando os índices
  for (let i = 0; i < maxLength; i++) {
    // Se o índice não existir na lista, retorna string vazia para não dar "undefined"
    // Removemos aspas duplas internas para não quebrar o CSV
    const t  = (listaTecnicos[i]     || "").replace(/"/g, '""');
    const d  = (listaDiagnosticos[i] || "").replace(/"/g, '""');
    const eq = (listaEquipamentos[i] || "").replace(/"/g, '""');
    const er = (listaErros[i]        || "").replace(/"/g, '""');

    // Envolve cada item em aspas duplas previne quebra de colunas se houver "ponto e vírgula" no texto original
    csvContent += `"${t}";"${d}";"${eq}";"${er}"\n`;
  }

  // 5. Converte o texto em um arquivo real (Blob) e força o download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  // Pega a data atual para dar nome ao arquivo
  const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const nomeArquivo = `Backup_BaseDeDados_OS_${dataHoje}.csv`;

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", nomeArquivo);
  
  // Anexa invisivelmente, clica e limpa a memória
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  if (typeof toast === 'function') {
    toast("✓ Base de dados exportada com sucesso!", 3000);
  }
}