# Gerador de Relatórios de OS

## Estrutura de arquivos

```
relatorios_os/
│
├── index.html          → Página principal — 3 abas: Gerador, Base de Dados, Métricas
├── style.css           → Estilos visuais (temas claro/escuro, componentes, analytics)
├── theme.js            → Alternância de tema (roda no <head> para evitar flash)
│
├── dados.js            → Camada de dados: listas de configuração + histórico persistente
│                         Funções: carregarDadosIniciais, salvarDados,
│                                  salvarNoHistorico, carregarHistorico, limparHistorico
│
├── core.js             → Utilitários centrais (consolidado de 4 arquivos)
│                         Funções: sel, raw, selectOpts, toast, downloadBlob,
│                                  nextId, updateActionInfo, lerDados
│                         [Consolidou: helpers.js + estado.js + ui.js + leitura.js]
│
├── blocos.js           → Criação/remoção de todos os blocos de UI (consolidado de 5 arquivos)
│                         Funções: addTecnico, removeTecnico, toggleTecnico, finalizarTecnico,
│                                  updateTecLabel, refreshTecnicosOptions,
│                                  addOS, removeOS, onNumOS,
│                                  toggleVerif,
│                                  addEquip, removeEquip, onEquipChange,
│                                  addErro, removeErro, onErroChange
│                         [Consolidou: tecnicos.js + ordens.js + verificacao.js
│                                     + equipamentos.js + erros.js]
│
├── config.js           → Aba "Base de Dados": roteamento de abas, CRUD das listas,
│                         importação em massa via XLSX/CSV
│
├── analytics.js        → Aba "Métricas": computação de métricas, gráficos de barras,
│                         tabela histórica e exportação de dados brutos
│                         Funções: renderAnalytics, computarMetricas, exportarCSV,
│                                  exportarXML, exportarXLSX, confirmarLimparHistorico
│
├── docx.js             → Geração dos arquivos .docx e gravação no histórico
│                         Funções: gerarDocumentos, gerarDocEquipamentos,
│                                  gerarDocVerificacao
│
└── docx.bundle.js      → Biblioteca docx v9.6.1 (bundle offline — não editar)
```

---

## Fluxo de dados

```
Formulário (blocos.js)
    │
    ▼ lerDados() [core.js]
    │
    ├──▶ gerarDocumentos() [docx.js]  →  .docx baixado
    │         │
    │         └──▶ salvarNoHistorico() [dados.js]  →  localStorage
    │
    └──▶ renderAnalytics() [analytics.js]  ←  carregarHistorico() [dados.js]
              │
              └──▶ exportarXLSX / exportarCSV / exportarXML
```
