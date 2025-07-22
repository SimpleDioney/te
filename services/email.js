const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true para 465, false para outros ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

const sendPasswordResetEmail = async (to, token) => {
    // A URL deve apontar para o seu frontend
    const resetUrl = `https://vps60023.publiccloud.com.br/filmes/reset-password?token=${token}`; 

    const mailOptions = {
        from: `"DioneyFlix" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Redefinição de Senha - DioneyFlix',
        html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Poppins', Arial, sans-serif;
                    background-color: #141414; /* var(--background) */
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                .wrapper {
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #1f1f1f; /* var(--card) */
                    color: #ffffff; /* var(--foreground) */
                    border-radius: 6px; /* var(--radius) */
                    overflow: hidden;
                }
                .header {
                    text-align: center;
                    padding: 40px 20px 20px 20px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 32px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    color: #E50914; /* var(--primary) */
                }
                .content {
                    padding: 20px 40px;
                    text-align: left;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #a0a0a0; /* var(--muted-foreground) */
                }
                .content p {
                    margin: 1em 0;
                }
                .content strong {
                    color: #ffffff;
                }
                .button-container {
                    text-align: center;
                    padding: 20px 0 30px 0;
                }
                .button {
                    display: inline-block;
                    padding: 14px 32px;
                    background-color: #E50914; /* var(--primary) */
                    color: #ffffff !important;
                    text-decoration: none;
                    font-size: 16px;
                    font-weight: bold;
                    border-radius: 4px; /* var(--radius) */
                    transition: background-color 0.2s ease-out;
                }
                .button:hover {
                    background-color: #f61f29;
                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    font-size: 12px;
                    color: #888888;
                    border-top: 1px solid #303030; /* var(--border) */
                }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="header">
                        <h1>DIONEYFLIX</h1>
                    </div>
                    <div class="content">
                        <p>Olá,</p>
                        <p>Recebemos uma solicitação para redefinir a senha da sua conta. Para continuar, clique no botão abaixo e siga as instruções.</p>
                        <div class="button-container">
                            <a href="${resetUrl}" target="_blank" class="button">Redefinir Senha</a>
                        </div>
                        <p>Se você não fez esta solicitação, pode ignorar este e-mail com segurança. Sua senha não será alterada.</p>
                        <p>Atenciosamente,<br><strong>Equipe DioneyFlix</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} DioneyFlix. Todos os direitos reservados.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail de redefinição de senha enviado para:', to);
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        throw new Error('Não foi possível enviar o e-mail de redefinição de senha.');
    }
};

module.exports = { sendPasswordResetEmail };