// profile.js - Функции для страницы профиля
console.log('👤 Profile.js загружается...');

// Основные функции профиля
function initProfilePage() {
    console.log('🔄 Инициализация страницы профиля...');
    
    loadProfileData();
    setupProfileEventListeners();
    updateProfileStats();
    loadTreeInfo();
}

// Загрузка данных профиля
async function loadProfileData() {
    console.log('📥 Загрузка данных профиля...');
    
    try {
        if (!window.currentUser) {
            const savedUser = localStorage.getItem('family_tree_user');
            if (savedUser) {
                window.currentUser = JSON.parse(savedUser);
                console.log('✅ Пользователь загружен из localStorage');
            }
            
            if (!window.currentUser) {
                window.showNotification('Пожалуйста, войдите в систему', 'error');
                setTimeout(() => window.location.href = 'auth.html', 1500);
                return;
            }
        }

        updateProfileUI();

        if (window.supabaseClient && window.currentUser.id && !window.currentUser.id.startsWith('demo-')) {
            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', window.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                console.error('Ошибка загрузки профиля:', error);
                window.showNotification('Ошибка загрузки профиля', 'error');
                return;
            }

            if (data) {
                window.currentUser.profile = data;
                window.currentUser.user_metadata = {
                    ...window.currentUser.user_metadata,
                    full_name: data.full_name,
                    birth_date: data.birth_date,
                    bio: data.bio,
                    avatar_url: data.avatar_url
                };
            } else {
                // Профиля нет → создаём
                await createUserProfile();
            }

            updateProfileUI();
        }
    } catch (err) {
        console.error('❌ Ошибка в loadProfileData:', err);
        window.showNotification('Ошибка загрузки профиля', 'error');
    }
}

// Создание профиля, если его нет
async function createUserProfile() {
    if (!window.supabaseClient || !window.currentUser) return;

    const defaultProfile = {
        id: window.currentUser.id,
        email: window.currentUser.email,
        full_name: window.currentUser.user_metadata?.name ||
                   window.currentUser.email?.split('@')[0] ||
                   'Пользователь',
        birth_date: null,
        bio: '',
        avatar_url: null
    };

    const { error } = await window.supabaseClient
        .from('profiles')
        .insert([defaultProfile]);

    if (error) {
        console.error('Ошибка создания профиля:', error);
        window.showNotification('Не удалось создать профиль', 'error');
    } else {
        window.currentUser.profile = defaultProfile;
        updateProfileUI();
    }
}

// Обновление интерфейса профиля
function updateProfileUI() {
    if (!window.currentUser) return;

    const name = window.currentUser.user_metadata?.full_name ||
                 window.currentUser.user_metadata?.name ||
                 window.currentUser.email?.split('@')[0] ||
                 'Пользователь';

    const email = window.currentUser.email || 'Не указан';
    const initials = window.getUserInitials ? window.getUserInitials(name) : name.substring(0, 2).toUpperCase();
    const avatarUrl = window.currentUser.profile?.avatar_url || window.currentUser.user_metadata?.avatar_url;

    document.getElementById('profile-name')?.setAttribute('data-value', name);
    document.getElementById('profile-name')?.textContent = name;
    document.getElementById('profile-email')?.textContent = email;

    const avatarElem = document.getElementById('profile-avatar');
    if (avatarElem) {
        if (avatarUrl) {
            avatarElem.style.backgroundImage = `url(${avatarUrl})`;
            avatarElem.style.backgroundSize = 'cover';
            avatarElem.style.backgroundPosition = 'center';
            avatarElem.textContent = '';
        } else {
            avatarElem.style.backgroundImage = '';
            avatarElem.textContent = initials;
        }
    }

    document.getElementById('info-email')?.textContent = email;
    document.getElementById('info-user-id')?.textContent =
        window.currentUser.id ? window.currentUser.id.substring(0, 8) + '...' : '—';

    document.getElementById('info-reg-date')?.textContent =
        window.currentUser.created_at
            ? new Date(window.currentUser.created_at).toLocaleDateString('ru-RU')
            : 'Недавно';
}

// Настройка всех обработчиков
function setupProfileEventListeners() {
    // Смена аватара
    document.getElementById('change-avatar-btn')?.addEventListener('click', () => {
        document.getElementById('avatar-upload-input')?.click();
    });

    document.getElementById('avatar-upload-input')?.addEventListener('change', handleAvatarUpload);

    // Кнопка "Редактировать профиль"
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
        document.getElementById('edit-profile-name').value =
            window.currentUser.user_metadata?.full_name || '';
        document.getElementById('edit-profile-birthdate').value =
            window.currentUser.profile?.birth_date || '';
        document.getElementById('edit-profile-bio').value =
            window.currentUser.profile?.bio || '';

        window.showModal('edit-profile-modal');
    });

    // Submit формы редактирования
    document.getElementById('edit-profile-form')?.addEventListener('submit', handleProfileEditSubmit);
}

// Обработка загрузки аватара
async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        window.showNotification('Пожалуйста, выберите изображение', 'error');
        return;
    }

    window.showLoader('Загружаем фотографию...');

    try {
        const fileExt = file.name.split('.').pop();
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

        // Обновляем auth.user_metadata (опционально)
        await window.supabaseClient.auth.updateUser({
            data: { avatar_url: publicUrl }
        });

        // Обновляем локальные данные
        if (!window.currentUser.profile) window.currentUser.profile = {};
        window.currentUser.profile.avatar_url = publicUrl;
        window.currentUser.user_metadata.avatar_url = publicUrl;

        window.saveToLocalStorage();
        updateProfileUI();

        window.showNotification('Аватар успешно обновлён!', 'success');
    } catch (err) {
        console.error('Ошибка при загрузке аватара:', err);
        window.showNotification('Не удалось загрузить фото', 'error');
    } finally {
        window.hideLoader();
        e.target.value = ''; // сброс input
    }
}

// Сохранение изменений профиля
async function handleProfileEditSubmit(e) {
    e.preventDefault();
    window.showLoader('Сохраняем изменения...');

    try {
        const name = document.getElementById('edit-profile-name').value.trim();
        const birthDate = document.getElementById('edit-profile-birthdate').value;
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

        // Синхронизируем с auth.user_metadata
        await window.supabaseClient.auth.updateUser({
            data: {
                full_name: name,
                birth_date: birthDate || null,
                bio: bio || null
            }
        });

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

        window.showNotification('Профиль успешно обновлён!', 'success');
        window.closeAllModals();
    } catch (err) {
        console.error('Ошибка сохранения профиля:', err);
        window.showNotification(err.message || 'Ошибка сохранения', 'error');
    } finally {
        window.hideLoader();
    }
}

// Заглушки для остальных функций (чтобы не было ошибок)
function updateProfileStats() {
    // можно реализовать позже
    console.log('updateProfileStats called');
}

function loadTreeInfo() {
    // можно реализовать позже
    console.log('loadTreeInfo called');
}

function exportUserData() {
    // можно реализовать позже
    window.showNotification('Экспорт данных пока не реализован', 'info');
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Страница профиля загружена');
    setTimeout(initProfilePage, 300);
});

window.initProfilePage = initProfilePage;
window.updateProfileUI = updateProfileUI;
window.loadProfileData = loadProfileData;