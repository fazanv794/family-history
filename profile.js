console.log('👤 Profile.js загружается...');

// Основные функции профиля
function initProfilePage() {
    console.log('🔄 Инициализация страницы профиля...');
    
    loadProfileData();
    setupProfileEventListeners();
    updateProfileStats();
    loadTreeInfo();
    loadNotificationSettings(); // Загружаем настройки уведомлений
}

// Загрузка данных профиля
async function loadProfileData() {
    console.log('📥 Загрузка данных профиля...');
    
    try {
        if (!window.currentUser) {
            const savedUser = localStorage.getItem('family_tree_user');
            if (savedUser) {
                try {
                    window.currentUser = JSON.parse(savedUser);
                } catch (e) {
                    console.error('❌ Ошибка парсинга пользователя:', e);
                }
            }
            
            if (!window.currentUser) {
                window.showNotification('Пожалуйста, войдите в систему', 'error');
                setTimeout(() => {
                    window.location.href = 'auth.html';
                }, 1500);
                return;
            }
        }
        
        updateProfileUI();
        
        if (window.supabaseClient && window.currentUser.id && !window.currentUser.id.startsWith('demo-')) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', window.currentUser.id)
                    .single();
                
                if (!error && data) {
                    window.currentUser.profile = data;
                    updateProfileUI();
                } else {
                    await createUserProfile();
                }
            } catch (error) {
                console.error('❌ Ошибка загрузки профиля из Supabase:', error);
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных профиля:', error);
        window.showNotification('Ошибка загрузки профиля', 'error');
    }
}

// Создание профиля пользователя
async function createUserProfile() {
    if (!window.currentUser || !window.supabaseClient) return;
    
    try {
        const profileData = {
            id: window.currentUser.id,
            email: window.currentUser.email,
            full_name: window.currentUser.user_metadata?.name || window.currentUser.email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .insert([profileData])
            .select();
        
        if (!error && data) {
            window.currentUser.profile = data[0];
            updateProfileUI();
        }
    } catch (error) {
        console.error('❌ Ошибка создания профиля:', error);
    }
}

// Обновление UI профиля
function updateProfileUI() {
    if (!window.currentUser) return;
    
    const email = window.currentUser.email || 'Не указан';
    const userId = window.currentUser.id || 'Не указан';
    const createdAt = window.currentUser.created_at || 
                     window.currentUser.profile?.created_at || 
                     new Date().toISOString();
    const fullName = window.currentUser.user_metadata?.name || 
                    window.currentUser.profile?.full_name || 
                    email.split('@')[0];
    
    const avatarUrl = window.currentUser.profile?.avatar_url;
    const avatarElement = document.getElementById('profile-avatar');
    
    const regDate = new Date(createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const infoEmail = document.getElementById('info-email');
    const infoUserId = document.getElementById('info-user-id');
    const infoRegDate = document.getElementById('info-reg-date');
    const usernameElements = document.querySelectorAll('#username, .user-name');
    
    if (profileName) profileName.textContent = fullName;
    if (profileEmail) profileEmail.textContent = email;
    if (infoEmail) infoEmail.textContent = email;
    if (infoUserId) infoUserId.textContent = userId.substring(0, 8) + '...';
    if (infoRegDate) infoRegDate.textContent = regDate;
    
    if (avatarElement) {
        if (avatarUrl) {
            avatarElement.style.backgroundImage = `url(${avatarUrl})`;
            avatarElement.style.backgroundSize = 'cover';
            avatarElement.style.backgroundPosition = 'center';
            avatarElement.textContent = '';
        } else {
            const initials = getUserInitials(fullName);
            avatarElement.style.backgroundImage = '';
            avatarElement.textContent = initials;
        }
    }
    
    usernameElements.forEach(el => {
        if (el.id === 'username' || el.classList.contains('user-name')) {
            el.textContent = fullName;
        }
    });
}

// Функция для получения инициалов
function getUserInitials(name) {
    if (!name) return 'П';
    
    const parts = name.split(' ');
    let initials = '';
    
    if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1) {
        initials = parts[0].substring(0, 2).toUpperCase();
    }
    
    return initials || 'П';
}

// ========== НАСТРОЙКИ УВЕДОМЛЕНИЙ ==========

let notificationSettings = {
    success: true,
    error: true,
    info: true,
    birthday: true,
    anniversary: true,
    event: true,
    invite: true,
    family_join: true,
    media: true,
    tree: true
};

// Загрузка настроек уведомлений из Supabase
async function loadNotificationSettings() {
    console.log('🔔 Загрузка настроек уведомлений...');
    
    try {
        if (!window.currentUser || !window.supabaseClient) {
            loadNotificationSettingsFromLocal();
            return;
        }
        
        const { data, error } = await window.supabaseClient
            .from('notification_settings')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .maybeSingle();
        
        if (error) {
            console.error('Ошибка загрузки настроек:', error);
            loadNotificationSettingsFromLocal();
            return;
        }
        
        if (data) {
            notificationSettings = { ...notificationSettings, ...data };
            console.log('✅ Настройки загружены из Supabase');
        } else {
            console.log('📝 Настройки не найдены, создаем новые');
            await createNotificationSettings();
        }
        
        // Сохраняем в localStorage как резервную копию
        localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
        
        // Применяем настройки к интерфейсу
        applyNotificationSettingsToUI();
        
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        loadNotificationSettingsFromLocal();
    }
}

// Загрузка из localStorage (резервный вариант)
function loadNotificationSettingsFromLocal() {
    try {
        const savedSettings = localStorage.getItem('notification_settings');
        if (savedSettings) {
            notificationSettings = { ...notificationSettings, ...JSON.parse(savedSettings) };
        }
        applyNotificationSettingsToUI();
    } catch (error) {
        console.error('Ошибка загрузки из localStorage:', error);
    }
}

// Создание настроек уведомлений в Supabase
async function createNotificationSettings() {
    try {
        const settingsForDb = {
            user_id: window.currentUser.id,
            success: notificationSettings.success,
            error: notificationSettings.error,
            info: notificationSettings.info,
            birthday: notificationSettings.birthday,
            anniversary: notificationSettings.anniversary,
            event: notificationSettings.event,
            invite: notificationSettings.invite,
            family_join: notificationSettings.family_join,
            media: notificationSettings.media,
            tree: notificationSettings.tree
        };
        
        const { data, error } = await window.supabaseClient
            .from('notification_settings')
            .insert([settingsForDb])
            .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
            notificationSettings = { ...notificationSettings, ...data[0] };
            console.log('✅ Настройки созданы в Supabase');
        }
        
    } catch (error) {
        console.error('Ошибка создания настроек:', error);
    }
}

