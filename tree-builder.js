// tree-builder.js - полная версия генеалогического построителя
(function() {
    console.log('🌳 Genealogy Tree Builder загружается...');
    
    // Хранилище данных
    const treeData = {
        relatives: [],
        currentStep: 1,
        selectedLine: null
    };

    // Конфигурация ролей
    const ROLES = {
        'great-grandfather': 'Прадедушка',
        'great-grandmother': 'Прабабушка',
        'grandfather': 'Дедушка',
        'grandmother': 'Бабушка',
        'father': 'Отец',
        'mother': 'Мать',
        'uncle': 'Дядя',
        'aunt': 'Тетя',
        'brother': 'Брат',
        'sister': 'Сестра',
        'son': 'Сын',
        'daughter': 'Дочь',
        'grandson': 'Внук',
        'granddaughter': 'Внучка'
    };

    const LINES = {
        'father': 'Линия отца',
        'mother': 'Линия матери',
        'both': 'Обе линии'
    };

    // Основная функция запуска
    window.startTreeBuilder = function(mode = 'auto') {
        console.log(`🚀 Запуск Tree Builder в режиме: ${mode}`);
        
        if (mode === 'auto') {
            startAutoBuilder();
        } else {
            startManualBuilder();
        }
    };

    // Авто-построение
    function startAutoBuilder() {
        treeData.relatives = [];
        treeData.currentStep = 1;
        
        showBuilderModal('auto');
    }

    // Ручное построение
    function startManualBuilder() {
        treeData.relatives = [];
        treeData.currentStep = 1;
        
        showBuilderModal('manual');
    }

    // Показать основное окно построителя
    function showBuilderModal(mode) {
        const content = `
            <div class="ms-alert ms-alert-info">
                <div class="ms-alert-icon">💡</div>
                <div>
                    <strong>${mode === 'auto' ? 'Автоматическое построение' : 'Ручное построение'}</strong>
                    <p style="margin:5px 0 0 0;font-size:13px;">
                        ${mode === 'auto' 
                            ? 'Система поможет вам поэтапно создать генеалогическое дерево' 
                            : 'Добавляйте родственников вручную, контролируя каждый шаг'}
                    </p>
                </div>
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Выберите линию родства:</label>
                <select class="ms-form-select" id="family-line">
                    <option value="">-- Выберите линию --</option>
                    <option value="father">Линия отца</option>
                    <option value="mother">Линия матери</option>
                    <option value="both">Обе линии</option>
                </select>
            </div>
            
            <div id="relatives-container">
                <div class="ms-alert ms-alert-info">
                    <div class="ms-alert-icon">👤</div>
                    <div>
                        <strong>Добавьте родственников</strong>
                        <p style="margin:5px 0 0 0;font-size:13px;">Начните с добавления первого родственника</p>
                    </div>
                </div>
                
                <div class="ms-relative-list" id="relatives-list">
                    <div class="ms-tree-preview">
                        <div class="ms-tree-placeholder">
                            🌳 Пока нет добавленных родственников
                        </div>
                    </div>
                </div>
                
                <div style="text-align:center;margin:30px 0;">
                    <button class="ms-modal-button ms-modal-button-primary" 
                            onclick="window.treeBuilder?.addRelative()" 
                            style="padding:15px 30px;font-size:16px;">
                        + Добавить родственника
                    </button>
                </div>
            </div>
            
            <div id="tree-preview-container" style="display:none;">
                <h4 style="margin-top:0;margin-bottom:15px;">Предпросмотр дерева:</h4>
                <div class="ms-tree-preview" id="tree-preview">
                    <div class="ms-tree-placeholder">
                        ⏳ Заполните информацию о родственниках
                    </div>
                </div>
            </div>
        `;

        window.ModalSystem.createModal('tree-builder-main', {
            title: '🌳 Построитель Генеалогического Древа',
            subtitle: mode === 'auto' ? 'Автоматический режим' : 'Ручной режим',
            content: content,
            width: '700px',
            showSteps: true,
            currentStep: 1,
            totalSteps: 3,
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary',
                    onClick: () => {
                        treeData.relatives = [];
                        window.ModalSystem.closeModal('tree-builder-main');
                    }
                },
                {
                    text: 'Продолжить',
                    type: 'primary',
                    onClick: () => {
                        if (treeData.relatives.length === 0) {
                            alert('Добавьте хотя бы одного родственника!');
                            return;
                        }
                        proceedToStep2();
                    }
                }
            ]
        });

        // Инициализация
        setTimeout(() => {
            document.getElementById('family-line').onchange = function() {
                treeData.selectedLine = this.value;
                updateTreePreview();
            };
        }, 100);
    }

    // Добавить родственника
    window.treeBuilder = {
        addRelative: function() {
            showRelativeForm();
        }
    };

    // Форма добавления родственника
    function showRelativeForm() {
        const content = `
            <form id="relative-form">
                <div class="ms-form-row">
                    <div class="ms-form-group">
                        <label class="ms-form-label">Фамилия *</label>
                        <input type="text" class="ms-form-input" id="last-name" required>
                    </div>
                    <div class="ms-form-group">
                        <label class="ms-form-label">Имя *</label>
                        <input type="text" class="ms-form-input" id="first-name" required>
                    </div>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Отчество</label>
                    <input type="text" class="ms-form-input" id="middle-name">
                </div>
                
                <div class="ms-form-row">
                    <div class="ms-form-group">
                        <label class="ms-form-label">Дата рождения</label>
                        <input type="date" class="ms-form-input" id="birth-date">
                    </div>
                    <div class="ms-form-group">
                        <label class="ms-form-label">Дата смерти (если есть)</label>
                        <input type="date" class="ms-form-input" id="death-date">
                    </div>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Роль в семье *</label>
                    <select class="ms-form-select" id="relative-role" required>
                        <option value="">-- Выберите роль --</option>
                        ${Object.entries(ROLES).map(([key, value]) => 
                            `<option value="${key}">${value}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Линия родства *</label>
                    <select class="ms-form-select" id="relative-line" required>
                        <option value="">-- Выберите линию --</option>
                        <option value="father">Линия отца</option>
                        <option value="mother">Линия матери</option>
                    </select>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Биография</label>
                    <textarea class="ms-form-textarea" id="bio" rows="3" 
                              placeholder="Краткая информация о человеке..."></textarea>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Заметки</label>
                    <textarea class="ms-form-textarea" id="notes" rows="2" 
                              placeholder="Дополнительные заметки..."></textarea>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Фотография</label>
                    <div class="ms-form-file" onclick="document.getElementById('photo-input').click()">
                        <div class="ms-form-file-icon">📷</div>
                        <div class="ms-form-file-label">Нажмите для загрузки фото</div>
                        <input type="file" id="photo-input" accept="image/*" style="display:none;">
                    </div>
                    <div id="photo-preview" style="margin-top:10px;display:none;">
                        <img id="preview-image" style="max-width:100px;border-radius:8px;">
                    </div>
                </div>
                
                <div class="ms-alert ms-alert-info" style="margin-top:30px;">
                    <div class="ms-alert-icon">ℹ️</div>
                    <div>
                        <strong>Подсказка</strong>
                        <p style="margin:5px 0 0 0;font-size:13px;">
                            Начните с ближайших родственников (родители, бабушки/дедушки), 
                            затем переходите к более дальним родственникам.
                        </p>
                    </div>
                </div>
            </form>
        `;

        window.ModalSystem.createModal('add-relative', {
            title: '👤 Добавить родственника',
            subtitle: 'Шаг 1 из 2 - Информация о человеке',
            content: content,
            width: '650px',
            showSteps: true,
            currentStep: 1,
            totalSteps: 2,
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary',
                    onClick: () => {
                        window.ModalSystem.closeModal('add-relative');
                    }
                },
                {
                    text: 'Сохранить',
                    type: 'primary',
                    onClick: saveRelative
                }
            ]
        });

        // Инициализация формы
        setTimeout(() => {
            const photoInput = document.getElementById('photo-input');
            const photoPreview = document.getElementById('photo-preview');
            const previewImage = document.getElementById('preview-image');
            
            if (photoInput) {
                photoInput.onchange = function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            previewImage.src = e.target.result;
                            photoPreview.style.display = 'block';
                        };
                        reader.readAsDataURL(file);
                    }
                };
            }
        }, 100);
    }

    // Сохранить родственника
    function saveRelative() {
        const form = document.getElementById('relative-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const relative = {
            id: Date.now(),
            lastName: document.getElementById('last-name').value.trim(),
            firstName: document.getElementById('first-name').value.trim(),
            middleName: document.getElementById('middle-name').value.trim(),
            birthDate: document.getElementById('birth-date').value,
            deathDate: document.getElementById('death-date').value || null,
            role: document.getElementById('relative-role').value,
            roleText: ROLES[document.getElementById('relative-role').value],
            line: document.getElementById('relative-line').value,
            lineText: LINES[document.getElementById('relative-line').value],
            bio: document.getElementById('bio').value.trim(),
            notes: document.getElementById('notes').value.trim(),
            photo: document.getElementById('preview-image')?.src || null,
            createdAt: new Date().toISOString()
        };

        treeData.relatives.push(relative);
        
        window.ModalSystem.closeModal('add-relative');
        
        updateRelativesList();
        updateTreePreview();
        
        // Показать уведомление об успешном добавлении
        showNotification(`Родственник ${relative.firstName} ${relative.lastName} добавлен!`);
    }

    // Обновить список родственников
    function updateRelativesList() {
        const container = document.getElementById('relatives-list');
        if (!container) return;

        if (treeData.relatives.length === 0) {
            container.innerHTML = `
                <div class="ms-tree-preview">
                    <div class="ms-tree-placeholder">🌳 Пока нет добавленных родственников</div>
                </div>
            `;
            return;
        }

        container.innerHTML = treeData.relatives.map(relative => `
            <div class="ms-relative-item" data-id="${relative.id}">
                <div class="ms-relative-avatar" style="background: ${relative.line === 'father' ? '#4361ee' : '#e91e63'}">
                    ${relative.firstName.charAt(0)}${relative.lastName.charAt(0)}
                </div>
                <div class="ms-relative-info">
                    <h4 class="ms-relative-name">
                        ${relative.lastName} ${relative.firstName} ${relative.middleName || ''}
                    </h4>
                    <p class="ms-relative-details">
                        <strong>Роль:</strong> ${relative.roleText} | 
                        <strong>Линия:</strong> ${relative.lineText} |
                        <strong>Дата рождения:</strong> ${relative.birthDate || 'не указана'}
                    </p>
                </div>
                <div class="ms-relative-actions">
                    <button class="ms-action-button" 
                            style="background:#4361ee;color:white;"
                            onclick="window.treeBuilder?.editRelative(${relative.id})">
                        ✏️
                    </button>
                    <button class="ms-action-button" 
                            style="background:#e74c3c;color:white;"
                            onclick="window.treeBuilder?.removeRelative(${relative.id})">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Редактировать родственника
    window.treeBuilder.editRelative = function(id) {
        const relative = treeData.relatives.find(r => r.id === id);
        if (!relative) return;

        // Заполняем форму данными родственника
        document.getElementById('last-name').value = relative.lastName;
        document.getElementById('first-name').value = relative.firstName;
        document.getElementById('middle-name').value = relative.middleName || '';
        document.getElementById('birth-date').value = relative.birthDate || '';
        document.getElementById('death-date').value = relative.deathDate || '';
        document.getElementById('relative-role').value = relative.role;
        document.getElementById('relative-line').value = relative.line;
        document.getElementById('bio').value = relative.bio || '';
        document.getElementById('notes').value = relative.notes || '';
        
        // Удаляем старого родственника
        treeData.relatives = treeData.relatives.filter(r => r.id !== id);
        
        // Показываем форму для редактирования
        showRelativeForm();
    };

    // Удалить родственника
    window.treeBuilder.removeRelative = function(id) {
        if (confirm('Удалить этого родственника?')) {
            treeData.relatives = treeData.relatives.filter(r => r.id !== id);
            updateRelativesList();
            updateTreePreview();
            showNotification('Родственник удален');
        }
    };

    // Перейти ко второму шагу
    function proceedToStep2() {
        const content = `
            <div class="ms-alert ms-alert-success">
                <div class="ms-alert-icon">✅</div>
                <div>
                    <strong>Отлично! Добавлено родственников: ${treeData.relatives.length}</strong>
                    <p style="margin:5px 0 0 0;font-size:13px;">
                        Проверьте правильность данных перед построением дерева
                    </p>
                </div>
            </div>
            
            <div style="margin:20px 0;">
                <h4 style="margin-top:0;margin-bottom:15px;">Список добавленных родственников:</h4>
                <div class="ms-relative-list" style="max-height:300px;overflow-y:auto;">
                    ${treeData.relatives.map(relative => `
                        <div class="ms-relative-item">
                            <div class="ms-relative-avatar" style="background: ${relative.line === 'father' ? '#4361ee' : '#e91e63'}">
                                ${relative.firstName.charAt(0)}${relative.lastName.charAt(0)}
                            </div>
                            <div class="ms-relative-info">
                                <h4 class="ms-relative-name">
                                    ${relative.lastName} ${relative.firstName}
                                </h4>
                                <p class="ms-relative-details">
                                    ${relative.roleText} • ${relative.lineText}
                                </p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Название вашего семейного древа:</label>
                <input type="text" class="ms-form-input" id="tree-name" 
                       placeholder="Например: Семья Ивановых" value="Моя семья">
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Стиль отображения дерева:</label>
                <select class="ms-form-select" id="tree-style">
                    <option value="classic">Классический (вертикальный)</option>
                    <option value="horizontal">Горизонтальный</option>
                    <option value="circular">Круговой</option>
                    <option value="compact">Компактный</option>
                </select>
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">
                    <input type="checkbox" id="include-photos" checked> Включать фотографии
                </label>
                <label class="ms-form-label" style="display:block;margin-top:10px;">
                    <input type="checkbox" id="include-dates" checked> Показывать даты
                </label>
                <label class="ms-form-label" style="display:block;margin-top:10px;">
                    <input type="checkbox" id="auto-layout" checked> Автоматическая компоновка
                </label>
            </div>
            
            <div class="ms-alert ms-alert-info">
                <div class="ms-alert-icon">⚠️</div>
                <div>
                    <strong>Внимание!</strong>
                    <p style="margin:5px 0 0 0;font-size:13px;">
                        После построения дерево можно будет редактировать, 
                        экспортировать в PNG/PDF или сохранить в вашем аккаунте.
                    </p>
                </div>
            </div>
        `;

        window.ModalSystem.updateModal('tree-builder-main', {
            title: '🌳 Подготовка к построению',
            subtitle: 'Шаг 2 из 3 - Проверка и настройки',
            content: content,
            showSteps: true,
            currentStep: 2,
            buttons: [
                {
                    text: 'Назад',
                    type: 'secondary',
                    onClick: () => showBuilderModal('auto')
                },
                {
                    text: 'Построить дерево',
                    type: 'success',
                    onClick: buildTree
                }
            ]
        });
    }

    // Построить дерево
    function buildTree() {
        const treeName = document.getElementById('tree-name').value.trim() || 'Мое семейное древо';
        const style = document.getElementById('tree-style').value;
        const includePhotos = document.getElementById('include-photos').checked;
        const includeDates = document.getElementById('include-dates').checked;
        const autoLayout = document.getElementById('auto-layout').checked;

        // Закрываем основное окно
        window.ModalSystem.closeModal('tree-builder-main');

        // Показываем окно построения
        showBuildingProgress();

        // Имитация процесса построения
        setTimeout(() => {
            completeTreeBuilding({
                name: treeName,
                style: style,
                relatives: treeData.relatives,
                options: { includePhotos, includeDates, autoLayout }
            });
        }, 2000);
    }

    // Показать прогресс построения
    function showBuildingProgress() {
        const content = `
            <div style="text-align:center;padding:40px 20px;">
                <div style="font-size:60px;margin-bottom:20px;">🌳</div>
                <h3 style="margin:0 0 15px 0;color:#4361ee;">Строим ваше семейное древо...</h3>
                <p style="color:#666;margin-bottom:30px;">
                    Обрабатываем ${treeData.relatives.length} родственников<br>
                    Формируем связи и структуру
                </p>
                
                <div style="background:#f8f9fa;border-radius:10px;padding:20px;margin:0 auto 30px;max-width:400px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                        <span>Прогресс:</span>
                        <span id="progress-percent">0%</span>
                    </div>
                    <div style="height:10px;background:#e9ecef;border-radius:5px;overflow:hidden;">
                        <div id="progress-bar" style="height:100%;background:linear-gradient(90deg, #4361ee, #3a0ca3);width:0%;transition:width 0.3s;"></div>
                    </div>
                </div>
                
                <div style="color:#999;font-size:14px;">
                    ⏳ Это может занять несколько секунд
                </div>
            </div>
        `;

        window.ModalSystem.createModal('building-progress', {
            title: '⚙️ Построение дерева',
            content: content,
            width: '500px',
            showCloseButton: false,
            closeOnOverlay: false,
            buttons: []
        });

        // Анимация прогресса
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            const progressBar = document.getElementById('progress-bar');
            const progressPercent = document.getElementById('progress-percent');
            
            if (progressBar && progressPercent) {
                progressBar.style.width = `${progress}%`;
                progressPercent.textContent = `${progress}%`;
            }
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 200);
    }

    // Завершить построение дерева
    function completeTreeBuilding(config) {
        window.ModalSystem.closeModal('building-progress');

        const content = `
            <div style="text-align:center;padding:20px;">
                <div style="font-size:60px;margin-bottom:20px;color:#2ecc71;">✅</div>
                <h3 style="margin:0 0 15px 0;color:#4361ee;">Дерево построено успешно!</h3>
                <p style="color:#666;margin-bottom:30px;">
                    <strong>${config.name}</strong><br>
                    ${config.relatives.length} родственников • ${config.style} стиль
                </p>
                
                <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:0 auto 30px;max-width:500px;">
                    <div style="font-family:monospace;font-size:12px;text-align:left;background:white;padding:15px;border-radius:8px;border:1px solid #e9ecef;">
                        ${generateTreeAscii(config.relatives)}
                    </div>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:30px;">
                    <button class="ms-modal-button ms-modal-button-primary" onclick="window.treeBuilder?.viewTree()">
                        👀 Просмотреть
                    </button>
                    <button class="ms-modal-button ms-modal-button-success" onclick="window.treeBuilder?.exportTree()">
                        📥 Экспорт
                    </button>
                    <button class="ms-modal-button" onclick="window.treeBuilder?.editTree()" 
                            style="background:#f39c12;color:white;">
                        ✏️ Редактировать
                    </button>
                    <button class="ms-modal-button" onclick="window.treeBuilder?.saveToAccount()" 
                            style="background:#9b59b6;color:white;">
                        💾 Сохранить
                    </button>
                </div>
                
                <div style="color:#999;font-size:14px;border-top:1px solid #eee;padding-top:20px;">
                    Дерево сохранено в памяти. Вы можете вернуться к редактированию в любое время.
                </div>
            </div>
        `;

        window.ModalSystem.createModal('tree-complete', {
            title: '🎉 Дерево готово!',
            content: content,
            width: '600px',
            buttons: [
                {
                    text: 'Закрыть',
                    type: 'secondary',
                    onClick: () => {
                        window.ModalSystem.closeModal('tree-complete');
                        treeData.relatives = []; // Очистить данные
                    }
                },
                {
                    text: 'Новое дерево',
                    type: 'primary',
                    onClick: () => {
                        window.ModalSystem.closeModal('tree-complete');
                        setTimeout(() => startAutoBuilder(), 300);
                    }
                }
            ]
        });

        // Сохраняем дерево в localStorage для доступа из других функций
        localStorage.setItem('lastBuiltTree', JSON.stringify(config));
    }

    // Генерация ASCII представления дерева
    function generateTreeAscii(relatives) {
        if (relatives.length === 0) return 'Дерево пустое';
        
        let ascii = '';
        const root = relatives.find(r => r.role === 'father' || r.role === 'mother') || relatives[0];
        
        ascii += `     ${root.firstName.charAt(0)}.${root.lastName.charAt(0)}\n`;
        ascii += `       |\n`;
        ascii += `   ┌───┴───┐\n`;
        
        const children = relatives.filter(r => 
            r.role === 'son' || r.role === 'daughter' || 
            r.role === 'grandson' || r.role === 'granddaughter'
        );
        
        if (children.length > 0) {
            children.forEach((child, i) => {
                ascii += `   ${child.firstName.charAt(0)}.${child.lastName.charAt(0)}   `;
                if ((i + 1) % 2 === 0) ascii += '\n';
            });
        }
        
        return ascii;
    }

    // Обновить предпросмотр дерева
    function updateTreePreview() {
        const preview = document.getElementById('tree-preview');
        if (!preview) return;

        if (treeData.relatives.length === 0) {
            preview.innerHTML = `
                <div class="ms-tree-placeholder">
                    ⏳ Заполните информацию о родственниках
                </div>
            `;
            return;
        }

        preview.innerHTML = `
            <div style="font-family:monospace;font-size:11px;line-height:1.4;">
                ${generateTreeAscii(treeData.relatives)}
            </div>
            <div style="margin-top:15px;color:#666;font-size:13px;">
                <strong>Статистика:</strong><br>
                👥 Родственников: ${treeData.relatives.length}<br>
                👨 Линия отца: ${treeData.relatives.filter(r => r.line === 'father').length}<br>
                👩 Линия матери: ${treeData.relatives.filter(r => r.line === 'mother').length}
            </div>
        `;

        // Показываем контейнер предпросмотра
        const container = document.getElementById('tree-preview-container');
        if (container) container.style.display = 'block';
    }

    // Показать уведомление
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">✅</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Добавить стили для анимаций уведомлений
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
    `;
    document.head.appendChild(notificationStyles);

    // Методы для кнопок в финальном окне
    window.treeBuilder.viewTree = function() {
        alert('Функция просмотра дерева будет реализована в следующем обновлении!');
    };

    window.treeBuilder.exportTree = function() {
        const treeData = localStorage.getItem('lastBuiltTree');
        if (treeData) {
            const data = JSON.parse(treeData);
            alert(`Экспорт дерева "${data.name}"\n\nВыберите формат:\n• PNG изображение\n• PDF документ\n• JSON данные`);
        }
    };

    window.treeBuilder.editTree = function() {
        alert('Редактирование дерева - скоро будет доступно!');
    };

    window.treeBuilder.saveToAccount = function() {
        alert('Сохранение в аккаунт - требуется авторизация!');
    };

    // Инициализация при загрузке
    console.log('✅ Genealogy Tree Builder загружен');
})();