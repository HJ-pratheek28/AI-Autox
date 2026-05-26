const fs = require('fs');
const path = require('path');

// Manually parse .env.local parameters to prevent requiring third-party dotenv packages
const envPath = path.join(__dirname, '../.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      envConfig[key] = value.trim();
    }
  });
}

// Extract live SMTP parameters
const host = envConfig.SMTP_HOST || 'smtp.gmail.com';
const port = Number(envConfig.SMTP_PORT) || 587;
const user = envConfig.SMTP_USER || '28hjpratheek@gmail.com';
const pass = envConfig.SMTP_PASSWORD || 'HJp@2007';
const from = envConfig.SMTP_FROM || `"Zapier Central" <${user}>`;

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass
  }
});

const mailOptions = {
  from,
  to: 'druvaha07@gmail.com',
  subject: 'Regards from Zapier Central Automation OS',
  text: 'Hi Druvaha,\n\nRegards from Zapier Central! Your next-generation visual operational AI automation platform is successfully up and running, and this email was dispatched automatically via our live SMTP execution engine.\n\nBest regards,\nH J Pratheek\nZapier Central Operator',
  html: '<p>Hi Druvaha,</p><p>Regards from <strong>Zapier Central</strong>! Your next-generation visual operational AI automation platform is successfully up and running, and this email was dispatched automatically via our live SMTP execution engine.</p><p>Best regards,<br><strong>H J Pratheek</strong><br>Zapier Central Operator</p>'
};

console.log(`[Scratch dispatch] Initializing credentials handshakes with Gmail SMTP (${host}:${port}) for sender: ${user}...`);
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('\n❌ [Scratch dispatch] SMTP Send failed:', error.message);
    if (error.message.includes('Username and Password not accepted') || error.message.includes('Invalid credentials')) {
      console.error('\n💡 Troubleshooting Tip: Google requires you to generate a secure 16-character "App Password" under your Google Account 2-Step Verification settings, rather than using your primary login password directly. Please update SMTP_PASSWORD in .env.local with a Google App Password if needed!');
    }
    process.exit(1);
  } else {
    console.log('\n✅ [Scratch dispatch] Regards email successfully sent to druvaha07@gmail.com!');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  }
});
