// chat.js - Рабочая система чатов

console.log('💬 Chat.js загружается...');

// Глобальные переменные
window.chats = [];
window.currentChat = null;
window.chatMessages = [];

// Основная функция инициализации
window.initChatSystem = function() {
    console.log('🔄 Инициализация чата...');
    
    // Проверяем пользователя
    if (!window.currentUser) {
        console.log('👤 Пользователь не авторизован');
        
        // Проверяем демо-режим
        const savedUser = localStorage.getItem('family_tree_user');
        if (savedUser) {
            try {
                window.currentUser = JSON.parse(savedUser);
                console.log('✅ Пользователь загружен из localStorage');
            } catch (e) {
                console.error('❌ Ошибка загрузки пользователя:', e);
                return;
            }
        } else {
            console.log('❌ Нет пользователя для чата');
            return;
        }
    }
    
    // Создаем виджет чата
    createChatWidget();
    
    // Загружаем демо-данные
    loadDemoChats();
    
    console.log('✅ Чат инициализирован');
};

// Создание виджета чата
function createChatWidget() {
    console.log('📱 Создание виджета чата...');
    
    // Создаем кнопку чата
    const toggleBtn = document.getElementById('chat-toggle-btn');
    if (!toggleBtn) {
        const toggleHTML = `
            <div id="chat-toggle-btn" class="chat-toggle-btn">
                <i class="fas fa-comments"></i>
                <span class="unread-badge" id="unread-badge" style="display: none;">0</span>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toggleHTML);
    }
    
    // Создаем виджет чата
    const chatWidget = document.getElementById('chat-widget');
    if (!chatWidget) {
        const chatHTML = `
            <div id="chat-widget" class="chat-widget">
                <div class="chat-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-comments"></i>
                        <h3>Семейный чат</h3>
                    </div>
                    <div class="chat-actions">
                        <button id="new-chat-btn" class="chat-header-btn" title="Новый чат">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button id="close-chat-btn" class="chat-header-btn" title="Закрыть чат">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="chat-content">
                    <!-- Список чатов -->
                    <div id="chat-list-container" class="chat-list-container">
                        <div class="chat-search">
                            <input type="text" id="chat-search-input" placeholder="Поиск чатов...">
                        </div>
                        <div id="chats-list" class="chats-list">
                            <!-- Чаты будут здесь -->
                        </div>
                    </div>
                    
                    <!-- Окно чата -->
                    <div id="chat-room-container" class="chat-room-container" style="display: none;">
                        <div class="chat-room-header">
                            <button id="back-to-chats" class="back-btn">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <div class="chat-room-info">
                                <h4 class="chat-room-title">Название чата</h4>
                                <span class="chat-room-members">3 участника</span>
                            </div>
                        </div>
                        
                        <div id="chat-messages" class="chat-messages">
                            <!-- Сообщения будут здесь -->
                        </div>
                        
                        <div class="chat-input-container">
                            <div class="chat-input-wrapper">
                                <input type="text" id="chat-message-input" placeholder="Введите сообщение...">
                                <button id="send-message-btn" class="btn">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }
    
    // Настраиваем обработчики
    setupChatListeners();
}

// Настройка обработчиков
function setupChatListeners() {
    console.log('🎮 Настройка обработчиков чата...');
    
    // Кнопка открытия/закрытия чата
    document.getElementById('chat-toggle-btn')?.addEventListener('click', toggleChat);
    document.getElementById('close-chat-btn')?.addEventListener('click', () => {
        document.getElementById('chat-widget').classList.remove('active');
    });
    
    // Навигация
    document.getElementById('back-to-chats')?.addEventListener('click', showChatList);
    
    // Создание чата
    document.getElementById('new-chat-btn')?.addEventListener('click', createDemoChat);
    
    // Отправка сообщений
    document.getElementById('send-message-btn')?.addEventListener('click', sendDemoMessage);
    document.getElementById('chat-message-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendDemoMessage();
        }
    });
    
    // Поиск
    document.getElementById('chat-search-input')?.addEventListener('input', filterChats);
}

