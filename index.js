const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

const N8N_WEBHOOK_URL = "https://eemanameeruddin.n8n-wsk.com/webhook-test/53a0bab2-3b1a-4d01-b5e7-b48bccdd9f5b";

// ✅ Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true },
  webVersionCache: {
    type: 'remote',
    remotePath:
      'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51.html',
  },
});

// 🔑 QR Code
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('📲 Scan the QR code above with your WhatsApp app');
});

// ✅ Ready event
client.on('ready', () => {
  console.log('✅ WhatsApp Bot is ready!');
});

// 🔥 Single event for both incoming + outgoing
client.on('message_create', async (msg) => {
  const direction = msg.fromMe ? 'outgoing' : 'incoming';

  console.log(`[${direction}] ${msg.from}: ${msg.body}`);

  try {
    await axios.post(N8N_WEBHOOK_URL, {
      direction,
      from: msg.from,
      body: msg.body,
    });
  } catch (err) {
    console.error(`❌ Error sending ${direction} to n8n:`, err.message);
  }
});

// ---------------- Outgoing messages from API ----------------
const app = express();
app.use(bodyParser.json());

app.post('/send', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).send({ error: 'Missing "to" or "message"' });
  }

  try {
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
    await client.sendMessage(chatId, message);

    console.log(`📤 Sent via API to ${chatId}: ${message}`);
    res.send({ success: true, to: chatId, message });
  } catch (err) {
    console.error('❌ Error sending message:', err.message);
    res.status(500).send({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('📡 API server running at http://localhost:3000/send');
});

// 🚀 Initialize WhatsApp client
client.initialize();
