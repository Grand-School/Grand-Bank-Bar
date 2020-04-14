class BuyPanel {
    constructor({ chooseUserRow, itemsToBuy, itemsToBuyList, getUserData, userName, userBalance, taxSpan, totalSpan, withdrawSpan, showDiscount, onBuy, getUsersTax, taxTypePlus, customUserParser = () => {}, onCancel = () => {} }) {
        this._chooseUserRow = chooseUserRow;
        this._creditCardInput = this._chooseUserRow.querySelector('.credit-card-input');
        this._nameSurnameInput = this._chooseUserRow.querySelector('.name-surname-input');

        this._itemsToBuy = itemsToBuy;
        this._itemsToBuyList = itemsToBuyList;
        this._getUserData = getUserData;
        this._userName = userName;
        this._userBalance = userBalance;
        this._taxSpan = taxSpan;
        this._totalSpan = totalSpan;
        this._withdrawSpan = withdrawSpan;
        this._showDiscount = showDiscount;
        this._onBuy = onBuy;
        this._getUsersTax = getUsersTax;
        this._taxTypePlus = taxTypePlus;
        this._customUserParser = customUserParser;
        this._onCancel = onCancel;

        this._rowHideAble = false;
        this._selectedUser = null;

        $(chooseUserRow).on('hide.bs.modal', () => this._rowHideAble);
        $(chooseUserRow).modal({ keyboard: false });
        setTimeout(() => this._creditCardInput.focus(), 500);

        this._creditCardInput.addEventListener('input', e => {
            let creditCard = this._creditCardInput.value;
            if (creditCard.length !== 12) {
                return;
            }
            this.loadUser(creditCard);
        });

        $(this._nameSurnameInput).typeahead({
            source: (input, callback) => {
                if (input.match(/^[0-9]+$/)) {
                    callback([]);
                    return;
                }

                $.ajax(serverUrl + 'users/find?user=' + input)
                    .done(response => callback(response));
            },
            displayText: user => {
                return {
                    name: showUserData(user),
                    card: user.creditCard
                }
            },
            matcher: user => user.creditCard !== undefined,
            highlighter: user => {
                let query = this._nameSurnameInput.value;
                let name = user.name.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                    return '<strong>' + match + '</strong>'
                });
                return `
                <li class="pl-2 pr-2">
                    <a role="option">${name}</a>
                    <span class="text-muted">${user.card}</span>
                </li>
            `;
            },
            afterSelect: user => {
                this._nameSurnameInput.value = showUserData(user);
                this.parseUser(user);
            },
            sorter: users => users,
            minLength: 2
        });

        this._itemsToBuy.addEventListener('click', e => {
            e.preventDefault();
            if (e.target.dataset.additembutton !== undefined && e.target.dataset.additembutton === 'false') {
                return;
            }

            let target = e.target.closest('.card');
            if (target === null) {
                return;
            }

            let discount = target.dataset.discount;
            let price = target.dataset.price;
            if (discount !== undefined) {
                let percent = price * discount / 100;
                price -= percent;
                price = price <= 10 ? Math.round(price) : Math.round(price * 100.0) / 100.0;
            }

            this.addItem({
                id: target.dataset.id,
                name: target.dataset.name,
                price, discount
            });
        });

        this._itemsToBuyList.addEventListener('click', e => {
            let target = e.target.closest('li');

            let countElement = target.querySelector('.count');
            let count = +countElement.dataset.count;

            if (count === 1) {
                this._itemsToBuyList.removeChild(target);
            } else {
                countElement.dataset.count = count - 1;
                countElement.textContent = count - 1;
            }

            let itemToBuyButton = this._itemsToBuy.querySelector(`[data-id="${target.dataset.id}"] .item-select-count`);
            itemToBuyButton.dataset.count = count - 1;
            itemToBuyButton.textContent = count - 1;

            this._updatePrice();
        });
    }

    loadUser(creditCard) {
        this._getUserData(creditCard)
            .done(response => this.parseUser(response));
    }

    buy() {
        let data = this._getBuyData();
        this._onBuy(data);
    }

    getUserID() {
        return this._selectedUser.id;
    }

    cancel() {
        $(this._chooseUserRow).modal();
        setTimeout(() => this._creditCardInput.focus(), 500);
        this._selectedUser = null;
        this._onCancel();
    }

    addItem({ id, name, price, discount }) {
        let itemToBuyButton = this._itemsToBuy.querySelector(`[data-id="${id}"] .item-select-count`);
        let count = +itemToBuyButton.dataset.count + 1;
        itemToBuyButton.dataset.count = count;
        itemToBuyButton.textContent = count;

        let menuElement = this._itemsToBuyList.querySelector(`[data-id="${id}"]`);
        if (menuElement !== null) {
            let countElement = menuElement.querySelector('.count');
            countElement.dataset.count = count;
            countElement.textContent = count;
        } else {
            let discountDiv = discount === undefined || discount === 0 ? '' : `<span class="badge badge-success badge-pill">-${discount}%</span>`;

            this._itemsToBuyList.insertAdjacentHTML('beforeend', `
                <li class="list-group-item d-flex justify-content-between align-items-center" data-id="${id}" data-price="${price}">
                    ${name}
                    <div>
                        <span class="badge badge-dark badge-pill bar-count count" data-count="1">1</span>
                        <span class="badge badge-primary badge-pill">${price}</span>
                    </div>
                    ${discountDiv}
                </li>
            `);
        }

        this._updatePrice();
    }

    parseUser(user) {
        this._selectedUser = user;
        this._userName.textContent = user.name + ' ' + user.surname;
        if (this._userBalance !== undefined) {
            this._userBalance.textContent = user.balance + ' грандиков';
        }
        let tax = this._getUsersTax(user.cardType);
        this._taxSpan.textContent = 'Налог: ' + tax + '%';
        this._taxSpan.dataset.tax = tax;
        this._itemsToBuyList.innerHTML = '';
        this._totalSpan.textContent = 'Всего: 0';

        this._rowHideAble = true;
        $(this._chooseUserRow).modal('hide');
        this._rowHideAble = false;

        this._creditCardInput.value = '';
        this._nameSurnameInput.value = '';

        if (this._showDiscount !== undefined) {
            this._showDiscount(user.cardType);
        }

        for (let i = 0; i < this._itemsToBuy.children.length; i++) {
            let element = this._itemsToBuy.children[i];
            let count = element.querySelector('.item-select-count');
            count.dataset.count = 0;
            count.textContent = 0;
        }

        this._customUserParser(user);
    }

    isActive() {
        return this._selectedUser !== null;
    }

    _updatePrice() {
        let buyData = this._getBuyData();
        let totalPrice = buyData.totalPrice;
        let tax = +this._taxSpan.dataset.tax;
        this._totalSpan.textContent = 'Всего: ' + totalPrice;
        let taxSum = totalPrice * tax / 100;
        this._withdrawSpan.textContent = `${this._taxTypePlus ? 'К снятию' : 'Чистая прибыль'}: ${this._taxTypePlus ? totalPrice + taxSum : totalPrice - taxSum}`;
        if (this._userBalance !== undefined) {
            this._userBalance.style.color = this._selectedUser.balance - totalPrice < 0 ? 'red' : 'black';
        }
    }

    _getBuyData() {
        let totalPrice = 0;
        let items = [];
        let elements = [];
        this._itemsToBuyList.childNodes.forEach(el => {
            if (el.nodeName !== 'LI') {
                return;
            }

            for (let i = 0; i < +el.querySelector('.count').dataset.count; i++) {
                totalPrice += +el.dataset.price;
                items.push(+el.dataset.id);
                elements.push(el);
            }
        });
        return { totalPrice, items, elements };
    }
}