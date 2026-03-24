import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { Client } from 'ssh2'

const SSH_CONFIG = {
  host: '100.87.71.71',
  port: 22,
  username: 'alperenk',
  password: '12345'
}

let mainWindow: BrowserWindow | null = null
let loadingWindow: BrowserWindow | null = null

function createLoadingWindow(): void {
  loadingWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    center: true,
    backgroundColor: '#0f0f0f',
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #0f0f0f;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          user-select: none;
        }
        .logo { font-size: 64px; margin-bottom: 20px; animation: pulse 2s infinite; }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
        h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #fff; }
        .status {
          font-size: 13px;
          color: #666;
          margin-bottom: 28px;
          min-height: 18px;
          transition: all 0.3s;
        }
        .status.connecting { color: #3b82f6; }
        .status.success { color: #10b981; }
        .status.error { color: #ef4444; }
        .bar-container {
          width: 260px;
          height: 3px;
          background: #222;
          border-radius: 2px;
          overflow: hidden;
        }
        .bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          border-radius: 2px;
          width: 0%;
          transition: width 0.5s ease;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% { transform: translateX(-100%); width: 60%; }
          100% { transform: translateX(200%); width: 60%; }
        }
        .bar.done {
          animation: none;
          width: 100%;
          background: #10b981;
        }
        .bar.error-bar {
          animation: none;
          width: 100%;
          background: #ef4444;
        }
      </style>
    </head>
    <body>
      <div class="logo">☁️</div>
      <h1>My Cloud</h1>
      <div class="status connecting" id="status">Sunucuya bağlanılıyor...</div>
      <div class="bar-container">
        <div class="bar" id="bar"></div>
      </div>
      <script>
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('loading-status', (_, data) => {
          const status = document.getElementById('status');
          const bar = document.getElementById('bar');
          status.textContent = data.message;
          status.className = 'status ' + data.type;
          if (data.type === 'success') {
            bar.className = 'bar done';
          } else if (data.type === 'error') {
            bar.className = 'bar error-bar';
          }
        });
      </script>
    </body>
    </html>
  `

  loadingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  loadingWindow.on('closed', () => { loadingWindow = null })
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
      
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    mainWindow.webContents.openDevTools();
    
  }
}

function checkAndStartServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const conn = new Client()

    conn.on('ready', () => {
      loadingWindow?.webContents.send('loading-status', {
        message: 'SSH bağlantısı kuruldu, sunucu kontrol ediliyor...',
        type: 'connecting'
      })

      // pm2 ile cloud-server çalışıyor mu kontrol et, değilse başlat
      conn.exec('pm2 describe cloud-server | grep status', (err, stream) => {
        if (err) { conn.end(); reject(err); return }

        let output = ''
        stream.on('data', (data: Buffer) => { output += data.toString() })
        stream.stderr.on('data', () => {})
        stream.on('close', () => {
          if (output.includes('online')) {
            loadingWindow?.webContents.send('loading-status', {
              message: 'Sunucu zaten çalışıyor ✓',
              type: 'success'
            })
            conn.end()
            setTimeout(resolve, 800)
          } else {
            // Sunucu çalışmıyor, başlat
            loadingWindow?.webContents.send('loading-status', {
              message: 'Sunucu başlatılıyor...',
              type: 'connecting'
            })
            conn.exec('cd ~/cloud-backend && pm2 start index.js --name cloud-server 2>/dev/null || pm2 restart cloud-server', (err2, stream2) => {
              if (err2) { conn.end(); reject(err2); return }
              stream2.on('close', () => {
                loadingWindow?.webContents.send('loading-status', {
                  message: 'Sunucu başlatıldı ✓',
                  type: 'success'
                })
                conn.end()
                setTimeout(resolve, 1000)
              })
            })
          }
        })
      })
    })

    conn.on('error', (err) => {
      reject(err)
    })

    conn.connect(SSH_CONFIG)
  })
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.mycloud')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  // Loading ekranını göster
  createLoadingWindow()

  try {
    loadingWindow?.webContents.on('did-finish-load', async () => {
      try {
        await checkAndStartServer()

        // Ana pencereyi oluştur
        createMainWindow()

        // Kısa bekleme sonra loading'i kapat, ana pencereyi göster
        setTimeout(() => {
          loadingWindow?.close()
          mainWindow?.show()
        }, 500)

      } catch (err: any) {
        loadingWindow?.webContents.send('loading-status', {
          message: `Bağlantı hatası: ${err.message}`,
          type: 'error'
        })
        // 3 saniye sonra yine de aç
        setTimeout(() => {
          createMainWindow()
          loadingWindow?.close()
          mainWindow?.show()
        }, 3000)
      }
    })
  } catch (err) {
    console.error(err)
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})