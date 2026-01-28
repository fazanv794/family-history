// chat.js - Полноценная система чатов с Supabase

console.log('💬 Chat.js загружается...');

// Глобальные переменные
window.chats = [];
window.currentChat = null;
window.chatMessages = [];
window.chatUsers = [];
window.chatSubscription = null;

// Основная функция инициализации
window.initChatSystem = async function() {
    console.log('🔄 Инициализация системы чатов...');
    
    try {
        // Проверяем пользователя
        if (!window.currentUser) {
            const savedUser = localStorage.getItem('family_tree_user');
            if (savedUser) {
                window.currentUser = JSON.parse(savedUser);
                console.log('👤 Пользователь загружен из localStorage:', window.currentUser.email);
            } else {
                console.log('❌ Пользователь не авторизован для чата');
                return;
            }
        }
        
        console.log('✅ Пользователь готов:', window.currentUser.email);
        
        // Создаем виджет чата
        createChatWidget();
        
        // Загружаем данные
        await loadUserChats();
        await loadAllUsers();
        
        // Настраиваем обработчики
        setupChatListeners();
        
        // Подписываемся на обновления в реальном времени
        setupRealtimeUpdates();
        
        console.log('✅ Система чатов готова');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации чата:', error);
        window.showNotification('Ошибка загрузки чата', 'error');
    }
};

