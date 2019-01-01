const {app, BrowserWindow} = require('electron');
const http = require('http');  
const finalhandler = require('finalhandler');  
const serveStatic = require('serve-static');

const staticBasePath = './build';

var serve = serveStatic(staticBasePath);

var server = http.createServer(function(req, res){  
    var done = finalhandler(req, res);
    serve(req, res, done);
})

server.listen(3000);  

let win = null;

function createWindow() {
  const width = 1024 + 55;
  const height = 600 + 55;
  win = new BrowserWindow({
    width: width,
    height: height,
    useContentSize: true,
    resizable: false});
  win.setMaximumSize(width, height);
  win.setMinimumSize(width, height);
  win.setContentSize(width, height);
  win.loadURL('http://localhost:3000');
  win.on('closed', function() {
    win = null;
  })
}

app.on('ready', () => {
  createWindow();
})

app.on('activate', () => {
  if (win == null) {
    createWindow();
  }
})

app.on('window-all-closed', () => {
  server.close();
  app.quit();
})
