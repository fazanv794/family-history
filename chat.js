// chat.js - Простая система чатов
console.log('💬 Chat.js загружается...');

// Глобальные переменные
window.chats = [];
window.currentChat = null;
window.chatMessages = [];

// Основная функция инициализации
window.initChatSystem = async function() {
    console.log('🔄 Инициализация системы чатов...');
    
    try {
        if (!window.currentUser) {
            const savedUser = localStorage.getItem('family_tree_user');
            if (savedUser) {
                window.currentUser = JSON.parse(savedUser);
            } else {
                console.log('❌ Пользователь не авторизован для чата');
                return;
            }
        }
        
        console.log('✅ Пользователь готов:', window.currentUser.email);
        
        createChatWidget();
        await loadUserChats();
        setupChatListeners();
        
        console.log('✅ Система чатов готова');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации чата:', error);
        window.showNotification('Ошибка загрузки чата', 'error');
    }
};

// Создание виджета чата
function createChatWidget() {
    const oldToggle = document.getElementById('chat-toggle-btn');
    if (oldToggle) oldToggle.remove();
    
    const oldWidget = document.getElementById('chat-widget');
    if (oldWidget) oldWidget.remove();
    
    const toggleHTML = `
        <div id="chat-toggle-btn" class="chat-toggle-btn">
            <i class="fas fa-comments"></i>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toggleHTML);
    
    const chatHTML = `
        <div id="chat-widget" class="chat-widget">
            <div class="chat-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-comments"></i>
                    <h3>Семейные чаты</h3>
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
                <div id="chat-list-container" class="chat-list-container">
                    <div class="chat-search">
                        <input type="text" id="chat-search-input" placeholder="Поиск чатов...">
                        <button id="refresh-chats" class="btn-icon" style="position: absolute; right: 25px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #667eea; cursor: pointer;">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div id="chats-list" class="chats-list"></div>
                </div>
                
                <div id="chat-room-container" class="chat-room-container" style="display: none;">
                    <div class="chat-room-header">
                        <button id="back-to-chats" class="back-btn">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="chat-room-info">
                            <h4 class="chat-room-title" id="chat-room-title">Название чата</h4>
                            <span class="chat-room-members" id="chat-room-members">Участники</span>
                        </div>
                    </div>
                    
                    <div id="chat-messages" class="chat-messages"></div>
                    
                    <div class="chat-input-container">
                        <div class="chat-input-wrapper">
                            <input type="text" id="chat-message-input" placeholder="Введите сообщение..." maxlength="1000">
                            <button id="send-message-btn" class="btn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="new-chat-container" class="new-chat-container" style="display: none;">
                    <div class="chat-room-header">
                        <button id="back-from-new-chat" class="back-btn">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="chat-room-info">
                            <h4>Создать новый чат</h4>
                        </div>
                    </div>
                    
                    <div class="new-chat-form" style="padding: 20px; overflow-y: auto; flex: 1;">
                        <div class="form-group">
                            <label for="new-chat-name">Название чата *</label>
                            <input type="text" id="new-chat-name" placeholder="Например: Семейный чат" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Тип чата</label>
                            <div style="display: flex; gap: 20px; margin-top: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="radio" name="chat-type" value="private" checked>
                                    <span>Личный</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="radio" name="chat-type" value="group">
                                    <span>Групповой</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Демо-участники</label>
                            <div id="demo-users" style="margin-top: 10px;">
                                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; cursor: pointer;" data-user-id="demo1">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center;">АИ</div>
                                    <div>
                                        <div style="font-weight: 500;">Александр Иванов</div>
                                        <div style="font-size: 0.85rem; color: #718096;">alex@example.com</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; cursor: pointer;" data-user-id="demo2">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #ed64a6; color: white; display: flex; align-items: center; justify-content: center;">МП</div>
                                    <div>
                                        <div style="font-weight: 500;">Мария Петрова</div>
                                        <div style="font-size: 0.85rem; color: #718096;">maria@example.com</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Выбранные участники</label>
                            <div id="selected-users-list" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; min-height: 60px; margin-top: 10px; background: #f8fafc;"></div>
                        </div>
                        
                        <div class="form-group" style="margin-top: 20px;">
                            <button id="create-chat-submit" class="btn" style="width: 100%;">
                                <i class="fas fa-plus-circle"></i> Создать чат
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHTML);
}

