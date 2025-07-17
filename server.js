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

    app.use('/movie', express.static(path.join(__dirname, './dist')));

// Rotas de API com prefixo /movie
app.use('/movie/auth', authRoutes(db));
app.use('/movie/api', apiRoutes(db));

app.get('/movie', (req, res) => {
    res.sendFile(path.join(__dirname, './dist/index.html'));
});

app.get('/movie/*', (req, res) => {
    res.sendFile(path.join(__dirname, './dist/index.html'));
});


    app.listen(port, () => {
        console.log(`Servidor backend final rodando em http://localhost:${port}`);
    });
}

startServer();
