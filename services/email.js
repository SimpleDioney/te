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
    const resetUrl = `https://dioneyflix.vercel.app/reset-password?token=${token}`; 

    const mailOptions = {
        from: `"DioneyFlix" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Redefinição de Senha - DioneyFlix',
        html: `
        <!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinir Senha - DioneyFlix</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #141414;
      font-family: 'Poppins', sans-serif;
      color: #fff;
    }
    .wrapper {
      width: 100%;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1f1f1f;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0,0,0,0.4);
    }
    .header {
      background-color: #000;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: #E50914;
      letter-spacing: 2px;
    }
    .content {
      padding: 30px 40px;
      font-size: 16px;
      line-height: 1.7;
      color: #d0d0d0;
    }
    .content p {
      margin-bottom: 20px;
    }
    .content strong {
      color: #fff;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      background-color: #E50914;
      color: #fff !important;
      padding: 14px 30px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      display: inline-block;
      transition: background 0.3s ease;
    }
    .button:hover {
      background-color: #f61f29;
    }
    .footer {
      background-color: #000;
      padding: 20px;
      text-align: center;
      color: #888;
      font-size: 12px;
    }
    .logo {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 24px;
  letter-spacing: 1px;
}

.dioney {
  color: #E50914; /* vermelho Netflix */
}

.flix {
  color: #ffffff; /* branco */
}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="email-container">
      <div class="header">
        <h1 class="logo">
          <span class="dioney">DIONEY</span><span class="flix">FLIX</span>
        </h1>

      </div>
      <div class="content">
        <p>Olá,</p>
        <p>Recebemos uma solicitação para <strong>redefinir a senha</strong> da sua conta. Para continuar, clique no botão abaixo e siga as instruções:</p>
        <div class="button-container">
          <a href="${resetUrl}" class="button" target="_blank">Redefinir Senha</a>
        </div>
        <p>Se você não fez esta solicitação, ignore este e-mail com segurança. Sua senha continuará segura.</p>
        <p>Atenciosamente,<br /><strong>Equipe DioneyFlix</strong></p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} DioneyFlix. Todos os direitos reservados.
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