// Настройка обработчиков
function setupChatListeners() {
    document.getElementById('chat-toggle-btn')?.addEventListener('click', toggleChatWidget);
    document.getElementById('close-chat-btn')?.addEventListener('click', closeChatWidget);
    
    document.getElementById('back-to-chats')?.addEventListener('click', showChatList);
    document.getElementById('back-from-new-chat')?.addEventListener('click', showChatList);
    
    document.getElementById('new-chat-btn')?.addEventListener('click', showNewChatForm);
    document.getElementById('create-chat-submit')?.addEventListener('click', createNewChat);
    document.getElementById('refresh-chats')?.addEventListener('click', () => {
        loadUserChats();
        window.showNotification('Список чатов обновлен', 'success');
    });
    
    document.getElementById('send-message-btn')?.addEventListener('click', sendMessage);
    document.getElementById('chat-message-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    document.getElementById('chat-search-input')?.addEventListener('input', filterChats);
    
    document.querySelectorAll('#demo-users > div').forEach(userDiv => {
        userDiv.addEventListener('click', () => {
            const userId = userDiv.dataset.userId;
            const userName = userDiv.querySelector('div > div:first-child').textContent;
            addUserToSelection(userId, userName);
        });
    });
}

// Загрузка чатов пользователя
async function loadUserChats() {
    try {
        const savedChats = localStorage.getItem('family_tree_chats');
        if (savedChats) {
            window.chats = JSON.parse(savedChats);
        } else {
            window.chats = [
                {
                    id: 'chat1',
                    name: 'Семейный чат',
                    description: 'Основной семейный чат',
                    is_group: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    membersCount: 4
                },
                {
                    id: 'chat2', 
                    name: 'Родители',
                    description: 'Чат с родителями',
                    is_group: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    membersCount: 2
                }
            ];
            localStorage.setItem('family_tree_chats', JSON.stringify(window.chats));
        }
        
        updateChatsList();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки чатов:', error);
    }
}

// Обновление списка чатов
function updateChatsList() {
    const chatsList = document.getElementById('chats-list');
    if (!chatsList) return;
    
    if (window.chats.length === 0) {
        chatsList.innerHTML = `
            <div class="empty-chats">
                <i class="fas fa-comments" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 15px;"></i>
                <p style="color: #718096; text-align: center;">У вас пока нет чатов</p>
                <button id="create-first-chat" class="btn btn-small" style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> Создать первый чат
                </button>
            </div>
        `;
        
        document.getElementById('create-first-chat')?.addEventListener('click', showNewChatForm);
        return;
    }
    
    let html = '';
    window.chats.forEach(chat => {
        const timeAgo = formatTimeAgo(chat.updated_at);
        const isGroup = chat.is_group;
        
        html += `
            <div class="chat-item" data-chat-id="${chat.id}">
                <div class="chat-item-avatar" style="background: ${isGroup ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};">
                    ${isGroup ? '<i class="fas fa-users"></i>' : '<i class="fas fa-user"></i>'}
                </div>
                <div class="chat-item-info">
                    <div class="chat-item-header">
                        <span class="chat-item-name">${chat.name}</span>
                        <span class="chat-item-time">${timeAgo}</span>
                    </div>
                    <div class="chat-item-preview">
                        <span style="color: #718096; font-size: 0.9rem;">${chat.description}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: #a0aec0; margin-top: 3px;">
                        ${chat.membersCount} участник${chat.membersCount === 1 ? '' : 'а'}
                    </div>
                </div>
            </div>
        `;
    });
    
    chatsList.innerHTML = html;
    
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', async () => {
            const chatId = item.dataset.chatId;
            await openChat(chatId);
        });
    });
}

// Открытие чата
async function openChat(chatId) {
    try {
        window.currentChat = window.chats.find(c => c.id === chatId);
        if (!window.currentChat) {
            return;
        }
        
        showChatRoom();
        
        loadChatMessages(chatId);
        
        updateChatUI();
        
    } catch (error) {
        console.error('❌ Ошибка открытия чата:', error);
        window.showNotification('Ошибка открытия чата', 'error');
        showChatList();
    }
}

// Загрузка сообщений чата
function loadChatMessages(chatId) {
    const demoMessages = [
        {
            id: 1,
            sender_id: 'demo1',
            content: 'Привет всем! Как дела?',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            profiles: {
                full_name: 'Александр Иванов'
            }
        },
        {
            id: 2,
            sender_id: 'current',
            content: 'Привет! Все отлично, у вас как?',
            created_at: new Date(Date.now() - 3540000).toISOString(),
            profiles: {
                full_name: 'Вы'
            }
        },
        {
            id: 3,
            sender_id: 'demo2',
            content: 'Тоже все хорошо! Когда встретимся?',
            created_at: new Date(Date.now() - 3480000).toISOString(),
            profiles: {
                full_name: 'Мария Петрова'
            }
        }
    ];
    
    window.chatMessages = demoMessages;
    updateChatMessages();
}

// Обновление сообщений в UI
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
    
    window.chatMessages.forEach(message => {
        const messageDate = new Date(message.created_at);
        const timeStr = messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const isOwnMessage = message.sender_id === 'current';
        const senderName = message.profiles?.full_name || 'Неизвестный';
        
        html += `
            <div class="message ${isOwnMessage ? 'own' : ''}">
                ${!isOwnMessage ? `
                    <div class="message-sender">${senderName}</div>
                ` : ''}
                <div class="message-content">
                    <div class="message-text">${escapeHtml(message.content)}</div>
                    <div class="message-time">${timeStr}</div>
                </div>
            </div>
        `;
    });
    
    messagesContainer.innerHTML = html;
    scrollToBottom();
}

