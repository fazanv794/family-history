console.log('👤 Profile.js загружается...');

// Основные функции профиля
function initProfilePage() {
    console.log('🔄 Инициализация страницы профиля...');
    
    // Загружаем данные пользователя
    loadProfileData();
    
    // Настраиваем обработчики событий
    setupProfileEventListeners();
    
    // Обновляем статистику
    updateProfileStats();
    
    // Загружаем информацию о дереве
    loadTreeInfo();
}

// Загрузка данных профиля
async function loadProfileData() {
    console.log('📥 Загрузка данных профиля...');
    
    try {
        // Проверяем авторизацию
        if (!window.currentUser) {
            console.log('👤 Пользователь не авторизован, проверяем localStorage...');
            
            // Пробуем загрузить из localStorage
            const savedUser = localStorage.getItem('family_tree_user');
            if (savedUser) {
                try {
                    window.currentUser = JSON.parse(savedUser);
                    console.log('✅ Пользователь загружен из localStorage');
                } catch (e) {
                    console.error('❌ Ошибка парсинга пользователя:', e);
                }
            }
            
            // Если всё равно нет пользователя, перенаправляем
            if (!window.currentUser) {
                window.showNotification('Пожалуйста, войдите в систему', 'error');
                setTimeout(() => {
                    window.location.href = 'auth.html';
                }, 1500);
                return;
            }
        }
        
        console.log('👤 Текущий пользователь:', window.currentUser);
        
        // Обновляем UI профиля
        updateProfileUI();
        
        // Загружаем данные из Supabase если пользователь авторизован через него
        if (window.supabaseClient && window.currentUser.id && !window.currentUser.id.startsWith('demo-')) {
            try {
                console.log('📦 Загрузка данных из Supabase...');
                
                // Загружаем профиль из Supabase
                const { data, error } = await window.supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', window.currentUser.id)
                    .single();
                
                if (!error && data) {
                    console.log('✅ Данные профиля из Supabase:', data);
                    
                    // Обновляем объект пользователя
                    window.currentUser.profile = data;
                    
                    // Обновляем UI
                    updateProfileUI();
                } else {
                    console.log('📝 Профиль не найден в Supabase, создаем новый...');
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
            console.log('✅ Профиль создан в Supabase:', data);
            window.currentUser.profile = data[0];
            updateProfileUI();
        }
    } catch (error) {
        console.error('❌ Ошибка создания профиля:', error);
    }
}

// Обновление UI профиля
function updateProfileUI() {
    console.log('🎨 Обновление UI профиля...');
    
    if (!window.currentUser) {
        console.log('👤 Нет данных пользователя для отображения');
        return;
    }
    
    // Получаем данные для отображения
    const email = window.currentUser.email || 'Не указан';
    const userId = window.currentUser.id || 'Не указан';
    const createdAt = window.currentUser.created_at || 
                     window.currentUser.profile?.created_at || 
                     new Date().toISOString();
    const fullName = window.currentUser.user_metadata?.name || 
                    window.currentUser.profile?.full_name || 
                    email.split('@')[0];
    
    // Проверяем наличие аватара
    const avatarUrl = window.currentUser.profile?.avatar_url;
    const avatarElement = document.getElementById('profile-avatar');
    
    // Форматируем дату регистрации
    const regDate = new Date(createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    // Обновляем элементы на странице
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
    
    // Обновляем аватар
    if (avatarElement) {
        if (avatarUrl) {
            // Используем URL аватара
            avatarElement.style.backgroundImage = `url(${avatarUrl})`;
            avatarElement.style.backgroundSize = 'cover';
            avatarElement.style.backgroundPosition = 'center';
            avatarElement.textContent = '';
        } else {
            // Используем инициалы
            const initials = getUserInitials(fullName);
            avatarElement.style.backgroundImage = '';
            avatarElement.textContent = initials;
        }
    }
    
    // Обновляем имя в хедере
    usernameElements.forEach(el => {
        if (el.id === 'username' || el.classList.contains('user-name')) {
            el.textContent = fullName;
        }
    });
    
    console.log('✅ UI профиля обновлен:', { fullName, email, avatarUrl: !!avatarUrl });
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

// Настройка обработчиков событий
function setupProfileEventListeners() {
    console.log('🎮 Настройка обработчиков профиля...');
    
    // Редактирование профиля
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            console.log('✏️ Открытие формы редактирования профиля');
            openEditProfileModal();
        });
    }
    
    // Приглашение родственника
    const inviteBtn = document.getElementById('invite-btn');
    if (inviteBtn) {
        inviteBtn.addEventListener('click', () => {
            console.log('📨 Открытие формы приглашения');
            window.showModal('invite-modal');
        });
    }
    
    // Настройки уведомлений
   const notificationsBtn = document.getElementById('notifications-settings-btn');
if (notificationsBtn) {
    notificationsBtn.addEventListener('click', () => {
        openNotificationSettings();
    });
}
    
    // Экспорт данных
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportUserData);
    }
    
    // Смена аватара
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', handleAvatarChange);
    }
    
    // Выход
    const logoutBtn = document.getElementById('logout-profile-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('🚪 Выход из профиля');
            if (window.handleLogout) {
                window.handleLogout();
            }
        });
    }
    
    // Обработчик формы редактирования профиля
    const editProfileForm = document.getElementById('edit-profile-form-modal');
    if (editProfileForm) {
        // Удаляем старый обработчик если есть
        editProfileForm.replaceWith(editProfileForm.cloneNode(true));
        
        // Добавляем новый обработчик
        document.getElementById('edit-profile-form-modal').addEventListener('submit', handleEditProfileSubmit);
    }
    
    // Обработчик формы приглашения
    const inviteForm = document.getElementById('invite-form-modal');
    if (inviteForm) {
        inviteForm.addEventListener('submit', handleInviteSubmit);
    }
}

