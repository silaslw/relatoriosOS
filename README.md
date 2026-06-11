# Gerador de Relatórios de OS — TEXNET

Abra `index.html` diretamente no navegador (Chrome ou Edge). Não precisa de servidor nem internet.

---

## Estrutura de arquivos

```
relatorios_os/
│
├── index.html          → Página principal (HTML puro, sem lógica)
├── style.css           → Toda a estilização visual (cores, layout, componentes)
│
├── dados.js            → Listas fixas: técnicos, tipos de OS, equipamentos, erros
├── estado.js           → Contador de IDs únicos (nextId)
├── helpers.js          → Funções utilitárias: sel(), val(), raw(), selectOpts(), toast()
│
├── tecnicos.js         → Criação, remoção e minimização de blocos de técnico
│                         Funções: addTecnico, removeTecnico, toggleTecnico,
│                                  finalizarTecnico, onTecnicoChange, updateTecLabel,
│                                  getTecnicosUsados, refreshTecnicosOptions
│
├── ordens.js           → Criação e remoção de blocos de OS dentro de cada técnico
│                         Funções: addOS, removeOS, onNumOS
│
├── verificacao.js      → Lógica do checkbox "Marcar para verificação"
│                         Funções: toggleVerif
│
├── equipamentos.js     → Adição/remoção de equipamentos dentro de uma OS
│                         Funções: addEquip, removeEquip
│
├── erros.js            → Adição/remoção de erros/pendências dentro de uma OS
│                         Funções: addErro, removeErro, onErroChange
│
├── ui.js               → Atualização da barra de status (contador de técnicos/OS)
│                         Funções: updateActionInfo
│
├── leitura.js          → Leitura de todos os campos do formulário e montagem
│                         do objeto de dados para geração dos documentos
│                         Funções: lerDados
│
├── docx.js             → Geração dos arquivos .docx e download
│                         Funções: gerarDocumentos, gerarDocEquipamentos,
│                                  gerarDocVerificacao, paraCenter, paraLeft,
│                                  paraIndented, emptyLine, runBold, runNormal,
│                                  runItalic, download
│
└── docx.bundle.js      → Biblioteca docx v9.6.1 (bundle offline, não editar)
```

---

## Customizações comuns

### Adicionar/remover técnicos
Edite o array `TECNICOS` em **`dados.js`**.

### Adicionar tipos de OS
Edite o array `TIPOS_OS` em **`dados.js`**.

### Adicionar equipamentos ao catálogo
Edite o array `EQUIPAMENTOS` em **`dados.js`**.

### Adicionar tipos de erro
Edite o array `ERROS` em **`dados.js`**.

### Mudar cores ou layout
Edite as variáveis CSS no topo de **`style.css`** (seção `:root`).

### Mudar fonte, tamanho ou formatação dos .docx
Edite as funções `runBold`, `runNormal`, `runItalic` em **`docx.js`**.
Tamanhos em half-points: 28 = 14pt, 32 = 16pt.
