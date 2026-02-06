// chats.js - Функции для страницы чатов
console.log('💬 Chats.js загружается...');

// Глобальные переменные
let currentConversationId = null;
let realtimeSubscriptions = [];

// Инициализация страницы чатов
async function initChatsPage() {
    console.log('🔄 Инициализация страницы чатов...');
    
    await window.loadUserData();
    if (!window.currentUser) {
        window.showNotification('Пожалуйста, войдите в систему', 'error');
        setTimeout(() => window.location.href = 'auth.html', 1500);
        return;
    }
    
    setupChatEventListeners();
    await loadConversations();
    setupRealtimeSubscriptions();
}

// Загрузка списка чатов
async function loadConversations() {
    window.showLoader('Загрузка чатов...');
    
    try {
        const { data: convs, error: convErr } = await window.supabaseClient
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (convErr) throw convErr;
        
        const chatsList = document.getElementById('chats-list');
        chatsList.innerHTML = '';
        
        for (const conv of convs || []) {
            const { data: participants, error: partErr } = await window.supabaseClient
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', conv.id);
            
            if (partErr) {
                console.warn('Ошибка участников', conv.id, partErr);
                continue;
            }
            
            const userIds = participants.map(p => p.user_id);
            const { data: profiles, error: profErr } = await window.supabaseClient
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            if (profErr) {
                console.warn('Ошибка профилей', profErr);
                continue;
            }
            
            const profileMap = new Map(profiles.map(p => [p.id, p]));
            
            const otherNames = participants
                .filter(p => p.user_id !== window.currentUser.id)
                .map(p => profileMap.get(p.user_id)?.full_name || profileMap.get(p.user_id)?.email?.split('@')[0] || 'Пользователь');
            
            const chatName = conv.is_group 
                ? conv.name || `Группа (${otherNames.length} чел.)`
                : otherNames[0] || 'Приватный чат';
            
            // Создаем элемент чата с классами вместо инлайн-стилей
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.convId = conv.id;
            
            const avatarColor = conv.is_group ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
            
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
        
        if (convs.length === 0) {
            chatsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments" style="font-size: 4rem; color: #cbd5e0; margin-bottom: 20px;"></i>
                    <p style="text-align: center; color: #718096; padding: 20px;">Нет чатов. Создайте новый!</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
        window.showNotification('Ошибка загрузки чатов', 'error');
    } finally {
        window.hideLoader();
    }
}

// Открытие чата
async function openConversation(convId, chatName) {
    currentConversationId = convId;
    
    // Убираем активный класс у всех чатов
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Добавляем активный класс к выбранному чату
    const activeChat = document.querySelector(`.chat-item[data-conv-id="${convId}"]`);
    if (activeChat) {
        activeChat.classList.add('active');
    }
    
    const header = document.getElementById('chat-header');
    header.innerHTML = `<h3>${chatName}</h3>`;
    
    await loadMessages(convId);
    
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

// Добавление одного сообщения
async function appendMessage(msg) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    let sender = msg.sender || {};

    // Если sender пустой, подгружаем по sender_id
    if (!sender.full_name && msg.sender_id) {
        const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('full_name, avatar_url, email')
            .eq('id', msg.sender_id)
            .single();
        
        if (profile) {
            sender = profile;
        }
    }

    const isOwn = msg.sender_id === window.currentUser.id;
    const senderName = sender.full_name || sender.email?.split('@')[0] || 'Аноним';
    const senderInitials = senderName.substring(0, 2).toUpperCase();

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
    }

    // Имя отправителя для чужих сообщений
    if (!isOwn) {
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
    timeElement.textContent = new Date(msg.created_at).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
    messageContent.appendChild(timeElement);

    messageWrapper.appendChild(messageContent);
    container.appendChild(messageWrapper);
    
    // Прокрутка к последнему сообщению
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}

// Загрузка всех сообщений при открытии чата
async function loadMessages(convId) {
    window.showLoader('Загрузка сообщений...');
    
    try {
        const { data: messages, error } = await window.supabaseClient
            .from('messages')
            .select(`*, sender:sender_id (full_name, avatar_url)`)
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        const container = document.getElementById('chat-messages');
        container.innerHTML = '';
        
        messages.forEach(msg => appendMessage(msg));
        
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        window.showNotification('Ошибка загрузки сообщений', 'error');
    } finally {
        window.hideLoader();
    }
}

// Realtime подписки
function setupRealtimeSubscriptions() {
    // Новые чаты
    window.supabaseClient
        .channel('conversations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
            console.log('Realtime: обновление списка чатов');
            loadConversations();
        })
        .subscribe();

    // Новые сообщения
    window.supabaseClient
        .channel('messages')
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
}

// Обработчики событий
function setupChatEventListeners() {
    document.getElementById('chat-form')?.addEventListener('submit', sendMessage);
    document.getElementById('create-chat-form')?.addEventListener('submit', createChatFromForm);
    
    document.getElementById('chat-type')?.addEventListener('change', (e) => {
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
            .select('id, full_name, email, avatar_url')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .neq('id', window.currentUser?.id || '')
            .limit(8);

        console.log('[searchUsers] Ответ:', users, error);

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
            
            const initials = (user.full_name || user.email)[0].toUpperCase();
            
            userDiv.innerHTML = `
                <div class="user-avatar">
                    ${initials}
                </div>
                <div class="user-info">
                    <div class="user-name">${user.full_name || user.email.split('@')[0]}</div>
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

    // Проверяем, не добавлен ли уже пользователь
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
    
    // Обработчик удаления пользователя
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
        
        console.log('Выбранные пользователи:', selectedUsers);
        
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
        
        await loadConversations();
        
    } catch (error) {
        console.error('Ошибка создания чата:', error);
        window.showNotification('Ошибка: ' + (error.message || 'проверьте консоль'), 'error');
    } finally {
        window.hideLoader();
    }
}

// Отправка сообщения
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
    
    try {
        const { error } = await window.supabaseClient
            .from('messages')
            .insert({
                conversation_id: currentConversationId,
                sender_id: window.currentUser.id,
                content: content
            });
        
        if (error) throw error;
        
        input.value = '';
        input.focus();
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        window.showNotification('Ошибка отправки', 'error');
    }
}

// Дополнительные стили (добавьте их в style.css)
function addChatStyles() {
    if (!document.getElementById('chat-styles')) {
        const style = document.createElement('style');
        style.id = 'chat-styles';
        style.textContent = `
            .search-loading,
            .no-results,
            .search-error {
                text-align: center;
                padding: 20px;
                color: #718096;
                font-style: italic;
            }
            
            .search-error {
                color: #f56565;
            }
            
            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #718096;
            }
            
            .chat-item.active {
                background: #ebf8ff;
                border-left: 4px solid #4299e1;
            }
        `;
        document.head.appendChild(style);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Страница чатов загружена');
    
    // Добавляем стили
    addChatStyles();
    
    // Ждем загрузки основных скриптов
    setTimeout(() => {
        if (typeof initChatsPage === 'function') {
            initChatsPage();
        } else {
            console.log('⚠️ Функция initChatsPage не найдена, запускаем базовую инициализацию');
            
            // Базовая инициализация
            if (typeof window.loadUserData === 'function') {
                window.loadUserData().then(() => {
                    setupChatEventListeners();
                    if (window.currentUser) {
                        window.showNotification('Чаты готовы к использованию', 'info');
                    }
                });
            }
        }
    }, 100);
});

// Закрытие подписок при закрытии страницы
window.addEventListener('beforeunload', () => {
    realtimeSubscriptions.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
            sub.unsubscribe();
        }
    });
});

// Экспорт функций для глобального доступа
window.initChatsPage = initChatsPage;
window.searchUsers = searchUsers;
window.addSelectedUser = addSelectedUser;

console.log('✅ Chats.js загружен');