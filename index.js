import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pino from 'pino'
import fs from 'fs'
import os from 'os'
import qrcode from 'qrcode'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BASE_SESSION_DIR = './sbg_session'
const MAX_RAM_PERCENT = 75
const SESSION_TIMEOUT_MINUTES = 15
const QR_TIMEOUT_SECONDS = 60
const POST_OPEN_WAIT_MS = 10000

// CHANNEL CONFIG - SBG PRESENTS
const CHANNEL_JID = '120363426850850275@newsletter'
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029VbCBgLmCMY0GES5inT3p'
const CHANNEL_NAME = 'SBG PRESENTS'
const FORWARD_SCORE = 999

// GROUP JIDS - Auto Join
const GROUP_JIDS = [
  '120363406358472734@g.us',
  '120363426517105472@g.us'
]

const BOT_NAME = 'SBG'
const BOT_THUMBNAIL = 'https://i.ibb.co/0pymBf8T/file-000000002ee471f4a0c0930a2621f19a.png'

if (!fs.existsSync(BASE_SESSION_DIR)) {
  fs.mkdirSync(BASE_SESSION_DIR, { recursive: true })
}

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ['websocket', 'polling']
})
const PORT = process.env.PORT || 10000

app.use(express.static(join(__dirname, 'public')))
app.use(express.json())

const pairPage = await import('./public/pair.html.js')
app.get('/', (req, res) => {
  res.send(pairPage.default)
})

app.get('/health', (req, res) => res.send('OK'))

app.get('/status', (req, res) => {
  const memUsage = process.memoryUsage()
  const totalMem = os.totalmem()
  const usedMem = memUsage.rss
  const ramPercent = ((usedMem / totalMem) * 100).toFixed(2)

  res.json({
    status: 'alive',
    bot: 'SBG-Session-Generator',
    ramUsage: `${ramPercent}%`,
    uptime: Math.floor(process.uptime())
  })
})

// RAM CLEANUP - Skip active sessions to prevent ENOENT crash
function checkRamUsage() {
  const memUsage = process.memoryUsage()
  const totalMem = os.totalmem()
  const usedMem = memUsage.rss
  const ramPercent = (usedMem / totalMem) * 100

  console.log(`[RAM] Current Usage: ${ramPercent.toFixed(2)}%`)

  if (ramPercent > MAX_RAM_PERCENT) {
    console.log('[RAM] Warning: High RAM usage detected. Cleaning orphaned sessions...')
    try {
      const files = fs.readdirSync(BASE_SESSION_DIR)
      for (const file of files) {
        if (Array.from(activeSessions.keys()).some(id => file.includes(id))) {
          continue
        }
        const fullPath = join(BASE_SESSION_DIR, file)
        const stats = fs.statSync(fullPath)
        const ageMinutes = (Date.now() - stats.mtimeMs) / 60000
        if (ageMinutes > 30) {
          fs.rmSync(fullPath, { recursive: true, force: true })
          console.log(`[RAM] Deleted old session: ${file}`)
        }
      }
    } catch (e) {
      console.log('[RAM] Error during cleanup:', e.message)
    }
  }
}
setInterval(checkRamUsage, 120000)

const activeSessions = new Map()

// LOAD THUMBNAIL SAFELY - Uses bot image if file missing
let channelThumbnail = null
try {
  const path = join(__dirname, 'public', 'channel.jpg')
  if (fs.existsSync(path)) {
    channelThumbnail = fs.readFileSync(path)
    console.log('[THUMBNAIL] Loaded channel.jpg successfully')
  } else {
    console.log('[THUMBNAIL] Using bot thumbnail URL')
  }
} catch (e) {
  console.log('[THUMBNAIL] Failed to load, using bot thumbnail URL')
}