// Сохранение настроек уведомлений в Supabase
async function saveNotificationSettings() {
    console.log('💾 Сохранение настроек уведомлений...');
    
    try {
        // Собираем настройки с переключателей
        document.querySelectorAll('.notification-toggle').forEach(toggle => {
            const type = toggle.dataset.type;
            if (type) {
                notificationSettings[type] = toggle.checked;
            }
        });
        
        // Сохраняем в localStorage
        localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
        
        // Если есть пользователь и Supabase, сохраняем туда
        if (window.currentUser && window.supabaseClient && !window.currentUser.id.startsWith('demo-')) {
            const settingsForDb = {
                user_id: window.currentUser.id,
                success: notificationSettings.success,
                error: notificationSettings.error,
                info: notificationSettings.info,
                birthday: notificationSettings.birthday,
                anniversary: notificationSettings.anniversary,
                event: notificationSettings.event,
                invite: notificationSettings.invite,
                family_join: notificationSettings.family_join,
                media: notificationSettings.media,
                tree: notificationSettings.tree,
                updated_at: new Date().toISOString()
            };
            
            const { error } = await window.supabaseClient
                .from('notification_settings')
                .upsert(settingsForDb, { onConflict: 'user_id' });
            
            if (error) throw error;
            
            console.log('✅ Настройки сохранены в Supabase');
        }
        
        // Обновляем глобальные настройки
        window.notificationSettings = notificationSettings;
        
        window.showNotification('✅ Настройки уведомлений сохранены', 'success');
        
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        window.showNotification('Ошибка сохранения настроек', 'error');
    }
}

// Сброс настроек уведомлений
async function resetNotificationSettings() {
    notificationSettings = {
        success: true,
        error: true,
        info: true,
        birthday: true,
        anniversary: true,
        event: true,
        invite: true,
        family_join: true,
        media: true,
        tree: true
    };
    
    // Обновляем переключатели
    document.querySelectorAll('.notification-toggle').forEach(toggle => {
        const type = toggle.dataset.type;
        if (type && notificationSettings[type] !== undefined) {
            toggle.checked = notificationSettings[type];
        }
    });
    
    // Сохраняем
    await saveNotificationSettings();
}

// Применение настроек к UI
function applyNotificationSettingsToUI() {
    document.querySelectorAll('.notification-toggle').forEach(toggle => {
        const type = toggle.dataset.type;
        if (type && notificationSettings[type] !== undefined) {
            toggle.checked = notificationSettings[type];
        }
    });
}

