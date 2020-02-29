const { app, BrowserWindow } = require('electron');

app.whenReady()
    .then(() => {
        let window = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration: true
            }
        });

        window.loadFile('./frontend/index.html')
            .then(() => {
                window.maximize();
                window.show();
            });
    });