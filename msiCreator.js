const { MSICreator } = require('electron-wix-msi');
const path = require('path');

const msiCreator = new MSICreator({
    appDirectory: path.resolve(__dirname, './build/GrandBankBar-win32-ia32'),
    outputDirectory: path.resolve(__dirname, './build/GrandBankBar-installer'),

    description: 'Desktop application for Grand school bar',
    exe: 'GrandBankBar',
    name: 'Grand Bank Bar',
    manufacturer: 'Grand School',
    version: '1.0.0',

    ui: {
        chooseDirectory: true
    },
});

msiCreator.create()
    .then(() => msiCreator.compile());