 HEAD
const { app, BrowserWindow, screen } = require('electron');

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = Math.max(380, Math.min(width - 80, 1200));
  const winHeight = Math.max(600, Math.min(height - 80, 820));

  const win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    minWidth: 360,
    minHeight: 520,
    title: 'Oblgram',
    backgroundColor: '#17212b',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL('https://oblgram.onrender.com/');
}

app.whenReady().then(() => setTimeout(createWindow, 500));
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
=======
const { app, BrowserWindow, screen } = require('electron');

require('./server.js');

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const winWidth = Math.max(380, Math.min(width - 80, 1200));
  const winHeight = Math.max(600, Math.min(height - 80, 820));

  const win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    minWidth: 360,
    minHeight: 520,
    title: 'Oblgram',
    backgroundColor: '#17212b',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL('http://127.0.0.1:31234/');
}

app.whenReady().then(() => setTimeout(createWindow, 500));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
	  239fa84985170630bafd2094ef2b27beb114bb8d
});