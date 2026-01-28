// chats.js - Функции для страницы чатов
console.log('💬 Chats.js загружается...');

// Глобальные переменные
let currentConversationId = null;
let realtimeSubscriptions = [];

// Инициализация страницы чатов
async function initChatsPage() {
    console.log('🔄 Инициализация страницы чатов...');
    
    // Проверяем авторизацию
    await window.loadUserData();
    if (!window.currentUser) {
        window.showNotification('Пожалуйста, войдите в систему', 'error');
        setTimeout(() => window.location.href = 'auth.html', 1500);
        return;
    }
    
    // Настраиваем обработчики
    setupChatEventListeners();
    
    // Загружаем чаты
    await loadConversations();
    
    // Настраиваем realtime
    setupRealtimeSubscriptions();
}

// Загрузка списка чатов
async function loadConversations() {
    window.showLoader('Загрузка чатов...');
    
    try {
        // 1. Получаем все чаты пользователя (conversation + базовые поля)
        const { data: convs, error: convErr } = await window.supabaseClient
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (convErr) throw convErr;
        
        const chatsList = document.getElementById('chats-list');
        chatsList.innerHTML = '';
        
        for (const conv of convs) {
            // 2. Получаем участников этого чата
            const { data: participants, error: partErr } = await window.supabaseClient
                .from('conversation_participants')
                .select('user_id, profiles!inner(id, full_name, avatar_url)')
                .eq('conversation_id', conv.id);
            
            if (partErr) {
                console.warn('Ошибка участников для чата', conv.id, partErr);
                continue;
            }
            
            // Формируем имена участников (исключаем себя)
            const otherNames = participants
                .filter(p => p.user_id !== window.currentUser.id)
                .map(p => p.profiles?.full_name || p.profiles?.email?.split('@')[0] || 'Пользователь');
            
            const chatName = conv.is_group 
                ? conv.name || `Группа (${otherNames.length} чел.)`
                : otherNames[0] || 'Приватный чат';
            
            const participantCount = participants.length;
            
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.style = 'padding: 15px; border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: background 0.3s;';
            chatItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div class="avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        ${conv.is_group ? '<i class="fas fa-users"></i>' : chatName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h4 style="margin: 0; color: #2d3748;">${chatName}</h4>
                        <p style="margin: 0; color: #718096; font-size: 0.9rem;">
                            Участников: ${participantCount}
                        </p>
                    </div>
                </div>
            `;
            chatItem.onclick = () => openConversation(conv.id, chatName);
            chatsList.appendChild(chatItem);
        }
        
        if (convs.length === 0) {
            chatsList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Нет чатов. Создайте новый!</p>';
        }
        
    } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
        window.showNotification('Ошибка загрузки чатов: ' + (error.message || 'проверьте консоль'), 'error');
    } finally {
        window.hideLoader();
    }
}

// Открытие чата
async function openConversation(convId, chatName) {
    currentConversationId = convId;
    
    const header = document.getElementById('chat-header');
    header.innerHTML = `<h3>${chatName}</h3>`;
    
    await loadMessages(convId);
    
    // Прокрутка вниз
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Загрузка сообщений
async function loadMessages(convId) {
    window.showLoader('Загрузка сообщений...');
    
    try {
        const { data: messages, error } = await window.supabaseClient
            .from('messages')
            .select(`
                *,
                sender: sender_id (
                    full_name
                )
            `)
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';
        
        messages.forEach(msg => {
            const isOwn = msg.sender_id === window.currentUser.id;
            const messageItem = document.createElement('div');
            messageItem.style = `
                margin-bottom: 15px;
                padding: 12px 15px;
                border-radius: 8px;
                max-width: 70%;
                ${isOwn ? 'background: #667eea; color: white; align-self: flex-end;' : 'background: #f1f5f9; color: #2d3748; align-self: flex-start;'}
            `;
            messageItem.innerHTML = `
                <p style="margin: 0 0 5px 0; font-size: 0.85rem; opacity: 0.8;">
                    ${msg.sender?.full_name || 'Аноним'}
                </p>
                <p style="margin: 0;">${msg.content}</p>
                <p style="margin: 5px 0 0 0; font-size: 0.75rem; opacity: 0.6; text-align: right;">
                    ${new Date(msg.created_at).toLocaleTimeString('ru-RU')}
                </p>
            `;
            messagesContainer.appendChild(messageItem);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        window.showNotification('Ошибка загрузки сообщений', 'error');
    } finally {
        window.hideLoader();
    }
}

// Настройка realtime подписок
function setupRealtimeSubscriptions() {
    // Подписка на новые чаты
    const convSub = window.supabaseClient
        .channel('conversations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
            loadConversations();
        })
        .subscribe();
    
    // Подписка на новые сообщения
    const msgSub = window.supabaseClient
        .channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            if (payload.new.conversation_id === currentConversationId) {
                loadMessages(currentConversationId);  // Обновляем сообщения
            }
        })
        .subscribe();
    
    realtimeSubscriptions.push(convSub, msgSub);
}

// Обработчики событий
function setupChatEventListeners() {
    // Кнопка создания чата
    document.getElementById('create-chat-btn')?.addEventListener('click', () => {
        document.getElementById('create-chat-modal').classList.remove('hidden');
document.getElementById('modal-overlay')?.classList?.remove('hidden') || 
document.body.insertAdjacentHTML('beforeend', '<div id="modal-overlay" class="modal-overlay"></div>');
        document.getElementById('user-search-results').innerHTML = '';
        document.getElementById('selected-users').innerHTML = '';
        document.getElementById('group-name-group').classList.add('hidden');
    });
    
    // Выбор типа чата
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
    
    // Поиск пользователей (debounce для оптимизации)
    let searchTimeout;
    document.getElementById('user-search')?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchUsers(e.target.value), 300);
    });
    
    // Форма создания чата
    document.getElementById('create-chat-form')?.addEventListener('submit', createChatFromForm);
    
    // Форма отправки сообщения
    document.getElementById('chat-form')?.addEventListener('submit', sendMessage);
}

// Поиск пользователей
async function searchUsers(query) {
    if (!query || query.length < 2) return;
    
    try {
        const { data: users, error } = await window.supabaseClient
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .neq('id', window.currentUser.id)  // Исключаем себя
            .limit(10);
        
        if (error) throw error;
        
        const results = document.getElementById('user-search-results');
        results.innerHTML = '';
        
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.style = 'display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid #e2e8f0; cursor: pointer;';
            userItem.innerHTML = `
                <div class="avatar">${user.full_name?.substring(0, 2).toUpperCase() || 'U'}</div>
                <div>
                    <p style="margin: 0; color: #2d3748;">${user.full_name || user.email}</p>
                    <p style="margin: 0; font-size: 0.85rem; color: #718096;">${user.email}</p>
                </div>
            `;
            userItem.onclick = () => addSelectedUser(user);
            results.appendChild(userItem);
        });
        
    } catch (error) {
        console.error('Ошибка поиска пользователей:', error);
        window.showNotification('Ошибка поиска', 'error');
    }
}

// Добавление выбранного пользователя
function addSelectedUser(user) {
    const selected = document.getElementById('selected-users');
    const exists = [...selected.children].some(child => child.dataset.id === user.id);
    if (exists) return;
    
    const tag = document.createElement('div');
    tag.dataset.id = user.id;
    tag.style = 'display: flex; align-items: center; gap: 5px; padding: 5px 10px; background: #e2e8f0; border-radius: 20px; font-size: 0.9rem;';
    tag.innerHTML = `
        ${user.full_name || user.email}
        <i class="fas fa-times" style="cursor: pointer;" onclick="this.parentElement.remove()"></i>
    `;
    selected.appendChild(tag);
}

// Создание чата из формы
async function createChatFromForm(e) {
    e.preventDefault();
    window.showLoader('Создание чата...');
    
    try {
        const type = document.getElementById('chat-type').value;
        const groupName = document.getElementById('group-name').value;
        const selectedUsers = [...document.getElementById('selected-users').children]
            .map(tag => tag.dataset.id);
        
        if (!type) throw new Error('Выберите тип чата');
        if (type === 'group' && !groupName) throw new Error('Введите название группы');
        if (selectedUsers.length === 0) throw new Error('Выберите хотя бы одного пользователя');
        if (type === 'private' && selectedUsers.length !== 1) throw new Error('Для приватного чата выберите ровно одного пользователя');
        
        // Создаём чат
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
        
        // Добавляем участников (себя + выбранных)
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
        await loadConversations();
        
    } catch (error) {
        console.error('Ошибка создания чата:', error);
        window.showNotification('Ошибка создания чата: ' + error.message, 'error');
    } finally {
        window.hideLoader();
    }
}

// Отправка сообщения
async function sendMessage(e) {
    e.preventDefault();
    if (!currentConversationId) return window.showNotification('Выберите чат', 'error');
    
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('messages')
            .insert({
                conversation_id: currentConversationId,
                sender_id: window.currentUser.id,
                content
            });
        
        if (error) throw error;
        
        input.value = '';
        // Realtime обновит автоматически
        
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        window.showNotification('Ошибка отправки', 'error');
    }
}

// Закрытие подписок при уходе со страницы
window.addEventListener('beforeunload', () => {
    realtimeSubscriptions.forEach(sub => sub.unsubscribe());
});

// Инициализация
document.addEventListener('DOMContentLoaded', initChatsPage);

// Экспортируем
window.initChatsPage = initChatsPage;

console.log('✅ Chats.js загружен');