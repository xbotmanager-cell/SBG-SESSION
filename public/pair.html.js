const pairHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SBG Session Generator - Small But Genius</title>
  <meta name="description" content="Generate your SBG WhatsApp Bot Session ID instantly. Connect with QR Code or Pairing Code. Fast, secure, and free session generator by SBG PRESENTS.">
  <meta name="keywords" content="WhatsApp Bot, Session Generator, SBG, Small But Genius, Baileys, Pair Code, QR Code, Bot Hosting">
  <meta name="author" content="SBG PRESENTS">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://api.sbg.site.je/">
  <meta property="og:title" content="SBG Session Generator">
  <meta property="og:description" content="Generate your SBG WhatsApp Bot Session ID instantly with QR Code or Pairing Code. Secure and fast.">
  <meta property="og:image" content="https://i.ibb.co/0pymBf8T/file-000000002ee471f4a0c0930a2621f19a.png">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://api.sbg.site.je/">
  <meta property="twitter:title" content="SBG Session Generator">
  <meta property="twitter:description" content="Generate your SBG WhatsApp Bot Session ID instantly with QR Code or Pairing Code.">
  <meta property="twitter:image" content="https://i.ibb.co/0pymBf8T/file-000000002ee471f4a0c0930a2621f19a.png">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="https://i.ibb.co/0pymBf8T/file-000000002ee471f4a0c0930a2621f19a.png">
  
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Outfit', sans-serif;
    }
    
    body {
      background: #0a0a0a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #fef3c7;
      position: relative;
      overflow-x: hidden;
    }

    /* GRID BACKGROUND */
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(251, 191, 36, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(251, 191, 36, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      z-index: 0;
      pointer-events: none;
    }

    /* GLOW ORBS */
    body::after {
      content: '';
      position: fixed;
      top: -50%;
      right: -20%;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(251, 191, 36, 0.12) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(60px);
      z-index: 0;
      pointer-events: none;
      animation: float 20s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-100px, 100px) scale(1.1); }
    }

    .container {
      width: 100%;
      max-width: 500px;
      display: grid;
      gap: 24px;
      position: relative;
      z-index: 1;
    }

    .glass-card {
      background: rgba(15, 15, 15, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(251, 191, 36, 0.25);
      border-radius: 24px;
      padding: 36px;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.7),
        inset 0 1px 0 rgba(251, 191, 36, 0.1);
      position: relative;
      overflow: hidden;
    }

    .glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.6), transparent);
    }

    .header {
      text-align: center;
      margin-bottom: 28px;
    }

    .bot-image {
      width: 110px;
      height: 110px;
      border-radius: 20px;
      margin: 0 auto 20px;
      border: 2px solid rgba(251, 191, 36, 0.5);
      object-fit: cover;
      box-shadow: 
        0 8px 32px rgba(251, 191, 36, 0.4),
        0 0 60px rgba(245, 158, 11, 0.3);
      animation: glow 3s ease-in-out infinite;
    }

    @keyframes glow {
      0%, 100% { box-shadow: 0 8px 32px rgba(251, 191, 36, 0.4), 0 0 60px rgba(245, 158, 11, 0.3); }
      50% { box-shadow: 0 8px 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(245, 158, 11, 0.5); }
    }

    .title {
      font-size: 32px;
      font-weight: 700;
      font-family: 'Space Grotesk', sans-serif;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 3s linear infinite;
      margin-bottom: 6px;
      letter-spacing: 2px;
    }

    @keyframes shimmer {
      to { background-position: 200% center; }
    }

    .subtitle {
      font-size: 13px;
      color: #fcd34d;
      font-weight: 500;
      letter-spacing: 1px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      color: #fbbf24;
      margin-top: 16px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #fbbf24;
      border-radius: 50%;
      box-shadow: 0 0 10px #fbbf24;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.2); }
    }

    .qr-section {
      background: rgba(251, 191, 36, 0.05);
      border: 1px solid rgba(251, 191, 36, 0.2);
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
    }

    .qr-container {
      background: white;
      border-radius: 16px;
      padding: 16px;
      display: inline-block;
      margin-bottom: 12px;
      box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);
    }

    #qr-image {
      width: 256px;
      height: 256px;
      border-radius: 12px;
      display: block;
    }

    .qr-placeholder {
      width: 256px;
      height: 256px;
      background: #f1f5f9;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 14px;
    }

    .timer {
      font-size: 13px;
      color: #fcd34d;
      margin-top: 8px;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 28px 0;
      color: #78716c;
      font-size: 13px;
      font-weight: 600;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.3), transparent);
    }

    .input-group {
      margin-bottom: 18px;
    }

    .input-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #fcd34d;
      margin-bottom: 10px;
    }

    .input-field {
      width: 100%;
      padding: 16px 18px;
      background: rgba(251, 191, 36, 0.05);
      border: 1px solid rgba(251, 191, 36, 0.25);
      border-radius: 14px;
      color: #fef3c7;
      font-size: 15px;
      transition: all 0.3s;
    }

    .input-field:focus {
      outline: none;
      border-color: #fbbf24;
      background: rgba(251, 191, 36, 0.08);
      box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.15);
    }

    .input-field::placeholder {
      color: #78716c;
    }

    .btn {
      width: 100%;
      padding: 16px 24px;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      border: none;
      border-radius: 14px;
      color: #1c1917;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);
      position: relative;
      overflow: hidden;
    }

    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s;
    }

    .btn:hover::before {
      left: 100%;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 30px rgba(251, 191, 36, 0.6);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .pair-code-display {
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      margin-top: 18px;
      display: none;
    }

    .pair-code-display.show {
      display: block;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .pair-code-label {
      font-size: 12px;
      color: #fcd34d;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .pair-code {
      font-size: 36px;
      font-weight: 700;
      color: #fbbf24;
      letter-spacing: 6px;
      font-family: 'Space Grotesk', monospace;
      text-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
      margin-bottom: 16px;
    }

    .copy-btn {
      padding: 10px 24px;
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.4);
      border-radius: 10px;
      color: #fbbf24;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .copy-btn:hover {
      background: rgba(251, 191, 36, 0.25);
      transform: scale(1.05);
    }

    .copy-btn.copied {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(34, 197, 94, 0.5);
      color: #4ade80;
    }

    .info-box {
      background: rgba(251, 191, 36, 0.05);
      border: 1px solid rgba(251, 191, 36, 0.2);
      border-radius: 16px;
      padding: 20px;
      margin-top: 24px;
    }

    .info-title {
      font-size: 14px;
      font-weight: 700;
      color: #fbbf24;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-text {
      font-size: 13px;
      color: #fcd34d;
      line-height: 1.8;
    }

    .info-text > span {
      display: block;
      margin-bottom: 6px;
    }

    @media (max-width: 480px) {
      .glass-card {
        padding: 28px 24px;
      }
      .title {
        font-size: 28px;
      }
      #qr-image, .qr-placeholder {
        width: 220px;
        height: 220px;
      }
      .pair-code {
        font-size: 28px;
        letter-spacing: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="glass-card">
      <div class="header">
        <img src="https://i.ibb.co/0pymBf8T/file-000000002ee471f4a0c0930a2621f19a.png" alt="SBG" class="bot-image">
        <h1 class="title">SBG</h1>
        <p class="subtitle">SMALL BUT GENIUS</p>
        <div class="status-badge">
          <span class="status-dot"></span>
          <span id="status-text">Connecting...</span>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-container">
          <div id="qr-placeholder" class="qr-placeholder">Generating QR Code...</div>
          <img id="qr-image" style="display: none;" alt="QR Code">
        </div>
        <p class="timer" id="timer-text">Scan with WhatsApp > Linked Devices</p>
      </div>

      <div class="divider">OR</div>

      <div class="input-group">
        <label class="input-label">Phone Number with Country Code</label>
        <input 
          type="text" 
          id="phone-input" 
          class="input-field" 
          placeholder="e.g. 254712345678"
          autocomplete="off"
        >
      </div>

      <button id="pair-btn" class="btn">Get Pairing Code</button>

      <div id="pair-code-display" class="pair-code-display">
        <p class="pair-code-label">Your Pairing Code</p>
        <p class="pair-code" id="pair-code-text"></p>
        <button id="copy-btn" class="copy-btn">Copy Code</button>
      </div>

      <div class="info-box">
        <div class="info-title">
          <span>◆</span>
          <span>Quick Setup Guide</span>
        </div>
        <div class="info-text">
          <span>1. Scan QR code or enter phone number above</span>
          <span>2. Open WhatsApp > Linked Devices > Link a Device</span>
          <span>3. Complete pairing on your phone</span>
          <span>4. Session ID will be sent to your WhatsApp automatically</span>
          <span>5. Session starts with SBG~ - Keep it secure</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    const socket = io();
    const qrImage = document.getElementById('qr-image');
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const statusText = document.getElementById('status-text');
    const timerText = document.getElementById('timer-text');
    const phoneInput = document.getElementById('phone-input');
    const pairBtn = document.getElementById('pair-btn');
    const pairCodeDisplay = document.getElementById('pair-code-display');
    const pairCodeText = document.getElementById('pair-code-text');
    const copyBtn = document.getElementById('copy-btn');

    let qrTimer = null;
    let qrExpireTime = 50;

    function startQrTimer() {
      clearInterval(qrTimer);
      qrExpireTime = 50;
      qrTimer = setInterval(() => {
        qrExpireTime--;
        timerText.textContent = \`QR expires in \${qrExpireTime}s - Auto refresh\`;
        if (qrExpireTime <= 0) {
          clearInterval(qrTimer);
          timerText.textContent = 'Refreshing QR Code...';
        }
      }, 1000);
    }

    socket.on('connect', () => {
      statusText.textContent = 'Connected';
    });

    socket.on('status', (status) => {
      statusText.textContent = status;
    });

    socket.on('qr', (qrData) => {
      qrImage.src = qrData;
      qrImage.style.display = 'block';
      qrPlaceholder.style.display = 'none';
      startQrTimer();
    });

    socket.on('pair-code', (code) => {
      pairCodeText.textContent = code;
      pairCodeDisplay.classList.add('show');
      pairBtn.disabled = false;
      pairBtn.textContent = 'Get Pairing Code';
    });

    socket.on('error', (error) => {
      alert(error);
      pairBtn.disabled = false;
      pairBtn.textContent = 'Get Pairing Code';
    });

    socket.on('success', (sessionId) => {
      statusText.textContent = 'Session Generated Successfully';
      pairBtn.disabled = true;
      pairBtn.textContent = 'Success - Check WhatsApp';
      alert('Session ID sent to your WhatsApp. Check your saved messages.');
    });

    pairBtn.addEventListener('click', () => {
      const phone = phoneInput.value.trim();
      if (!phone) {
        alert('Please enter your phone number');
        return;
      }
      if (phone.length < 10) {
        alert('Please enter a valid phone number with country code');
        return;
      }
      pairBtn.disabled = true;
      pairBtn.textContent = 'Generating...';
      pairCodeDisplay.classList.remove('show');
      socket.emit('request-pair-code', phone);
    });

    phoneInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        pairBtn.click();
      }
    });

    copyBtn.addEventListener('click', () => {
      const code = pairCodeText.textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = 'Copy Code';
          copyBtn.classList.remove('copied');
        }, 2000);
      });
    });
  </script>
</body>
</html>`;

export default pairHtml;