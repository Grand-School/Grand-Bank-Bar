class CustomerEventListener {
    constructor() {
        this.eventsMap = new Map();
    }

    on(event, callback) {
        this.eventsMap.set(event, callback);
    }

    send(event, data) {
        this.eventsMap.get(event)(data);
    }
}

module.exports = { CustomerEventListener };