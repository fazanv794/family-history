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
        const { data: convs, error: convErr } = await window.supabaseClient
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (convErr) throw convErr;
        
        const chatsList = document.getElementById('chats-list');
        chatsList.innerHTML = '';
        
        for (const conv of convs || []) {
            // Получаем участников
            const { data: participants, error: partErr } = await window.supabaseClient
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', conv.id);
            
            if (partErr) {
                console.warn('Ошибка участников для чата', conv.id, partErr);
                continue;
            }
            
            // Получаем профили отдельно (без join'а, чтобы избежать 400)
            const userIds = participants.map(p => p.user_id);
            const { data: profilesData, error: profErr } = await window.supabaseClient
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            if (profErr) {
                console.warn('Ошибка профилей', profErr);
                continue;
            }
            
            const profileMap = new Map(profilesData.map(p => [p.id, p]));
            
            const otherNames = participants
                .filter(p => p.user_id !== window.currentUser.id)
                .map(p => {
                    const prof = profileMap.get(p.user_id);
                    return prof?.full_name || prof?.email?.split('@')[0] || 'Пользователь';
                });
            
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
        window.showNotification('Ошибка загрузки чатов', 'error');
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
    
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Загрузка сообщений (красивый визуал: справа/слева)
async function loadMessages(convId) {
    window.showLoader('Загрузка сообщений...');
    
    try {
        const { data: messages, error } = await window.supabaseClient
            .from('messages')
            .select('*, sender:sender_id (full_name, avatar_url)')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';
        messagesContainer.style.display = 'flex';
        messagesContainer.style.flexDirection = 'column';
        messagesContainer.style.gap = '12px';
        messagesContainer.style.padding = '10px';
        
        messages.forEach(msg => {
            const isOwn = msg.sender_id === window.currentUser.id;
            const sender = msg.sender || { full_name: 'Аноним', avatar_url: null };
            const senderName = sender.full_name || 'Аноним';
            
            const messageWrapper = document.createElement('div');
            messageWrapper.style.display = 'flex';
            messageWrapper.style.alignItems = 'flex-start';
            messageWrapper.style.gap = '10px';
            if (isOwn) messageWrapper.style.flexDirection = 'row-reverse';
            
            // Аватарка (только у чужих сообщений)
            if (!isOwn) {
                const avatar = document.createElement('div');
                avatar.style.width = '36px';
                avatar.style.height = '36px';
                avatar.style.borderRadius = '50%';
                avatar.style.background = sender.avatar_url 
                    ? `url(${sender.avatar_url}) center/cover`
                    : 'linear-gradient(135deg, #667eea, #764ba2)';
                avatar.style.color = 'white';
                avatar.style.display = 'flex';
                avatar.style.alignItems = 'center';
                avatar.style.justifyContent = 'center';
                avatar.style.fontSize = '14px';
                avatar.style.fontWeight = 'bold';
                avatar.textContent = !sender.avatar_url ? senderName[0].toUpperCase() : '';
                messageWrapper.appendChild(avatar);
            }
            
            // Само сообщение
            const messageItem = document.createElement('div');
            messageItem.style.maxWidth = '70%';
            messageItem.style.padding = '12px 16px';
            messageItem.style.borderRadius = '18px';
            messageItem.style.background = isOwn ? '#667eea' : '#f1f5f9';
            messageItem.style.color = isOwn ? 'white' : '#2d3748';
            messageItem.style.position = 'relative';
            
            messageItem.innerHTML = `
                ${!isOwn ? `<small style="font-size:0.8rem; opacity:0.8; display:block; margin-bottom:4px;">
                    ${senderName}
                </small>` : ''}
                <p style="margin:0; word-break:break-word;">${msg.content}</p>
                <small style="font-size:0.75rem; opacity:0.7; display:block; margin-top:6px; text-align:right;">
                    ${new Date(msg.created_at).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})}
                </small>
            `;
            
            messageWrapper.appendChild(messageItem);
            messagesContainer.appendChild(messageWrapper);
        });
        
        // Прокрутка вниз
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        window.showNotification('Ошибка загрузки сообщений', 'error');
    } finally {
        window.hideLoader();
    }
}

// Настройка realtime подписок
function setupRealtimeSubscriptions() {
    const convSub = window.supabaseClient
        .channel('conversations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
            loadConversations();
        })
        .subscribe();
    
    const msgSub = window.supabaseClient
        .channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            if (payload.new.conversation_id === currentConversationId) {
                loadMessages(currentConversationId);
            }
        })
        .subscribe();
    
    realtimeSubscriptions.push(convSub, msgSub);
}

