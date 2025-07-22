const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuth');

module.exports = (db) => {
    // Middleware de autenticação de admin para todas as rotas deste arquivo
    router.use(adminAuthMiddleware);

    // Rota para listar todos os usuários
    router.get('/users', async (req, res) => {
        try {
            const users = await db.all('SELECT id, username, email, created_at, is_banned FROM users');
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar usuários.', error: error.message });
        }
    });

    // Rota para trocar a senha de um usuário
    router.post('/change-password', async (req, res) => {
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) {
            return res.status(400).json({ message: 'ID do usuário e nova senha são obrigatórios.' });
        }

        try {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(newPassword, salt);

            await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, userId]);
            res.json({ message: 'Senha do usuário atualizada com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao trocar a senha do usuário.', error: error.message });
        }
    });

    // Rota para banir/desbanir um usuário
    router.post('/toggle-ban', async (req, res) => {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
        }

        try {
            const user = await db.get('SELECT is_banned FROM users WHERE id = ?', [userId]);
            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            const newBanStatus = !user.is_banned;
            await db.run('UPDATE users SET is_banned = ? WHERE id = ?', [newBanStatus, userId]);

            const action = newBanStatus ? 'banido' : 'desbanido';
            res.json({ message: `Usuário ${action} com sucesso.`, newBanStatus });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao alterar o status de banimento do usuário.', error: error.message });
        }
    });
    
    // (Opcional) Rota para ver usuários logados - Requer uma abordagem mais complexa (e.g., armazenar tokens ativos)
    // A implementação abaixo é uma simplificação e pode não ser adequada para produção.
    router.get('/logged-in-users', (req, res) => {
        // Esta é uma funcionalidade complexa. Uma forma simples (mas não ideal)
        // seria ter uma lista em memória de tokens ativos.
        // Para uma solução robusta, use um banco de dados como Redis para armazenar sessões.
        res.status(512).json({ message: 'Funcionalidade não implementada nesta versão.' });
    });

    return router;
};