/**
 * Tree Builder - построитель генеалогического дерева
 */

(function() {
    console.log('🌳 Tree Builder загружается...');
    
    // Хранилище данных
    let relatives = [];
    let currentMode = 'auto';
    
    // Конфигурация
    const CONFIG = {
        ROLES: {
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
        },
        
        LINES: {
            'father': 'Линия отца',
            'mother': 'Линия матери',
            'both': 'Обе линии'
        }
    };
    
    // Основная функция
    window.startTreeBuilder = function(mode = 'auto') {
        console.log(`🚀 Запуск Tree Builder в режиме: ${mode}`);
        currentMode = mode;
        relatives = [];
        
        showMainModal();
    };
    
    // Показать главное модальное окно
    function showMainModal() {
        const content = `
            <div class="ms-alert" style="background:#e3f2fd;color:#0d47a1;padding:15px;border-radius:8px;margin-bottom:20px;">
                <strong>${currentMode === 'auto' ? '⚡ Авто-построение' : '🎯 Ручное построение'}</strong>
                <p style="margin:5px 0 0 0;font-size:14px;">
                    ${currentMode === 'auto' 
                        ? 'Система поможет вам поэтапно создать дерево' 
                        : 'Вы полностью контролируете процесс построения'}
                </p>
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Выберите линию родства:</label>
                <select class="ms-form-select" id="family-line">
                    <option value="father">Линия отца</option>
                    <option value="mother">Линия матери</option>
                    <option value="both">Обе линии</option>
                </select>
            </div>
            
            <div style="text-align:center;margin:30px 0;">
                <button class="ms-modal-button ms-modal-button-primary" 
                        onclick="window.treeBuilder?.addRelative()" 
                        style="padding:15px 30px;font-size:16px;">
                    👤 Добавить первого родственника
                </button>
            </div>
            
            <div id="relatives-list" style="min-height:100px;">
                <div style="text-align:center;padding:40px 20px;color:#999;">
                    <div style="font-size:48px;margin-bottom:10px;">👥</div>
                    <p>Пока нет добавленных родственников</p>
                </div>
            </div>
            
            <div class="ms-alert" style="background:#e8f5e9;color:#1b5e20;padding:15px;border-radius:8px;margin-top:20px;">
                <strong>💡 Совет:</strong> Начните с добавления себя или ближайших родственников.
            </div>
        `;
        
        window.ModalSystem.createModal('tree-builder-main', {
            title: '🌳 Построитель Генеалогического Дерева',
            subtitle: 'Шаг 1: Добавление родственников',
            content: content,
            width: '700px',
            showSteps: true,
            currentStep: 1,
            totalSteps: 3,
            showCloseButton: true,
            closeOnOverlay: true,
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary',
                    onClick: () => {
                        console.log('Построение отменено');
                    }
                },
                {
                    text: 'Далее',
                    type: 'primary',
                    onClick: () => {
                        if (relatives.length === 0) {
                            window.Modal.alert('Внимание', 'Добавьте хотя бы одного родственника!');
                            return;
                        }
                        showPreviewModal();
                    }
                }
            ]
        });
        
        // Обновляем список родственников
        updateRelativesList();
    }
    
    // Добавить родственника
    window.treeBuilder = {
        addRelative: function() {
            showAddRelativeModal();
        },
        
        editRelative: function(id) {
            const relative = relatives.find(r => r.id === id);
            if (relative) {
                showAddRelativeModal(relative);
            }
        },
        
        removeRelative: function(id) {
            if (confirm('Удалить этого родственника?')) {
                relatives = relatives.filter(r => r.id !== id);
                updateRelativesList();
                showNotification('Родственник удален');
            }
        }
    };
    
    // Показать форму добавления родственника
    function showAddRelativeModal(relativeToEdit = null) {
        const isEdit = !!relativeToEdit;
        const relative = relativeToEdit || {};
        
        const content = `
            <form id="relative-form">
                <div class="ms-form-row">
                    <div class="ms-form-group">
                        <label class="ms-form-label">Фамилия *</label>
                        <input type="text" class="ms-form-input" id="last-name" 
                               value="${relative.lastName || ''}" required>
                    </div>
                    <div class="ms-form-group">
                        <label class="ms-form-label">Имя *</label>
                        <input type="text" class="ms-form-input" id="first-name" 
                               value="${relative.firstName || ''}" required>
                    </div>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Отчество</label>
                    <input type="text" class="ms-form-input" id="middle-name" 
                           value="${relative.middleName || ''}">
                </div>
                
                <div class="ms-form-row">
                    <div class="ms-form-group">
                        <label class="ms-form-label">Дата рождения</label>
                        <input type="date" class="ms-form-input" id="birth-date" 
                               value="${relative.birthDate || ''}">
                    </div>
                    <div class="ms-form-group">
                        <label class="ms-form-label">Дата смерти (если есть)</label>
                        <input type="date" class="ms-form-input" id="death-date" 
                               value="${relative.deathDate || ''}">
                    </div>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Роль в семье *</label>
                    <select class="ms-form-select" id="relative-role" required>
                        <option value="">-- Выберите роль --</option>
                        ${Object.entries(CONFIG.ROLES).map(([key, value]) => 
                            `<option value="${key}" ${relative.role === key ? 'selected' : ''}>
                                ${value}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Линия родства *</label>
                    <select class="ms-form-select" id="relative-line" required>
                        <option value="">-- Выберите линию --</option>
                        <option value="father" ${relative.line === 'father' ? 'selected' : ''}>Линия отца</option>
                        <option value="mother" ${relative.line === 'mother' ? 'selected' : ''}>Линия матери</option>
                    </select>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Биография</label>
                    <textarea class="ms-form-textarea" id="bio" rows="3" 
                              placeholder="Краткая информация о человеке...">${relative.bio || ''}</textarea>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Заметки</label>
                    <textarea class="ms-form-textarea" id="notes" rows="2" 
                              placeholder="Дополнительные заметки...">${relative.notes || ''}</textarea>
                </div>
                
                <div class="ms-alert" style="background:#fff3cd;color:#856404;padding:15px;border-radius:8px;margin-top:20px;">
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
                    text: isEdit ? 'Сохранить изменения' : 'Добавить',
                    type: 'primary',
                    onClick: () => saveRelative(relativeToEdit?.id)
                }
            ]
        });
    }
    
    // Сохранить родственника
    function saveRelative(existingId = null) {
        const form = document.getElementById('relative-form');
        if (!form.checkValidity()) {
            alert('Пожалуйста, заполните все обязательные поля!');
            return;
        }
        
        const relative = {
            id: existingId || Date.now(),
            lastName: document.getElementById('last-name').value.trim(),
            firstName: document.getElementById('first-name').value.trim(),
            middleName: document.getElementById('middle-name').value.trim(),
            birthDate: document.getElementById('birth-date').value,
            deathDate: document.getElementById('death-date').value || null,
            role: document.getElementById('relative-role').value,
            roleText: CONFIG.ROLES[document.getElementById('relative-role').value],
            line: document.getElementById('relative-line').value,
            lineText: CONFIG.LINES[document.getElementById('relative-line').value],
            bio: document.getElementById('bio').value.trim(),
            notes: document.getElementById('notes').value.trim(),
            createdAt: new Date().toISOString()
        };
        
        if (existingId) {
            // Обновляем существующего
            const index = relatives.findIndex(r => r.id === existingId);
            if (index !== -1) {
                relatives[index] = relative;
            }
        } else {
            // Добавляем нового
            relatives.push(relative);
        }
        
        window.ModalSystem.closeModal('add-relative');
        updateRelativesList();
        showNotification(existingId ? 'Изменения сохранены' : 'Родственник добавлен');
    }
    
    // Обновить список родственников
    function updateRelativesList() {
        const container = document.getElementById('relatives-list');
        if (!container) return;
        
        if (relatives.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px 20px;color:#999;">
                    <div style="font-size:48px;margin-bottom:10px;">👥</div>
                    <p>Пока нет добавленных родственников</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = relatives.map(relative => `
            <div class="relative-item" 
                 style="border:1px solid #e9ecef;border-radius:10px;padding:15px;margin-bottom:10px;display:flex;align-items:center;gap:15px;">
                <div style="width:50px;height:50px;border-radius:50%;background:${relative.line === 'father' ? '#4361ee' : '#e91e63'};color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;">
                    ${relative.firstName.charAt(0)}${relative.lastName.charAt(0)}
                </div>
                <div style="flex:1;">
                    <div style="font-weight:bold;color:#333;">
                        ${relative.lastName} ${relative.firstName} ${relative.middleName || ''}
                    </div>
                    <div style="font-size:12px;color:#666;margin-top:5px;">
                        ${relative.roleText} • ${relative.lineText}
                        ${relative.birthDate ? `• 📅 ${relative.birthDate}` : ''}
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button onclick="window.treeBuilder.editRelative(${relative.id})" 
                            style="background:#4361ee;color:white;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-size:12px;">
                        ✏️
                    </button>
                    <button onclick="window.treeBuilder.removeRelative(${relative.id})" 
                            style="background:#e74c3c;color:white;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-size:12px;">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Показать окно предпросмотра
    function showPreviewModal() {
        const content = `
            <div class="ms-alert" style="background:#e8f5e9;color:#1b5e20;padding:15px;border-radius:8px;margin-bottom:20px;">
                <strong>✅ Отлично! Добавлено родственников: ${relatives.length}</strong>
                <p style="margin:5px 0 0 0;font-size:14px;">Проверьте данные перед построением дерева</p>
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Название дерева:</label>
                <input type="text" class="ms-form-input" id="tree-name" 
                       value="Моя семья" placeholder="Введите название">
            </div>
            
            <div class="ms-form-group">
                <label class="ms-form-label">Стиль отображения:</label>
                <select class="ms-form-select" id="tree-style">
                    <option value="classic">Классический (вертикальный)</option>
                    <option value="horizontal">Горизонтальный</option>
                    <option value="circular">Круговой</option>
                </select>
            </div>
            
            <div style="background:#f8f9fa;padding:20px;border-radius:10px;margin:20px 0;">
                <h4 style="margin-top:0;">Предпросмотр структуры:</h4>
                <pre style="background:white;padding:15px;border-radius:8px;border:1px solid #e9ecef;overflow:auto;">
${generateTreePreview()}
                </pre>
            </div>
            
            <div class="ms-alert" style="background:#e3f2fd;color:#0d47a1;padding:15px;border-radius:8px;">
                <strong>📊 Статистика:</strong><br>
                👥 Всего родственников: ${relatives.length}<br>
                👨 Линия отца: ${relatives.filter(r => r.line === 'father').length}<br>
                👩 Линия матери: ${relatives.filter(r => r.line === 'mother').length}
            </div>
        `;
        
        window.ModalSystem.createModal('tree-preview', {
            title: '🌳 Предпросмотр дерева',
            subtitle: 'Шаг 2: Настройка и проверка',
            content: content,
            width: '700px',
            showSteps: true,
            currentStep: 2,
            totalSteps: 3,
            buttons: [
                {
                    text: 'Назад',
                    type: 'secondary',
                    onClick: showMainModal
                },
                {
                    text: 'Построить дерево',
                    type: 'primary',
                    onClick: buildTree
                }
            ]
        });
    }
    
    // Генерация предпросмотра дерева
    function generateTreePreview() {
        if (relatives.length === 0) return 'Дерево пустое';
        
        let preview = '';
        const root = relatives.find(r => r.role === 'father' || r.role === 'mother') || relatives[0];
        
        preview += `     ${root.firstName.charAt(0)}. ${root.lastName}\n`;
        preview += `       |\n`;
        preview += `   ┌───┴───┐\n`;
        
        const children = relatives.filter(r => 
            ['son', 'daughter', 'grandson', 'granddaughter'].includes(r.role)
        );
        
        if (children.length > 0) {
            preview += '   ';
            children.forEach((child, i) => {
                preview += `${child.firstName.charAt(0)}. ${child.lastName}   `;
                if ((i + 1) % 2 === 0 && i !== children.length - 1) preview += '\n   ';
            });
            if (children.length % 2 !== 0) preview += '\n';
        }
        
        return preview;
    }
    
    // Построить дерево
    function buildTree() {
        const treeName = document.getElementById('tree-name').value.trim() || 'Мое семейное древо';
        const style = document.getElementById('tree-style').value;
        
        window.ModalSystem.closeModal('tree-preview');
        showBuildingProgress();
        
        // Имитация построения
        setTimeout(() => {
            showResultModal(treeName, style);
        }, 2000);
    }
    
    // Показать прогресс построения
    function showBuildingProgress() {
        const content = `
            <div style="text-align:center;padding:40px 20px;">
                <div style="font-size:60px;margin-bottom:20px;">🌳</div>
                <h3 style="margin:0 0 15px 0;color:#4361ee;">Строим ваше семейное древо...</h3>
                <p style="color:#666;margin-bottom:30px;">
                    Обрабатываем ${relatives.length} родственников
                </p>
                
                <div style="background:#f8f9fa;border-radius:10px;padding:20px;margin:0 auto 30px;max-width:400px;">
                    <div style="height:10px;background:#e9ecef;border-radius:5px;overflow:hidden;">
                        <div id="progress-bar" style="height:100%;background:linear-gradient(90deg, #4361ee, #3a0ca3);width:0%;transition:width 1s;"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:10px;">
                        <span style="color:#666;">Прогресс:</span>
                        <span id="progress-percent" style="font-weight:bold;color:#4361ee;">0%</span>
                    </div>
                </div>
                
                <div style="color:#999;font-size:14px;">
                    ⏳ Пожалуйста, подождите...
                </div>
            </div>
        `;
        
        window.ModalSystem.createModal('building-progress', {
            title: '⚙️ Построение дерева',
            content: content,
            width: '500px',
            showCloseButton: false,
            closeOnOverlay: false
        });
        
        // Анимация прогресса
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            const progressBar = document.getElementById('progress-bar');
            const progressPercent = document.getElementById('progress-percent');
            
            if (progressBar && progressPercent) {
                progressBar.style.width = `${progress}%`;
                progressPercent.textContent = `${progress}%`;
            }
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 300);
    }
    
    // Показать результат
    function showResultModal(treeName, style) {
        window.ModalSystem.closeModal('building-progress');
        
        const content = `
            <div style="text-align:center;padding:20px;">
                <div style="font-size:60px;color:#2ecc71;margin-bottom:20px;">✅</div>
                <h3 style="margin:0 0 15px 0;color:#4361ee;">Дерево построено!</h3>
                <p style="color:#666;margin-bottom:30px;">
                    <strong>${treeName}</strong><br>
                    ${relatives.length} родственников • ${style} стиль
                </p>
                
                <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:0 auto 30px;max-width:500px;">
                    <div style="font-family:monospace;font-size:12px;text-align:left;background:white;padding:15px;border-radius:8px;border:1px solid #e9ecef;">
${generateTreePreview()}
                    </div>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:30px;">
                    <button class="ms-modal-button ms-modal-button-primary" onclick="viewTree()">
                        👀 Просмотреть
                    </button>
                    <button class="ms-modal-button ms-modal-button-success" onclick="exportTree()">
                        📥 Экспорт
                    </button>
                </div>
                
                <div style="color:#999;font-size:14px;border-top:1px solid #eee;padding-top:20px;">
                    Дерево построено успешно. Вы можете создать новое или экспортировать это.
                </div>
            </div>
        `;
        
        window.ModalSystem.createModal('tree-result', {
            title: '🎉 Готово!',
            content: content,
            width: '600px',
            showSteps: true,
            currentStep: 3,
            totalSteps: 3,
            buttons: [
                {
                    text: 'Закрыть',
                    type: 'secondary'
                },
                {
                    text: 'Новое дерево',
                    type: 'primary',
                    onClick: () => {
                        window.ModalSystem.closeModal('tree-result');
                        setTimeout(() => window.startTreeBuilder(currentMode), 300);
                    }
                }
            ]
        });
    }
    
    // Вспомогательные функции
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
    
    // Добавить стили для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Глобальные функции для кнопок
    window.viewTree = function() {
        window.Modal.alert('Просмотр дерева', 'Эта функция будет реализована в следующем обновлении!');
    };
    
    window.exportTree = function() {
        const dataStr = JSON.stringify(relatives, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'семейное-дерево.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        window.Modal.alert('Экспорт', 'Данные экспортированы в JSON файл!');
    };
    
    console.log('✅ Tree Builder загружен');
})();