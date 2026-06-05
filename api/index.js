const express = require('express');
const QRCode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const app = express();

app.get('/', async (req, res) => {
    // Basic stylized HTML frontend wrapper
    res.setHeader('Content-Type', 'text/html');
    res.write(`
        <html>
        <head>
            <title>AMV Bot QR Portal</title>
            <style>
                body { font-family: sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding-top: 50px; }
                .container { max-width: 400px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; }
                img { margin-top: 20px; border: 10px solid white; border-radius: 8px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🔮 amv whatsapp bot</h2>
                <p>Scan the code below using your WhatsApp Linked Devices menu:</p>
                <div id="qr-space">Generating fresh QR code stream...</div>
            </div>
        </body>
        </html>
    `);

    // Initialize temporary in-memory authentication state 
    const { state } = await useMultiFileAuthState('/tmp/session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;

        // If Baileys pushes a fresh string, convert it to a DataURL image and inject it
        if (qr) {
            try {
                const qrImage = await QRCode.toDataURL(qr);
                res.write(`<script>document.getElementById('qr-space').innerHTML = '<img src="${qrImage}" width="250"/>';</script>`);
            } catch (err) {
                console.error(err);
            }
        }

        // Once successfully linked, close the runtime socket loop to avoid memory leaks
        if (connection === 'open') {
            res.write(`<script>document.getElementById('qr-space').innerHTML = '<h3 style="color: #10b981;">✅ Linked Successfully! Check your WhatsApp inbox for your Session ID.</h3>';</script>`);
            res.end();
            sock.logout();
        }
    });
});

module.exports = app;