// Открытие модального окна настроек уведомлений
function openNotificationSettings() {
    console.log('🔔 Открытие настроек уведомлений');
    
    // Применяем текущие настройки
    applyNotificationSettingsToUI();
    
    // Показываем модальное окно
    window.showModal('notifications-modal');
}

// Переопределяем глобальную функцию показа уведомлений
const originalShowNotification = window.showNotification;
window.showNotification = function(message, type = 'info') {
    if (window.notificationSettings) {
        if (type === 'success' && !window.notificationSettings.success) return;
        if (type === 'error' && !window.notificationSettings.error) return;
        if (type === 'info' && !window.notificationSettings.info) return;
    }
    
    if (originalShowNotification) {
        originalShowNotification(message, type);
    }
};

// ========== ОСТАЛЬНЫЕ ФУНКЦИИ ПРОФИЛЯ ==========

// Настройка обработчиков событий
function setupProfileEventListeners() {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            openEditProfileModal();
        });
    }
    
    const inviteBtn = document.getElementById('invite-btn');
    if (inviteBtn) {
        inviteBtn.addEventListener('click', () => {
            window.showModal('invite-modal');
        });
    }
    
    const notificationsBtn = document.getElementById('notifications-settings-btn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', openNotificationSettings);
    }
    
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportUserData);
    }
    
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', handleAvatarChange);
    }
    
    const logoutBtn = document.getElementById('logout-profile-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.handleLogout) {
                window.handleLogout();
            }
        });
    }
    
    // Обработчик для сохранения настроек уведомлений
    const saveNotifBtn = document.getElementById('save-notification-settings');
    if (saveNotifBtn) {
        saveNotifBtn.addEventListener('click', async () => {
            await saveNotificationSettings();
            window.closeAllModals();
        });
    }
    
    // Обработчик для сброса настроек
    const resetNotifBtn = document.getElementById('reset-notifications');
    if (resetNotifBtn) {
        resetNotifBtn.addEventListener('click', async () => {
            await resetNotificationSettings();
            window.showNotification('✅ Настройки сброшены', 'success');
        });
    }
    
    const editProfileForm = document.getElementById('edit-profile-form-modal');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfileSubmit);
    }
    
    const inviteForm = document.getElementById('invite-form-modal');
    if (inviteForm) {
        inviteForm.addEventListener('submit', handleInviteSubmit);
    }
}

// Обработка смены аватара
async function handleAvatarChange() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    document.body.appendChild(input);
    
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
            document.body.removeChild(input);
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            window.showNotification('Размер файла не должен превышать 5MB', 'error');
            document.body.removeChild(input);
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            window.showNotification('Пожалуйста, выберите изображение', 'error');
            document.body.removeChild(input);
            return;
        }
        
        window.showLoader('Загрузка фото...');
        
        try {
            let avatarUrl;
            
            if (window.currentUser && window.currentUser.id) {
                if (window.uploadProfilePhoto) {
                    avatarUrl = await window.uploadProfilePhoto(file, window.currentUser.id);
                } else {
                    avatarUrl = await window.readFileAsDataURL(file);
                }
                
                await saveAvatarToProfile(avatarUrl);
                updateAvatarInUI(avatarUrl);
                window.showNotification('✅ Фото профиля обновлено!', 'success');
            } else {
                window.showNotification('Пользователь не авторизован', 'error');
            }
            
        } catch (error) {
            console.error('❌ Ошибка обработки фото:', error);
            window.showNotification('Ошибка обработки фото', 'error');
        } finally {
            window.hideLoader();
            document.body.removeChild(input);
        }
    });
    
    input.click();
}

// Сохранение аватара в профиль
async function saveAvatarToProfile(avatarUrl) {
    if (!window.currentUser) return;
    
    if (!window.currentUser.profile) {
        window.currentUser.profile = {};
    }
    
    window.currentUser.profile.avatar_url = avatarUrl;
    localStorage.setItem('family_tree_user', JSON.stringify(window.currentUser));
    
    if (window.supabaseClient && window.currentUser.id && !window.currentUser.id.startsWith('demo-')) {
        try {
            const { error } = await window.supabaseClient
                .from('profiles')
                .update({
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', window.currentUser.id);
            
            if (error) {
                console.warn('⚠️ Не удалось сохранить аватар в Supabase:', error);
            }
        } catch (supabaseError) {
            console.warn('⚠️ Ошибка Supabase при сохранении аватара:', supabaseError);
        }
    }
}

// Обновление аватара в UI
function updateAvatarInUI(avatarUrl) {
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
        if (avatarUrl) {
            profileAvatar.style.backgroundImage = `url(${avatarUrl})`;
            profileAvatar.style.backgroundSize = 'cover';
            profileAvatar.style.backgroundPosition = 'center';
            profileAvatar.textContent = '';
        } else {
            const fullName = window.currentUser.user_metadata?.name || 
                           window.currentUser.profile?.full_name || 
                           window.currentUser.email?.split('@')[0] || 
                           'П';
            const initials = getUserInitials(fullName);
            profileAvatar.style.backgroundImage = '';
            profileAvatar.textContent = initials;
        }
    }
    
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar && avatarUrl) {
        userAvatar.style.backgroundImage = `url(${avatarUrl})`;
        userAvatar.style.backgroundSize = 'cover';
        userAvatar.style.backgroundPosition = 'center';
        userAvatar.textContent = '';
    }
}

