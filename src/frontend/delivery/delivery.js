const cardsTable = document.getElementById('cardsTable');
let storage = {};

$(() => {
    const jwtToken = getJwt().accessToken;
    const url = `${serverUrl}websocket?access_token=${jwtToken}`;
    const socket = SockJS(url);
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, frame => {
        console.log(frame);

        stompClient.subscribe('/topic/admin/delivery', data => {
            const delivery = JSON.parse(data.body);
            storage[delivery.id] = delivery;
            renderTable();
        });
    });

    loadData();
});

function renderTable() {
    let orders = Object.values(storage)
        .filter(item => DISPLAY_DELIVERY_STATUS.includes(item.status));

    cardsTable.innerHTML = orders
        .reduce((acc, item) => {
            return acc += `
                <div class="col mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Доставка #${item.id}</h5>
                            <span class="text-muted">${parseDate(item.date)}</span>
                            <div class="card-text">Покупатель: <b>${item.toUser.name} ${item.toUser.surname} (${item.toUser.class} класс)</b></div>
                            <div class="card-text">Товары: <b>${getItemsList(item.items)}</b></div>
                            <div class="card-text">Статус: <b>${DELIVERY_STATUS_TRANSLATION[item.status]}</b></div>
                            ${item.operator 
                                ? `<div class="card-text">Курьер: <b>${item.operator.name} ${item.operator.surname}</b></div>` 
                                : ''}
                        </div>
                    </div>
                </div>
            `;
        }, '');

    if (orders.length === 0) {
        cardsTable.innerHTML = `
            <h3>Заказов нет</h3>
        `;
    }
}

function loadData() {
    $.get(serverUrl + 'bar/delivery/list/ordered')
        .done(response => {
            storage = response.reduce((acc, item) => {
                acc[item.id] = item
                return acc;
            }, {});
            renderTable();
        });
}

function getItemsList(items) {
    let itemsName = {};
    let result = items.reduce((acc, item) => {
        const id = item.barItem.id;
        if (id in acc) {
            acc[id] = acc[id] + 1;
        } else {
            acc[id] = 1;
        }
        itemsName[id] = item.barItem.name;
        return acc;
    }, {});

    let arrayResult = [];
    for (let id in result) {
        if (!result.hasOwnProperty(id)) {
            continue;
        }

        let strResult = itemsName[id];
        if (result[id] > 1) {
            strResult += ` (x${result[id]})`;
        }
        arrayResult.push(strResult);
    }

    return arrayResult.join(', ');
}

function parseDate(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const isToday = now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth() && date.getDay() === now.getDay();
    const day = addZeroPrefix(date.getDay());
    const month = addZeroPrefix(date.getMonth());
    const hours = addZeroPrefix(date.getHours());
    const minutes = addZeroPrefix(date.getMinutes());
    let time = `${hours}:${minutes}`;
    return isToday ? time : `${day}.${month}.${date.getFullYear()} ${time}`;
}

const addZeroPrefix = num => ('0' + num).substr(-2);

const DISPLAY_DELIVERY_STATUS = ['CREATED', 'COURIER_FOUND', 'PACKAGING', 'DELIVERING'];

const DELIVERY_STATUS_TRANSLATION = {
    CREATED: 'Поиск курьера',
    COURIER_FOUND: 'Курьер найден',
    PACKAGING: 'Упаковывается',
    DELIVERING: 'Доставляется',
    DELIVERED: 'Доставлен',
    CANCELED: 'Отменён'
};