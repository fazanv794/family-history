// chats.js - Функции для страницы чатов
console.log('💬 Chats.js загружается...');

// Глобальные переменные
let currentConversationId = null;
let realtimeSubscriptions = [];
let currentConversationName = null;

// Инициализация страницы чатов
async function initChatsPage() {
    console.log('🔄 Инициализация страницы чатов...');
    
    // Обновляем шапку сразу
    updateHeader();
    
    try {
        // Быстрая проверка авторизации без загрузчика
        if (!window.currentUser) {
            const { data: { user } } = await window.supabaseClient?.auth.getUser();
            if (!user) {
                window.showNotification('Пожалуйста, войдите в систему', 'error');
                setTimeout(() => window.location.href = 'auth.html', 1500);
                return;
            }
            window.currentUser = user;
        }
        
        // Обновляем UI пользователя
        updateUserUI();
        
        setupChatEventListeners();
        await loadConversations(true); // Быстрая загрузка без лоадера
        setupRealtimeSubscriptions();
        
    } catch (error) {
        console.error('Ошибка инициализации чатов:', error);
        // Пробуем использовать демо-режим
        if (!window.currentUser && typeof window.loadFromLocalStorage === 'function') {
            window.loadFromLocalStorage();
            setupChatEventListeners();
            await loadConversations(true);
        }
    }
}

// Обновление шапки
function updateHeader() {
    const usernameElements = document.querySelectorAll('#username');
    const avatarElements = document.querySelectorAll('#user-avatar');
    
    if (usernameElements.length > 0) {
        const name = window.currentUser?.user_metadata?.name || 
                    window.currentUser?.email?.split('@')[0] || 
                    'Гость';
        usernameElements.forEach(el => {
            el.textContent = name;
        });
    }
    
    if (avatarElements.length > 0) {
        avatarElements.forEach(el => {
            const name = window.currentUser?.user_metadata?.name || 
                        window.currentUser?.email?.split('@')[0] || 
                        'Г';
            el.textContent = name.substring(0, 1).toUpperCase();
        });
    }
}

// Обновление UI пользователя
function updateUserUI() {
    if (!window.currentUser) return;
    
    const displayName = window.currentUser.user_metadata?.name || 
                       window.currentUser.email?.split('@')[0] || 
                       'Пользователь';
    
    document.querySelectorAll('#username').forEach(el => {
        el.textContent = displayName;
    });
    
    document.querySelectorAll('#user-avatar').forEach(el => {
        el.textContent = getUserInitials(displayName);
    });
}

function getUserInitials(name) {
    return name.substring(0, 2).toUpperCase();
}