// Отправка сообщения
function sendMessage() {
    const input = document.getElementById('chat-message-input');
    const content = input?.value.trim();
    
    if (!content || !window.currentChat) {
        return;
    }
    
    const newMessage = {
        id: Date.now(),
        sender_id: 'current',
        content: content,
        created_at: new Date().toISOString(),
        profiles: {
            full_name: 'Вы'
        }
    };
    
    window.chatMessages.push(newMessage);
    updateChatMessages();
    
    input.value = '';
    input.focus();
    
    window.showNotification('Сообщение отправлено', 'success');
    
    window.currentChat.updated_at = new Date().toISOString();
    localStorage.setItem('family_tree_chats', JSON.stringify(window.chats));
    updateChatsList();
}

// Добавление пользователя в выбранные
function addUserToSelection(userId, userName) {
    const selectedContainer = document.getElementById('selected-users-list');
    if (!selectedContainer) return;
    
    if (document.querySelector(`.selected-user[data-user-id="${userId}"]`)) {
        return;
    }
    
    const userHTML = `
        <div class="selected-user" data-user-id="${userId}" style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: white;
            padding: 8px 12px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            margin: 5px;
        ">
            <div style="
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: bold;
            ">
                ${window.getUserInitials(userName)}
            </div>
            <span style="font-size: 0.9rem;">${userName}</span>
            <button class="remove-user-btn" data-user-id="${userId}" style="
                background: #fed7d7;
                color: #c53030;
                border: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 0.7rem;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    selectedContainer.insertAdjacentHTML('beforeend', userHTML);
    
    document.querySelector(`.selected-user[data-user-id="${userId}"] .remove-user-btn`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeUserFromSelection(userId);
    });
}

// Удаление пользователя из выбранных
function removeUserFromSelection(userId) {
    const selectedUser = document.querySelector(`.selected-user[data-user-id="${userId}"]`);
    if (selectedUser) {
        selectedUser.remove();
    }
}

// Создание нового чата
function createNewChat() {
    const chatName = document.getElementById('new-chat-name')?.value.trim();
    const chatType = document.querySelector('input[name="chat-type"]:checked')?.value;
    const selectedUsers = document.querySelectorAll('.selected-user');
    
    if (!chatName) {
        window.showNotification('Введите название чата', 'error');
        return;
    }
    
    if (selectedUsers.length === 0) {
        window.showNotification('Выберите хотя бы одного участника', 'error');
        return;
    }
    
    const newChat = {
        id: 'chat' + Date.now(),
        name: chatName,
        description: chatType === 'group' ? 'Групповой чат' : 'Личный чат',
        is_group: chatType === 'group',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        membersCount: selectedUsers.length + 1
    };
    
    window.chats.unshift(newChat);
    localStorage.setItem('family_tree_chats', JSON.stringify(window.chats));
    
    window.showNotification(`✅ Чат "${chatName}" создан!`, 'success');
    
    document.getElementById('new-chat-name').value = '';
    document.getElementById('selected-users-list').innerHTML = '';
    
    updateChatsList();
    
    setTimeout(() => {
        openChat(newChat.id);
    }, 500);
}

// Вспомогательные функции
function toggleChatWidget() {
    document.getElementById('chat-widget').classList.toggle('active');
}

function closeChatWidget() {
    document.getElementById('chat-widget').classList.remove('active');
}

function showChatList() {
    document.getElementById('chat-list-container').style.display = 'block';
    document.getElementById('chat-room-container').style.display = 'none';
    document.getElementById('new-chat-container').style.display = 'none';
    window.currentChat = null;
}

function showChatRoom() {
    document.getElementById('chat-list-container').style.display = 'none';
    document.getElementById('chat-room-container').style.display = 'flex';
    document.getElementById('new-chat-container').style.display = 'none';
}

function showNewChatForm() {
    document.getElementById('chat-list-container').style.display = 'none';
    document.getElementById('chat-room-container').style.display = 'none';
    document.getElementById('new-chat-container').style.display = 'flex';
    
    document.getElementById('new-chat-name').value = '';
    document.getElementById('selected-users-list').innerHTML = '';
}

function filterChats() {
    const searchTerm = document.getElementById('chat-search-input')?.value.toLowerCase();
    const items = document.querySelectorAll('.chat-item');
    
    items.forEach(item => {
        const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
        item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function updateChatUI() {
    if (!window.currentChat) return;
    
    document.getElementById('chat-room-title').textContent = window.currentChat.name;
    
    const membersCount = window.currentChat.membersCount || 1;
    document.getElementById('chat-room-members').textContent = 
        `${membersCount} участник${membersCount === 1 ? '' : 'а'}`;
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.initChatSystem === 'function') {
            window.initChatSystem();
        }
    }, 1500);
});

console.log('✅ Chat.js загружен');