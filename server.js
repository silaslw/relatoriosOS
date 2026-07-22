// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Connect to / Create SQLite Database file
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// 2. Initialize Database Tables
db.serialize(() => {
  // Configs table (tecnicos, tipos_os, equipamentos, erros)
  db.run(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `);

  // History table
  db.run(`
    CREATE TABLE IF NOT EXISTS historico (
      id INTEGER PRIMARY KEY,
      dataRef TEXT NOT NULL,
      geradoEm TEXT NOT NULL,
      tecnicos JSON NOT NULL
    )
  `);
});

// ==================== ENDPOINTS: CONFIGURATIONS ====================

// Get all initial lists (tecnicos, tipos_os, equipamentos, erros)
app.get('/api/configuracoes', (req, res) => {
  db.all('SELECT chave, valor FROM configuracoes', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const result = {
      tecnicos: [],
      tipos_os: [],
      equipamentos: [],
      erros: []
    };

    rows.forEach(row => {
      try {
        result[row.chave] = JSON.parse(row.valor);
      } catch (e) {
        result[row.chave] = [];
      }
    });

    res.json(result);
  });
});

// Save or update a specific list (e.g. POST /api/configuracoes/tecnicos)
app.post('/api/configuracoes/:tipo', (req, res) => {
  const { tipo } = req.params;
  const lista = req.body;

  if (!Array.isArray(lista)) {
    return res.status(400).json({ error: 'Payload must be an array' });
  }

  const query = `
    INSERT INTO configuracoes (chave, valor) 
    VALUES (?, ?) 
    ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
  `;

  db.run(query, [tipo, JSON.stringify(lista)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, count: lista.length });
  });
});

// ==================== ENDPOINTS: HISTORICO ====================

// Fetch all history records
app.get('/api/historico', (req, res) => {
  db.all('SELECT * FROM historico ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const historico = rows.map(row => ({
      id: row.id,
      dataRef: row.dataRef,
      geradoEm: row.geradoEm,
      tecnicos: JSON.parse(row.tecnicos)
    }));

    res.json(historico);
  });
});

// Insert a new history record
app.post('/api/historico', (req, res) => {
  const { dataRef, tecnicos } = req.body;
  const id = Date.now();
  const geradoEm = new Date().toISOString();

  const query = `INSERT INTO historico (id, dataRef, geradoEm, tecnicos) VALUES (?, ?, ?, ?)`;
  const params = [id, dataRef, geradoEm, JSON.stringify(tecnicos || [])];

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id, dataRef, geradoEm, tecnicos });
  });
});

// Clear all history
app.delete('/api/historico', (req, res) => {
  db.run('DELETE FROM historico', [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});