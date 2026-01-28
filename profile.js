// profile.js - Функции для страницы профиля
console.log('👤 Profile.js загружается...');

function initProfilePage() {
    loadProfileData();
    setupProfileEventListeners();
    updateProfileStats();
    loadTreeInfo();
}

async function loadProfileData() {
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
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных профиля:', error);
        window.showNotification('Ошибка загрузки профиля', 'error');
    }
}

function updateProfileUI() {
    if (!window.currentUser) {
        return;
    }
    
    const email = window.currentUser.email || 'Не указан';
    const userId = window.currentUser.id || 'Не указан';
    const createdAt = window.currentUser.created_at || new Date().toISOString();
    const fullName = window.currentUser.user_metadata?.name || email.split('@')[0];
    
    const initials = getUserInitials(fullName);
    
    const regDate = new Date(createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileAvatar = document.getElementById('profile-avatar');
    const infoEmail = document.getElementById('info-email');
    const infoUserId = document.getElementById('info-user-id');
    const infoRegDate = document.getElementById('info-reg-date');
    const usernameElements = document.querySelectorAll('#username, .user-name');
    
    if (profileName) profileName.textContent = fullName;
    if (profileEmail) profileEmail.textContent = email;
    if (profileAvatar) profileAvatar.textContent = initials;
    if (infoEmail) infoEmail.textContent = email;
    if (infoUserId) infoUserId.textContent = userId.substring(0, 8) + '...';
    if (infoRegDate) infoRegDate.textContent = regDate;
    
    usernameElements.forEach(el => {
        if (el.id === 'username' || el.classList.contains('user-name')) {
            el.textContent = fullName;
        }
    });
}

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
    
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportUserData);
    }
    
    const logoutBtn = document.getElementById('logout-profile-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.handleLogout) {
                window.handleLogout();
            }
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

function openEditProfileModal() {
    if (!window.currentUser) {
        window.showNotification('Пожалуйста, войдите в систему', 'error');
        return;
    }
    
    const name = window.currentUser.user_metadata?.name || '';
    const email = window.currentUser.email || '';
    
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
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
            
            localStorage.setItem('family_tree_user', JSON.stringify(window.currentUser));
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

async function handleInviteSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('invite-email').value;
    
    if (!email) {
        window.showNotification('Введите email', 'error');
        return;
    }
    
    window.showLoader('Отправка приглашения...');
    
    try {
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
            media: window.media || []
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
        
        window.showNotification('✅ Данные экспортированы! Файл скачивается...', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка экспорта данных:', error);
        window.showNotification('Ошибка экспорта данных', 'error');
    } finally {
        window.hideLoader();
    }
}

function updateProfileStats() {
    const peopleCount = window.people ? window.people.length : 0;
    const peopleCountElement = document.getElementById('info-people-count');
    if (peopleCountElement) {
        peopleCountElement.textContent = peopleCount;
    }
    
    setTimeout(updateProfileStats, 5000);
}

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

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initProfilePage();
    }, 100);
});

window.initProfilePage = initProfilePage;
window.updateProfileUI = updateProfileUI;
window.exportUserData = exportUserData;
window.loadProfileData = loadProfileData;

console.log('✅ Profile.js загружен');