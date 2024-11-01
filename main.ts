import { App, Plugin, Modal, Notice } from "obsidian";

// Интерфейс для подписок
interface Subscription {
  name: string;
  endDate: string; // Дата окончания подписки
}

// Основной класс плагина
export default class SubscriptionTrackerPlugin extends Plugin {
  subscriptions: Subscription[] = []; // Список подписок

  async onload() {
    console.log("Плагин отслеживания подписок загружен");

    // Загрузка сохранённых подписок
    await this.loadSubscriptions();

    // Добавление команды для открытия панели подписок
    this.addCommand({
      id: "open-subscription-tracker",
      name: "Открыть менеджер подписок",
      callback: () => this.openSubscriptionManager(),
    });

    // Настройка проверки подписок раз в день
    this.checkSubscriptions();

    // Запуск проверки при каждом запуске плагина
    this.registerInterval(window.setInterval(() => this.checkSubscriptions(), 24 * 60 * 60 * 1000)); // Раз в сутки
  }

  onunload() {
    console.log("Плагин отслеживания подписок выгружен");
  }

  // Открытие менеджера подписок
  openSubscriptionManager() {
    new SubscriptionManagerModal(this.app, this.subscriptions, this).open();
  }

  // Проверка подписок и уведомление об истекающих
  checkSubscriptions() {
    const today = new Date();
    this.subscriptions.forEach(subscription => {
      const endDate = new Date(subscription.endDate);
      const timeLeft = endDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

      if (daysLeft <= 7 && daysLeft >= 0) {
        new Notice(`Подписка "${subscription.name}" истекает через ${daysLeft} дней.`);
      }
    });
  }

  // Сохранение подписок
  saveSubscriptions() {
    this.saveData(this.subscriptions);
  }

  // Загрузка подписок из хранилища
  async loadSubscriptions() {
    const loadedData = await this.loadData();
    if (loadedData) {
      this.subscriptions = loadedData;
    }
  }
}

// Модальное окно для управления подписками
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
      const div = contentEl.createDiv("subscription-item");
      div.createEl("span", { text: `${subscription.name} - истекает: ${subscription.endDate}` });

      // Кнопка удаления подписки
      const deleteButton = div.createEl("button", { text: "Удалить" });
      deleteButton.onclick = () => {
        this.subscriptions.splice(index, 1);
        this.plugin.saveSubscriptions();
        this.onOpen(); // Перезагрузка модального окна
      };
    });

    // Форма для добавления новой подписки
    const nameInput = contentEl.createEl("input", { type: "text", placeholder: "Название подписки" });
    const dateInput = contentEl.createEl("input", { type: "date" });

    const addButton = contentEl.createEl("button", { text: "Добавить подписку" });
    addButton.onclick = () => {
      if (nameInput.value && dateInput.value) {
        this.subscriptions.push({ name: nameInput.value, endDate: dateInput.value });
        this.plugin.saveSubscriptions();
        this.onOpen(); // Перезагрузка модального окна
      }
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
