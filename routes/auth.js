const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const { sendPasswordResetEmail } = require('../services/email');

module.exports = (db) => {
    router.post('/register', async (req, res) => {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Usuário, e-mail e senha são obrigatórios.' });
        }

        try {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            
            const result = await db.run(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, password_hash]
            );

            res.status(201).json({ message: 'Usuário criado com sucesso.', userId: result.lastID });
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ message: 'Nome de usuário ou e-mail já existe.' });
            }
            res.status(500).json({ message: 'Erro ao registrar usuário.', error: error.message });
        }
    });

    router.post('/login', async (req, res) => {
        const { login, password } = req.body; // 'login' pode ser username ou email
        if (!login || !password) {
            return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
        }

        try {
            const user = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [login, login]);
            if (!user) {
                return res.status(401).json({ message: 'Credenciais inválidas.' });
            }

            if (user.is_banned) {
                return res.status(403).json({ message: 'Este usuário está banido.' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Credenciais inválidas.' });
            }

            const payload = { id: user.id, username: user.username, email: user.email };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.json({ message: 'Login bem-sucedido!', token, user: payload });

        } catch (error) {
            res.status(500).json({ message: 'Erro no servidor durante o login.', error: error.message });
        }
    });

    router.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'O e-mail é obrigatório.' });
        }

        try {
            const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
            if (!user) {
                // Resposta genérica para não revelar se um e-mail está cadastrado
                return res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.' });
            }

            const token = crypto.randomBytes(20).toString('hex');
            const expires = new Date(Date.now() + 3600000); // 1 hora

            await db.run(
                'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
                [token, expires, user.id]
            );

            await sendPasswordResetEmail(user.email, token);

            res.status(200).json({ message: 'E-mail de redefinição de senha enviado.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao processar a solicitação.', error: error.message });
        }
    });
    
    router.post('/reset-password', async (req, res) => {
    // A única mudança é aqui: de 'password' para 'newPassword'
    const { token, newPassword } = req.body; 
    
    // A verificação agora usa 'newPassword'
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    }

    try {
        const user = await db.get(
            'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > ?',
            [token, new Date()]
        );

        if (!user) {
            return res.status(400).json({ message: 'Token de redefinição de senha inválido ou expirado.' });
        }

        const salt = await bcrypt.genSalt(10);
        // A nova senha ('newPassword') é usada para criar o hash
        const password_hash = await bcrypt.hash(newPassword, salt);

        await db.run(
            'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
            [password_hash, user.id]
        );

        res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao redefinir a senha.', error: error.message });
    }
});

return router;
};