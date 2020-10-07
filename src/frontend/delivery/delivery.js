const cardsTable = document.getElementById('cardsTable');
let storage = {};

$(() => {
    const jwtToken = getJwt().accessToken;
    const url = `http://localhost:8080/rest/websocket?access_token=${jwtToken}`;
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
    cardsTable.innerHTML = Object.values(storage)
        .filter(item => DISPLAY_DELIVERY_STATUS.includes(item.status))
        .reduce((acc, item) => {
            return acc += `
                <div class="col mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Доставка #${item.id}</h5>
                            <div class="card-text">Покупатель: <b>${item.toUser.name} ${item.toUser.surname}</b></div>
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

const DISPLAY_DELIVERY_STATUS = ['CREATED', 'COURIER_FOUND', 'PACKAGING', 'DELIVERING'];

const DELIVERY_STATUS_TRANSLATION = {
    CREATED: 'Поиск курьера',
    COURIER_FOUND: 'Курьер найден',
    PACKAGING: 'Упаковывается',
    DELIVERING: 'Доставляется',
    DELIVERED: 'Доставлен',
    CANCELED: 'Отменён'
};