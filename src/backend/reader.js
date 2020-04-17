const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const { getWindow, setReader } = require('../app');
const { dialog } = require('electron');

class Reader {
    constructor(port) {
        this._onCard = () => {};
        this._lastCard = null;
        this._lastCardTimeout = null;
        this._console = [];
        this._onConsole = () => {};
    }

    loadPort(port) {
        if (this._serialPort) {
            this._serialPort.close(error => {
                let message = error ? `Error while closing port: ${error.message}` : 'Old port closed';
                console.log(message);
                this._makeConsole(message)
            });
        }
        this._makeConsole(`Connecting to port ${port}`);
        this._serialPort = new SerialPort(port);
        this._loadParser();
    }

    _loadParser() {
        let parser = new Readline();
        parser.on('data', data => this._loadData(data));
        this._serialPort.pipe(parser);
    }

    _loadData(data) {
        this._makeConsole(data);

        if (data .startsWith('WARNING')) {
            console.log(data);
            dialog.showErrorBox('NFC READER WARNING', data.substr(9));
            return;
        }

        if (!data.startsWith('Card detected, UID:')) {
            console.log(data);
            return;
        }

        let card = data.substr(20).trim();
        if (this._lastCard === card) {
            return;
        }

        this._setLastCard(card);
        this._onCard(card);
    }

    _setLastCard(card) {
        this._lastCard = card;
        if (this._lastCardTimeout !== null) {
            clearTimeout(this._lastCardTimeout);
        }
        this._lastCardTimeout = setTimeout(() => this._lastCard = null, 3000);
    }

    _makeConsole(message) {
        this._console.push(message);
        this._onConsole(message);
    }

    reload() {
        this._lastCard = null;
    }

    setOnCard(onCard) {
        this._onCard = onCard;
    }

    getConsole() {
        return this._console;
    }

    setOnConsole(callback) {
        this._onConsole = callback;
    }
}

module.exports = { Reader };