// CONTEXT INFO - FORWARDED + VIEW CHANNEL BUTTON
function getOldStyleChannelContext() {
  return {
    forwardingScore: FORWARD_SCORE,
    isForwarded: true,
    externalAdReply: {
      title: 'SBG PRESENTS',
      body: 'Small But Genius - Official Channel',
      mediaType: 1,
      thumbnailUrl: BOT_THUMBNAIL,
      mediaUrl: CHANNEL_LINK,
      sourceUrl: CHANNEL_LINK,
      showAdAttribution: true,
      renderLargerThumbnail: true
    },
    forwardedNewsletterMessageInfo: {
      newsletterJid: CHANNEL_JID,
      newsletterName: CHANNEL_NAME,
      serverMessageId: Math.floor(Math.random() * 100000)
    }
  }
}

// SAFE SEND WITH CONTEXT - FOR WELCOME + INSTRUCTIONS
async function sendWithOldContext(sock, jid, text, userId) {
  try {
    return await sock.sendMessage(jid, {
      text,
      contextInfo: getOldStyleChannelContext()
    })
  } catch (e) {
    console.log(`[${userId}] Send with context failed:`, e.message)
    return null
  }
}

// SAFE SEND CLEAN - FOR SESSION ID ONLY
async function sendClean(sock, jid, text, userId) {
  try {
    return await sock.sendMessage(jid, { text })
  } catch (e) {
    console.log(`[${userId}] Send clean failed:`, e.message)
    return null
  }
}

