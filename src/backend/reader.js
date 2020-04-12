const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const { getWindow, setReader } = require('../app');
const { dialog } = require('electron');

class Reader {
    constructor(port) {
        this._serialPort = new SerialPort(port);
        this._onCard = () => {};
        this._lastCard = null;
        this._lastCardTimeout = null;

        this._loadParser();
    }

    _loadParser() {
        let parser = new Readline();
        parser.on('data', data => this._loadData(data));
        this._serialPort.pipe(parser);
    }

    _loadData(data) {
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

    reload() {
        this._lastCard = null;
    }

    setOnCard(onCard) {
        this._onCard = onCard;
    }
}

module.exports = { Reader };