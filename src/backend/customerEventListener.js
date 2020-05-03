class CustomerEventListener {
    constructor() {
        this.eventsMap = new Map();
    }

    on(event, callback) {
        this.eventsMap.set(event, callback);
    }

    send(event, data) {
        let callback = this.eventsMap.get(event);
        if (typeof callback === 'function') {
            callback(data);
        }
    }
}

module.exports = { CustomerEventListener };