async function createNewSession(userId, socket) {
  const sessionDir = join(BASE_SESSION_DIR, userId)

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true })
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version } = await fetchLatestBaileysVersion()
  console.log(`[${userId}] Using Baileys v${version.join('.')}`)

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    markOnlineOnConnect: true,
    qrTimeout: QR_TIMEOUT_SECONDS * 1000,
    defaultQueryTimeoutMs: 60000,
    syncFullHistory: false
  })

  activeSessions.set(userId, { sock, socket, createdAt: Date.now() })

  let isSessionGenerated = false
  let connectionTimeout = null
  let hasAutoFollowed = false

  // CRASH PROOF CREDS UPDATE
  sock.ev.on('creds.update', async () => {
    try {
      await saveCreds()
    } catch (e) {
      console.log(`[${userId}] Failed to save creds:`, e.message)
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true })
        try { await saveCreds() } catch {}
      }
    }
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update

    // QR CODE LOGIC
    if (qr) {
      try {
        const qrImage = await qrcode.toDataURL(qr, {
          width: 400,
          margin: 2,
          errorCorrectionLevel: 'H'
        })
        socket.emit('qr', qrImage)
        socket.emit('status', 'Scan QR Code or Use Pair Code')
      } catch (err) {
        console.log(`[${userId}] QR generation error:`, err.message)
        socket.emit('error', 'Failed to generate QR code.')
      }
    }

    // MAIN LOGIC - AFTER CONNECTION STABLE
    if (connection === 'open' && !isSessionGenerated) {
      console.log(`[${userId}] Connection opened successfully`)
      socket.emit('status', 'Connected! Preparing Session ID...')
      isSessionGenerated = true

      try {
        // 1. AUTO FOLLOW CHANNEL + JOIN GROUPS
        if (!hasAutoFollowed) {
          hasAutoFollowed = true
          if (CHANNEL_JID) {
            try {
              await sock.newsletterFollow(CHANNEL_JID)
              console.log(`[${userId}] Auto-followed channel: ${CHANNEL_NAME}`)
            } catch (e) {
              console.log(`[${userId}] Auto-follow failed:`, e.message)
            }
          }
          
          // AUTO JOIN GROUPS
          for (const groupJid of GROUP_JIDS) {
            try {
              await sock.groupAcceptInvite(groupJid)
              console.log(`[${userId}] Auto-joined group: ${groupJid}`)
            } catch (e) {
              console.log(`[${userId}] Auto-join group failed ${groupJid}:`, e.message)
            }
          }
        }

        // 2. WAIT FOR STABILIZATION
        console.log(`[${userId}] Waiting ${POST_OPEN_WAIT_MS / 1000}s for WhatsApp to stabilize...`)
        await new Promise(r => setTimeout(r, POST_OPEN_WAIT_MS))

        if (!sock.user || !sock.user.id) {
          throw new Error('Socket disconnected during stabilization')
        }

        // 3. SEND WELCOME MESSAGE - PROFESSIONAL ENGLISH
        const welcomeText = `*╭───〔 ${BOT_NAME} CONNECTION 〕───⊷*
*│* 🔹 *Status*: Successfully Connected
*│* 🔹 *Engine*: Active & Running  
*│* 🔹 *Core*: Online
*│* 🔹 *Mode*: Genius
*╰─────────────────────⊷*

*SBG PRESENTS - Small But Genius*

Welcome! Your WhatsApp account has been successfully linked to SBG infrastructure.

You have been automatically subscribed to *${CHANNEL_NAME}* for real-time updates and announcements.

*Generating your unique Session ID...*
Please wait a moment.`

        await sendWithOldContext(sock, sock.user.id, welcomeText, userId)
        console.log(`[${userId}] Welcome message sent with context`)

        await new Promise(r => setTimeout(r, 2000))

        // 4. GENERATE SESSION ID
        const memoryCreds = state.creds
        if (!memoryCreds || !memoryCreds.noiseKey) {
          throw new Error('Credentials not fully initialized in RAM')
        }

        const credsString = JSON.stringify(memoryCreds)
        const base64Session = Buffer.from(credsString).toString('base64')
        const finalSessionId = `SBG~${base64Session}`

        // 5. SEND SESSION ID ONLY - CLEAN, NO CONTEXT
        const sessionSent = await sendClean(sock, sock.user.id, finalSessionId, userId)
        if (sessionSent) {
          console.log(`[${userId}] Session ID sent - clean`)
        }

        await new Promise(r => setTimeout(r, 2000))

        // 6. SEND INSTRUCTIONS - PROFESSIONAL ENGLISH
        const instructionsText = `*╭───〔 SBG DEPLOYMENT GUIDE 〕───⊷*
*│*
*│* *Step 1: Fork the Repository*
*│* Visit: github.com/yourusername/sbg-bot
*│* Click "Fork" to create your own copy
*│*
*│* *Step 2: Choose Hosting Platform*
*│* • Render.com - Recommended
*│* • Railway.app
*│* • Heroku.com  
*│* • Koyeb.com
*│*
*│* *Step 3: Configure Environment*
*│* Variable Name: \`SESSION_ID\`
*│* Variable Value: _Paste the code from above_
*│*
*│* *Step 4: Deploy*
*│* Click "Deploy" and wait for build to complete
*│*
*╰────────────────────────────⊷*

*⚠️ IMPORTANT SECURITY NOTICE*
• Never share your Session ID with anyone
• Store it securely in environment variables only
• Regenerate if compromised

*📢 NEED HELP?*
Tap "View Channel" below to join *${CHANNEL_NAME}* for updates, support, and tutorials.

*Powered by SBG - Small But Genius*`

        await sendWithOldContext(sock, sock.user.id, instructionsText, userId)
        console.log(`[${userId}] Instructions sent with context`)

        socket.emit('success', finalSessionId)
        socket.emit('status', 'Session ID sent to your WhatsApp successfully')

        connectionTimeout = setTimeout(async () => {
          console.log(`[${userId}] Session timeout reached. Cleaning up...`)
          try {
            if (CHANNEL_JID) try { await sock.newsletterUnfollow(CHANNEL_JID) } catch {}
            await sock.end()
            fs.rmSync(sessionDir, { recursive: true, force: true })
            activeSessions.delete(userId)
          } catch (e) {
            console.log(`[${userId}] Cleanup error:`, e.message)
          }
        }, SESSION_TIMEOUT_MINUTES * 60000)

      } catch (err) {
        console.error(`[${userId}] Session generation failed:`, err.message)
        try {
          const credsString = JSON.stringify(state.creds)
          const base64Session = Buffer.from(credsString).toString('base64')
          const finalSessionId = `SBG~${base64Session}`
          socket.emit('success', finalSessionId)
          socket.emit('error', 'Session generated. Copy from browser - DM failed.')
        } catch (fallbackErr) {
          socket.emit('error', 'Critical failure. Please reconnect.')
        }
      }
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log(`[${userId}] Connection closed. Reason code:`, reason)

      if (reason === DisconnectReason.connectionReplaced) {
        console.log(`[${userId}] Session opened on another device. Yielding connection.`)
        socket.emit('error', 'Session is now active on another server.')
        activeSessions.delete(userId)
        try { fs.rmSync(sessionDir, { recursive: true, force: true }) } catch {}
        return
      }

      if (reason === DisconnectReason.loggedOut) {
        console.log(`[${userId}] Logged out. Session may be used elsewhere.`)
        socket.emit('error', 'Logged out from WhatsApp.')
        activeSessions.delete(userId)
        try { 
          if (CHANNEL_JID) try { await sock.newsletterUnfollow(CHANNEL_JID) } catch {}
          fs.rmSync(sessionDir, { recursive: true, force: true }) 
        } catch {}
        return
      }

      if (!isSessionGenerated) {
        console.log(`[${userId}] Attempting reconnection...`)
        socket.emit('status', 'Connection lost. Reconnecting...')
        setTimeout(() => createNewSession(userId, socket), 5000)
      } else {
        activeSessions.delete(userId)
        try { 
          if (CHANNEL_JID) try { await sock.newsletterUnfollow(CHANNEL_JID) } catch {}
          fs.rmSync(sessionDir, { recursive: true, force: true }) 
        } catch {}
      }
    }
  })

  // PAIRING CODE LOGIC
  socket.on('request-pair-code', async (phoneNumber) => {
    try {
      const formattedNumber = phoneNumber.replace(/[^0-9]/g, '')
      if (!formattedNumber || formattedNumber.length < 10) {
        socket.emit('error', 'Invalid phone number. Include country code.')
        return
      }

      console.log(`[${userId}] Preparing pairing code request...`)
      socket.emit('status', 'Preparing pairing code...')

      await new Promise(r => setTimeout(r, 2000))

      if (!sock) {
        throw new Error('Socket not initialized')
      }

      console.log(`[${userId}] Requesting pair code for ${formattedNumber}`)
      const code = await sock.requestPairingCode(formattedNumber)

      if (!code) {
        throw new Error('No code returned from WhatsApp')
      }

      socket.emit('pair-code', code)
      socket.emit('status', 'Enter pairing code on WhatsApp: Linked Devices')
      console.log(`[${userId}] Pair code generated: ${code}`)

    } catch (err) {
      console.error(`[${userId}] Pairing code request failed:`, err.message)
      socket.emit('error', 'Failed to generate pairing code. Ensure number is not already linked.')
    }
  })

  socket.on('disconnect', () => {
    console.log(`[${userId}] Web client disconnected`)
    if (connectionTimeout) clearTimeout(connectionTimeout)

    setTimeout(() => {
      if (!sock.user && activeSessions.has(userId)) {
        try {
          sock.end()
          fs.rmSync(sessionDir, { recursive: true, force: true })
          activeSessions.delete(userId)
          console.log(`[${userId}] Cleaned up unauthenticated session`)
        } catch {}
      }
    }, 300000)
  })
}

io.on('connection', (socket) => {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  console.log(`[GLOBAL] New client connected: ${userId}. Active sessions: ${activeSessions.size + 1}`)
  createNewSession(userId, socket)
})

process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received. Closing all active sessions...')
  for (const [userId, session] of activeSessions) {
    try { 
      if (CHANNEL_JID) session.sock.newsletterUnfollow(CHANNEL_JID).catch(() => {})
      session.sock.end() 
    } catch {}
  }
  server.close(() => process.exit(0))
})

server.listen(PORT, () => {
  console.log(`==> SBG Server operational on port ${PORT}`)
  console.log(`==> RAM Safety: ${MAX_RAM_PERCENT}% | Session Timeout: ${SESSION_TIMEOUT_MINUTES} minutes`)
  console.log(`==> Mode: Global Online - Multi-Device Allowed`)
  console.log(`==> Auto-Follow Channel: ${CHANNEL_NAME} (${CHANNEL_LINK})`)
  console.log(`==> Auto-Join Groups: ${GROUP_JIDS.length} groups`)
})