// Открытие модального окна редактирования профиля
function openEditProfileModal() {
    if (!window.currentUser) {
        window.showNotification('Пожалуйста, войдите в систему', 'error');
        return;
    }
    
    const name = window.currentUser.user_metadata?.name || 
                window.currentUser.profile?.full_name || 
                '';
    
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const email = window.currentUser.email || '';
    
    const nameInput = document.getElementById('edit-profile-name');
    const lastNameInput = document.getElementById('edit-profile-last-name');
    const emailInput = document.getElementById('edit-profile-email');
    const bioInput = document.getElementById('edit-profile-bio');
    
    if (nameInput) nameInput.value = firstName;
    if (lastNameInput) lastNameInput.value = lastName;
    if (emailInput) emailInput.value = email;
    if (bioInput) bioInput.value = window.currentUser.profile?.bio || '';
    
    window.showModal('edit-profile-modal');
}

// Обработка отправки формы редактирования профиля
async function handleEditProfileSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('edit-profile-name').value;
    const lastName = document.getElementById('edit-profile-last-name').value;
    const email = document.getElementById('edit-profile-email').value;
    const bio = document.getElementById('edit-profile-bio').value;
    
    if (!name || !email) {
        window.showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    const fullName = lastName ? `${name} ${lastName}` : name;
    
    window.showLoader('Сохранение профиля...');
    
    try {
        if (window.currentUser) {
            window.currentUser.user_metadata = {
                ...window.currentUser.user_metadata,
                name: fullName
            };
            window.currentUser.email = email;
            
            if (!window.currentUser.profile) {
                window.currentUser.profile = {};
            }
            window.currentUser.profile.full_name = fullName;
            window.currentUser.profile.bio = bio;
            window.currentUser.profile.updated_at = new Date().toISOString();
            
            localStorage.setItem('family_tree_user', JSON.stringify(window.currentUser));
        }
        
        if (window.supabaseClient && window.currentUser.id && !window.currentUser.id.startsWith('demo-')) {
            try {
                const { data: authData, error: authError } = await window.supabaseClient.auth.updateUser({
                    email: email,
                    data: { name: fullName }
                });
                
                if (!authError && authData.user) {
                    window.currentUser = authData.user;
                }
                
                const profileData = {
                    id: window.currentUser.id,
                    email: email,
                    full_name: fullName,
                    bio: bio,
                    updated_at: new Date().toISOString()
                };
                
                const { error: profileError } = await window.supabaseClient
                    .from('profiles')
                    .upsert(profileData);
                
                if (profileError) {
                    console.warn('⚠️ Ошибка обновления в таблице profiles:', profileError);
                }
            } catch (supabaseError) {
                console.warn('⚠️ Не удалось обновить в Supabase:', supabaseError);
            }
        }
        
        window.showNotification('✅ Профиль успешно обновлен!', 'success');
        
        updateProfileUI();
        if (window.updateUserUI) {
            window.updateUserUI();
        }
        
        window.closeAllModals();
        
    } catch (error) {
        console.error('❌ Ошибка обновления профиля:', error);
        window.showNotification('Ошибка обновления профиля', 'error');
    } finally {
        window.hideLoader();
    }
}

