// chat-service.js - Дополнительные сервисные функции для чата

console.log('🔧 Chat Service загружается...');

// Функция для получения пользователя по ID
async function getUserById(userId) {
    if (!window.supabaseClient) return null;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (!error && data) return data;
        return null;
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        return null;
    }
}

// Функция для поиска пользователей по имени
async function searchUsersByName(name) {
    if (!window.supabaseClient) return [];
    
    try {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${name}%`)
            .limit(20);
        
        if (!error && data) return data;
        return [];
    } catch (error) {
        console.error('Ошибка поиска пользователей:', error);
        return [];
    }
}

// Функция для получения количества непрочитанных сообщений
async function getUnreadMessagesCount() {
    if (!window.supabaseClient || !window.currentUser) return 0;
    
    try {
        // Получаем все чаты пользователя
        const { data: chatMemberships, error } = await window.supabaseClient
            .from('chat_members')
            .select('chat_id')
            .eq('user_id', window.currentUser.id);
        
        if (error) throw error;
        
        if (!chatMemberships || chatMemberships.length === 0) return 0;
        
        const chatIds = chatMemberships.map(m => m.chat_id);
        let totalUnread = 0;
        
        // Для каждого чата получаем количество непрочитанных сообщений
        for (const chatId of chatIds) {
            const count = await getUnreadMessagesInChat(chatId);
            totalUnread += count;
        }
        
        return totalUnread;
    } catch (error) {
        console.error('Ошибка подсчета непрочитанных сообщений:', error);
        return 0;
    }
}

// Функция для получения непрочитанных сообщений в конкретном чате
async function getUnreadMessagesInChat(chatId) {
    if (!window.supabaseClient || !window.currentUser) return 0;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('messages')
            .select('id')
            .eq('chat_id', chatId)
            .not('read_by', 'cs', `{${window.currentUser.id}}`);
        
        if (!error && data) return data.length;
        return 0;
    } catch (error) {
        console.error('Ошибка получения непрочитанных сообщений:', error);
        return 0;
    }
}

// Функция для пометки сообщений как прочитанных
async function markChatAsRead(chatId) {
    if (!window.supabaseClient || !window.currentUser) return;
    
    try {
        // Получаем все непрочитанные сообщения
        const { data: messages, error } = await window.supabaseClient
            .from('messages')
            .select('id, read_by')
            .eq('chat_id', chatId)
            .not('read_by', 'cs', `{${window.currentUser.id}}`);
        
        if (error || !messages) return;
        
        // Для каждого сообщения добавляем текущего пользователя в список прочитавших
        for (const message of messages) {
            const newReadBy = [...(message.read_by || []), window.currentUser.id];
            
            await window.supabaseClient
                .from('messages')
                .update({ read_by: newReadBy })
                .eq('id', message.id);
        }
    } catch (error) {
        console.error('Ошибка пометки сообщений как прочитанных:', error);
    }
}

// Функция для отправки файла в чат
async function sendFileToChat(chatId, file) {
    if (!window.supabaseClient || !window.currentUser) return null;
    
    try {
        // В реальном приложении здесь была бы загрузка в Supabase Storage
        // Для демо-версии используем Data URL
        
        const fileDataUrl = await readFileAsDataURL(file);
        
        const { data, error } = await window.supabaseClient
            .from('messages')
            .insert([{
                chat_id: chatId,
                sender_id: window.currentUser.id,
                content: `📎 Файл: ${file.name}`,
                metadata: {
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    data_url: fileDataUrl.substring(0, 1000) // Обрезаем для демо
                }
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Ошибка отправки файла:', error);
        window.showNotification('Ошибка отправки файла', 'error');
        return null;
    }
}

// Функция для создания группового чата
async function createGroupChat(name, userIds) {
    if (!window.supabaseClient || !window.currentUser) return null;
    
    try {
        // Создаем чат
        const { data: chat, error: chatError } = await window.supabaseClient
            .from('chats')
            .insert([{
                name: name,
                is_group: true,
                owner_id: window.currentUser.id,
                description: 'Групповой чат'
            }])
            .select()
            .single();
        
        if (chatError) throw chatError;
        
        // Добавляем участников (включая создателя)
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
        
        window.showNotification(`✅ Групповой чат "${name}" создан!`, 'success');
        return chat;
    } catch (error) {
        console.error('Ошибка создания группового чата:', error);
        window.showNotification('Ошибка создания группового чата', 'error');
        return null;
    }
}

// Функция для добавления участников в существующий чат
async function addUsersToChat(chatId, userIds) {
    if (!window.supabaseClient || !window.currentUser) return false;
    
    try {
        // Проверяем, что текущий пользователь является участником чата
        const { data: membership, error: checkError } = await window.supabaseClient
            .from('chat_members')
            .select('id')
            .eq('chat_id', chatId)
            .eq('user_id', window.currentUser.id)
            .single();
        
        if (checkError) {
            window.showNotification('У вас нет доступа к этому чату', 'error');
            return false;
        }
        
        // Добавляем новых участников
        const members = userIds.map(userId => ({
            chat_id: chatId,
            user_id: userId
        }));
        
        const { error: membersError } = await window.supabaseClient
            .from('chat_members')
            .insert(members);
        
        if (membersError) throw membersError;
        
        // Отправляем системное сообщение
        const { error: messageError } = await window.supabaseClient
            .from('messages')
            .insert([{
                chat_id: chatId,
                sender_id: window.currentUser.id,
                content: '✅ Добавлены новые участники в чат'
            }]);
        
        if (messageError) throw messageError;
        
        window.showNotification('✅ Участники добавлены в чат', 'success');
        return true;
    } catch (error) {
        console.error('Ошибка добавления участников:', error);
        window.showNotification('Ошибка добавления участников', 'error');
        return false;
    }
}

// Функция для получения истории чата
async function getChatHistory(chatId, limit = 50, offset = 0) {
    if (!window.supabaseClient) return [];
    
    try {
        const { data, error } = await window.supabaseClient
            .from('messages')
            .select(`
                id,
                content,
                sender_id,
                created_at,
                metadata,
                profiles:sender_id (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (!error && data) return data.reverse();
        return [];
    } catch (error) {
        console.error('Ошибка получения истории чата:', error);
        return [];
    }
}

// Экспортируем функции
window.chatService = {
    getUserById,
    searchUsersByName,
    getUnreadMessagesCount,
    getUnreadMessagesInChat,
    markChatAsRead,
    sendFileToChat,
    createGroupChat,
    addUsersToChat,
    getChatHistory
};

console.log('✅ Chat Service загружен');