// Создание виджета чата
function createChatWidget() {
    console.log('📱 Создание виджета чата...');
    
    // Удаляем старые элементы если есть
    const oldToggle = document.getElementById('chat-toggle-btn');
    if (oldToggle) oldToggle.remove();
    
    const oldWidget = document.getElementById('chat-widget');
    if (oldWidget) oldWidget.remove();
    
    // Создаем кнопку чата
    const toggleHTML = `
        <div id="chat-toggle-btn" class="chat-toggle-btn">
            <i class="fas fa-comments"></i>
            <span class="unread-badge" id="unread-badge" style="display: none;">0</span>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toggleHTML);
    
    // Создаем виджет чата
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
                <!-- Список чатов -->
                <div id="chat-list-container" class="chat-list-container">
                    <div class="chat-search">
                        <input type="text" id="chat-search-input" placeholder="Поиск чатов...">
                        <button id="refresh-chats" class="btn-icon" style="position: absolute; right: 25px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #667eea; cursor: pointer;">
                            <i class="fas fa-sync-alt"></i>
                        </button>
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
                            <h4 class="chat-room-title" id="chat-room-title">Название чата</h4>
                            <span class="chat-room-members" id="chat-room-members">Участники</span>
                        </div>
                        <div class="chat-room-actions">
                            <button id="chat-info-btn" class="chat-header-btn" title="Информация о чате">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div id="chat-messages" class="chat-messages">
                        <!-- Сообщения будут здесь -->
                    </div>
                    
                    <div class="chat-input-container">
                        <div class="chat-input-wrapper">
                            <input type="text" id="chat-message-input" placeholder="Введите сообщение..." maxlength="1000">
                            <button id="send-message-btn" class="btn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Создание нового чата -->
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
                            <label for="search-users-input">Поиск пользователей</label>
                            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                                <input type="text" id="search-users-input" placeholder="Введите имя или email..." style="flex: 1;">
                                <button id="search-users-btn" class="btn" style="white-space: nowrap;">
                                    <i class="fas fa-search"></i> Найти
                                </button>
                            </div>
                            <div id="search-users-results" style="
                                border: 1px solid #e2e8f0;
                                border-radius: 8px;
                                max-height: 200px;
                                overflow-y: auto;
                                padding: 10px;
                                background: #f8fafc;
                                display: none;
                            ">
                                <!-- Результаты поиска -->
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Выбранные участники</label>
                            <div id="selected-users-list" style="
                                border: 1px solid #e2e8f0;
                                border-radius: 8px;
                                padding: 15px;
                                min-height: 60px;
                                margin-top: 10px;
                                background: #f8fafc;
                            ">
                                <!-- Выбранные пользователи -->
                            </div>
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
    console.log('🎮 Настройка обработчиков чата...');
    
    // Основные кнопки
    document.getElementById('chat-toggle-btn')?.addEventListener('click', toggleChatWidget);
    document.getElementById('close-chat-btn')?.addEventListener('click', closeChatWidget);
    
    // Навигация
    document.getElementById('back-to-chats')?.addEventListener('click', showChatList);
    document.getElementById('back-from-new-chat')?.addEventListener('click', showChatList);
    
    // Создание чата
    document.getElementById('new-chat-btn')?.addEventListener('click', showNewChatForm);
    document.getElementById('create-chat-submit')?.addEventListener('click', createNewChat);
    document.getElementById('search-users-btn')?.addEventListener('click', searchUsers);
    document.getElementById('search-users-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchUsers();
    });
    
    // Обновление чатов
    document.getElementById('refresh-chats')?.addEventListener('click', () => {
        loadUserChats();
        window.showNotification('Список чатов обновлен', 'success');
    });
    
    // Сообщения
    document.getElementById('send-message-btn')?.addEventListener('click', sendMessage);
    document.getElementById('chat-message-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Поиск
    document.getElementById('chat-search-input')?.addEventListener('input', filterChats);
    
    // Информация о чате
    document.getElementById('chat-info-btn')?.addEventListener('click', showChatInfo);
}

// Загрузка чатов пользователя
async function loadUserChats() {
    console.log('📥 Загрузка чатов пользователя...');
    
    if (!window.supabaseClient || !window.currentUser) {
        console.log('⚠️ Supabase или пользователь не готов');
        return;
    }
    
    try {
        window.showLoader('Загрузка чатов...');
        
        // Получаем чаты, где пользователь является участником
const { data: chatMembers, error: membersError } = await window.supabaseClient
    .from('chat_members')
    .select(`
        chat_id,
        chats (
            id,
            name,
            description,
            is_group,
            owner_id,  // ← ПРАВИЛЬНО
            created_at,
            updated_at
        )
    `)
    .eq('user_id', window.currentUser.id)
    .order('joined_at', { ascending: false });
        
        if (membersError) throw membersError;
        
        if (!chatMembers || chatMembers.length === 0) {
            window.chats = [];
            updateChatsList();
            window.hideLoader();
            return;
        }
        
        // Получаем последние сообщения для каждого чата
        const chatsWithMessages = [];
        
        for (const member of chatMembers) {
            const chat = member.chats;
            
            // Получаем последнее сообщение
            const { data: lastMessage } = await window.supabaseClient
                .from('messages')
                .select('content, created_at, sender_id')
                .eq('chat_id', chat.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            // Получаем количество участников
            const { count: membersCount } = await window.supabaseClient
                .from('chat_members')
                .select('*', { count: 'exact', head: true })
                .eq('chat_id', chat.id);
            
            // Получаем количество непрочитанных сообщений
            const { count: unreadCount } = await window.supabaseClient
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('chat_id', chat.id)
                .neq('sender_id', window.currentUser.id);
                // В реальном приложении здесь должна быть проверка прочитанных сообщений
            
            chatsWithMessages.push({
                ...chat,
                lastMessage: lastMessage?.content || 'Нет сообщений',
                lastMessageTime: lastMessage?.created_at || chat.updated_at,
                membersCount: membersCount || 1,
                unreadCount: unreadCount || 0
            });
        }
        
        window.chats = chatsWithMessages.sort((a, b) => 
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
        
        updateChatsList();
        updateUnreadBadge();
        
        console.log('✅ Загружено чатов:', window.chats.length);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки чатов:', error);
        window.showNotification('Ошибка загрузки чатов', 'error');
    } finally {
        window.hideLoader();
    }
}

// Загрузка всех пользователей
async function loadAllUsers() {
    console.log('👥 Загрузка пользователей...');
    
    if (!window.supabaseClient) return;
    
    try {
        const { data: users, error } = await window.supabaseClient
            .from('profiles')
            .select('id, email, full_name')
            .neq('id', window.currentUser?.id) // Исключаем текущего пользователя
            .order('full_name', { ascending: true });
        
        if (!error && users) {
            window.chatUsers = users;
            console.log('✅ Загружено пользователей:', window.chatUsers.length);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки пользователей:', error);
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
        const timeAgo = formatTimeAgo(chat.lastMessageTime);
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
                        <span style="color: #718096; font-size: 0.9rem;">${truncateText(chat.lastMessage, 40)}</span>
                        ${chat.unreadCount > 0 ? `
                            <span style="
                                background: #f56565;
                                color: white;
                                font-size: 0.7rem;
                                font-weight: bold;
                                padding: 2px 6px;
                                border-radius: 10px;
                                margin-left: 8px;
                            ">${chat.unreadCount}</span>
                        ` : ''}
                    </div>
                    <div style="font-size: 0.8rem; color: #a0aec0; margin-top: 3px;">
                        ${chat.membersCount} участник${chat.membersCount === 1 ? '' : 'а'}
                    </div>
                </div>
            </div>
        `;
    });
    
    chatsList.innerHTML = html;
    
    // Добавляем обработчики
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', async () => {
            const chatId = item.dataset.chatId;
            await openChat(chatId);
        });
    });
}

