const { app, BrowserWindow, Menu } = require('electron')
const { name } = require('./config.json')

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('index.html')
}

const isMac = process.platform === 'darwin'
const menuTemplate = [
  ...(isMac ? [{
    label: name,
    submenu: [
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click() {
          app.quit()
        },
      },
    ],
  }] : []),
  {
    label: 'Window',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
    ]
  },
]
const appMenu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(appMenu)

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