// Загрузка списка чатов (без лоадера по умолчанию)
async function loadConversations(showLoader = false) {
    if (showLoader) window.showLoader('Загрузка чатов...');
    
    try {
        const { data: convs, error: convErr } = await window.supabaseClient
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (convErr) throw convErr;
        
        const chatsList = document.getElementById('chats-list');
        if (!chatsList) return;
        
        // Очищаем только если есть новые данные
        chatsList.innerHTML = '';
        
        // Если нет чатов, показываем сообщение
        if (!convs || convs.length === 0) {
            chatsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>Нет чатов. Создайте новый!</p>
                </div>
            `;
            return;
        }
        
        for (const conv of convs) {
            const { data: participants, error: partErr } = await window.supabaseClient
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', conv.id);
            
            if (partErr) continue;
            
            const userIds = participants.map(p => p.user_id);
            const { data: profiles } = await window.supabaseClient
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const profileMap = new Map((profiles || []).map(p => [p.id, p]));
            
            const otherNames = participants
                .filter(p => p.user_id !== window.currentUser?.id)
                .map(p => profileMap.get(p.user_id)?.full_name || 
                         profileMap.get(p.user_id)?.email?.split('@')[0] || 
                         'Пользователь');
            
            const chatName = conv.is_group 
                ? conv.name || `Группа (${otherNames.length})`
                : otherNames[0] || 'Приватный чат';
            
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            if (currentConversationId === conv.id) {
                chatItem.classList.add('active');
            }
            chatItem.dataset.convId = conv.id;
            
            const avatarColor = conv.is_group 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
            
            chatItem.innerHTML = `
                <div class="chat-item-content">
                    <div class="chat-avatar" style="background: ${avatarColor};">
                        ${conv.is_group ? '<i class="fas fa-users"></i>' : chatName.substring(0, 2).toUpperCase()}
                    </div>
                    <div class="chat-info">
                        <h4 class="chat-name">${chatName}</h4>
                        <p class="chat-participants">Участников: ${participants.length}</p>
                    </div>
                </div>
            `;
            
            chatItem.onclick = () => openConversation(conv.id, chatName);
            chatsList.appendChild(chatItem);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
        // Показываем демо-чаты для тестирования
        showDemoChats();
    } finally {
        if (showLoader) window.hideLoader();
    }
}

// Демо-чаты для тестирования
function showDemoChats() {
    const chatsList = document.getElementById('chats-list');
    if (!chatsList) return;
    
    chatsList.innerHTML = '';
    
    const demoChats = [
        { id: 'demo1', name: 'Семейный чат', is_group: true, participants: 5 },
        { id: 'demo2', name: 'Мама', is_group: false, participants: 2 },
        { id: 'demo3', name: 'Папа', is_group: false, participants: 2 }
    ];
    
    demoChats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.dataset.convId = chat.id;
        
        const avatarColor = chat.is_group 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
        
        chatItem.innerHTML = `
            <div class="chat-item-content">
                <div class="chat-avatar" style="background: ${avatarColor};">
                    ${chat.is_group ? '<i class="fas fa-users"></i>' : chat.name.substring(0, 2).toUpperCase()}
                </div>
                <div class="chat-info">
                    <h4 class="chat-name">${chat.name}</h4>
                    <p class="chat-participants">Участников: ${chat.participants}</p>
                </div>
            </div>
        `;
        
        chatItem.onclick = () => openConversation(chat.id, chat.name);
        chatsList.appendChild(chatItem);
    });
}

// Открытие чата (без лоадера)
async function openConversation(convId, chatName) {
    // Убираем активный класс у всех чатов
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Добавляем активный класс к выбранному чату
    const activeChat = document.querySelector(`.chat-item[data-conv-id="${convId}"]`);
    if (activeChat) {
        activeChat.classList.add('active');
    }
    
    currentConversationId = convId;
    currentConversationName = chatName;
    
    const header = document.getElementById('chat-header');
    header.innerHTML = `<h3>${chatName}</h3>`;
    
    // Показываем "Загрузка..." только в заголовке
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '<p class="loading-messages">Загрузка сообщений...</p>';
    
    try {
        await loadMessages(convId);
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        messagesContainer.innerHTML = '<p class="error-messages">Ошибка загрузки сообщений</p>';
        showDemoMessages();
    }
}

// Загрузка сообщений (без лоадера)
async function loadMessages(convId) {
    try {
        const { data: messages, error } = await window.supabaseClient
            .from('messages')
            .select(`*, sender:sender_id (full_name, avatar_url)`)
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        const container = document.getElementById('chat-messages');
        container.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            container.innerHTML = '<p class="no-messages">Нет сообщений. Будьте первым!</p>';
            return;
        }
        
        messages.forEach(msg => appendMessage(msg, false));
        
        // Прокрутка к последнему сообщению
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
        
    } catch (error) {
        throw error;
    }
}

// Добавление одного сообщения
async function appendMessage(msg, scrollToBottom = true) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const isOwn = msg.sender_id === window.currentUser?.id;
    
    // Если контейнер показывает "нет сообщений" или загрузку, очищаем его
    if (container.innerHTML.includes('no-messages') || 
        container.innerHTML.includes('loading-messages') ||
        container.innerHTML.includes('error-messages')) {
        container.innerHTML = '';
    }

    let senderName = 'Аноним';
    let senderInitials = 'А';
    
    if (msg.sender && msg.sender.full_name) {
        senderName = msg.sender.full_name;
        senderInitials = senderName.substring(0, 2).toUpperCase();
    } else if (msg.sender_id) {
        // Пробуем получить данные отправителя
        try {
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('full_name')
                .eq('id', msg.sender_id)
                .single();
            
            if (profile) {
                senderName = profile.full_name;
                senderInitials = senderName.substring(0, 2).toUpperCase();
            }
        } catch (error) {
            console.log('Не удалось получить данные отправителя:', error);
        }
    }

    const messageWrapper = document.createElement('div');
    messageWrapper.className = isOwn ? 'message-wrapper own' : 'message-wrapper other';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    // Аватар для чужих сообщений
    if (!isOwn) {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = senderInitials;
        messageWrapper.appendChild(avatar);
        
        // Имя отправителя для чужих сообщений
        const senderElement = document.createElement('span');
        senderElement.className = 'message-sender';
        senderElement.textContent = senderName;
        messageContent.appendChild(senderElement);
    }

    // Текст сообщения
    const textElement = document.createElement('p');
    textElement.className = 'message-text';
    textElement.textContent = msg.content;
    messageContent.appendChild(textElement);

    // Время отправки
    const timeElement = document.createElement('span');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date(msg.created_at || new Date()).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
    messageContent.appendChild(timeElement);

    messageWrapper.appendChild(messageContent);
    container.appendChild(messageWrapper);
    
    // Прокрутка к последнему сообщению
    if (scrollToBottom) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50);
    }
}

// Демо-сообщения для тестирования
function showDemoMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    container.innerHTML = '';
    
    const demoMessages = [
        { content: 'Привет! Как дела?', isOwn: false, time: '10:30' },
        { content: 'Привет! Всё отлично, спасибо!', isOwn: true, time: '10:32' },
        { content: 'Что нового?', isOwn: false, time: '10:35' },
        { content: 'Создал наше семейное дерево!', isOwn: true, time: '10:40' }
    ];
    
    demoMessages.forEach(msg => {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = msg.isOwn ? 'message-wrapper own' : 'message-wrapper other';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (!msg.isOwn) {
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = 'Д';
            messageWrapper.appendChild(avatar);
            
            const senderElement = document.createElement('span');
            senderElement.className = 'message-sender';
            senderElement.textContent = 'Демо Пользователь';
            messageContent.appendChild(senderElement);
        }

        const textElement = document.createElement('p');
        textElement.className = 'message-text';
        textElement.textContent = msg.content;
        messageContent.appendChild(textElement);

        const timeElement = document.createElement('span');
        timeElement.className = 'message-time';
        timeElement.textContent = msg.time;
        messageContent.appendChild(timeElement);

        messageWrapper.appendChild(messageContent);
        container.appendChild(messageWrapper);
    });
    
    // Прокрутка к последнему сообщению
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Realtime подписки
function setupRealtimeSubscriptions() {
    try {
        // Новые сообщения
        const messagesChannel = window.supabaseClient
            .channel('chat-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                console.log('Realtime: новое сообщение', payload.new);
                if (payload.new.conversation_id === currentConversationId) {
                    appendMessage(payload.new);
                }
            })
            .subscribe();
        
        realtimeSubscriptions.push(messagesChannel);
        
        // Новые чаты
        const conversationsChannel = window.supabaseClient
            .channel('chat-conversations')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'conversations'
            }, () => {
                console.log('Realtime: новый чат');
                loadConversations();
            })
            .subscribe();
        
        realtimeSubscriptions.push(conversationsChannel);
        
    } catch (error) {
        console.error('Ошибка настройки realtime:', error);
    }
}

// Обработчики событий
function setupChatEventListeners() {
    // Форма отправки сообщений
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', sendMessage);
    }
    
    // Форма создания чата
    const createChatForm = document.getElementById('create-chat-form');
    if (createChatForm) {
        createChatForm.addEventListener('submit', createChatFromForm);
    }
    
    // Изменение типа чата
    const chatTypeSelect = document.getElementById('chat-type');
    if (chatTypeSelect) {
        chatTypeSelect.addEventListener('change', (e) => {
            const groupGroup = document.getElementById('group-name-group');
            if (e.target.value === 'group') {
                groupGroup.classList.remove('hidden');
                document.getElementById('group-name').required = true;
            } else {
                groupGroup.classList.add('hidden');
                document.getElementById('group-name').required = false;
            }
        });
    }
    
    // Поиск пользователей
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        let searchTimeout;
        userSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => searchUsers(query), 300);
            } else {
                document.getElementById('user-search-results').innerHTML = '';
            }
        });
    }
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && window.handleLogout) {
        logoutBtn.addEventListener('click', window.handleLogout);
    }
}

// Поиск пользователей
async function searchUsers(query) {
    console.log('[searchUsers] Запрос:', query);

    const container = document.getElementById('user-search-results');
    if (!container) return;

    if (!query || query.length < 2) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = '<p class="search-loading">Поиск...</p>';

    try {
        const { data: users, error } = await window.supabaseClient
            .from('profiles')
            .select('id, full_name, email')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .neq('id', window.currentUser?.id || '')
            .limit(8);

        if (error) throw error;

        container.innerHTML = '';

        if (!users?.length) {
            container.innerHTML = '<p class="no-results">Никто не найден</p>';
            return;
        }

        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-search-item';
            userDiv.dataset.userId = user.id;
            
            const displayName = user.full_name || user.email.split('@')[0];
            const initials = displayName.substring(0, 2).toUpperCase();
            
            userDiv.innerHTML = `
                <div class="user-avatar">
                    ${initials}
                </div>
                <div class="user-info">
                    <div class="user-name">${displayName}</div>
                    <div class="user-email">${user.email}</div>
                </div>
            `;
            
            userDiv.onclick = () => addSelectedUser(user);
            container.appendChild(userDiv);
        });
    } catch (err) {
        console.error('[searchUsers] Ошибка:', err);
        container.innerHTML = '<p class="search-error">Ошибка поиска</p>';
    }
}

// Добавление участника
function addSelectedUser(user) {
    const selected = document.getElementById('selected-users');
    if (!selected) return;

    const exists = [...selected.querySelectorAll('.selected-user-tag')]
        .some(tag => tag.dataset.userId === user.id);
    
    if (exists) {
        window.showNotification('Этот пользователь уже добавлен', 'info');
        return;
    }

    const tag = document.createElement('div');
    tag.className = 'selected-user-tag';
    tag.dataset.userId = user.id;
    
    const displayName = user.full_name || user.email.split('@')[0];
    
    tag.innerHTML = `
        ${displayName}
        <i class="fas fa-times remove-user"></i>
    `;
    
    tag.querySelector('.remove-user').onclick = (e) => {
        e.stopPropagation();
        tag.remove();
    };
    
    selected.appendChild(tag);
}

// Создание чата
async function createChatFromForm(e) {
    e.preventDefault();
    window.showLoader('Создание чата...');
    
    try {
        const type = document.getElementById('chat-type').value;
        const groupName = document.getElementById('group-name').value.trim();
        const selectedUsers = [...document.querySelectorAll('.selected-user-tag')]
            .map(tag => tag.dataset.userId)
            .filter(id => id);
        
        if (!type) throw new Error('Выберите тип чата');
        if (type === 'group' && !groupName) throw new Error('Введите название группы');
        if (selectedUsers.length === 0) throw new Error('Выберите хотя бы одного пользователя');
        if (type === 'private' && selectedUsers.length !== 1) throw new Error('Для приватного чата выберите одного пользователя');
        
        const { data: conv, error: convError } = await window.supabaseClient
            .from('conversations')
            .insert({
                name: type === 'group' ? groupName : null,
                is_group: type === 'group',
                created_by: window.currentUser.id
            })
            .select()
            .single();
        
        if (convError) throw convError;
        
        const participants = [
            { conversation_id: conv.id, user_id: window.currentUser.id },
            ...selectedUsers.map(id => ({ conversation_id: conv.id, user_id: id }))
        ];
        
        const { error: partError } = await window.supabaseClient
            .from('conversation_participants')
            .insert(participants);
        
        if (partError) throw partError;
        
        window.showNotification('✅ Чат создан!', 'success');
        window.closeAllModals();
        
        // Сбрасываем форму
        e.target.reset();
        document.getElementById('selected-users').innerHTML = '';
        document.getElementById('user-search-results').innerHTML = '';
        document.getElementById('group-name-group').classList.add('hidden');
        
        // Обновляем список чатов
        await loadConversations();
        
        // Открываем созданный чат
        setTimeout(() => {
            const chatName = type === 'group' ? groupName : 'Новый чат';
            openConversation(conv.id, chatName);
        }, 500);
        
    } catch (error) {
        console.error('Ошибка создания чата:', error);
        window.showNotification('Ошибка: ' + (error.message || 'проверьте консоль'), 'error');
    } finally {
        window.hideLoader();
    }
}

// Отправка сообщения (С ИСПРАВЛЕНИЕМ ДЛЯ МГНОВЕННОГО ОТОБРАЖЕНИЯ)
async function sendMessage(e) {
    e.preventDefault();
    
    if (!currentConversationId) {
        window.showNotification('Выберите чат', 'error');
        return;
    }
    
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    
    if (!content) {
        window.showNotification('Введите сообщение', 'error');
        return;
    }
    
    // Создаем временное сообщение для мгновенного отображения
    const tempMessage = {
        id: 'temp-' + Date.now(),
        content: content,
        sender_id: window.currentUser?.id,
        conversation_id: currentConversationId,
        created_at: new Date().toISOString(),
        sender: {
            full_name: window.currentUser?.user_metadata?.name || window.currentUser?.email?.split('@')[0]
        }
    };
    
    // Немедленно показываем сообщение
    appendMessage(tempMessage);
    
    // Очищаем поле ввода
    input.value = '';
    input.focus();
    
    try {
        // Отправляем на сервер
        const { data, error } = await window.supabaseClient
            .from('messages')
            .insert({
                conversation_id: currentConversationId,
                sender_id: window.currentUser.id,
                content: content
            })
            .select(`*, sender:sender_id (full_name, avatar_url)`)
            .single();
        
        if (error) throw error;
        
        // Удаляем временное сообщение и добавляем настоящее
        const tempMsgElement = document.querySelector(`[data-temp-id="${tempMessage.id}"]`);
        if (tempMsgElement) {
            tempMsgElement.remove();
        }
        
        // Добавляем сообщение с сервера (если realtime не сработало)
        setTimeout(() => {
            const existingMsg = document.querySelector(`[data-message-id="${data.id}"]`);
            if (!existingMsg) {
                appendMessage(data);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        
        // Показываем ошибку для временного сообщения
        const tempMsgElement = document.querySelector(`[data-temp-id="${tempMessage.id}"]`);
        if (tempMsgElement) {
            tempMsgElement.classList.add('error');
            const errorSpan = document.createElement('span');
            errorSpan.className = 'message-error';
            errorSpan.textContent = ' (не отправлено)';
            tempMsgElement.querySelector('.message-text').appendChild(errorSpan);
        }
        
        window.showNotification('Ошибка отправки сообщения', 'error');
    }
}

// Обновляем функцию appendMessage для поддержки временных сообщений
function appendMessageWithTemp(msg, scrollToBottom = true) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const isOwn = msg.sender_id === window.currentUser?.id;
    
    // Если контейнер показывает "нет сообщений" или загрузку, очищаем его
    if (container.innerHTML.includes('no-messages') || 
        container.innerHTML.includes('loading-messages') ||
        container.innerHTML.includes('error-messages')) {
        container.innerHTML = '';
    }

    let senderName = 'Аноним';
    let senderInitials = 'А';
    
    if (msg.sender && msg.sender.full_name) {
        senderName = msg.sender.full_name;
        senderInitials = senderName.substring(0, 2).toUpperCase();
    }

    const messageWrapper = document.createElement('div');
    messageWrapper.className = isOwn ? 'message-wrapper own' : 'message-wrapper other';
    if (msg.id && msg.id.startsWith('temp-')) {
        messageWrapper.dataset.tempId = msg.id;
    } else if (msg.id) {
        messageWrapper.dataset.messageId = msg.id;
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    // Аватар для чужих сообщений
    if (!isOwn) {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = senderInitials;
        messageWrapper.appendChild(avatar);
        
        // Имя отправителя для чужих сообщений
        const senderElement = document.createElement('span');
        senderElement.className = 'message-sender';
        senderElement.textContent = senderName;
        messageContent.appendChild(senderElement);
    }

    // Текст сообщения
    const textElement = document.createElement('p');
    textElement.className = 'message-text';
    textElement.textContent = msg.content;
    messageContent.appendChild(textElement);

    // Время отправки
    const timeElement = document.createElement('span');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date(msg.created_at || new Date()).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
    messageContent.appendChild(timeElement);

    messageWrapper.appendChild(messageContent);
    container.appendChild(messageWrapper);
    
    // Прокрутка к последнему сообщению
    if (scrollToBottom) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50);
    }
}

// Переопределяем appendMessage
window.appendMessage = appendMessageWithTemp;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Страница чатов загружена');
    
    // Фикс для шапки - обновляем сразу
    updateHeader();
    
    // Инициализируем чаты
    setTimeout(() => {
        if (typeof initChatsPage === 'function') {
            initChatsPage();
        } else {
            console.log('⚠️ Запуск базовой инициализации');
            
            // Проверяем авторизацию
            if (window.supabaseClient) {
                window.supabaseClient.auth.getUser().then(({ data: { user } }) => {
                    if (user) {
                        window.currentUser = user;
                        updateHeader();
                        setupChatEventListeners();
                        showDemoChats();
                        showDemoMessages();
                    }
                });
            } else {
                // Демо-режим
                window.currentUser = {
                    email: 'demo@example.com',
                    user_metadata: { name: 'Демо Пользователь' }
                };
                updateHeader();
                setupChatEventListeners();
                showDemoChats();
                showDemoMessages();
            }
        }
    }, 100);
});

// Закрытие подписок
window.addEventListener('beforeunload', () => {
    realtimeSubscriptions.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
            sub.unsubscribe();
        }
    });
});

// Экспорт функций
window.initChatsPage = initChatsPage;
window.searchUsers = searchUsers;
window.addSelectedUser = addSelectedUser;

console.log('✅ Chats.js загружен');