// Загрузка демо-чатов
function loadDemoChats() {
    console.log('📥 Загрузка демо-чатов...');
    
    window.chats = [
        {
            id: 'chat1',
            name: 'Семейный чат Ивановых',
            members: 5,
            lastMessage: 'Кто идет на семейный ужин?',
            time: '10:30',
            unread: 2,
            isGroup: true
        },
        {
            id: 'chat2',
            name: 'Мама',
            members: 2,
            lastMessage: 'Не забудь купить хлеб',
            time: 'Вчера',
            unread: 0,
            isGroup: false
        },
        {
            id: 'chat3',
            name: 'Брат',
            members: 2,
            lastMessage: 'Привет, как дела?',
            time: '2 дня назад',
            unread: 0,
            isGroup: false
        },
        {
            id: 'chat4',
            name: 'Родственники',
            members: 8,
            lastMessage: 'Фото с праздника',
            time: 'Неделю назад',
            unread: 5,
            isGroup: true
        }
    ];
    
    updateChatsList();
    updateUnreadBadge();
}

// Обновление списка чатов
function updateChatsList() {
    const chatsList = document.getElementById('chats-list');
    if (!chatsList) return;
    
    let html = '';
    window.chats.forEach(chat => {
        html += `
            <div class="chat-item" data-chat-id="${chat.id}">
                <div class="chat-item-avatar">
                    ${chat.isGroup ? '<i class="fas fa-users"></i>' : '<i class="fas fa-user"></i>'}
                </div>
                <div class="chat-item-info">
                    <div class="chat-item-header">
                        <span class="chat-item-name">${chat.name}</span>
                        <span class="chat-item-time">${chat.time}</span>
                    </div>
                    <div class="chat-item-preview">
                        ${chat.lastMessage}
                        ${chat.unread > 0 ? `<span style="
                            background: #f56565;
                            color: white;
                            font-size: 0.7rem;
                            padding: 2px 6px;
                            border-radius: 10px;
                            margin-left: 5px;
                        ">${chat.unread}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    chatsList.innerHTML = html || `
        <div class="empty-chats">
            <i class="fas fa-comments" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 15px;"></i>
            <p style="color: #718096;">Чатов пока нет</p>
            <button id="create-first-chat" class="btn btn-small" style="margin-top: 15px;">
                Создать чат
            </button>
        </div>
    `;
    
    // Обработчики для чатов
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            const chatId = item.dataset.chatId;
            openChat(chatId);
        });
    });
    
    document.getElementById('create-first-chat')?.addEventListener('click', createDemoChat);
}

// Открытие чата
function openChat(chatId) {
    console.log('💬 Открытие чата:', chatId);
    
    window.currentChat = window.chats.find(c => c.id === chatId);
    if (!window.currentChat) return;
    
    // Переключаем вид
    document.getElementById('chat-list-container').style.display = 'none';
    document.getElementById('chat-room-container').style.display = 'flex';
    
    // Обновляем заголовок
    document.querySelector('.chat-room-title').textContent = window.currentChat.name;
    document.querySelector('.chat-room-members').textContent = 
        `${window.currentChat.members} участник${window.currentChat.members === 1 ? '' : 'а'}`;
    
    // Загружаем сообщения
    loadDemoMessages(chatId);
    
    // Очищаем счетчик непрочитанных
    window.currentChat.unread = 0;
    updateUnreadBadge();
}

// Загрузка демо-сообщений
function loadDemoMessages(chatId) {
    const messages = {
        chat1: [
            { id: 1, sender: 'Папа', text: 'Всем привет!', time: '10:30', own: false },
            { id: 2, sender: 'Я', text: 'Привет всем!', time: '10:31', own: true },
            { id: 3, sender: 'Сестра', text: 'Кто идет на семейный ужин в субботу?', time: '10:32', own: false },
            { id: 4, sender: 'Брат', text: 'Я буду', time: '10:33', own: false },
            { id: 5, sender: 'Я', text: 'Я тоже приду', time: '10:34', own: true }
        ],
        chat2: [
            { id: 1, sender: 'Мама', text: 'Привет, сынок!', time: 'Вчера 18:20', own: false },
            { id: 2, sender: 'Я', text: 'Привет, мам!', time: 'Вчера 18:21', own: true },
            { id: 3, sender: 'Мама', text: 'Не забудь купить хлеб по дороге домой', time: 'Вчера 18:22', own: false },
            { id: 4, sender: 'Я', text: 'Хорошо, куплю', time: 'Вчера 18:23', own: true }
        ],
        chat3: [
            { id: 1, sender: 'Брат', text: 'Привет, как дела?', time: '2 дня назад', own: false },
            { id: 2, sender: 'Я', text: 'Нормально, у тебя как?', time: '2 дня назад', own: true }
        ],
        chat4: [
            { id: 1, sender: 'Дядя', text: 'Всем привет!', time: 'Неделю назад', own: false },
            { id: 2, sender: 'Тетя', text: 'Смотрите фото с праздника', time: 'Неделю назад', own: false },
            { id: 3, sender: 'Я', text: 'Классные фото!', time: 'Неделю назад', own: true },
            { id: 4, sender: 'Кузен', text: 'Да, супер получилось', time: 'Неделю назад', own: false }
        ]
    };
    
    window.chatMessages = messages[chatId] || [];
    updateChatMessages();
}

// Обновление сообщений
function updateChatMessages() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    if (window.chatMessages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comment-slash" style="font-size: 3rem; color: #cbd5e0;"></i>
                <p style="color: #718096; margin-top: 15px;">Нет сообщений</p>
                <p style="color: #a0aec0; font-size: 0.9rem;">Начните общение первым!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    window.chatMessages.forEach(msg => {
        html += `
            <div class="message ${msg.own ? 'own' : ''}">
                ${!msg.own ? `<div class="message-sender">${msg.sender}</div>` : ''}
                <div class="message-content">
                    <div class="message-text">${msg.text}</div>
                    <div class="message-time">${msg.time}</div>
                </div>
            </div>
        `;
    });
    
    messagesContainer.innerHTML = html;
    scrollToBottom();
}

// Прокрутка вниз
function scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Отправка сообщения
function sendDemoMessage() {
    const input = document.getElementById('chat-message-input');
    const text = input?.value.trim();
    
    if (!text || !window.currentChat) return;
    
    // Добавляем сообщение
    const newMessage = {
        id: Date.now(),
        sender: 'Я',
        text: text,
        time: 'Только что',
        own: true
    };
    
    window.chatMessages.push(newMessage);
    updateChatMessages();
    
    // Очищаем поле ввода
    input.value = '';
    input.focus();
    
    // Обновляем последнее сообщение в списке чатов
    window.currentChat.lastMessage = text;
    window.currentChat.time = 'Только что';
    updateChatsList();
    
    // Показываем уведомление
    window.showNotification('Сообщение отправлено', 'success');
}

// Создание демо-чата
function createDemoChat() {
    const chatName = prompt('Введите название нового чата:');
    if (!chatName) return;
    
    const newChat = {
        id: 'chat' + Date.now(),
        name: chatName,
        members: 2,
        lastMessage: 'Чат создан',
        time: 'Только что',
        unread: 0,
        isGroup: false
    };
    
    window.chats.unshift(newChat);
    updateChatsList();
    
    window.showNotification(`Чат "${chatName}" создан`, 'success');
}

// Обновление бейджа
function updateUnreadBadge() {
    const badge = document.getElementById('unread-badge');
    if (!badge) return;
    
    const totalUnread = window.chats.reduce((sum, chat) => sum + (chat.unread || 0), 0);
    
    if (totalUnread > 0) {
        badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Фильтрация чатов
function filterChats() {
    const searchTerm = document.getElementById('chat-search-input')?.value.toLowerCase();
    const items = document.querySelectorAll('.chat-item');
    
    items.forEach(item => {
        const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
        item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
}

// Показать список чатов
function showChatList() {
    document.getElementById('chat-list-container').style.display = 'block';
    document.getElementById('chat-room-container').style.display = 'none';
    document.getElementById('chat-message-input').value = '';
}

// Переключение чата
function toggleChat() {
    document.getElementById('chat-widget').classList.toggle('active');
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Страница загружена');
    
    // Ждем загрузки пользователя
    setTimeout(() => {
        if (typeof window.initChatSystem === 'function') {
            window.initChatSystem();
        } else {
            console.error('❌ Функция initChatSystem не найдена');
        }
    }, 1000);
});

console.log('✅ Chat.js загружен');