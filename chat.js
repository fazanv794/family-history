// chat.js - Система чатов для проекта "История моей семьи"

console.log('💬 Chat.js загружается...');

// Глобальные переменные для чата
window.chats = [];
window.currentChat = null;
window.chatUsers = [];
window.chatMessages = [];
window.chatRealTimeSubscription = null;

// Функция инициализации чата
function initChatSystem() {
    console.log('🔄 Инициализация системы чатов...');
    
    // Загружаем чаты текущего пользователя
    loadUserChats();
    
    // Создаем виджет чата в DOM
    createChatWidget();
    
    // Настраиваем обработчики событий
    setupChatEventListeners();
    
    // Подписываемся на обновления в реальном времени
    subscribeToRealTimeChatUpdates();
}

// Создание виджета чата
function createChatWidget() {
    console.log('📱 Создание виджета чата...');
    
    // Проверяем, не создан ли уже виджет
    if (document.getElementById('chat-widget')) {
        return;
    }
    
    const chatWidgetHTML = `
        <div id="chat-widget" class="chat-widget">
            <div class="chat-header">
                <div class="chat-title">
                    <i class="fas fa-comments"></i>
                    <span>Семейный чат</span>
                </div>
                <div class="chat-actions">
                    <button id="new-chat-btn" class="btn-icon" title="Новый чат">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button id="close-chat-btn" class="btn-icon" title="Свернуть чат">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="chat-content">
                <!-- Список чатов -->
                <div id="chat-list-container" class="chat-list-container">
                    <div class="chat-search">
                        <input type="text" id="chat-search-input" placeholder="Поиск чатов...">
                        <i class="fas fa-search"></i>
                    </div>
                    <div id="chats-list" class="chats-list">
                        <!-- Список чатов будет загружен динамически -->
                    </div>
                </div>
                
                <!-- Окно чата -->
                <div id="chat-room-container" class="chat-room-container" style="display: none;">
                    <div class="chat-room-header">
                        <button id="back-to-chats" class="btn-icon">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="chat-info">
                            <h4 id="chat-room-title">Название чата</h4>
                            <span id="chat-room-members" class="chat-members-count">3 участника</span>
                        </div>
                        <div class="chat-room-actions">
                            <button id="chat-info-btn" class="btn-icon" title="Информация о чате">
                                <i class="fas fa-info-circle"></i>
                            </button>
                            <button id="add-members-btn" class="btn-icon" title="Добавить участников">
                                <i class="fas fa-user-plus"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div id="chat-messages" class="chat-messages">
                        <!-- Сообщения будут загружены здесь -->
                    </div>
                    
                    <div class="chat-input-container">
                        <div class="chat-input-wrapper">
                            <input type="text" id="chat-message-input" placeholder="Введите сообщение..." maxlength="1000">
                            <button id="send-message-btn" class="btn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <div class="chat-input-actions">
                            <button class="btn-icon" title="Добавить фото">
                                <i class="fas fa-image"></i>
                            </button>
                            <button class="btn-icon" title="Добавить файл">
                                <i class="fas fa-paperclip"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Создание нового чата -->
                <div id="new-chat-container" class="new-chat-container" style="display: none;">
                    <div class="new-chat-header">
                        <button id="back-from-new-chat" class="btn-icon">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h4>Создать новый чат</h4>
                    </div>
                    
                    <div class="new-chat-form">
                        <div class="form-group">
                            <label for="chat-name">Название чата</label>
                            <input type="text" id="chat-name" placeholder="Семейный чат" maxlength="100">
                        </div>
                        
                        <div class="form-group">
                            <label>Тип чата</label>
                            <div class="chat-type-selector">
                                <label class="radio-group">
                                    <input type="radio" name="chat-type" value="private" checked>
                                    <span>Личный чат (до 2 человек)</span>
                                </label>
                                <label class="radio-group">
                                    <input type="radio" name="chat-type" value="group">
                                    <span>Групповой чат</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="search-users">Найти пользователей</label>
                            <div class="search-users-wrapper">
                                <input type="text" id="search-users" placeholder="Введите имя или email..." maxlength="100">
                                <button id="search-users-btn" class="btn-icon">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                            <div id="search-results" class="search-results">
                                <!-- Результаты поиска будут здесь -->
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Выбранные участники</label>
                            <div id="selected-users" class="selected-users">
                                <!-- Выбранные пользователи будут здесь -->
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <button id="create-chat-btn" class="btn full-width">
                                <i class="fas fa-plus-circle"></i> Создать чат
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Кнопка открытия чата -->
            <div id="chat-toggle-btn" class="chat-toggle-btn">
                <i class="fas fa-comments"></i>
                <span class="unread-badge" id="unread-badge" style="display: none;">0</span>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatWidgetHTML);
    console.log('✅ Виджет чата создан');
}

// Настройка обработчиков событий
function setupChatEventListeners() {
    console.log('🎮 Настройка обработчиков чата...');
    
    // Кнопка открытия/закрытия чата
    document.getElementById('chat-toggle-btn')?.addEventListener('click', toggleChatWidget);
    document.getElementById('close-chat-btn')?.addEventListener('click', () => {
        document.getElementById('chat-widget').classList.remove('expanded');
    });
    
    // Навигация между разделами чата
    document.getElementById('new-chat-btn')?.addEventListener('click', showNewChatForm);
    document.getElementById('back-to-chats')?.addEventListener('click', showChatList);
    document.getElementById('back-from-new-chat')?.addEventListener('click', showChatList);
    
    // Создание нового чата
    document.getElementById('create-chat-btn')?.addEventListener('click', createNewChat);
    document.getElementById('search-users-btn')?.addEventListener('click', searchUsers);
    document.getElementById('search-users')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') searchUsers();
    });
    
    // Отправка сообщений
    document.getElementById('send-message-btn')?.addEventListener('click', sendMessage);
    document.getElementById('chat-message-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Поиск чатов
    document.getElementById('chat-search-input')?.addEventListener('input', filterChats);
    
    // Добавление участников
    document.getElementById('add-members-btn')?.addEventListener('click', showAddMembersToChat);
    document.getElementById('chat-info-btn')?.addEventListener('click', showChatInfo);
    
    console.log('✅ Обработчики чата настроены');
}

// Загрузка чатов пользователя
async function loadUserChats() {
    console.log('📥 Загрузка чатов пользователя...');
    
    if (!window.currentUser || !window.supabaseClient) {
        console.log('👤 Пользователь не авторизован');
        return;
    }
    
    try {
        // Загружаем чаты, в которых состоит пользователь
        const { data: chatMemberships, error: membershipsError } = await window.supabaseClient
            .from('chat_members')
            .select(`
                chat_id,
                chats (
                    id,
                    name,
                    description,
                    is_group,
                    owner_id,
                    created_at,
                    updated_at
                )
            `)
            .eq('user_id', window.currentUser.id)
            .order('joined_at', { ascending: false });
        
        if (membershipsError) throw membershipsError;
        
        window.chats = chatMemberships.map(m => ({
            ...m.chats,
            membership: m
        }));
        
        console.log('✅ Загружено чатов:', window.chats.length);
        
        // Обновляем UI списка чатов
        updateChatsList();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки чатов:', error);
        window.showNotification('Ошибка загрузки чатов', 'error');
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
        // Получаем количество непрочитанных сообщений
        const unreadCount = getUnreadCount(chat.id);
        
        html += `
            <div class="chat-item" data-chat-id="${chat.id}">
                <div class="chat-item-avatar">
                    <div class="avatar-small ${chat.is_group ? 'group' : ''}">
                        ${chat.is_group ? '<i class="fas fa-users"></i>' : '<i class="fas fa-user"></i>'}
                    </div>
                </div>
                <div class="chat-item-info">
                    <div class="chat-item-header">
                        <span class="chat-item-name">${chat.name}</span>
                        <span class="chat-item-time">${formatChatTime(chat.updated_at)}</span>
                    </div>
                    <div class="chat-item-preview">
                        <span class="chat-item-last-message">${chat.description || 'Нет сообщений'}</span>
                        ${unreadCount > 0 ? `<span class="chat-item-unread">${unreadCount}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    chatsList.innerHTML = html;
    
    // Добавляем обработчики клика по чатам
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            const chatId = item.dataset.chatId;
            openChat(chatId);
        });
    });
}

// Открытие чата
async function openChat(chatId) {
    console.log('💬 Открытие чата:', chatId);
    
    window.currentChat = window.chats.find(c => c.id === chatId);
    if (!window.currentChat) {
        console.error('❌ Чат не найден');
        return;
    }
    
    // Переключаемся в режим чата
    document.getElementById('chat-list-container').style.display = 'none';
    document.getElementById('chat-room-container').style.display = 'flex';
    document.getElementById('new-chat-container').style.display = 'none';
    
    // Обновляем заголовок чата
    document.getElementById('chat-room-title').textContent = window.currentChat.name;
    
    // Загружаем участников чата
    await loadChatMembers(chatId);
    
    // Загружаем сообщения чата
    await loadChatMessages(chatId);
    
    // Подписываемся на новые сообщения в этом чате
    subscribeToChatMessages(chatId);
    
    // Помечаем сообщения как прочитанные
    markMessagesAsRead(chatId);
}

// Загрузка участников чата
async function loadChatMembers(chatId) {
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
            window.chatUsers = members.map(m => m.profiles);
            updateChatMembersUI();
        }
    } catch (error) {
        console.error('Ошибка загрузки участников чата:', error);
    }
}

// Обновление UI участников чата
function updateChatMembersUI() {
    const membersElement = document.getElementById('chat-room-members');
    if (membersElement) {
        const count = window.chatUsers.length;
        membersElement.textContent = `${count} участник${count === 1 ? '' : 'а'}`;
    }
}

// Загрузка сообщений чата
async function loadChatMessages(chatId) {
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
            .limit(50);
        
        if (!error && messages) {
            window.chatMessages = messages;
            updateChatMessagesUI();
            scrollToBottom();
        }
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
    }
}

// Обновление UI сообщений
function updateChatMessagesUI() {
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
    let lastSenderId = null;
    let lastDate = null;
    
    window.chatMessages.forEach(message => {
        const messageDate = new Date(message.created_at);
        const currentDate = messageDate.toLocaleDateString('ru-RU');
        const isOwnMessage = message.sender_id === window.currentUser?.id;
        
        // Добавляем дату, если она изменилась
        if (currentDate !== lastDate) {
            html += `<div class="message-date">${formatMessageDate(messageDate)}</div>`;
            lastDate = currentDate;
        }
        
        // Добавляем отступ, если отправитель изменился
        if (lastSenderId !== message.sender_id) {
            html += `<div class="message-sender-spacing"></div>`;
        }
        
        html += `
            <div class="message ${isOwnMessage ? 'own-message' : ''}">
                ${!isOwnMessage && lastSenderId !== message.sender_id ? `
                    <div class="message-sender">${message.profiles?.full_name || message.profiles?.email || 'Неизвестный'}</div>
                ` : ''}
                <div class="message-content">
                    <div class="message-text">${escapeHtml(message.content)}</div>
                    <div class="message-time">${messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        `;
        
        lastSenderId = message.sender_id;
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
async function sendMessage() {
    const input = document.getElementById('chat-message-input');
    const message = input?.value.trim();
    
    if (!message || !window.currentChat || !window.currentUser) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('messages')
            .insert([{
                chat_id: window.currentChat.id,
                sender_id: window.currentUser.id,
                content: message
            }]);
        
        if (error) throw error;
        
        // Очищаем поле ввода
        input.value = '';
        
        // Обновляем время последнего сообщения в чате
        await window.supabaseClient
            .from('chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', window.currentChat.id);
        
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        window.showNotification('Ошибка отправки сообщения', 'error');
    }
}

// Поиск пользователей
async function searchUsers() {
    const searchInput = document.getElementById('search-users');
    const searchTerm = searchInput?.value.trim();
    
    if (!searchTerm) {
        window.showNotification('Введите имя или email для поиска', 'info');
        return;
    }
    
    try {
        // Ищем пользователей по имени или email
        const { data: users, error } = await window.supabaseClient
            .from('profiles')
            .select('id, full_name, email')
            .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .limit(10);
        
        if (error) throw error;
        
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        if (!users || users.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">Пользователи не найдены</div>';
            return;
        }
        
        let html = '';
        users.forEach(user => {
            // Проверяем, не добавлен ли уже пользователь
            const isSelected = document.querySelector(`.selected-user[data-user-id="${user.id}"]`);
            
            if (!isSelected && user.id !== window.currentUser.id) {
                html += `
                    <div class="user-search-result" data-user-id="${user.id}">
                        <div class="user-avatar-small">
                            ${getUserInitials(user.full_name || user.email)}
                        </div>
                        <div class="user-info">
                            <div class="user-name">${user.full_name || user.email}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                        <button class="btn-icon add-user-btn" data-user-id="${user.id}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
            }
        });
        
        resultsContainer.innerHTML = html || '<div class="no-results">Нет подходящих пользователей</div>';
        
        // Добавляем обработчики для кнопок добавления
        document.querySelectorAll('.add-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = btn.dataset.userId;
                addUserToSelection(userId);
            });
        });
        
        // Также добавляем обработчик клика по всей строке
        document.querySelectorAll('.user-search-result').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('add-user-btn')) {
                    const userId = item.dataset.userId;
                    addUserToSelection(userId);
                }
            });
        });
        
    } catch (error) {
        console.error('Ошибка поиска пользователей:', error);
        window.showNotification('Ошибка поиска пользователей', 'error');
    }
}

