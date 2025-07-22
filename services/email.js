const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

const sendPasswordResetEmail = async (to, token) => {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`; // Altere para a URL do seu frontend

    const mailOptions = {
        from: `"Megaflix" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Redefinição de Senha - Megaflix',
        html: `
            <p>Você solicitou a redefinição de sua senha.</p>
            <p>Clique neste <a href="${resetUrl}">link</a> para redefinir sua senha.</p>
            <p>Se você não solicitou isso, ignore este e-mail.</p>
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