// Открытие чата
async function openChat(chatId) {
    console.log('💬 Открытие чата:', chatId);
    
    try {
        window.showLoader('Загрузка чата...');
        
        // Находим чат
        window.currentChat = window.chats.find(c => c.id === chatId);
        if (!window.currentChat) {
            throw new Error('Чат не найден');
        }
        
        // Переключаем вид
        showChatRoom();
        
        // Загружаем участников
        await loadChatMembers(chatId);
        
        // Загружаем сообщения
        await loadChatMessages(chatId);
        
        // Подписываемся на новые сообщения
        subscribeToChatMessages(chatId);
        
        // Обновляем UI
        updateChatUI();
        
        console.log('✅ Чат открыт:', window.currentChat.name);
        
    } catch (error) {
        console.error('❌ Ошибка открытия чата:', error);
        window.showNotification('Ошибка открытия чата', 'error');
        showChatList();
    } finally {
        window.hideLoader();
    }
}

// Загрузка участников чата
async function loadChatMembers(chatId) {
    if (!window.supabaseClient) return;
    
    try {
        const { data: members, error } = await window.supabaseClient
            .from('chat_members')
            .select(`
                user_id,
                profiles:user_id (
                    id,
                    email,
                    full_name
                )
            `)
            .eq('chat_id', chatId);
        
        if (!error && members) {
            window.currentChat.members = members.map(m => m.profiles);
        }
    } catch (error) {
        console.error('Ошибка загрузки участников:', error);
    }
}

