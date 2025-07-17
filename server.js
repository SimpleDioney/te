// backend/server.js (VERSÃO FINAL E CORRETA)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initializeDatabase = require('./db/database');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const path = require('path');


const app = express();
const port = 4586;

app.use(express.json());
app.use(cors());

async function startServer() {
    const db = await initializeDatabase();

    app.use(cors());
    app.use(express.json());

    // Servir arquivos estáticos da pasta /dist
    app.use('/movie', express.static(path.join(__dirname, './dist')));

    // Rotas de autenticação e API (assumindo que suas rotas estejam corretas)
    app.use('/auth', authRoutes(db));
    app.use('/api', apiRoutes(db));

    // Ao acessar a raiz, servir o index.html estático
    app.get('/movie', (req, res) => {
        res.sendFile(path.join(__dirname, './dist/index.html'));
    });

    app.listen(port, () => {
        console.log(`Servidor backend final rodando em http://localhost:${port}`);
    });
}

startServer();
