const packager = require('electron-packager');
const { rebuild } = require('electron-rebuild');

const options = {
    'arch': 'ia32',
    'platform': 'win32',
    'dir': './',
    'app-copyright': 'Nikita Ivchenko',
    'app-version': '2.0',
    'icon': './src/icon.ico',
    'name': 'GrandBankBar',
    'out': './build',
    'overwrite': true,
    'prune': true,
    'version': '1.3.4',
    'version-string': {
        'CompanyName': 'Grand School',
        'FileDescription': 'Desktop application for Grand school bar',
        'OriginalFilename': 'GrandBankBar',
        'ProductName': 'Grand Bank Bar',
        'InternalName': 'GrandBankBar'
    },

    afterCopy: [
        (buildPath, electronVersion, platform, arch, callback) => {
            rebuild({ buildPath, electronVersion, arch })
                .then(() => callback())
                .catch((error) => callback(error));
        }
    ]
};

packager(options, (err, appPaths) => {
    console.log("Error: ", err);
    console.log("appPaths: ", appPaths);
});