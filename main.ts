import { App, Plugin, Modal, Notice } from "obsidian";

interface Subscription {
    name: string;
    endDate: string;
}

export default class SubscriptionTrackerPlugin extends Plugin {
    subscriptions: Subscription[] = []; // Список подписок

    async onload() {
        console.log("Плагин отслеживания подписок загружен");

        await this.loadSubscriptions();

        this.addCommand({
            id: "open-subscription-tracker",
            name: "Открыть менеджер подписок",
            callback: () => this.openSubscriptionManager(),
        });

        this.addCommand({
            id: "view-all-subscriptions",
            name: "Просмотреть все подписки",
            callback: () => this.viewAllSubscriptions(),
        });

        this.checkSubscriptions();

        this.registerInterval(window.setInterval(() => this.checkSubscriptions(), 24 * 60 * 60 * 1000)); // Раз в сутки
    }

    onunload() {
        console.log("Плагин отслеживания подписок выгружен");
    }

    openSubscriptionManager() {
        new SubscriptionManagerModal(this.app, this.subscriptions, this).open();
    }

    viewAllSubscriptions() {
        new AllSubscriptionsModal(this.app, this.subscriptions).open();
    }

    formatDate(date: Date): string {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('ru-RU', options);
    }


    checkSubscriptions() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Завтра

        this.subscriptions.forEach(subscription => {
            const endDate = new Date(subscription.endDate);
            const formattedDate = this.formatDate(endDate); 

            if (endDate.toDateString() === today.toDateString()) {
                new Notice(`Подписка "${subscription.name}" истекает сегодня!`);
            }
            else if (endDate.toDateString() === tomorrow.toDateString()) {
                const hoursLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60));
                new Notice(`Подписка "${subscription.name}" истекает завтра. Осталось ${hoursLeft} часов.`);
            }
          
            else {
                const timeLeft = endDate.getTime() - today.getTime();
                const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

                if (daysLeft <= 7 && daysLeft > 1) {
                    new Notice(`Подписка "${subscription.name}" истекает через ${daysLeft} дней.`);
                }
            }

          
            const subscriptionInfo = `Подписка "${subscription.name}" - истекает: ${formattedDate}`;
            console.log(subscriptionInfo);
        });
    }


    saveSubscriptions() {
        this.saveData(this.subscriptions);
    }

    async loadSubscriptions() {
        const loadedData = await this.loadData();
        if (loadedData) {
            this.subscriptions = loadedData;
        }
    }
}


class SubscriptionManagerModal extends Modal {
    plugin: SubscriptionTrackerPlugin;
    subscriptions: Subscription[];

    constructor(app: App, subscriptions: Subscription[], plugin: SubscriptionTrackerPlugin) {
        super(app);
        this.plugin = plugin;
        this.subscriptions = subscriptions;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "Управление подписками" });

        this.subscriptions.forEach((subscription, index) => {
            const endDate = new Date(subscription.endDate);
            const formattedDate = this.plugin.formatDate(endDate); 
            const div = contentEl.createDiv("subscription-item");
            div.createEl("span", { text: `${subscription.name} - истекает: ${formattedDate}` });

       
            const deleteButton = div.createEl("button", { text: "Удалить" });
            deleteButton.onclick = () => {
                this.subscriptions.splice(index, 1);
                this.plugin.saveSubscriptions();
                this.onOpen(); 
            };
        });


        const nameInput = contentEl.createEl("input", { type: "text", placeholder: "Название подписки" });
        const dateInput = contentEl.createEl("input", { type: "date" });

        const addButton = contentEl.createEl("button", { text: "Добавить подписку" });
        addButton.onclick = () => {
            if (nameInput.value && dateInput.value) {
                this.subscriptions.push({ name: nameInput.value, endDate: dateInput.value });
                this.plugin.saveSubscriptions();
                this.onOpen();
            }
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}


class AllSubscriptionsModal extends Modal {
    subscriptions: Subscription[];

    constructor(app: App, subscriptions: Subscription[]) {
        super(app);
        this.subscriptions = subscriptions;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "Все подписки" });

        this.subscriptions.forEach(subscription => {
            const endDate = new Date(subscription.endDate);
            const formattedDate = this.formatDate(endDate); 
            contentEl.createEl("p", { text: `${subscription.name} - истекает: ${formattedDate}` });
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }


    formatDate(date: Date): string {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('ru-RU', options);
    }
}