// Загрузка сообщений чата
async function loadChatMessages(chatId) {
    if (!window.supabaseClient) return;
    
    try {
        const { data: messages, error } = await window.supabaseClient
            .from('messages')
            .select(`
                id,
                content,
                sender_id,
                created_at,
                profiles:sender_id (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true })
            .limit(100);
        
        if (!error && messages) {
            window.chatMessages = messages;
            updateChatMessages();
        }
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
    }
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
    let lastDate = null;
    
    window.chatMessages.forEach(message => {
        const messageDate = new Date(message.created_at);
        const dateStr = messageDate.toLocaleDateString('ru-RU');
        const timeStr = messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const isOwnMessage = message.sender_id === window.currentUser?.id;
        const senderName = message.profiles?.full_name || message.profiles?.email || 'Неизвестный';
        
        // Добавляем дату если она изменилась
        if (dateStr !== lastDate) {
            html += `<div class="message-date">${formatDate(messageDate)}</div>`;
            lastDate = dateStr;
        }
        
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
async function sendMessage() {
    const input = document.getElementById('chat-message-input');
    const content = input?.value.trim();
    
    if (!content || !window.currentChat || !window.supabaseClient || !window.currentUser) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('messages')
            .insert([{
                chat_id: window.currentChat.id,
                sender_id: window.currentUser.id,
                content: content
            }]);
        
        if (error) throw error;
        
        // Обновляем время чата
        await window.supabaseClient
            .from('chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', window.currentChat.id);
        
        // Очищаем поле ввода
        input.value = '';
        input.focus();
        
        // Обновляем список чатов
        await loadUserChats();
        
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
        window.showNotification('Ошибка отправки сообщения', 'error');
    }
}

// Поиск пользователей
async function searchUsers() {
    const searchInput = document.getElementById('search-users-input');
    const searchTerm = searchInput?.value.trim().toLowerCase();
    
    if (!searchTerm) {
        window.showNotification('Введите имя или email для поиска', 'info');
        return;
    }
    
    const resultsContainer = document.getElementById('search-users-results');
    if (!resultsContainer) return;
    
    // Ищем среди загруженных пользователей
    const filteredUsers = window.chatUsers.filter(user => {
        const name = user.full_name?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        return name.includes(searchTerm) || email.includes(searchTerm);
    });
    
    if (filteredUsers.length === 0) {
        resultsContainer.innerHTML = '<p style="color: #718096; text-align: center; padding: 20px;">Пользователи не найдены</p>';
        resultsContainer.style.display = 'block';
        return;
    }
    
    let html = '';
    filteredUsers.forEach(user => {
        // Проверяем, не выбран ли уже пользователь
        const isSelected = document.querySelector(`.selected-user[data-user-id="${user.id}"]`);
        
        if (!isSelected) {
            html += `
                <div class="user-search-result" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px;
                    border-bottom: 1px solid #e2e8f0;
                    cursor: pointer;
                    transition: background 0.3s;
                " data-user-id="${user.id}">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                        ">
                            ${getUserInitials(user.full_name || user.email)}
                        </div>
                        <div>
                            <div style="font-weight: 500; color: #2d3748;">${user.full_name || 'Без имени'}</div>
                            <div style="font-size: 0.85rem; color: #718096;">${user.email}</div>
                        </div>
                    </div>
                    <button class="add-user-btn" style="
                        background: #48bb78;
                        color: white;
                        border: none;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    " data-user-id="${user.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
        }
    });
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
    
    // Обработчики для кнопок добавления
    document.querySelectorAll('.add-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = btn.dataset.userId;
            addUserToSelection(userId);
        });
    });
    
    // Обработчики клика по строкам
    document.querySelectorAll('.user-search-result').forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-user-btn')) {
                const userId = row.dataset.userId;
                addUserToSelection(userId);
            }
        });
    });
}

// Добавление пользователя в выбранные
function addUserToSelection(userId) {
    const user = window.chatUsers.find(u => u.id === userId);
    if (!user) return;
    
    const selectedContainer = document.getElementById('selected-users-list');
    if (!selectedContainer) return;
    
    // Проверяем, не добавлен ли уже
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
                ${getUserInitials(user.full_name || user.email)}
            </div>
            <span style="font-size: 0.9rem;">${user.full_name || user.email}</span>
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
    
    // Обработчик удаления
    document.querySelector(`.selected-user[data-user-id="${userId}"] .remove-user-btn`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeUserFromSelection(userId);
    });
    
    // Скрываем результаты поиска
    document.getElementById('search-users-results').style.display = 'none';
    document.getElementById('search-users-input').value = '';
}

// Удаление пользователя из выбранных
function removeUserFromSelection(userId) {
    const selectedUser = document.querySelector(`.selected-user[data-user-id="${userId}"]`);
    if (selectedUser) {
        selectedUser.remove();
    }
}

