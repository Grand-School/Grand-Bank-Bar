const userName = document.getElementById('userName');
const userBalance = document.getElementById('userBalance');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalHeader = document.getElementById('modalHeader');
const modalBody = document.getElementById('modalBody');
const waitingClientModal = {
    title: false,
    body: `
        <div class="text-center" style="padding-bottom: 40px; padding-top: 40px;">
            <h3>Ожидание клиента</h3>
        </div>
    `
};
let modalShown = false;

$(() => {
    $(modal).on('hidden.bs.modal', () => modalShown = false);
    renderModal(waitingClientModal);

    let eventListener = getCustomerEventListener();

    eventListener.on('client', client => {
        $(modal).modal('hide');
        userBalance.innerHTML = `Баланс: <span class="balance-span">${client.balance}</span>`;
        userName.textContent = showUserData(client);
    });

    eventListener.on('cancelClient', () => {
        renderModal(waitingClientModal);
        userBalance.innerHTML = '';
        userName.textContent = '';
    });
});

function renderModal({ title, body }) {
    if (title === false) {
        modalHeader.hidden = true;
    } else {
        modalTitle.textContent = title;
        modalHeader.hidden = false;
    }
    modalBody.innerHTML = body;

    if (!modalShown) {
        $(modal).modal();
        modalShown = true;
    }
}