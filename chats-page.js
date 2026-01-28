// chats-page.js - Полноценная система чатов для chats.html
console.log('💬 Chats-page.js загружается...');

// Глобальные переменные
let currentChat = null;
let chatMessages = [];
let availableUsers = [];
let realtimeSubscription = null;

// Основная инициализация
async function initChatsPage() {
    console.log('🚀 Инициализация страницы чатов...');
    
    try {
        await window.loadUserData();
        await loadAllUsers();
        await loadUserChats();
        setupEventListeners();
        
        // Подписываемся на обновления в реальном времени
        setupRealtimeUpdates();
        
        console.log('✅ Страница чатов инициализирована');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации чатов:', error);
        window.showNotification('Ошибка загрузки чатов', 'error');
    }
}

// Загрузка всех пользователей
async function loadAllUsers() {
    console.log('👥 Загрузка всех пользователей...');
    
    if (!window.supabaseClient || !window.currentUser) {
        console.warn('⚠️ Supabase не готов или пользователь не авторизован');
        return;
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('id, email, full_name')
            .neq('id', window.currentUser.id)
            .order('full_name', { ascending: true })
            .limit(50);
        
        if (error) throw error;
        
        availableUsers = data || [];
        console.log(`✅ Загружено пользователей: ${availableUsers.length}`);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки пользователей:', error);
        // Демо-пользователи для отладки
        availableUsers = [
            { id: 'user1', email: 'user1@example.com', full_name: 'Александр Иванов' },
            { id: 'user2', email: 'user2@example.com', full_name: 'Мария Петрова' },
            { id: 'user3', email: 'user3@example.com', full_name: 'Дмитрий Сидоров' },
            { id: 'user4', email: 'user4@example.com', full_name: 'Елена Козлова' }
        ];
    }
}