// Добавление пользователя в выбранные
function addUserToSelection(userId) {
    const userResult = document.querySelector(`.user-search-result[data-user-id="${userId}"]`);
    if (!userResult) return;
    
    const userName = userResult.querySelector('.user-name').textContent;
    const userEmail = userResult.querySelector('.user-email').textContent;
    
    const selectedContainer = document.getElementById('selected-users');
    if (!selectedContainer) return;
    
    // Проверяем, не добавлен ли уже пользователь
    if (document.querySelector(`.selected-user[data-user-id="${userId}"]`)) {
        return;
    }
    
    const selectedUserHTML = `
        <div class="selected-user" data-user-id="${userId}">
            <div class="selected-user-info">
                <div class="user-avatar-tiny">
                    ${getUserInitials(userName)}
                </div>
                <span>${userName}</span>
            </div>
            <button class="btn-icon remove-user-btn" data-user-id="${userId}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    selectedContainer.insertAdjacentHTML('beforeend', selectedUserHTML);
    
    // Добавляем обработчик удаления
    document.querySelector(`.selected-user[data-user-id="${userId}"] .remove-user-btn`).addEventListener('click', (e) => {
        e.stopPropagation();
        removeUserFromSelection(userId);
    });
    
    // Удаляем пользователя из результатов поиска
    userResult.remove();
    
    // Если нет результатов, показываем сообщение
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer.children.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Все найденные пользователи добавлены</div>';
    }
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
    const chatName = document.getElementById('chat-name')?.value.trim();
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
        // Создаем чат
        const { data: chat, error: chatError } = await window.supabaseClient
            .from('chats')
            .insert([{
                name: chatName,
                is_group: chatType === 'group',
                owner_id: window.currentUser.id,
                description: 'Новый чат'
            }])
            .select()
            .single();
        
        if (chatError) throw chatError;
        
        // Добавляем создателя в участники
        const members = [{
            chat_id: chat.id,
            user_id: window.currentUser.id
        }];
        
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
        
        window.showNotification('✅ Чат создан!', 'success');
        
        // Обновляем список чатов
        await loadUserChats();
        
        // Переходим в созданный чат
        openChat(chat.id);
        
    } catch (error) {
        console.error('Ошибка создания чата:', error);
        window.showNotification('Ошибка создания чата', 'error');
    }
}

// Подписка на обновления в реальном времени
function subscribeToRealTimeChatUpdates() {
    if (!window.supabaseClient || !window.currentUser) {
        console.log('⚠️ Не удалось подписаться на обновления чата');
        return;
    }
    
    // Отписываемся от предыдущей подписки
    if (window.chatRealTimeSubscription) {
        window.supabaseClient.removeChannel(window.chatRealTimeSubscription);
    }
    
    // Подписываемся на новые сообщения в чатах пользователя
    window.chatRealTimeSubscription = window.supabaseClient
        .channel('chat_updates')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `chat_id=in.(${window.chats.map(c => `"${c.id}"`).join(',')})`
            }, 
            (payload) => {
                console.log('🆕 Новое сообщение:', payload.new);
                handleNewMessage(payload.new);
            }
        )
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_members',
                filter: `user_id=eq.${window.currentUser.id}`
            },
            (payload) => {
                console.log('➕ Добавлен в новый чат:', payload.new);
                handleNewChatMembership(payload.new);
            }
        )
        .subscribe();
    
    console.log('🔔 Подписка на обновления чата активирована');
}

// Обработка нового сообщения
function handleNewMessage(message) {
    // Если открыт текущий чат, добавляем сообщение
    if (window.currentChat && message.chat_id === window.currentChat.id) {
        window.chatMessages.push(message);
        updateChatMessagesUI();
    } else {
        // Показываем уведомление о новом сообщении
        showNewMessageNotification(message);
        
        // Обновляем счетчик непрочитанных
        updateUnreadBadge();
    }
}

// Обработка нового чата
function handleNewChatMembership(membership) {
    // Обновляем список чатов
    loadUserChats();
    
    // Показываем уведомление
    window.showNotification('Вас добавили в новый чат', 'info');
}

// Показать уведомление о новом сообщении
function showNewMessageNotification(message) {
    // Получаем информацию об отправителе
    const senderName = message.profiles?.full_name || message.profiles?.email || 'Неизвестный';
    
    // Показываем системное уведомление, если браузер поддерживает
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Новое сообщение', {
            body: `${senderName}: ${message.content.substring(0, 50)}...`,
            icon: '/favicon.ico'
        });
    }
    
    // Показываем звуковое уведомление
    playNotificationSound();
}

// Воспроизведение звука уведомления
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

// Обновление бейджа с количеством непрочитанных
function updateUnreadBadge() {
    const badge = document.getElementById('unread-badge');
    if (!badge) return;
    
    let totalUnread = 0;
    window.chats.forEach(chat => {
        totalUnread += getUnreadCount(chat.id);
    });
    
    if (totalUnread > 0) {
        badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Получение количества непрочитанных сообщений
function getUnreadCount(chatId) {
    // В реальном приложении здесь была бы логика подсчета непрочитанных
    // Для демо-версии возвращаем случайное число
    return Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
}

// Пометить сообщения как прочитанные
async function markMessagesAsRead(chatId) {
    if (!window.currentUser || !window.supabaseClient) return;
    
    try {
        // В реальном приложении здесь была бы логика обновления поля read_by
        console.log(`✅ Сообщения в чате ${chatId} помечены как прочитанные`);
        
        // Обновляем бейдж
        updateUnreadBadge();
        
    } catch (error) {
        console.error('Ошибка пометки сообщений как прочитанных:', error);
    }
}

// Вспомогательные функции
function toggleChatWidget() {
    const widget = document.getElementById('chat-widget');
    widget.classList.toggle('expanded');
}

function showNewChatForm() {
    document.getElementById('chat-list-container').style.display = 'none';
    document.getElementById('chat-room-container').style.display = 'none';
    document.getElementById('new-chat-container').style.display = 'block';
    
    // Очищаем форму
    document.getElementById('chat-name').value = '';
    document.getElementById('search-users').value = '';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('selected-users').innerHTML = '';
}

function showChatList() {
    document.getElementById('chat-list-container').style.display = 'block';
    document.getElementById('chat-room-container').style.display = 'none';
    document.getElementById('new-chat-container').style.display = 'none';
}

function filterChats() {
    const searchTerm = document.getElementById('chat-search-input')?.value.toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const chatName = item.querySelector('.chat-item-name').textContent.toLowerCase();
        item.style.display = chatName.includes(searchTerm) ? 'flex' : 'none';
    });
}

function formatChatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} д`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatMessageDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date >= today) {
        return 'Сегодня';
    } else if (date >= yesterday) {
        return 'Вчера';
    } else {
        return date.toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAddMembersToChat() {
    if (!window.currentChat) return;
    
    window.showNotification('Функция добавления участников будет доступна в следующем обновлении', 'info');
}

function showChatInfo() {
    if (!window.currentChat) return;
    
    const membersList = window.chatUsers.map(user => 
        `• ${user.full_name || user.email}`
    ).join('<br>');
    
    const infoHtml = `
        <div class="chat-info-modal">
            <h3>Информация о чате</h3>
            <p><strong>Название:</strong> ${window.currentChat.name}</p>
            <p><strong>Тип:</strong> ${window.currentChat.is_group ? 'Групповой' : 'Личный'}</p>
            <p><strong>Создан:</strong> ${new Date(window.currentChat.created_at).toLocaleDateString('ru-RU')}</p>
            <p><strong>Участники (${window.chatUsers.length}):</strong><br>${membersList}</p>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Информация о чате</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${infoHtml}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-chat-info">Закрыть</button>
            </div>
        </div>
    `;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = '';
        overlay.appendChild(modal);
        overlay.classList.remove('hidden');
        
        // Закрытие модального окна
        modal.querySelector('.modal-close').addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
        
        modal.querySelector('.close-chat-info').addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Страница загружена, инициализируем чат...');
    
    // Ждем загрузки пользователя
    setTimeout(() => {
        if (window.currentUser) {
            initChatSystem();
        } else {
            console.log('👤 Пользователь не авторизован, чат не инициализирован');
        }
    }, 1000);
});

// Экспортируем функции
window.initChatSystem = initChatSystem;
window.openChat = openChat;
window.createNewChat = createNewChat;

console.log('✅ Chat.js загружен');