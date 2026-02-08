// profile.js - Полностью рабочий файл для страницы профиля
console.log('👤 Profile.js загружается...');

// =============================================
// Основная функция инициализации страницы
// =============================================
function initProfilePage() {
    console.log('🔄 Инициализация страницы профиля...');

    loadProfileData();
    setupProfileEventListeners();
    updateProfileStats();
    loadTreeInfo();
}

// =============================================
// Загрузка всех данных профиля
// =============================================
async function loadProfileData() {
    console.log('📥 Загрузка данных профиля...');

    try {
        // 1. Проверяем есть ли вообще текущий пользователь
        if (!window.currentUser) {
            const savedUser = localStorage.getItem('family_tree_user');
            if (savedUser) {
                window.currentUser = JSON.parse(savedUser);
                console.log('✅ Пользователь восстановлен из localStorage');
            }
        }

        if (!window.currentUser) {
            window.showNotification('Пожалуйста, войдите в систему', 'error');
            setTimeout(() => window.location.href = 'auth.html', 1200);
            return;
        }

        // 2. Сначала обновляем интерфейс тем, что уже есть
        updateProfileUI();

        // 3. Пытаемся загрузить свежие данные из Supabase
        if (window.supabaseClient && window.currentUser.id && !window.currentUser.id.startsWith('demo-')) {
            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', window.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = нет записей
                console.error('Ошибка загрузки профиля из Supabase:', error);
                window.showNotification('Ошибка загрузки профиля', 'error');
                return;
            }

            if (data) {
                // Есть профиль → используем его
                window.currentUser.profile = { ...data };
                window.currentUser.user_metadata = {
                    ...window.currentUser.user_metadata,
                    full_name: data.full_name,
                    birth_date: data.birth_date,
                    bio: data.bio,
                    avatar_url: data.avatar_url
                };
            }
            else {
                // Профиля нет → создаём
                await createUserProfile();
            }

            // Обновляем интерфейс свежими данными
            updateProfileUI();
        }
    }
    catch (err) {
        console.error('Критическая ошибка в loadProfileData:', err);
        window.showNotification('Ошибка загрузки профиля', 'error');
    }
}

// =============================================
// Создаём профиль если его ещё нет
// =============================================
async function createUserProfile() {
    if (!window.supabaseClient || !window.currentUser) return;

    const defaultProfile = {
        id: window.currentUser.id,
        email: window.currentUser.email,
        full_name: window.currentUser.user_metadata?.name ||
                   window.currentUser.email?.split('@')[0] ||
                   'Новый пользователь',
        birth_date: null,
        bio: '',
        avatar_url: null,
        created_at: new Date().toISOString()
    };

    const { error } = await window.supabaseClient
        .from('profiles')
        .insert([defaultProfile]);

    if (error) {
        console.error('Ошибка создания профиля:', error);
        window.showNotification('Не удалось создать профиль', 'error');
    }
    else {
        window.currentUser.profile = { ...defaultProfile };
        updateProfileUI();
        console.log('Новый профиль успешно создан');
    }
}

