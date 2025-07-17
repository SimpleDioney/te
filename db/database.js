// backend/db/database.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const dbFilePath = path.join(__dirname, '../data/megaflix.sqlite');
const dataDir = path.dirname(dbFilePath);

async function initializeDatabase() {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`Diretório '${dataDir}' criado com sucesso.`);
        }

        const db = await open({
            filename: dbFilePath,
            driver: sqlite3.Database
        });

        console.log('Conectado ao banco de dados SQLite.');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS watchlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                tmdb_id INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                poster_path TEXT,
                title TEXT,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE (user_id, tmdb_id)
            );

            -- ✅ CORREÇÃO APLICADA AQUI --
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                tmdb_id INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                poster_path TEXT,
                title TEXT,
                progress INTEGER,
                season_number INTEGER,
                episode_number INTEGER,
                last_watched DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                -- Alterado para permitir um registro por episódio
                UNIQUE (user_id, tmdb_id, season_number, episode_number)
            );
        `);

        console.log('Tabelas do banco de dados verificadas/criadas com sucesso.');
        return db;
    } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
        process.exit(1);
    }
}

module.exports = initializeDatabase;