// Создание нового чата
async function createNewChat() {
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
    
    if (chatType === 'private' && selectedUsers.length !== 1) {
        window.showNotification('Личный чат может быть только с одним участником', 'error');
        return;
    }
    
    try {
        window.showLoader('Создание чата...');
        
        // Создаем чат
        const { data: chat, error: chatError } = await window.supabaseClient
            .from('chats')
            .insert([{
                name: chatName,
                is_group: chatType === 'group',
                owner_id: window.currentUser.id,
                description: chatType === 'group' ? 'Групповой чат' : 'Личный чат'
            }])
            .select()
            .single();
        
        if (chatError) throw chatError;
        
        // Добавляем участников
        const members = [
            { chat_id: chat.id, user_id: window.currentUser.id } // Добавляем себя
        ];
        
        // Добавляем выбранных пользователей
        selectedUsers.forEach(userEl => {
            members.push({
                chat_id: chat.id,
                user_id: userEl.dataset.userId
            });
        });
        
        const { error: membersError } = await window.supabaseClient
            .from('chat_members')
            .insert(members);
        
        if (membersError) throw membersError;
        
        // Отправляем приветственное сообщение
        await window.supabaseClient
            .from('messages')
            .insert([{
                chat_id: chat.id,
                sender_id: window.currentUser.id,
                content: 'Чат создан! Привет всем участникам!'
            }]);
        
        window.showNotification(`✅ Чат "${chatName}" создан!`, 'success');
        
        // Очищаем форму
        document.getElementById('new-chat-name').value = '';
        document.getElementById('selected-users-list').innerHTML = '';
        document.getElementById('search-users-input').value = '';
        document.getElementById('search-users-results').style.display = 'none';
        
        // Обновляем список чатов
        await loadUserChats();
        
        // Открываем созданный чат
        await openChat(chat.id);
        
    } catch (error) {
        console.error('❌ Ошибка создания чата:', error);
        window.showNotification('Ошибка создания чата', 'error');
    } finally {
        window.hideLoader();
    }
}

// Настройка обновлений в реальном времени
function setupRealtimeUpdates() {
    if (!window.supabaseClient || !window.currentUser) return;
    
    // Отписываемся от старой подписки
    if (window.chatSubscription) {
        window.supabaseClient.removeChannel(window.chatSubscription);
    }
    
    // Подписываемся на новые сообщения
    window.chatSubscription = window.supabaseClient
        .channel('chat_updates')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages'
            }, 
            async (payload) => {
                console.log('🆕 Новое сообщение:', payload.new);
                
                // Если это сообщение в текущем чате
                if (window.currentChat && payload.new.chat_id === window.currentChat.id) {
                    // Загружаем новые сообщения
                    await loadChatMessages(window.currentChat.id);
                } else {
                    // Обновляем список чатов
                    await loadUserChats();
                    
                    // Показываем уведомление
                    showNewMessageNotification(payload.new);
                }
            }
        )
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_members',
                filter: `user_id=eq.${window.currentUser.id}`
            },
            async (payload) => {
                console.log('➕ Добавлен в новый чат:', payload.new);
                window.showNotification('Вас добавили в новый чат!', 'info');
                await loadUserChats();
            }
        )
        .subscribe();
    
    console.log('🔔 Подписка на обновления чата активирована');
}

// Подписка на сообщения конкретного чата
function subscribeToChatMessages(chatId) {
    // В этой простой версии используем общую подписку
    // В расширенной версии можно сделать отдельную подписку для каждого чата
}

// Показать уведомление о новом сообщении
function showNewMessageNotification(message) {
    if (!window.currentUser || message.sender_id === window.currentUser.id) return;
    
    // Обновляем бейдж
    updateUnreadBadge();
    
    // Воспроизводим звук
    playNotificationSound();
}

// Воспроизведение звука уведомления
function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) {
        // Игнорируем ошибки воспроизведения
    }
}