// Загрузка чатов пользователя
async function loadUserChats() {
    console.log('📥 Загрузка чатов пользователя...');
    
    if (!window.supabaseClient || !window.currentUser) {
        console.warn('⚠️ Supabase не готов или пользователь не авторизован');
        updateChatsList([]);
        return;
    }
    
    try {
        window.showLoader('Загрузка чатов...');
        
        // 1. Получаем чаты, где пользователь является участником
        const { data: chatMembers, error: membersError } = await window.supabaseClient
            .from('chat_members')
            .select('chat_id')
            .eq('user_id', window.currentUser.id);
        
        if (membersError) throw membersError;
        
        if (!chatMembers || chatMembers.length === 0) {
            updateChatsList([]);
            return;
        }
        
        // 2. Получаем информацию о каждом чате
        const chatIds = chatMembers.map(m => m.chat_id);
        
        const { data: chats, error: chatsError } = await window.supabaseClient
            .from('chats')
            .select('*')
            .in('id', chatIds)
            .order('updated_at', { ascending: false });
        
        if (chatsError) throw chatsError;
        
        // 3. Обогащаем каждый чат дополнительной информацией
        const enrichedChats = await Promise.all(
            chats.map(async (chat) => {
                // Участники
                const { data: members } = await window.supabaseClient
                    .from('chat_members')
                    .select('user_id')
                    .eq('chat_id', chat.id);
                
                // Последнее сообщение
                const { data: lastMessage } = await window.supabaseClient
                    .from('messages')
                    .select('content, created_at, sender_id')
                    .eq('chat_id', chat.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                // Непрочитанные сообщения
                const { count: unreadCount } = await window.supabaseClient
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('chat_id', chat.id)
                    .neq('sender_id', window.currentUser.id);
                
                return {
                    ...chat,
                    members_count: members?.length || 1,
                    last_message: lastMessage?.content || 'Нет сообщений',
                    last_message_time: lastMessage?.created_at || chat.updated_at,
                    unread_count: unreadCount || 0
                };
            })
        );
        
        updateChatsList(enrichedChats);
        console.log(`✅ Загружено чатов: ${enrichedChats.length}`);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки чатов:', error);
        updateChatsList([]);
        window.showNotification('Ошибка загрузки чатов', 'error');
    } finally {
        window.hideLoader();
    }
}

// Обновление списка чатов в UI
function updateChatsList(chats) {
    const container = document.getElementById('chats-list');
    if (!container) return;
    
    if (!chats || chats.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments" style="font-size: 4rem; color: #cbd5e0; margin-bottom: 20px;"></i>
                <h3 style="color: #4a5568; margin-bottom: 10px;">Чатов пока нет</h3>
                <p style="color: #718096; text-align: center; margin-bottom: 20px;">
                    Создайте новый чат или вас пригласят в существующий
                </p>
                <button class="btn" id="create-first-chat-btn">
                    <i class="fas fa-plus"></i> Создать первый чат
                </button>
            </div>
        `;
        
        document.getElementById('create-first-chat-btn')?.addEventListener('click', showCreateChatModal);
        return;
    }
    
    let html = '';
    chats.forEach(chat => {
        const timeAgo = formatTimeAgo(chat.last_message_time);
        const isGroup = chat.is_group;
        const previewText = truncateText(chat.last_message, 40);
        const membersText = chat.members_count === 1 ? '1 участник' : `${chat.members_count} участника`;
        
        html += `
            <div class="chat-list-item ${currentChat?.id === chat.id ? 'active' : ''}" data-chat-id="${chat.id}">
                <div class="chat-avatar" style="background: ${isGroup ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};">
                    ${isGroup ? '<i class="fas fa-users"></i>' : '<i class="fas fa-user"></i>'}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${escapeHtml(chat.name)}</div>
                    <div class="chat-preview">${escapeHtml(previewText)}</div>
                    <div class="chat-details">
                        <span class="chat-members">${membersText}</span>
                        <span class="chat-time">${timeAgo}</span>
                    </div>
                </div>
                ${chat.unread_count > 0 ? `
                    <span class="unread-badge">${chat.unread_count > 99 ? '99+' : chat.unread_count}</span>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Добавляем обработчики кликов
    document.querySelectorAll('.chat-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const chatId = item.dataset.chatId;
            const chat = chats.find(c => c.id === chatId);
            if (chat) openChat(chat);
        });
    });
}

// Открытие чата
async function openChat(chat) {
    console.log(`💬 Открытие чата: ${chat.name}`);
    
    try {
        window.showLoader('Загрузка чата...');
        
        currentChat = chat;
        
        // Обновляем UI
        document.getElementById('chat-empty-state').style.display = 'none';
        document.getElementById('chat-room').style.display = 'flex';
        document.getElementById('current-chat-name').textContent = chat.name;
        document.getElementById('current-chat-members').textContent = 
            `${chat.members_count} участник${chat.members_count === 1 ? '' : 'а'}`;
        
        // Обновляем список чатов (подсвечиваем активный)
        document.querySelectorAll('.chat-list-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.chat-list-item[data-chat-id="${chat.id}"]`)?.classList.add('active');
        
        // Загружаем сообщения
        await loadChatMessages(chat.id);
        
        // Загружаем участников
        await loadChatMembers(chat.id);
        
        // Подписываемся на новые сообщения
        subscribeToChatMessages(chat.id);
        
        // Помечаем как прочитанные
        await markChatAsRead(chat.id);
        
        // Обновляем список чатов (убираем бейдж)
        await loadUserChats();
        
        // Фокусируемся на поле ввода
        setTimeout(() => {
            document.getElementById('message-input')?.focus();
        }, 100);
        
    } catch (error) {
        console.error('❌ Ошибка открытия чата:', error);
        window.showNotification('Ошибка загрузки чата', 'error');
    } finally {
        window.hideLoader();
    }
}

// Загрузка сообщений чата
async function loadChatMessages(chatId) {
    if (!window.supabaseClient) return;
    
    try {
        const { data, error } = await window.supabaseClient
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
        
        if (error) throw error;
        
        chatMessages = data || [];
        updateChatMessages();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
        chatMessages = [];
        updateChatMessages();
    }
}

// Обновление сообщений в UI
function updateChatMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-slash" style="font-size: 3rem; color: #cbd5e0;"></i>
                <p style="color: #718096; margin-top: 15px;">Нет сообщений</p>
                <p style="color: #a0aec0; font-size: 0.9rem;">Начните общение первым!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    let lastDate = null;
    
    chatMessages.forEach(message => {
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
                ${!isOwnMessage ? `<div class="message-sender">${escapeHtml(senderName)}</div>` : ''}
                <div class="message-content">
                    <div class="message-text">${escapeHtml(message.content)}</div>
                    <div class="message-time">${timeStr}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Прокручиваем вниз
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Загрузка участников чата
async function loadChatMembers(chatId) {
    if (!window.supabaseClient) return;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('chat_members')
            .select(`
                user_id,
                profiles:user_id (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('chat_id', chatId);
        
        if (error) throw error;
        
        if (data) {
            currentChat.members = data.map(m => m.profiles);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки участников:', error);
    }
}

// Отправка сообщения
async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input?.value.trim();
    
    if (!content || !currentChat || !window.supabaseClient || !window.currentUser) {
        window.showNotification('Введите сообщение', 'error');
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('messages')
            .insert([{
                chat_id: currentChat.id,
                sender_id: window.currentUser.id,
                content: content
            }]);
        
        if (error) throw error;
        
        // Обновляем время последнего сообщения в чате
        await window.supabaseClient
            .from('chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', currentChat.id);
        
        // Очищаем поле ввода
        input.value = '';
        
        // Перефокусируемся
        input.focus();
        
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
        window.showNotification('Ошибка отправки сообщения', 'error');
    }
}

// Создание нового чата
async function createNewChat(chatName, isGroup, userIds) {
    if (!window.supabaseClient || !window.currentUser) return;
    
    try {
        window.showLoader('Создание чата...');
        
        // 1. Создаем чат
        const { data: chat, error: chatError } = await window.supabaseClient
            .from('chats')
            .insert([{
                name: chatName,
                is_group: isGroup,
                owner_id: window.currentUser.id,
                description: isGroup ? 'Групповой чат' : 'Личный чат'
            }])
            .select()
            .single();
        
        if (chatError) throw chatError;
        
        // 2. Добавляем участников
        const members = [
            { chat_id: chat.id, user_id: window.currentUser.id }
        ];
        
        userIds.forEach(userId => {
            members.push({ chat_id: chat.id, user_id: userId });
        });
        
        const { error: membersError } = await window.supabaseClient
            .from('chat_members')
            .insert(members);
        
        if (membersError) throw membersError;
        
        // 3. Отправляем приветственное сообщение
        await window.supabaseClient
            .from('messages')
            .insert([{
                chat_id: chat.id,
                sender_id: window.currentUser.id,
                content: 'Чат создан! Привет всем участникам!'
            }]);
        
        window.showNotification(`Чат "${chatName}" создан!`, 'success');
        
        // 4. Обновляем список чатов
        await loadUserChats();
        
        // 5. Открываем созданный чат
        openChat(chat);
        
    } catch (error) {
        console.error('❌ Ошибка создания чата:', error);
        window.showNotification('Ошибка создания чата', 'error');
    } finally {
        window.hideLoader();
    }
}

// Подписка на обновления в реальном времени
function setupRealtimeUpdates() {
    if (!window.supabaseClient || !window.currentUser) return;
    
    // Отписываемся от старой подписки
    if (realtimeSubscription) {
        window.supabaseClient.removeChannel(realtimeSubscription);
    }
    
    // Подписываемся на обновления чатов, где пользователь участник
    realtimeSubscription = window.supabaseClient
        .channel('global_chat_updates')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'chats' 
            }, 
            async (payload) => {
                console.log('🔄 Обновление чатов:', payload.eventType);
                await loadUserChats();
            }
        )
        .subscribe();
    
    console.log('🔔 Подписка на обновления установлена');
}

// Подписка на сообщения конкретного чата
function subscribeToChatMessages(chatId) {
    if (!window.supabaseClient) return;
    
    // Создаем подписку только на этот чат
    const chatSubscription = window.supabaseClient
        .channel(`chat:${chatId}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `chat_id=eq.${chatId}`
            }, 
            async (payload) => {
                console.log('💬 Новое сообщение:', payload.new);
                
                // Добавляем сообщение в список
                chatMessages.push(payload.new);
                updateChatMessages();
                
                // Помечаем как прочитанное если отправитель не текущий пользователь
                if (payload.new.sender_id !== window.currentUser?.id) {
                    await markMessageAsRead(payload.new.id);
                }
            }
        )
        .subscribe();
    
    // Сохраняем подписку для отписки при смене чата
    if (window.currentChatSubscription) {
        window.supabaseClient.removeChannel(window.currentChatSubscription);
    }
    window.currentChatSubscription = chatSubscription;
}

// Пометить сообщение как прочитанное
async function markMessageAsRead(messageId) {
    if (!window.supabaseClient || !window.currentUser) return;
    
    try {
        // В простой реализации можно обновить бейдж
        // В более сложной - добавить в read_by массив
        await loadUserChats();
        
    } catch (error) {
        console.error('Ошибка отметки сообщения:', error);
    }
}

// Пометить весь чат как прочитанный
async function markChatAsRead(chatId) {
    if (!window.supabaseClient || !window.currentUser) return;
    
    try {
        // В простой реализации обновляем бейдж через перезагрузку
        await loadUserChats();
        
    } catch (error) {
        console.error('Ошибка отметки чата:', error);
    }
}

// Показать модальное окно создания чата
function showCreateChatModal() {
    const modalHtml = `
        <div class="modal show">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Создать новый чат</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="create-chat-form">
                        <div class="form-group">
                            <label for="chat-name">Название чата *</label>
                            <input type="text" id="chat-name" placeholder="Например: Семейный чат" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Тип чата</label>
                            <div style="display: flex; gap: 20px; margin-top: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="radio" name="chat-type" value="private" checked>
                                    <span>Личный (с одним человеком)</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="radio" name="chat-type" value="group">
                                    <span>Групповой</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Выберите участников</label>
                            <div id="chat-users-search" style="margin-bottom: 15px;">
                                <input type="text" id="search-users" placeholder="Поиск по имени или email..." style="width: 100%; padding: 10px;">
                            </div>
                            <div id="available-users-list" style="
                                border: 1px solid #e2e8f0;
                                border-radius: 8px;
                                max-height: 200px;
                                overflow-y: auto;
                                padding: 10px;
                            ">
                                ${renderAvailableUsers()}
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
                                <!-- Выбранные пользователи будут здесь -->
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary cancel-btn">
                                Отмена
                            </button>
                            <button type="submit" class="btn">
                                <i class="fas fa-plus-circle"></i> Создать чат
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    const overlay = document.getElementById('modal-overlay');
    overlay.innerHTML = modalHtml;
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
    
    // Настраиваем обработчики
    const form = document.getElementById('create-chat-form');
    form.addEventListener('submit', handleCreateChatSubmit);
    
    const searchInput = document.getElementById('search-users');
    searchInput.addEventListener('input', filterAvailableUsers);
    
    // Инициализируем выбор пользователей
    initUserSelection();
}

// Рендер доступных пользователей
function renderAvailableUsers(users = availableUsers) {
    if (!users || users.length === 0) {
        return '<p style="color: #718096; text-align: center; padding: 20px;">Пользователи не найдены</p>';
    }
    
    return users.map(user => `
        <div class="user-select-item" data-user-id="${user.id}" style="
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            cursor: pointer;
            transition: background 0.3s;
        ">
            <input type="checkbox" class="user-checkbox" data-user-id="${user.id}" style="margin-right: 8px;">
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
                flex-shrink: 0;
            ">
                ${getUserInitials(user.full_name || user.email)}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #2d3748;">${user.full_name || user.email}</div>
                <div style="font-size: 0.85rem; color: #718096;">${user.email}</div>
            </div>
        </div>
    `).join('');
}

// Получение инициалов
function getUserInitials(name) {
    const parts = name.split(' ');
    let initials = '';
    
    if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1) {
        initials = parts[0].substring(0, 2).toUpperCase();
    }
    
    return initials || '?';
}

// Инициализация выбора пользователей
function initUserSelection() {
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const userId = this.dataset.userId;
            const user = availableUsers.find(u => u.id === userId);
            
            if (this.checked) {
                addSelectedUser(user);
            } else {
                removeSelectedUser(userId);
            }
        });
    });
    
    document.querySelectorAll('.user-select-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.classList.contains('user-checkbox')) {
                const checkbox = this.querySelector('.user-checkbox');
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });
}

// Добавление пользователя в выбранные
function addSelectedUser(user) {
    const container = document.getElementById('selected-users-list');
    if (!container) return;
    
    // Проверяем, не добавлен ли уже
    if (container.querySelector(`[data-user-id="${user.id}"]`)) return;
    
    const userHtml = `
        <div class="selected-user" data-user-id="${user.id}" style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: white;
            padding: 6px 12px;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            margin: 4px;
            font-size: 0.9rem;
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
            <span>${user.full_name || user.email}</span>
            <button type="button" class="remove-user-btn" data-user-id="${user.id}" style="
                background: #fed7d7;
                color: #c53030;
                border: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 0.8rem;
                margin-left: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                &times;
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', userHtml);
    
    // Обработчик удаления
    const removeBtn = container.querySelector(`.remove-user-btn[data-user-id="${user.id}"]`);
    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        removeSelectedUser(user.id);
        
        // Снимаем чекбокс
        const checkbox = document.querySelector(`.user-checkbox[data-user-id="${user.id}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
    });
}

// Удаление пользователя из выбранных
function removeSelectedUser(userId) {
    const userEl = document.querySelector(`.selected-user[data-user-id="${userId}"]`);
    if (userEl) {
        userEl.remove();
    }
}

// Фильтрация доступных пользователей
function filterAvailableUsers() {
    const searchTerm = document.getElementById('search-users')?.value.toLowerCase() || '';
    const container = document.getElementById('available-users-list');
    
    if (!searchTerm) {
        container.innerHTML = renderAvailableUsers(availableUsers);
        initUserSelection();
        return;
    }
    
    const filteredUsers = availableUsers.filter(user => 
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm)) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    
    container.innerHTML = renderAvailableUsers(filteredUsers);
    initUserSelection();
}

// Обработка создания чата
async function handleCreateChatSubmit(e) {
    e.preventDefault();
    
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
    
    const userIds = Array.from(selectedUsers).map(user => user.dataset.userId);
    
    // Закрываем модальное окно
    window.closeAllModals();
    
    // Создаем чат
    await createNewChat(chatName, chatType === 'group', userIds);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Создание чата
    document.getElementById('create-chat-btn')?.addEventListener('click', showCreateChatModal);
    
    // Отправка сообщения
    document.getElementById('send-message-btn')?.addEventListener('click', sendMessage);
    
    // Enter для отправки сообщения
    document.getElementById('message-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Поиск чатов
    document.getElementById('search-chats')?.addEventListener('input', searchChats);
    
    // Информация о чате
    document.getElementById('chat-info-btn')?.addEventListener('click', showChatInfo);
}

// Поиск чатов
function searchChats() {
    const searchTerm = document.getElementById('search-chats')?.value.toLowerCase() || '';
    const items = document.querySelectorAll('.chat-list-item');
    
    items.forEach(item => {
        const name = item.querySelector('.chat-name').textContent.toLowerCase();
        const preview = item.querySelector('.chat-preview').textContent.toLowerCase();
        
        item.style.display = (name.includes(searchTerm) || preview.includes(searchTerm)) ? 'flex' : 'none';
    });
}

// Информация о чате
function showChatInfo() {
    if (!currentChat) return;
    
    let info = `Название: ${currentChat.name}\n`;
    info += `Тип: ${currentChat.is_group ? 'Групповой' : 'Личный'}\n`;
    info += `Участников: ${currentChat.members_count}\n\n`;
    
    if (currentChat.members) {
        info += 'Участники:\n';
        currentChat.members.forEach(member => {
            const isYou = member.id === window.currentUser?.id;
            info += `• ${member.full_name || member.email}${isYou ? ' (Вы)' : ''}\n`;
        });
    }
    
    alert(info);
}

// Вспомогательные функции
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин`;
    if (diffHours < 24) return `${diffHours} ч`;
    if (diffDays < 7) return `${diffDays} д`;
    
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
            month: 'long' 
        });
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Автоматическая инициализация при загрузке страницы
if (document.getElementById('chats-page')) {
    document.addEventListener('DOMContentLoaded', initChatsPage);
}

// Экспорт функций
window.initChatsPage = initChatsPage;
window.openChat = openChat;
window.sendMessage = sendMessage;
window.createNewChat = createNewChat;

console.log('✅ Chats-page.js загружен');