// Обработка приглашения
async function handleInviteSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('invite-email').value;
    const name = document.getElementById('invite-name').value;
    const message = document.getElementById('invite-message').value;
    const allowEdit = document.getElementById('invite-editor').checked;
    
    if (!email) {
        window.showNotification('Введите email', 'error');
        return;
    }
    
    window.showLoader('Отправка приглашения...');
    
    try {
        const invitations = JSON.parse(localStorage.getItem('family_invitations') || '[]');
        const newInvitation = {
            id: Date.now(),
            email: email,
            name: name,
            message: message,
            allowEdit: allowEdit,
            sentAt: new Date().toISOString(),
            status: 'pending'
        };
        
        invitations.push(newInvitation);
        localStorage.setItem('family_invitations', JSON.stringify(invitations));
        
        window.showNotification(`✅ Приглашение отправлено на ${email}`, 'success');
        
        e.target.reset();
        window.closeAllModals();
        
    } catch (error) {
        console.error('❌ Ошибка отправки приглашения:', error);
        window.showNotification('Ошибка отправки приглашения', 'error');
    } finally {
        window.hideLoader();
    }
}

// Экспорт данных пользователя
async function exportUserData() {
    window.showLoader('Подготовка данных...');
    
    try {
        const userData = {
            exportInfo: {
                date: new Date().toISOString(),
                format: 'JSON',
                version: '1.0'
            },
            user: {
                id: window.currentUser?.id,
                email: window.currentUser?.email,
                name: window.currentUser?.user_metadata?.name,
                created: window.currentUser?.created_at
            },
            tree: window.treeData || {},
            people: window.people || [],
            events: window.events || [],
            media: window.media || [],
            invitations: JSON.parse(localStorage.getItem('family_invitations') || '[]')
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `family-history-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        window.showNotification('✅ Данные экспортированы!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка экспорта данных:', error);
        window.showNotification('Ошибка экспорта данных', 'error');
    } finally {
        window.hideLoader();
    }
}

// Обновление статистики профиля
function updateProfileStats() {
    const peopleCount = window.people ? window.people.length : 0;
    const peopleCountElement = document.getElementById('info-people-count');
    if (peopleCountElement) {
        peopleCountElement.textContent = peopleCount;
    }
    
    setTimeout(updateProfileStats, 5000);
}

// Загрузка информации о дереве
function loadTreeInfo() {
    const treeInfoSection = document.getElementById('tree-info-section');
    if (!treeInfoSection) return;
    
    if (!window.treeData || !window.treeData.relatives || window.treeData.relatives.length === 0) {
        treeInfoSection.innerHTML = `
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; color: #718096;">
                    <i class="fas fa-tree" style="margin-right: 8px;"></i>
                    У вас еще нет созданного дерева
                </p>
                <button class="btn btn-small" onclick="window.location.href='tree.html'">
                    <i class="fas fa-plus"></i> Создать дерево
                </button>
            </div>
        `;
        return;
    }
    
    const treeName = window.treeData.name || 'Мое семейное дерево';
    const relativesCount = window.treeData.relatives.length;
    const createdDate = window.treeData.created ? 
        new Date(window.treeData.created).toLocaleDateString('ru-RU') : 
        'Недавно';
    
    treeInfoSection.innerHTML = `
        <div style="background: #f0fff4; padding: 15px; border-radius: 8px; border: 1px solid #c6f6d5;">
            <h4 style="margin: 0 0 10px 0; color: #276749; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-tree"></i> ${treeName}
            </h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div>
                    <div style="font-size: 0.85rem; color: #718096;">Родственников:</div>
                    <div style="font-weight: bold; color: #2d3748;">${relativesCount}</div>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: #718096;">Создано:</div>
                    <div style="font-weight: bold; color: #2d3748;">${createdDate}</div>
                </div>
            </div>
            <div style="margin-top: 10px;">
                <a href="tree.html" class="btn btn-small" style="margin-right: 10px;">
                    <i class="fas fa-edit"></i> Редактировать
                </a>
                <button class="btn btn-small btn-secondary" onclick="exportTree()">
                    <i class="fas fa-download"></i> Экспорт
                </button>
            </div>
        </div>
    `;
}

// Функция для экспорта дерева
function exportTree() {
    if (!window.treeData) {
        window.showNotification('Нет данных для экспорта', 'error');
        return;
    }
    
    const treeStr = JSON.stringify(window.treeData, null, 2);
    const blob = new Blob([treeStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-tree-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    window.showNotification('✅ Дерево экспортировано!', 'success');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initProfilePage();
    }, 100);
});

// Экспортируем функции
window.initProfilePage = initProfilePage;
window.updateProfileUI = updateProfileUI;
window.exportUserData = exportUserData;
window.loadProfileData = loadProfileData;
window.handleAvatarChange = handleAvatarChange;
window.openEditProfileModal = openEditProfileModal;
window.openNotificationSettings = openNotificationSettings;
window.loadNotificationSettings = loadNotificationSettings;
window.saveNotificationSettings = saveNotificationSettings;
window.resetNotificationSettings = resetNotificationSettings;