// Обработка смены аватара
async function handleAvatarChange() {
    console.log('📸 Запуск процесса смены аватара');
    
    // Создаем input для выбора файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    // Добавляем ограничения
    input.setAttribute('capture', 'user'); // Для мобильных устройств
    input.setAttribute('multiple', false);
    
    document.body.appendChild(input);
    
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
            console.log('❌ Файл не выбран');
            document.body.removeChild(input);
            return;
        }
        
        console.log('📁 Выбран файл:', file.name, file.size, file.type);
        
        // Проверяем размер файла (макс 5MB)
        if (file.size > 5 * 1024 * 1024) {
            window.showNotification('Размер файла не должен превышать 5MB', 'error');
            document.body.removeChild(input);
            return;
        }
        
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            window.showNotification('Пожалуйста, выберите изображение (JPG, PNG, GIF)', 'error');
            document.body.removeChild(input);
            return;
        }
        
        window.showLoader('Загрузка фото...');
        
        try {
            let avatarUrl;
            
            // Если пользователь авторизован, загружаем фото
            if (window.currentUser && window.currentUser.id) {
                try {
                    // Используем функцию загрузки
                    if (window.uploadProfilePhoto) {
                        avatarUrl = await window.uploadProfilePhoto(file, window.currentUser.id);
                        console.log('✅ Фото загружено, URL:', avatarUrl);
                    } else {
                        // Если функция не доступна, используем Data URL
                        avatarUrl = await window.readFileAsDataURL(file);
                    }
                } catch (uploadError) {
                    console.error('Ошибка загрузки фото:', uploadError);
                    window.showNotification('Ошибка загрузки фото', 'error');
                    window.hideLoader();
                    document.body.removeChild(input);
                    return;
                }
                
                // Сохраняем URL фото в профиле пользователя
                await saveAvatarToProfile(avatarUrl);
                
                // Обновляем аватар в интерфейсе
                updateAvatarInUI(avatarUrl);
                
                window.showNotification('✅ Фото профиля успешно обновлено!', 'success');
                
            } else {
                window.showNotification('Пользователь не авторизован', 'error');
            }
            
        } catch (error) {
            console.error('❌ Ошибка обработки фото:', error);
            window.showNotification('Ошибка обработки фото', 'error');
        } finally {
            window.hideLoader();
            // Удаляем input
            document.body.removeChild(input);
        }
    });
    
    // Запускаем выбор файла
    input.click();
}