// Обработчики событий
function setupChatEventListeners() {
    // Форма отправки сообщения
    document.getElementById('chat-form')?.addEventListener('submit', sendMessage);

    // Форма создания чата
    document.getElementById('create-chat-form')?.addEventListener('submit', createChatFromForm);

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
}

// Поиск пользователей
async function searchUsers(query) {
    console.log('[searchUsers] Запрос:', query);

    const container = document.getElementById('user-search-results');
    if (!container) {
        console.error('[searchUsers] Контейнер #user-search-results не найден');
        return;
    }

    if (!query || query.length < 2) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = '<p style="text-align:center; color:#718096; padding:12px;">Поиск...</p>';

    try {
        const { data: users, error } = await window.supabaseClient
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .neq('id', window.currentUser?.id || '')
            .limit(8);

        console.log('[searchUsers] Ответ Supabase:', { users, error });

        if (error) throw error;

        container.innerHTML = '';

        if (!users || users.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#718096; padding:12px;">Пользователи не найдены</p>';
            return;
        }

        users.forEach(user => {
            const div = document.createElement('div');
            div.style.cssText = 'padding:10px 12px; border-bottom:1px solid #eee; cursor:pointer; display:flex; align-items:center; gap:12px; transition:background 0.2s;';
            div.innerHTML = `
                <div style="width:40px;height:40px;background:#667eea;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;">
                    ${(user.full_name || user.email)[0].toUpperCase()}
                </div>
                <div>
                    <div style="font-weight:500;">${user.full_name || user.email.split('@')[0]}</div>
                    <div style="font-size:0.85rem;color:#718096;">${user.email}</div>
                </div>
            `;
            div.onclick = () => {
                console.log('Выбран:', user);
                addSelectedUser(user);
            };
            div.onmouseover = () => div.style.background = '#f0f4f8';
            div.onmouseout = () => div.style.background = '';
            container.appendChild(div);
        });
    } catch (err) {
        console.error('[searchUsers] Ошибка:', err);
        container.innerHTML = '<p style="color:red; text-align:center; padding:12px;">Ошибка поиска</p>';
    }
}

// Добавление выбранного пользователя
function addSelectedUser(user) {
    const selected = document.getElementById('selected-users');
    if (!selected) return;

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

// Создание чата
async function createChatFromForm(e) {
    e.preventDefault();
    window.showLoader('Создание чата...');
    
    try {
        const type = document.getElementById('chat-type').value;
        const groupName = document.getElementById('group-name').value.trim();
        const selectedUsers = [...document.getElementById('selected-users').children]
            .map(tag => tag.dataset.id);
        
        if (!type) throw new Error('Выберите тип чата');
        if (type === 'group' && !groupName) throw new Error('Введите название группы');
        if (selectedUsers.length === 0) throw new Error('Выберите хотя бы одного пользователя');
        if (type === 'private' && selectedUsers.length !== 1) throw new Error('Для приватного чата выберите одного пользователя');
        
        // Для приватного чата проверяем существование
        if (type === 'private') {
            const partnerId = selectedUsers[0];
            const { data: existing } = await window.supabaseClient
                .from('conversations')
                .select('id')
                .eq('is_group', false)
                .limit(1);
            
            // Более точная проверка требует join'а — пока пропускаем
        }
        
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
        document.getElementById('modal-overlay').style.display = 'none';
        document.getElementById('create-chat-modal').style.opacity = '0';
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
        // Realtime сам обновит
    } catch (error) {
        console.error('Ошибка отправки:', error);
        window.showNotification('Ошибка отправки: ' + (error.message || 'проверьте консоль'), 'error');
    }
}

// Закрытие подписок
window.addEventListener('beforeunload', () => {
    realtimeSubscriptions.forEach(sub => sub.unsubscribe());
});

// Экспорт
window.initChatsPage = initChatsPage;

console.log('✅ Chats.js загружен');