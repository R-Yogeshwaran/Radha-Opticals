const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.openDevTools();
};

app.on('ready', () => {
  createWindow();

  // Expose the reloadApp function to the renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.reloadApp = () => {
        location.reload();
      }
    `);
  });

  // Listen for reload-app message from the renderer process
  ipcMain.on('reload-app', () => {
    mainWindow.reload();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('navigate-to-page', (event, pageName) => {
  const pagePath = path.join(__dirname, `${pageName}.html`);
  mainWindow.loadFile(pagePath);
});

ipcMain.on('navigate-to-pages', (event, pageName, data) => {
  const url = `file://${path.join(__dirname, pageName)}.html`;
  mainWindow.loadURL(url);

  // Send the data as an argument to the renderer process
  mainWindow.webContents.send('page-data', data);
});