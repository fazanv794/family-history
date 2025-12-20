/**
 * Tree Builder - Построитель генеалогического дерева с визуализацией
 */

(function() {
    console.log('🌳 Tree Builder загружается...');
    
    // Хранилище данных
    let treeData = {
        relatives: [],
        treeName: 'Мое семейное дерево',
        familyLine: 'father',
        style: 'classic',
        rootId: null
    };
    
    // Конфигурация
    const CONFIG = {
        ROLES: [
            { value: 'great-grandfather', label: 'Прадедушка', level: 1 },
            { value: 'great-grandmother', label: 'Прабабушка', level: 1 },
            { value: 'grandfather', label: 'Дедушка', level: 2 },
            { value: 'grandmother', label: 'Бабушка', level: 2 },
            { value: 'father', label: 'Отец', level: 3 },
            { value: 'mother', label: 'Мать', level: 3 },
            { value: 'uncle', label: 'Дядя', level: 3 },
            { value: 'aunt', label: 'Тетя', level: 3 },
            { value: 'brother', label: 'Брат', level: 4 },
            { value: 'sister', label: 'Сестра', level: 4 },
            { value: 'son', label: 'Сын', level: 4 },
            { value: 'daughter', label: 'Дочь', level: 4 },
            { value: 'grandson', label: 'Внук', level: 5 },
            { value: 'granddaughter', label: 'Внучка', level: 5 }
        ],
        
        LINES: [
            { value: 'father', label: 'Линия отца', color: '#007bff' },
            { value: 'mother', label: 'Линия матери', color: '#e83e8c' },
            { value: 'both', label: 'Обе линии', color: '#6f42c1' }
        ],
        
        COLORS: {
            father: '#007bff',
            mother: '#e83e8c',
            male: '#4dabf7',
            female: '#f783ac',
            default: '#6c757d'
        }
    };
    
    // Основная функция запуска построителя
    window.startTreeBuilder = function(mode = 'auto') {
        console.log(`🚀 Запуск Tree Builder в режиме: ${mode}`);
        
        // Инициализируем данные
        treeData.relatives = [];
        treeData.mode = mode;
        treeData.rootId = null;
        
        // Показываем первое окно
        showMainModal();
    };
    
    // Показать главное модальное окно
    function showMainModal() {
        const content = `
            <div class="ms-alert ms-alert-info">
                <strong>${treeData.mode === 'auto' ? 'Авто-построение' : 'Ручное построение'}</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">
                    ${treeData.mode === 'auto' 
                        ? 'Система поможет вам поэтапно создать генеалогическое дерево' 
                        : 'Вы полностью контролируете процесс построения'}
                </p>
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Выберите линию родства:</label>
                <select class="ms-form-control" id="family-line">
                    ${CONFIG.LINES.map(line => 
                        `<option value="${line.value}">${line.label}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div id="relatives-container" style="margin-top: 20px;">
                <div class="ms-alert ms-alert-warning" id="empty-list-alert">
                    <strong>Добавьте родственников</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Начните с добавления первого родственника</p>
                </div>
                
                <div id="relatives-list" style="display: none;">
                    <!-- Список родственников будет здесь -->
                </div>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
                <button class="ms-btn ms-btn-primary" id="add-relative-btn" style="padding: 10px 20px;">
                    + Добавить родственника
                </button>
            </div>
            
            <div class="ms-alert ms-alert-info">
                <strong>💡 Совет:</strong> Начните с добавления себя или ближайших родственников.
            </div>
        `;
        
        window.ModalSystem.createModal('tree-builder-main', {
            title: '🌳 Построитель генеалогического дерева',
            content: content,
            width: '600px',
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary',
                    onClick: function() {
                        console.log('Построение отменено');
                    }
                },
                {
                    text: 'Далее',
                    type: 'primary',
                    onClick: function() {
                        if (treeData.relatives.length === 0) {
                            window.Modal.alert('Внимание', 'Добавьте хотя бы одного родственника!');
                            return false;
                        }
                        showTreeSettingsModal();
                        return true;
                    }
                }
            ]
        });
        
        // Инициализация обработчиков событий
        setTimeout(() => {
            document.getElementById('family-line').addEventListener('change', function(e) {
                treeData.familyLine = e.target.value;
            });
            
            document.getElementById('add-relative-btn').addEventListener('click', showAddRelativeModal);
            
            updateRelativesList();
        }, 100);
    }
    
    // Показать окно добавления родственника
    function showAddRelativeModal(relativeToEdit = null) {
        const isEdit = !!relativeToEdit;
        const relative = relativeToEdit || {};
        
        // Определяем пол по роли
        const isMale = ['great-grandfather', 'grandfather', 'father', 'uncle', 'brother', 'son', 'grandson'].includes(relative.role);
        const isFemale = ['great-grandmother', 'grandmother', 'mother', 'aunt', 'sister', 'daughter', 'granddaughter'].includes(relative.role);
        
        const content = `
            <form id="relative-form">
                <div class="ms-form-row">
                    <div class="ms-form-group">
                        <label class="ms-form-label">Фамилия *</label>
                        <input type="text" class="ms-form-control" id="last-name" 
                               value="${relative.lastName || ''}" required>
                    </div>
                    <div class="ms-form-group">
                        <label class="ms-form-label">Имя *</label>
                        <input type="text" class="ms-form-control" id="first-name" 
                               value="${relative.firstName || ''}" required>
                    </div>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Отчество</label>
                    <input type="text" class="ms-form-control" id="middle-name" 
                           value="${relative.middleName || ''}">
                </div>
                
                <div class="ms-form-row">
                    <div class="ms-form-group">
                        <label class="ms-form-label">Пол *</label>
                        <select class="ms-form-control" id="gender" required>
                            <option value="">-- Выберите пол --</option>
                            <option value="male" ${relative.gender === 'male' || isMale ? 'selected' : ''}>Мужской</option>
                            <option value="female" ${relative.gender === 'female' || isFemale ? 'selected' : ''}>Женский</option>
                        </select>
                    </div>
                    <div class="ms-form-group">
                        <label class="ms-form-label">Роль в семье *</label>
                        <select class="ms-form-control" id="relative-role" required>
                            <option value="">-- Выберите роль --</option>
                            ${CONFIG.ROLES.map(role => 
                                `<option value="${role.value}" ${relative.role === role.value ? 'selected' : ''}>
                                    ${role.label}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="ms-form-row">
                    <div class="ms-form-group">
                        <label class="ms-form-label">Дата рождения</label>
                        <input type="date" class="ms-form-control" id="birth-date" 
                               value="${relative.birthDate || ''}">
                    </div>
                    <div class="ms-form-group">
                        <label class="ms-form-label">Дата смерти</label>
                        <input type="date" class="ms-form-control" id="death-date" 
                               value="${relative.deathDate || ''}">
                    </div>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Линия родства *</label>
                    <select class="ms-form-control" id="relative-line" required>
                        <option value="">-- Выберите линию --</option>
                        <option value="father" ${relative.line === 'father' ? 'selected' : ''}>Линия отца</option>
                        <option value="mother" ${relative.line === 'mother' ? 'selected' : ''}>Линия матери</option>
                    </select>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Место рождения</label>
                    <input type="text" class="ms-form-control" id="birth-place" 
                           value="${relative.birthPlace || ''}" placeholder="Город, страна">
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Профессия/Род деятельности</label>
                    <input type="text" class="ms-form-control" id="profession" 
                           value="${relative.profession || ''}" placeholder="Чем занимался(ется)">
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Биография</label>
                    <textarea class="ms-form-control ms-form-textarea" id="bio" rows="3" 
                              placeholder="Краткая история жизни, достижения, интересные факты...">${relative.bio || ''}</textarea>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Заметки</label>
                    <textarea class="ms-form-control ms-form-textarea" id="notes" rows="2" 
                              placeholder="Дополнительные сведения, воспоминания...">${relative.notes || ''}</textarea>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Фотография</label>
                    <div style="border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer;"
                         onclick="document.getElementById('photo-upload').click()" 
                         id="photo-dropzone">
                        <div style="font-size: 48px; color: #6c757d; margin-bottom: 10px;" id="photo-icon">
                            📷
                        </div>
                        <div style="color: #6c757d;" id="photo-text">
                            Нажмите или перетащите фото
                        </div>
                        <input type="file" id="photo-upload" accept="image/*" style="display: none;" 
                               onchange="handlePhotoUpload(event, '${relative.id || 'new'}')">
                    </div>
                    <div id="photo-preview" style="margin-top: 15px; ${relative.photo ? '' : 'display: none;'}">
                        <img id="preview-image" src="${relative.photo || ''}" 
                             style="max-width: 150px; max-height: 150px; border-radius: 8px; border: 1px solid #dee2e6;">
                    </div>
                </div>
                
                <div class="ms-alert ms-alert-warning">
                    <strong>ℹ️ Информация:</strong> Поля, отмеченные *, обязательны для заполнения.
                </div>
            </form>
        `;
        
        window.ModalSystem.createModal('add-relative', {
            title: isEdit ? '✏️ Редактировать родственника' : '👤 Добавить родственника',
            content: content,
            width: '600px',
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary'
                },
                {
                    text: isEdit ? 'Сохранить' : 'Добавить',
                    type: 'primary',
                    onClick: function() {
                        saveRelative(relativeToEdit?.id);
                        return true;
                    }
                }
            ]
        });
        
        // Инициализация загрузки фото
        setTimeout(() => {
            if (relative.photo) {
                document.getElementById('photo-icon').style.display = 'none';
                document.getElementById('photo-text').textContent = 'Фото загружено. Нажмите для изменения';
            }
        }, 100);
    }
    
    // Обработка загрузки фото
    window.handlePhotoUpload = function(event, relativeId) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            window.Modal.alert('Ошибка', 'Пожалуйста, выберите файл изображения (JPG, PNG, GIF)');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            window.Modal.alert('Ошибка', 'Файл слишком большой. Максимальный размер: 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoPreview = document.getElementById('photo-preview');
            const previewImage = document.getElementById('preview-image');
            const photoIcon = document.getElementById('photo-icon');
            const photoText = document.getElementById('photo-text');
            
            previewImage.src = e.target.result;
            photoPreview.style.display = 'block';
            photoIcon.style.display = 'none';
            photoText.textContent = 'Фото загружено. Нажмите для изменения';
            
            // Сохраняем фото во временное хранилище
            window.tempPhotoData = window.tempPhotoData || {};
            window.tempPhotoData[relativeId] = e.target.result;
        };
        
        reader.readAsDataURL(file);
    };
    
    // Сохранить родственника
    function saveRelative(existingId = null) {
        // Получаем значения из формы
        const lastName = document.getElementById('last-name').value.trim();
        const firstName = document.getElementById('first-name').value.trim();
        const middleName = document.getElementById('middle-name').value.trim();
        const gender = document.getElementById('gender').value;
        const birthDate = document.getElementById('birth-date').value;
        const deathDate = document.getElementById('death-date').value;
        const role = document.getElementById('relative-role').value;
        const line = document.getElementById('relative-line').value;
        const birthPlace = document.getElementById('birth-place').value.trim();
        const profession = document.getElementById('profession').value.trim();
        const bio = document.getElementById('bio').value.trim();
        const notes = document.getElementById('notes').value.trim();
        
        // Валидация
        if (!lastName || !firstName || !gender || !role || !line) {
            window.Modal.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля!');
            return false;
        }
        
        // Получаем фото (из временного хранилища или существующего)
        const tempPhoto = window.tempPhotoData?.[existingId || 'new'];
        const existingPhoto = treeData.relatives.find(r => r.id === existingId)?.photo;
        const photo = tempPhoto || existingPhoto || null;
        
        // Очищаем временное хранилище
        if (window.tempPhotoData) {
            delete window.tempPhotoData[existingId || 'new'];
        }
        
        // Находим данные роли
        const roleObj = CONFIG.ROLES.find(r => r.value === role);
        const roleText = roleObj ? roleObj.label : role;
        const level = roleObj ? roleObj.level : 3;
        
        // Цвет по полу и линии
        const avatarColor = gender === 'male' ? CONFIG.COLORS.male : CONFIG.COLORS.female;
        const borderColor = line === 'father' ? CONFIG.COLORS.father : CONFIG.COLORS.mother;
        
        // Создаем объект родственника
        const relative = {
            id: existingId || Date.now(),
            lastName: lastName,
            firstName: firstName,
            middleName: middleName,
            fullName: `${lastName} ${firstName} ${middleName || ''}`.trim(),
            gender: gender,
            birthDate: birthDate || null,
            deathDate: deathDate || null,
            age: calculateAge(birthDate, deathDate),
            role: role,
            roleText: roleText,
            level: level,
            line: line,
            lineText: line === 'father' ? 'Линия отца' : 'Линия матери',
            birthPlace: birthPlace,
            profession: profession,
            bio: bio,
            notes: notes,
            photo: photo,
            avatarColor: avatarColor,
            borderColor: borderColor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Устанавливаем root если это первый родственник или родитель
        if (!treeData.rootId && ['father', 'mother', 'grandfather', 'grandmother'].includes(role)) {
            treeData.rootId = relative.id;
        }
        
        // Сохраняем или обновляем
        if (existingId) {
            // Обновляем существующего
            const index = treeData.relatives.findIndex(r => r.id === existingId);
            if (index !== -1) {
                treeData.relatives[index] = relative;
            }
        } else {
            // Добавляем нового
            treeData.relatives.push(relative);
        }
        
        // Обновляем список
        updateRelativesList();
        
        // Показываем уведомление
        showNotification(
            existingId ? 'Родственник обновлен' : 'Родственник добавлен',
            `${relative.firstName} ${relative.lastName} ${existingId ? 'обновлен' : 'добавлен'} в дерево`
        );
        
        return true;
    }
    
    // Расчет возраста
    function calculateAge(birthDate, deathDate) {
        if (!birthDate) return null;
        
        const birth = new Date(birthDate);
        const end = deathDate ? new Date(deathDate) : new Date();
        
        if (isNaN(birth.getTime())) return null;
        if (deathDate && isNaN(end.getTime())) return null;
        
        let years = end.getFullYear() - birth.getFullYear();
        const months = end.getMonth() - birth.getMonth();
        
        if (months < 0 || (months === 0 && end.getDate() < birth.getDate())) {
            years--;
        }
        
        return years > 0 ? years : null;
    }
    
    // Обновить список родственников
    function updateRelativesList() {
        const container = document.getElementById('relatives-container');
        const listContainer = document.getElementById('relatives-list');
        const emptyAlert = document.getElementById('empty-list-alert');
        
        if (!container) return;
        
        if (treeData.relatives.length === 0) {
            if (emptyAlert) emptyAlert.style.display = 'block';
            if (listContainer) listContainer.style.display = 'none';
            return;
        }
        
        if (emptyAlert) emptyAlert.style.display = 'none';
        
        // Сортируем по уровню (поколению)
        const sortedRelatives = [...treeData.relatives].sort((a, b) => a.level - b.level);
        
        let listHtml = '';
        
        sortedRelatives.forEach((relative) => {
            const initials = `${relative.firstName.charAt(0)}${relative.lastName.charAt(0)}`;
            
            listHtml += `
                <div class="ms-relative-item" data-id="${relative.id}">
                    <div class="ms-relative-avatar" style="background: ${relative.avatarColor}; border: 2px solid ${relative.borderColor}">
                        ${relative.photo ? 
                            `<img src="${relative.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : 
                            initials
                        }
                    </div>
                    <div class="ms-relative-info">
                        <h4 class="ms-relative-name">${relative.fullName}</h4>
                        <p class="ms-relative-details">
                            ${relative.roleText} • ${relative.lineText}
                            ${relative.birthDate ? `• 📅 ${formatDate(relative.birthDate)}` : ''}
                            ${relative.age ? `• ${relative.age} лет` : ''}
                        </p>
                    </div>
                    <div class="ms-relative-actions">
                        <button class="ms-action-btn ms-action-btn-edit" onclick="editRelative(${relative.id})">
                            ✏️
                        </button>
                        <button class="ms-action-btn ms-action-btn-delete" onclick="deleteRelative(${relative.id})">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });
        
        if (!listContainer) {
            const newListContainer = document.createElement('div');
            newListContainer.id = 'relatives-list';
            newListContainer.innerHTML = listHtml;
            
            const addButton = container.querySelector('#add-relative-btn');
            if (addButton && addButton.parentNode) {
                container.insertBefore(newListContainer, addButton.parentNode);
            }
        } else {
            listContainer.innerHTML = listHtml;
            listContainer.style.display = 'block';
        }
    }
    
    // Показать окно настроек дерева
    function showTreeSettingsModal() {
        const content = `
            <div class="ms-alert ms-alert-success">
                <strong>✅ Отлично! Добавлено родственников: ${treeData.relatives.length}</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Теперь настройте параметры дерева</p>
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Название дерева:</label>
                <input type="text" class="ms-form-control" id="tree-name" 
                       value="${treeData.treeName}" placeholder="Введите название">
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Стиль отображения:</label>
                <select class="ms-form-control" id="tree-style">
                    <option value="classic">Классический (вертикальный)</option>
                    <option value="horizontal">Горизонтальный</option>
                    <option value="circular">Круговой</option>
                    <option value="photo">С фотографиями</option>
                </select>
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Цветовая схема:</label>
                <select class="ms-form-control" id="tree-color">
                    <option value="blue">Синяя</option>
                    <option value="green">Зеленая</option>
                    <option value="purple">Фиолетовая</option>
                    <option value="warm">Теплая</option>
                </select>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin-top: 0; font-size: 16px;">Предпросмотр:</h4>
                <div id="tree-preview" style="min-height: 150px; display: flex; align-items: center; justify-content: center;">
                    <div style="color: #999; font-style: italic;">Предпросмотр дерева...</div>
                </div>
            </div>
            
            <div class="ms-alert ms-alert-info">
                <strong>📊 Статистика:</strong><br>
                👥 Всего родственников: ${treeData.relatives.length}<br>
                👨 Линия отца: ${treeData.relatives.filter(r => r.line === 'father').length}<br>
                👩 Линия матери: ${treeData.relatives.filter(r => r.line === 'mother').length}<br>
                📷 С фотографиями: ${treeData.relatives.filter(r => r.photo).length}
            </div>
        `;
        
        window.ModalSystem.createModal('tree-settings', {
            title: '⚙️ Настройки дерева',
            content: content,
            width: '650px',
            buttons: [
                {
                    text: 'Назад',
                    type: 'secondary',
                    onClick: function() {
                        showMainModal();
                        return true;
                    }
                },
                {
                    text: 'Построить дерево',
                    type: 'primary',
                    onClick: function() {
                        treeData.treeName = document.getElementById('tree-name').value.trim() || 'Мое семейное дерево';
                        treeData.style = document.getElementById('tree-style').value;
                        treeData.colorScheme = document.getElementById('tree-color').value;
                        
                        buildTree();
                        return true;
                    }
                }
            ]
        });
        
        // Генерируем предпросмотр
        setTimeout(() => {
            generateTreePreview();
        }, 100);
    }
    
    // Генерация предпросмотра дерева
    function generateTreePreview() {
        const previewContainer = document.getElementById('tree-preview');
        if (!previewContainer || treeData.relatives.length === 0) return;
        
        // Простой ASCII превью
        let previewHtml = `
            <div style="font-family: monospace; font-size: 11px; line-height: 1.3; text-align: center;">
        `;
        
        // Группируем по уровням
        const levels = {};
        treeData.relatives.forEach(relative => {
            if (!levels[relative.level]) levels[relative.level] = [];
            levels[relative.level].push(relative);
        });
        
        // Отображаем уровни
        Object.keys(levels).sort().forEach(level => {
            previewHtml += `<div style="margin: 5px 0;">`;
            levels[level].forEach(relative => {
                const symbol = relative.gender === 'male' ? '👨' : '👩';
                previewHtml += `<span style="margin: 0 5px;">${symbol} ${relative.firstName.charAt(0)}.</span>`;
            });
            previewHtml += `</div>`;
        });
        
        previewHtml += `</div>`;
        previewContainer.innerHTML = previewHtml;
    }
    
    // Построить дерево
    function buildTree() {
        // Показываем окно прогресса
        const progressContent = `
            <div style="text-align: center; padding: 30px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">🌳</div>
                <h4 style="margin: 0 0 15px 0; color: #007bff;">Создаем визуализацию дерева...</h4>
                <p style="color: #6c757d; margin-bottom: 20px;">
                    Обрабатываем ${treeData.relatives.length} родственников<br>
                    ${treeData.relatives.filter(r => r.photo).length} с фотографиями
                </p>
                
                <div class="ms-progress">
                    <div id="progress-bar" class="ms-progress-bar" style="width: 0%">0%</div>
                </div>
                
                <div style="margin-top: 20px; font-size: 14px; color: #999;">
                    <div>⏳ Генерация структуры...</div>
                    <div>🖼️ Загрузка фотографий...</div>
                    <div>🎨 Применение стилей...</div>
                </div>
            </div>
        `;
        
        window.ModalSystem.createModal('building-progress', {
            title: '⚙️ Построение дерева',
            content: progressContent,
            width: '500px',
            showCloseButton: false,
            closeOnOverlay: false
        });
        
        // Запускаем анимацию прогресса
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
                progressBar.textContent = `${progress}%`;
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                
                setTimeout(() => {
                    window.ModalSystem.closeModal('building-progress');
                    showTreeVisualization();
                }, 500);
            }
        }, 200);
    }
    
    // Показать визуализацию дерева
    function showTreeVisualization() {
        // Генерируем HTML для дерева
        const treeHtml = generateTreeHTML();
        
        const content = `
            <div style="position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; color: #333;">${treeData.treeName}</h4>
                    <div style="font-size: 14px; color: #666;">
                        ${treeData.relatives.length} родственников • ${treeData.style} стиль
                    </div>
                </div>
                
                <div style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="ms-btn ms-btn-primary" onclick="zoomIn()" style="font-size: 12px; padding: 5px 10px;">
                        🔍 Увеличить
                    </button>
                    <button class="ms-btn ms-btn-secondary" onclick="zoomOut()" style="font-size: 12px; padding: 5px 10px;">
                        🔍 Уменьшить
                    </button>
                    <button class="ms-btn ms-btn-success" onclick="exportTreeImage()" style="font-size: 12px; padding: 5px 10px;">
                        📷 Сохранить как изображение
                    </button>
                    <button class="ms-btn" onclick="toggleViewMode()" style="font-size: 12px; padding: 5px 10px; background: #6c757d; color: white;">
                        🔄 Сменить вид
                    </button>
                </div>
                
                <div id="tree-container" style="overflow: auto; max-height: 500px; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; background: #f8f9fa;">
                    ${treeHtml}
                </div>
                
                <div style="margin-top: 15px; font-size: 12px; color: #666; text-align: center;">
                    <div>👆 Нажмите на любого родственника, чтобы посмотреть подробную информацию</div>
                    <div style="margin-top: 5px;">
                        <span style="color: #007bff;">●</span> Линия отца | 
                        <span style="color: #e83e8c;">●</span> Линия матери
                    </div>
                </div>
            </div>
        `;
        
        window.ModalSystem.createModal('tree-visualization', {
            title: '🌳 Ваше генеалогическое дерево',
            content: content,
            width: '900px',
            height: '700px',
            buttons: [
                {
                    text: 'Закрыть',
                    type: 'secondary'
                },
                {
                    text: 'Экспорт данных',
                    type: 'primary',
                    onClick: exportTree
                }
            ]
        });
        
        // Инициализация обработчиков для элементов дерева
        setTimeout(() => {
            initializeTreeInteractions();
        }, 100);
    }
    
    // Генерация HTML для дерева
    function generateTreeHTML() {
        if (treeData.relatives.length === 0) {
            return '<div style="text-align: center; padding: 50px; color: #666;">Дерево пустое</div>';
        }
        
        // Определяем корневого родственника
        let root = treeData.relatives.find(r => r.id === treeData.rootId);
        if (!root) {
            // Ищем родителей или бабушек/дедушек
            root = treeData.relatives.find(r => ['father', 'mother', 'grandfather', 'grandmother'].includes(r.role)) 
                || treeData.relatives[0];
        }
        
        let html = '';
        
        if (treeData.style === 'classic') {
            html = generateClassicTree(root);
        } else if (treeData.style === 'horizontal') {
            html = generateHorizontalTree(root);
        } else if (treeData.style === 'circular') {
            html = generateCircularTree(root);
        } else {
            html = generatePhotoTree(root);
        }
        
        return html;
    }
    
    // Классическое вертикальное дерево
    function generateClassicTree(root) {
        // Группируем по уровням
        const levels = {};
        treeData.relatives.forEach(relative => {
            if (!levels[relative.level]) levels[relative.level] = [];
            levels[relative.level].push(relative);
        });
        
        let html = '<div style="display: flex; flex-direction: column; align-items: center;">';
        
        // Отображаем уровни сверху вниз
        Object.keys(levels).sort().forEach(level => {
            html += `<div style="display: flex; justify-content: center; margin: 20px 0;">`;
            
            levels[level].forEach((relative, index) => {
                const isRoot = relative.id === root?.id;
                const borderSize = isRoot ? '3px' : '2px';
                const boxShadow = isRoot ? '0 0 10px rgba(0,0,0,0.2)' : '0 2px 5px rgba(0,0,0,0.1)';
                
                html += `
                    <div class="tree-node" data-id="${relative.id}" 
                         style="margin: 0 15px; cursor: pointer; transition: all 0.3s;"
                         onmouseover="this.style.transform='translateY(-5px)'"
                         onmouseout="this.style.transform='translateY(0)'">
                        <div style="width: 80px; text-align: center;">
                            <div style="width: 60px; height: 60px; margin: 0 auto 5px; 
                                        border-radius: 50%; border: ${borderSize} solid ${relative.borderColor};
                                        background: ${relative.avatarColor}; overflow: hidden; box-shadow: ${boxShadow};">
                                ${relative.photo ? 
                                    `<img src="${relative.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                                    `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; font-weight: bold;">
                                        ${relative.firstName.charAt(0)}${relative.lastName.charAt(0)}
                                    </div>`
                                }
                            </div>
                            <div style="font-size: 11px; font-weight: 600; color: #333; margin-top: 5px;">
                                ${relative.firstName}
                            </div>
                            <div style="font-size: 10px; color: #666;">
                                ${relative.roleText}
                            </div>
                            ${relative.birthDate ? 
                                `<div style="font-size: 9px; color: #999; margin-top: 2px;">
                                    📅 ${formatDate(relative.birthDate)}
                                </div>` : ''
                            }
                        </div>
                    </div>
                `;
                
                // Добавляем связи между узлами
                if (index < levels[level].length - 1) {
                    html += `<div style="width: 30px; border-top: 1px dashed #ccc; margin-top: 30px;"></div>`;
                }
            });
            
            html += `</div>`;
            
            // Добавляем вертикальные связи между уровнями
            if (level < Object.keys(levels).length - 1) {
                html += `
                    <div style="height: 40px; display: flex; justify-content: center;">
                        ${levels[level].map(() => 
                            `<div style="width: 1px; height: 100%; background: #ccc; margin: 0 47px;"></div>`
                        ).join('')}
                    </div>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }
    
    // Горизонтальное дерево
    function generateHorizontalTree(root) {
        let html = '<div style="display: flex; overflow-x: auto; padding: 20px;">';
        
        // Сортируем по уровню
        const sortedRelatives = [...treeData.relatives].sort((a, b) => a.level - b.level);
        
        sortedRelatives.forEach((relative, index) => {
            const isRoot = relative.id === root?.id;
            const marginLeft = relative.level * 50;
            
            html += `
                <div class="tree-node" data-id="${relative.id}" 
                     style="margin-left: ${marginLeft}px; margin-right: 30px; cursor: pointer; 
                            transition: all 0.3s; min-width: 100px;"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'">
                    <div style="text-align: center;">
                        <div style="width: 70px; height: 70px; margin: 0 auto 8px; 
                                    border-radius: 50%; border: 2px solid ${relative.borderColor};
                                    background: ${relative.avatarColor}; overflow: hidden; 
                                    box-shadow: ${isRoot ? '0 0 15px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)'};">
                            ${relative.photo ? 
                                `<img src="${relative.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                                `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; font-weight: bold; font-size: 18px;">
                                    ${relative.firstName.charAt(0)}${relative.lastName.charAt(0)}
                                </div>`
                            }
                        </div>
                        <div style="font-size: 12px; font-weight: 600; color: #333;">
                            ${relative.firstName} ${relative.lastName.charAt(0)}.
                        </div>
                        <div style="font-size: 10px; color: #666; margin-top: 3px;">
                            ${relative.roleText}
                        </div>
                        <div style="font-size: 9px; color: #999; margin-top: 2px;">
                            ${relative.birthDate ? `📅 ${formatDate(relative.birthDate)}` : ''}
                            ${relative.age ? ` • ${relative.age} лет` : ''}
                        </div>
                    </div>
                    
                    <!-- Горизонтальная связь -->
                    ${index < sortedRelatives.length - 1 ? 
                        `<div style="position: absolute; right: -15px; top: 35px; width: 15px; border-top: 1px dashed #ccc;"></div>` : ''
                    }
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Дерево с фотографиями (главный вид)
    function generatePhotoTree(root) {
        let html = `
            <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px;">
        `;
        
        treeData.relatives.forEach((relative) => {
            const isRoot = relative.id === root?.id;
            const borderColor = isRoot ? '#ff6b6b' : relative.borderColor;
            const boxShadow = isRoot ? '0 0 20px rgba(255, 107, 107, 0.4)' : '0 4px 15px rgba(0,0,0,0.1)';
            
            html += `
                <div class="tree-node" data-id="${relative.id}" 
                     style="cursor: pointer; transition: all 0.3s; width: 140px;"
                     onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='${boxShadow}'">
                    <div style="background: white; border-radius: 12px; overflow: hidden; border: 3px solid ${borderColor}; 
                                box-shadow: ${boxShadow}; padding-bottom: 10px;">
                        <!-- Фото или аватар -->
                        <div style="height: 120px; background: ${relative.avatarColor}; position: relative; overflow: hidden;">
                            ${relative.photo ? 
                                `<img src="${relative.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                                `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; font-size: 36px; font-weight: bold;">
                                    ${relative.firstName.charAt(0)}${relative.lastName.charAt(0)}
                                </div>`
                            }
                            ${isRoot ? 
                                `<div style="position: absolute; top: 5px; right: 5px; background: #ff6b6b; color: white; 
                                      padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">
                                    ★
                                </div>` : ''
                            }
                        </div>
                        
                        <!-- Информация -->
                        <div style="padding: 10px; text-align: center;">
                            <div style="font-size: 14px; font-weight: 700; color: #333; margin-bottom: 3px;">
                                ${relative.firstName}
                            </div>
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                                ${relative.lastName}
                            </div>
                            <div style="font-size: 10px; color: ${borderColor}; font-weight: 600; margin-bottom: 5px;">
                                ${relative.roleText}
                            </div>
                            
                            <div style="font-size: 9px; color: #999; line-height: 1.3;">
                                ${relative.birthDate ? `
                                    <div>📅 ${formatDate(relative.birthDate)}</div>
                                ` : ''}
                                ${relative.birthPlace ? `
                                    <div>📍 ${relative.birthPlace}</div>
                                ` : ''}
                                ${relative.profession ? `
                                    <div>💼 ${relative.profession}</div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Круговое дерево (упрощенное)
    function generateCircularTree(root) {
        const radius = 200;
        const centerX = 300;
        const centerY = 300;
        
        let html = `
            <div style="position: relative; width: 600px; height: 600px; margin: 0 auto;">
                <!-- Центральный узел (корень) -->
                ${root ? `
                    <div class="tree-node" data-id="${root.id}" 
                         style="position: absolute; left: ${centerX - 40}px; top: ${centerY - 40}px; 
                                width: 80px; height: 80px; cursor: pointer; z-index: 10;"
                         onmouseover="this.style.transform='scale(1.1)'"
                         onmouseout="this.style.transform='scale(1)'">
                        <div style="width: 100%; height: 100%; border-radius: 50%; border: 3px solid ${root.borderColor};
                                    background: ${root.avatarColor}; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.2);">
                            ${root.photo ? 
                                `<img src="${root.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                                `<div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                                      color: white; font-size: 24px; font-weight: bold;">
                                    ${root.firstName.charAt(0)}${root.lastName.charAt(0)}
                                </div>`
                            }
                        </div>
                    </div>
                ` : ''}
        `;
        
        // Располагаем остальных родственников по кругу
        const otherRelatives = treeData.relatives.filter(r => !root || r.id !== root.id);
        const angleStep = (2 * Math.PI) / otherRelatives.length;
        
        otherRelatives.forEach((relative, index) => {
            const angle = index * angleStep;
            const x = centerX + radius * Math.cos(angle) - 30;
            const y = centerY + radius * Math.sin(angle) - 30;
            
            html += `
                <div class="tree-node" data-id="${relative.id}" 
                     style="position: absolute; left: ${x}px; top: ${y}px; 
                            width: 60px; height: 60px; cursor: pointer; z-index: 5;"
                     onmouseover="this.style.transform='scale(1.1)'"
                     onmouseout="this.style.transform='scale(1)'">
                    <div style="width: 100%; height: 100%; border-radius: 50%; border: 2px solid ${relative.borderColor};
                                background: ${relative.avatarColor}; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        ${relative.photo ? 
                            `<img src="${relative.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                            `<div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                                  color: white; font-size: 16px; font-weight: bold;">
                                ${relative.firstName.charAt(0)}
                            </div>`
                        }
                    </div>
                </div>
                
                <!-- Линия к центру -->
                <div style="position: absolute; left: ${centerX}px; top: ${centerY}px; width: 1px; height: ${radius}px;
                            background: #ccc; transform-origin: top left; transform: rotate(${angle}rad); z-index: 1;"></div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Инициализация взаимодействий с деревом
    function initializeTreeInteractions() {
        document.querySelectorAll('.tree-node').forEach(node => {
            node.addEventListener('click', function() {
                const relativeId = parseInt(this.getAttribute('data-id'));
                const relative = treeData.relatives.find(r => r.id === relativeId);
                if (relative) {
                    showRelativeProfile(relative);
                }
            });
        });
    }
    
    // Показать профиль родственника
    function showRelativeProfile(relative) {
        // Рассчитываем полные года
        const ageText = relative.age ? `${relative.age} ${getAgeWord(relative.age)}` : 'Не указан';
        const lifeYears = relative.deathDate ? 
            `${formatDate(relative.birthDate)} - ${formatDate(relative.deathDate)}` : 
            `Родился: ${formatDate(relative.birthDate) || 'Не указана'}`;
        
        const content = `
            <div style="max-width: 500px; margin: 0 auto;">
                <!-- Заголовок с фото -->
                <div style="display: flex; gap: 20px; margin-bottom: 25px; align-items: center;">
                    <div style="width: 120px; height: 120px; flex-shrink: 0;">
                        <div style="width: 100%; height: 100%; border-radius: 50%; border: 4px solid ${relative.borderColor};
                                    background: ${relative.avatarColor}; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                            ${relative.photo ? 
                                `<img src="${relative.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                                `<div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                                      color: white; font-size: 36px; font-weight: bold;">
                                    ${relative.firstName.charAt(0)}${relative.lastName.charAt(0)}
                                </div>`
                            }
                        </div>
                    </div>
                    
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 8px 0; color: #333;">${relative.fullName}</h3>
                        <div style="font-size: 16px; color: ${relative.borderColor}; font-weight: 600; margin-bottom: 5px;">
                            ${relative.roleText}
                        </div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
                            ${relative.lineText} • ${relative.gender === 'male' ? '👨 Мужчина' : '👩 Женщина'}
                        </div>
                        <div style="font-size: 13px; color: #888;">
                            <div>📅 ${lifeYears}</div>
                            <div>🎂 Возраст: ${ageText}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Основная информация -->
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: #333; font-size: 16px;">📋 Основная информация</h4>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        ${relative.birthPlace ? `
                            <div>
                                <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Место рождения</div>
                                <div style="font-weight: 500;">📍 ${relative.birthPlace}</div>
                            </div>
                        ` : ''}
                        
                        ${relative.profession ? `
                            <div>
                                <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Род деятельности</div>
                                <div style="font-weight: 500;">💼 ${relative.profession}</div>
                            </div>
                        ` : ''}
                        
                        <div>
                            <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Линия родства</div>
                            <div style="font-weight: 500; color: ${relative.borderColor};">${relative.lineText}</div>
                        </div>
                        
                        <div>
                            <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Поколение</div>
                            <div style="font-weight: 500;">${relative.level}-е поколение</div>
                        </div>
                    </div>
                </div>
                
                <!-- Биография -->
                ${relative.bio ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 16px;">📖 Биография</h4>
                        <div style="font-size: 14px; line-height: 1.6; color: #555; background: white; 
                                    padding: 15px; border-radius: 6px; border-left: 4px solid ${relative.borderColor};">
                            ${relative.bio}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Заметки -->
                ${relative.notes ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 16px;">📝 Заметки</h4>
                        <div style="font-size: 14px; line-height: 1.6; color: #666; background: white; 
                                    padding: 15px; border-radius: 6px; border: 1px solid #e9ecef;">
                            ${relative.notes}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Статистика -->
                <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-top: 20px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 8px;">📊 Информация о записи</div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #888;">
                        <div>Добавлен: ${formatDateTime(relative.createdAt)}</div>
                        <div>Обновлен: ${formatDateTime(relative.updatedAt)}</div>
                    </div>
                </div>
            </div>
        `;
        
        window.ModalSystem.createModal('relative-profile', {
            title: '👤 Профиль родственника',
            content: content,
            width: '600px',
            buttons: [
                {
                    text: 'Закрыть',
                    type: 'secondary'
                },
                {
                    text: 'Редактировать',
                    type: 'primary',
                    onClick: function() {
                        window.ModalSystem.closeModal('relative-profile');
                        setTimeout(() => {
                            const relativeToEdit = treeData.relatives.find(r => r.id === relative.id);
                            if (relativeToEdit) {
                                showAddRelativeModal(relativeToEdit);
                            }
                        }, 300);
                        return true;
                    }
                }
            ]
        });
    }
    
    // Вспомогательные функции
    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch (e) {
            return dateString;
        }
    }
    
    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString('ru-RU');
        } catch (e) {
            return dateTimeString;
        }
    }
    
    function getAgeWord(age) {
        const lastDigit = age % 10;
        const lastTwoDigits = age % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'лет';
        if (lastDigit === 1) return 'год';
        if (lastDigit >= 2 && lastDigit <= 4) return 'года';
        return 'лет';
    }
    
    // Показать уведомление
    function showNotification(title, message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            min-width: 250px;
            max-width: 350px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <div style="font-size: 20px; line-height: 1;">✅</div>
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                    <div style="font-size: 14px; opacity: 0.9;">${message}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Добавляем стили для анимаций
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        /* Стили для узлов дерева */
        .tree-node {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(notificationStyles);
    
    // Глобальные функции
    window.editRelative = function(id) {
        const relative = treeData.relatives.find(r => r.id === id);
        if (relative) {
            showAddRelativeModal(relative);
        }
    };
    
    window.deleteRelative = function(id) {
        window.Modal.confirm(
            'Удаление родственника',
            'Вы уверены, что хотите удалить этого родственника из дерева?',
            function() {
                treeData.relatives = treeData.relatives.filter(r => r.id !== id);
                
                // Если удалили root, выбираем нового
                if (treeData.rootId === id) {
                    treeData.rootId = treeData.relatives.find(r => 
                        ['father', 'mother', 'grandfather', 'grandmother'].includes(r.role)
                    )?.id || treeData.relatives[0]?.id;
                }
                
                updateRelativesList();
                showNotification('Удалено', 'Родственник удален из дерева');
            }
        );
    };
    
    // Функции для управления деревом
    window.zoomIn = function() {
        const container = document.getElementById('tree-container');
        if (container) {
            const currentScale = parseFloat(container.style.transform?.replace('scale(', '') || 1);
            container.style.transform = `scale(${currentScale + 0.1})`;
        }
    };
    
    window.zoomOut = function() {
        const container = document.getElementById('tree-container');
        if (container) {
            const currentScale = parseFloat(container.style.transform?.replace('scale(', '') || 1);
            if (currentScale > 0.3) {
                container.style.transform = `scale(${currentScale - 0.1})`;
            }
        }
    };
    
    window.toggleViewMode = function() {
        const styles = ['classic', 'horizontal', 'circular', 'photo'];
        const currentIndex = styles.indexOf(treeData.style);
        const nextIndex = (currentIndex + 1) % styles.length;
        treeData.style = styles[nextIndex];
        
        window.ModalSystem.updateContent('tree-visualization', generateTreeHTML());
        setTimeout(() => {
            initializeTreeInteractions();
        }, 100);
    };
    
    window.exportTreeImage = function() {
        window.Modal.alert(
            'Сохранение изображения', 
            'Эта функция будет реализована в следующем обновлении. Пока вы можете сделать скриншот.'
        );
    };
    
    // Экспорт дерева
    window.exportTree = function() {
        try {
            const exportData = {
                treeName: treeData.treeName,
                familyLine: treeData.familyLine,
                style: treeData.style,
                colorScheme: treeData.colorScheme,
                relatives: treeData.relatives.map(r => ({
                    ...r,
                    // Уменьшаем размер фото для экспорта
                    photo: r.photo && r.photo.length > 10000 ? '[ФОТО]' : r.photo
                })),
                exportedAt: new Date().toISOString(),
                version: '2.0'
            };
            
            const jsonData = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${treeData.treeName.replace(/\s+/g, '_')}_генеалогическое_дерево.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            window.Modal.alert(
                '✅ Экспорт завершен', 
                `Дерево "${treeData.treeName}" успешно экспортировано в JSON файл.`
            );
            
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            window.Modal.alert('❌ Ошибка', 'Не удалось экспортировать дерево. Попробуйте еще раз.');
        }
    };
    
    // Экспортируем функции для отладки
    window.treeBuilder = {
        getData: () => treeData,
        addRelative: () => showAddRelativeModal(),
        editRelative: window.editRelative,
        deleteRelative: window.deleteRelative,
        exportTree: window.exportTree,
        showTree: showTreeVisualization
    };
    
    console.log('✅ Tree Builder с визуализацией готов к использованию');
})();