// Сохранение аватара в профиль
async function saveAvatarToProfile(avatarUrl) {
    if (!window.currentUser) {
        console.error('❌ Нет данных пользователя для сохранения аватара');
        return;
    }
    
    console.log('💾 Сохранение аватара в профиль:', avatarUrl);
    
    try {
        // Обновляем локально
        if (!window.currentUser.profile) {
            window.currentUser.profile = {};
        }
        
        window.currentUser.profile.avatar_url = avatarUrl;
        
        // Сохраняем в localStorage
        localStorage.setItem('family_tree_user', JSON.stringify(window.currentUser));
        console.log('✅ Аватар сохранен в localStorage');
        
        // Если пользователь авторизован через Supabase, обновляем в базе
        if (window.supabaseClient && window.currentUser.id && !window.currentUser.id.startsWith('demo-')) {
            try {
                // Обновляем в таблице profiles
                const { error } = await window.supabaseClient
                    .from('profiles')
                    .update({
                        avatar_url: avatarUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', window.currentUser.id);
                
                if (error) {
                    console.warn('⚠️ Не удалось сохранить аватар в Supabase:', error);
                } else {
                    console.log('✅ Аватар сохранен в Supabase');
                }
            } catch (supabaseError) {
                console.warn('⚠️ Ошибка Supabase при сохранении аватара:', supabaseError);
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка сохранения аватара:', error);
        throw error;
    }
}

// Обновление аватара в UI
function updateAvatarInUI(avatarUrl) {
    console.log('🎨 Обновление аватара в UI');
    
    // Обновляем на странице профиля
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
        if (avatarUrl) {
            profileAvatar.style.backgroundImage = `url(${avatarUrl})`;
            profileAvatar.style.backgroundSize = 'cover';
            profileAvatar.style.backgroundPosition = 'center';
            profileAvatar.textContent = '';
        } else {
            // Если нет URL, показываем инициалы
            const fullName = window.currentUser.user_metadata?.name || 
                           window.currentUser.profile?.full_name || 
                           window.currentUser.email?.split('@')[0] || 
                           'П';
            const initials = getUserInitials(fullName);
            profileAvatar.style.backgroundImage = '';
            profileAvatar.textContent = initials;
        }
    }
    
    // Обновляем в хедере
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
    
    console.log('📝 Заполнение формы редактирования профиля');
    
    // Получаем текущие данные
    const name = window.currentUser.user_metadata?.name || 
                window.currentUser.profile?.full_name || 
                '';
    const email = window.currentUser.email || '';
    
    // Разбиваем имя на части
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    console.log('Данные для формы:', { firstName, lastName, email });
    
    // Заполняем форму
    const nameInput = document.getElementById('edit-profile-name');
    const lastNameInput = document.getElementById('edit-profile-last-name');
    const emailInput = document.getElementById('edit-profile-email');
    const bioInput = document.getElementById('edit-profile-bio');
    
    if (nameInput) nameInput.value = firstName;
    if (lastNameInput) lastNameInput.value = lastName;
    if (emailInput) emailInput.value = email;
    if (bioInput) bioInput.value = window.currentUser.profile?.bio || '';
    
    // Показываем модальное окно
    const modal = window.showModal('edit-profile-modal');
    
    // Убедимся, что у формы есть обработчик
    if (modal) {
        const form = modal.querySelector('#edit-profile-form-modal');
        if (form) {
            // Удаляем старый обработчик если есть
            form.replaceWith(form.cloneNode(true));
            
            // Добавляем новый обработчик
            modal.querySelector('#edit-profile-form-modal').addEventListener('submit', handleEditProfileSubmit);
        }
    }
}

// Обработка отправки формы редактирования профиля
async function handleEditProfileSubmit(e) {
    e.preventDefault();
    console.log('📝 Сохранение профиля...');
    
    const name = document.getElementById('edit-profile-name').value;
    const lastName = document.getElementById('edit-profile-last-name').value;
    const email = document.getElementById('edit-profile-email').value;
    const bio = document.getElementById('edit-profile-bio').value;
    
    console.log('Данные из формы:', { name, lastName, email, bio });
    
    if (!name || !email) {
        window.showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    // Формируем полное имя
    const fullName = lastName ? `${name} ${lastName}` : name;
    
    window.showLoader('Сохранение профиля...');
    
    try {
        // Обновляем локально
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
            
            // Сохраняем в localStorage
            localStorage.setItem('family_tree_user', JSON.stringify(window.currentUser));
            console.log('✅ Профиль обновлен локально');
        }
        
        // Если пользователь авторизован через Supabase, обновляем там
        if (window.supabaseClient && window.currentUser.id && !window.currentUser.id.startsWith('demo-')) {
            try {
                // Обновляем в auth
                console.log('🔐 Обновление данных в Auth...');
                const { data: authData, error: authError } = await window.supabaseClient.auth.updateUser({
                    email: email,
                    data: {
                        name: fullName
                    }
                });
                
                if (authError) {
                    console.warn('⚠️ Ошибка обновления в Auth:', authError);
                } else if (authData.user) {
                    window.currentUser = authData.user;
                    console.log('✅ Профиль обновлен в Auth');
                }
                
                // Обновляем в таблице profiles
                console.log('💾 Обновление данных в таблице profiles...');
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
                } else {
                    console.log('✅ Профиль обновлен в таблице profiles');
                }
            } catch (supabaseError) {
                console.warn('⚠️ Не удалось обновить в Supabase:', supabaseError);
            }
        }
        
        window.showNotification('✅ Профиль успешно обновлен!', 'success');
        
        // Обновляем UI
        updateProfileUI();
        if (window.updateUserUI) {
            window.updateUserUI();
        }
        
        // Закрываем модальное окно
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
    console.log('📨 Отправка приглашения...');
    
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
        // Сохраняем приглашение в localStorage
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
        
        // Сбрасываем форму
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
    console.log('💾 Экспорт данных пользователя...');
    
    window.showLoader('Подготовка данных...');
    
    try {
        // Собираем все данные пользователя
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
        
        // Создаем JSON файл
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.href = url;
        link.download = `family-history-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        window.showNotification('✅ Данные экспортированы! Файл скачивается...', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка экспорта данных:', error);
        window.showNotification('Ошибка экспорта данных', 'error');
    } finally {
        window.hideLoader();
    }
}

// Обновление статистики профиля
function updateProfileStats() {
    console.log('📊 Обновление статистики профиля...');
    
    // Люди в древе
    const peopleCount = window.people ? window.people.length : 0;
    const peopleCountElement = document.getElementById('info-people-count');
    if (peopleCountElement) {
        peopleCountElement.textContent = peopleCount;
    }
    
    // Обновляем статистику каждые 5 секунд (для динамических данных)
    setTimeout(updateProfileStats, 5000);
}

// Загрузка информации о дереве
function loadTreeInfo() {
    console.log('🌳 Загрузка информации о дереве...');
    
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
    console.log('📄 Страница профиля загружена');
    
    // Ждем загрузки основных скриптов
    setTimeout(() => {
        initProfilePage();
    }, 100);
});

// Настройки уведомлений
let notificationSettings = {
    success: true,
    error: true,
    info: true,
    birthday: true,
    anniversary: true,
    event: true,
    invite: true,
    join: true,
    media: true,
    tree: true
};

// Загрузка настроек уведомлений
function loadNotificationSettings() {
    try {
        const savedSettings = localStorage.getItem('notification_settings');
        if (savedSettings) {
            notificationSettings = { ...notificationSettings, ...JSON.parse(savedSettings) };
        }
        
        // Применяем настройки к переключателям
        document.querySelectorAll('.notification-toggle').forEach(toggle => {
            const type = toggle.dataset.type;
            if (type && notificationSettings[type] !== undefined) {
                toggle.checked = notificationSettings[type];
            }
        });
        
        console.log('✅ Настройки уведомлений загружены');
    } catch (error) {
        console.error('Ошибка загрузки настроек уведомлений:', error);
    }
}

// Сохранение настроек уведомлений
function saveNotificationSettings() {
    try {
        // Собираем настройки с переключателей
        document.querySelectorAll('.notification-toggle').forEach(toggle => {
            const type = toggle.dataset.type;
            if (type) {
                notificationSettings[type] = toggle.checked;
            }
        });
        
        localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
        
        // Применяем настройки к глобальной функции показа уведомлений
        window.notificationSettings = notificationSettings;
        
        console.log('✅ Настройки уведомлений сохранены');
    } catch (error) {
        console.error('Ошибка сохранения настроек уведомлений:', error);
    }
}

// Сброс настроек уведомлений
function resetNotificationSettings() {
    notificationSettings = {
        success: true,
        error: true,
        info: true,
        birthday: true,
        anniversary: true,
        event: true,
        invite: true,
        join: true,
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
    
    saveNotificationSettings();
    window.showNotification('✅ Настройки уведомлений сброшены', 'success');
}

// Открытие модального окна настроек уведомлений
function openNotificationSettings() {
    console.log('🔔 Открытие настроек уведомлений');
    
    // Загружаем актуальные настройки
    loadNotificationSettings();
    
    // Показываем модальное окно
    window.showModal('notifications-modal');
}

// Переопределяем глобальную функцию показа уведомлений с учетом настроек
const originalShowNotification = window.showNotification;
window.showNotification = function(message, type = 'info') {
    // Проверяем, включены ли уведомления этого типа
    if (window.notificationSettings) {
        if (type === 'success' && !window.notificationSettings.success) return;
        if (type === 'error' && !window.notificationSettings.error) return;
        if (type === 'info' && !window.notificationSettings.info) return;
    }
    
    // Вызываем оригинальную функцию
    originalShowNotification(message, type);
};

// Добавляем обработчики для настроек уведомлений
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем настройки
    loadNotificationSettings();
    window.notificationSettings = notificationSettings;
    
    // Обработчик для кнопки настроек уведомлений
    const notificationsBtn = document.getElementById('notifications-settings-btn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', openNotificationSettings);
    }
    
    // Обработчик для сохранения настроек
    const saveBtn = document.getElementById('save-notification-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveNotificationSettings();
            window.closeAllModals();
            window.showNotification('✅ Настройки уведомлений сохранены', 'success');
        });
    }
    
    // Обработчик для сброса настроек
    const resetBtn = document.getElementById('reset-notifications');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetNotificationSettings);
    }
    
    // Добавляем обработчики для всех переключателей (мгновенное применение)
    document.querySelectorAll('.notification-toggle').forEach(toggle => {
        toggle.addEventListener('change', function() {
            // Можно показывать подсказку, но не обязательно
            // console.log('Изменен тип:', this.dataset.type, this.checked);
        });
    });
});

// Экспортируем функции
window.openNotificationSettings = openNotificationSettings;
window.loadNotificationSettings = loadNotificationSettings;
window.saveNotificationSettings = saveNotificationSettings;
window.resetNotificationSettings = resetNotificationSettings;
// Экспортируем функции
window.initProfilePage = initProfilePage;
window.updateProfileUI = updateProfileUI;
window.exportUserData = exportUserData;
window.loadProfileData = loadProfileData;
window.handleAvatarChange = handleAvatarChange;
window.openEditProfileModal = openEditProfileModal;