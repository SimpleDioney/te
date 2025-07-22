const jwt = require('jsonwebtoken');

function adminAuthMiddleware(req, res, next) {
    // Primeiro, verifica o token JWT como no middleware de autenticação normal
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Acesso não autorizado: Token não fornecido.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Acesso proibido: Token inválido.' });
        }
        
        // Agora, verifica se o usuário é o administrador
        if (user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Acesso proibido: Requer privilégios de administrador.' });
        }

        req.user = user;
        next();
    });
}

module.exports = adminAuthMiddleware;