// =============================================
// Обновление всего интерфейса профиля
// =============================================
function updateProfileUI() {
    if (!window.currentUser) return;

    const name = window.currentUser.user_metadata?.full_name ||
                 window.currentUser.user_metadata?.name ||
                 window.currentUser.email?.split('@')[0] ||
                 'Пользователь';

    const email = window.currentUser.email || '—';
    const initials = window.getUserInitials ? window.getUserInitials(name) : name.substring(0, 2).toUpperCase();
    const avatarUrl = window.currentUser.profile?.avatar_url || window.currentUser.user_metadata?.avatar_url;

    // Основные поля
    const nameEl = document.getElementById('profile-name');
    if (nameEl) {
        nameEl.textContent = name;
    }

    document.getElementById('profile-email')?.textContent = email;

    // Аватар
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) {
        if (avatarUrl) {
            avatarEl.style.backgroundImage = `url(${avatarUrl})`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
            avatarEl.textContent = '';
        }
        else {
            avatarEl.style.backgroundImage = '';
            avatarEl.textContent = initials;
        }
    }

    // Информация в карточке
    document.getElementById('info-email')?.textContent = email;
    document.getElementById('info-user-id')?.textContent =
        window.currentUser.id ? window.currentUser.id.substring(0, 8) + '...' : '—';

    document.getElementById('info-reg-date')?.textContent =
        window.currentUser.created_at
            ? new Date(window.currentUser.created_at).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            })
            : 'Недавно';

    // Дополнительные поля, если они есть в html
    document.getElementById('info-full-name')?.textContent = name;
    document.getElementById('info-birth-date')?.textContent =
        window.currentUser.profile?.birth_date
            ? new Date(window.currentUser.profile.birth_date).toLocaleDateString('ru-RU')
            : '—';

    document.getElementById('info-bio')?.textContent =
        window.currentUser.profile?.bio || 'Нет информации';
}

// =============================================
// Все обработчики событий
// =============================================
function setupProfileEventListeners() {
    // -----------------------
    // Смена фотографии
    // -----------------------
    document.getElementById('change-avatar-btn')?.addEventListener('click', () => {
        document.getElementById('avatar-upload-input')?.click();
    });

    document.getElementById('avatar-upload-input')?.addEventListener('change', handleAvatarUpload);

    // -----------------------
    // Кнопка "Редактировать профиль"
    // -----------------------
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
        // Заполняем форму текущими значениями
        document.getElementById('edit-profile-name').value =
            window.currentUser.user_metadata?.full_name || '';

        document.getElementById('edit-profile-birthdate').value =
            window.currentUser.profile?.birth_date || '';

        document.getElementById('edit-profile-bio').value =
            window.currentUser.profile?.bio || '';

        window.showModal('edit-profile-modal');
    });

    // -----------------------
    // Сохранение формы редактирования
    // -----------------------
    document.getElementById('edit-profile-form')?.addEventListener('submit', handleProfileEditSubmit);
}