// Обновление бейджа непрочитанных
function updateUnreadBadge() {
    const badge = document.getElementById('unread-badge');
    if (!badge) return;
    
    const totalUnread = window.chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    
    if (totalUnread > 0) {
        badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Обновление UI чата
function updateChatUI() {
    if (!window.currentChat) return;
    
    document.getElementById('chat-room-title').textContent = window.currentChat.name;
    
    const membersCount = window.currentChat.members?.length || window.currentChat.membersCount || 1;
    document.getElementById('chat-room-members').textContent = 
        `${membersCount} участник${membersCount === 1 ? '' : 'а'}`;
}

// Показать информацию о чате
async function showChatInfo() {
    if (!window.currentChat) return;
    
    try {
        // Загружаем детальную информацию об участниках
        const { data: members, error } = await window.supabaseClient
            .from('chat_members')
            .select(`
                user_id,
                joined_at,
                profiles:user_id (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('chat_id', window.currentChat.id);
        
        if (error) throw error;
        
        let membersList = '';
        if (members && members.length > 0) {
            membersList = members.map(member => {
                const joinDate = new Date(member.joined_at).toLocaleDateString('ru-RU');
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="
                                width: 36px;
                                height: 36px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                            ">
                                ${getUserInitials(member.profiles.full_name || member.profiles.email)}
                            </div>
                            <div>
                                <div style="font-weight: 500;">${member.profiles.full_name || 'Без имени'}</div>
                                <div style="font-size: 0.85rem; color: #718096;">${member.profiles.email}</div>
                            </div>
                        </div>
                        <div style="font-size: 0.85rem; color: #a0aec0;">
                            с ${joinDate}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        const modalHTML = `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Информация о чате</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 20px;">
                            <h4 style="color: #2d3748; margin-bottom: 10px;">${window.currentChat.name}</h4>
                            <p style="color: #718096; margin-bottom: 5px;">
                                <strong>Тип:</strong> ${window.currentChat.is_group ? 'Групповой чат' : 'Личный чат'}
                            </p>
                            <p style="color: #718096; margin-bottom: 5px;">
                                <strong>Создан:</strong> ${new Date(window.currentChat.created_at).toLocaleDateString('ru-RU')}
                            </p>
                            <p style="color: #718096;">
                                <strong>Участников:</strong> ${members?.length || 0}
                            </p>
                        </div>
                        
                        <div>
                            <h4 style="color: #2d3748; margin-bottom: 10px;">Участники</h4>
                            <div style="max-height: 300px; overflow-y: auto;">
                                ${membersList || '<p style="color: #718096; text-align: center;">Нет данных об участниках</p>'}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary close-chat-info">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.innerHTML = modalHTML;
            overlay.classList.remove('hidden');
            
            // Закрытие модального окна
            overlay.querySelector('.modal-close').addEventListener('click', () => {
                overlay.classList.add('hidden');
            });
            
            overlay.querySelector('.close-chat-info').addEventListener('click', () => {
                overlay.classList.add('hidden');
            });
        }
        
    } catch (error) {
        console.error('Ошибка загрузки информации о чате:', error);
        window.showNotification('Ошибка загрузки информации о чате', 'error');
    }
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
    
    // Очищаем форму
    document.getElementById('new-chat-name').value = '';
    document.getElementById('selected-users-list').innerHTML = '';
    document.getElementById('search-users-input').value = '';
    document.getElementById('search-users-results').style.display = 'none';
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

function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера';
    } else {
        return date.toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

function getUserInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Страница загружена, готовим чат...');
    
    // Ждем загрузки основных скриптов
    setTimeout(() => {
        if (typeof window.initChatSystem === 'function') {
            console.log('🚀 Запуск инициализации чата...');
            window.initChatSystem();
        } else {
            console.error('❌ Функция initChatSystem не найдена');
        }
    }, 1500);
});

console.log('✅ Chat.js загружен');