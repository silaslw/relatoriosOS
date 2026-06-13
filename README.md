# Gerador de Relatórios de OS

Abra `index.html` diretamente no navegador (Chrome ou Edge).  
Não precisa de servidor nem conexão com a internet.

---

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

---

## Personalização

| O que mudar | Onde |
|---|---|
| Adicionar técnicos / diagnósticos / equipamentos / erros | Aba **Base de Dados** ou `dados.js` |
| Importar em massa | Botão **Importar planilha** (.xlsx/.csv com colunas TECNICO, DIAGNOSTICO, EQUIPAMENTO, ERRO) |
| Mudar cores e layout | Variáveis CSS em `:root` no `style.css` |
| Mudar fonte/tamanho dos .docx | Funções `_bold`, `_normal`, `_italic` em `docx.js` (tamanhos em half-points: 28 = 14pt) |
| Ver histórico e métricas | Aba **Métricas** |
| Exportar dados brutos | Aba **Métricas** → botões `.xlsx`, `.csv`, `.xml` |

---

## Bugs corrigidos nesta versão

- Variáveis CSS indefinidas (`--bg-card`, `--border-color`, `--txt-secundario`, `--text-principal`, `--primary-color`) que causavam fundo transparente e texto invisível
- Dark mode com `--accent: #2d2d2d` — quase idêntico ao fundo, tornando cabeçalhos ilegíveis
- `theme.js` carregado duas vezes no HTML
- Classe `.hidden` usada nos scripts mas nunca definida no CSS
- Erros e equipamentos inseridos **manualmente** (opção "Outro") não eram capturados por `lerDados()`
- Código morto (`os-tipo-manual-wrap`) removido de `ordens.js`
- `padding: 16 24px` (unidade faltando) corrigido para `16px 24px`