// =============================================
// Загрузка и сохранение новой фотографии
// =============================================
async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        window.showNotification('Выберите пожалуйста изображение', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        window.showNotification('Файл слишком большой (макс 5 МБ)', 'error');
        return;
    }

    window.showLoader('Загружаем фотографию...');

    try {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = `${window.currentUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await window.supabaseClient.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = window.supabaseClient.storage
            .from('avatars')
            .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Обновляем в таблице profiles
        const { error: updateError } = await window.supabaseClient
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', window.currentUser.id);

        if (updateError) throw updateError;

        // Дублируем в user_metadata (удобно для быстрого доступа)
        await window.supabaseClient.auth.updateUser({
            data: { avatar_url: publicUrl }
        }).catch(err => console.warn('Не удалось обновить auth metadata', err));

        // Обновляем локальный объект
        if (!window.currentUser.profile) window.currentUser.profile = {};
        window.currentUser.profile.avatar_url = publicUrl;
        window.currentUser.user_metadata.avatar_url = publicUrl;

        window.saveToLocalStorage();
        updateProfileUI();

        window.showNotification('Фото профиля успешно обновлено!', 'success');
    }
    catch (err) {
        console.error('Ошибка загрузки аватара:', err);
        window.showNotification('Не удалось загрузить фото', 'error');
    }
    finally {
        window.hideLoader();
        e.target.value = ''; // очень важно сбрасывать!
    }
}

// =============================================
// Сохранение изменений в форме редактирования
// =============================================
async function handleProfileEditSubmit(e) {
    e.preventDefault();
    window.showLoader('Сохраняем изменения...');

    try {
        const name = document.getElementById('edit-profile-name').value.trim();
        const birthDate = document.getElementById('edit-profile-birthdate').value.trim();
        const bio = document.getElementById('edit-profile-bio').value.trim();

        if (!name) {
            throw new Error('Имя обязательно');
        }

        const profileData = {
            full_name: name,
            birth_date: birthDate || null,
            bio: bio || null
        };

        const { error } = await window.supabaseClient
            .from('profiles')
            .update(profileData)
            .eq('id', window.currentUser.id);

        if (error) throw error;

        // Синхронизируем user_metadata
        await window.supabaseClient.auth.updateUser({
            data: {
                full_name: name,
                birth_date: birthDate || null,
                bio: bio || null
            }
        }).catch(err => console.warn('auth metadata не обновился', err));

        // Обновляем локальные данные
        window.currentUser.user_metadata = {
            ...window.currentUser.user_metadata,
            full_name: name,
            birth_date: birthDate || null,
            bio: bio || null
        };

        if (window.currentUser.profile) {
            Object.assign(window.currentUser.profile, profileData);
        }

        window.saveToLocalStorage();
        updateProfileUI();

        window.showNotification('Профиль успешно сохранён!', 'success');
        window.closeAllModals();
    }
    catch (err) {
        console.error('Ошибка сохранения профиля:', err);
        window.showNotification(err.message || 'Ошибка сохранения', 'error');
    }
    finally {
        window.hideLoader();
    }
}

// =============================================
// Статистика профиля
// =============================================
function updateProfileStats() {
    const peopleCount = window.treeData?.relatives?.length || 0;

    document.getElementById('info-people-count')?.textContent = peopleCount;
}

// =============================================
// Информация о дереве
// =============================================
function loadTreeInfo() {
    const section = document.getElementById('tree-info-section');
    if (!section) return;

    const count = window.treeData?.relatives?.length || 0;
    const name = window.treeData?.name || 'Моё семейное дерево';

    if (count === 0) {
        section.innerHTML = `
            <div style="text-align:center; padding:40px 20px; color:#718096;">
                <i class="fas fa-tree" style="font-size:3rem; opacity:0.4; margin-bottom:15px;"></i>
                <h4 style="margin:10px 0;">У вас пока нет семейного древа</h4>
                <p style="margin-bottom:20px;">Начните создавать свою семейную историю</p>
                <a href="tree.html" class="btn">Создать дерево</a>
            </div>
        `;
    }
    else {
        section.innerHTML = `
            <div style="background:#f0fff4; padding:20px; border-radius:10px; border:1px solid #c6f6d5;">
                <h4 style="margin:0 0 15px 0; color:#276749;">
                    <i class="fas fa-tree"></i> ${name}
                </h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.95rem;">
                    <div>Родственников:</div>
                    <div style="font-weight:bold;">${count}</div>
                    
                    <div>Создано:</div>
                    <div style="font-weight:bold;">
                        ${window.treeData.created 
                            ? new Date(window.treeData.created).toLocaleDateString('ru-RU') 
                            : 'Недавно'}
                    </div>
                </div>
                
                <div style="margin-top:20px; display:flex; gap:12px;">
                    <a href="tree.html" class="btn btn-small">Редактировать</a>
                    <button class="btn btn-small btn-secondary" onclick="exportTree()">Экспорт</button>
                </div>
            </div>
        `;
    }
}

// =============================================
// Экспорт дерева (простой вариант)
// =============================================
function exportTree() {
    if (!window.treeData?.relatives?.length) {
        window.showNotification('Нет данных для экспорта', 'warning');
        return;
    }

    const dataStr = JSON.stringify(window.treeData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `family-tree-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    window.showNotification('Дерево экспортировано в JSON', 'success');
}

// =============================================
// Запуск при загрузке страницы
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Страница профиля загружена');
    setTimeout(initProfilePage, 200);
});

// Экспорт функций в глобальную область
window.initProfilePage = initProfilePage;
window.updateProfileUI = updateProfileUI;
window.loadProfileData = loadProfileData;