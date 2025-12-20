/**
 * Tree Builder - Построитель генеалогического дерева
 */

(function() {
    console.log('🌳 Tree Builder загружается...');
    
    // Хранилище данных
    let treeData = {
        relatives: [],
        treeName: 'Мое семейное дерево',
        familyLine: 'father',
        style: 'classic'
    };
    
    // Конфигурация
    const CONFIG = {
        ROLES: [
            { value: 'great-grandfather', label: 'Прадедушка' },
            { value: 'great-grandmother', label: 'Прабабушка' },
            { value: 'grandfather', label: 'Дедушка' },
            { value: 'grandmother', label: 'Бабушка' },
            { value: 'father', label: 'Отец' },
            { value: 'mother', label: 'Мать' },
            { value: 'uncle', label: 'Дядя' },
            { value: 'aunt', label: 'Тетя' },
            { value: 'brother', label: 'Брат' },
            { value: 'sister', label: 'Сестра' },
            { value: 'son', label: 'Сын' },
            { value: 'daughter', label: 'Дочь' },
            { value: 'grandson', label: 'Внук' },
            { value: 'granddaughter', label: 'Внучка' }
        ],
        
        LINES: [
            { value: 'father', label: 'Линия отца' },
            { value: 'mother', label: 'Линия матери' },
            { value: 'both', label: 'Обе линии' }
        ]
    };
    
    // Основная функция запуска построителя
    window.startTreeBuilder = function(mode = 'auto') {
        console.log(`🚀 Запуск Tree Builder в режиме: ${mode}`);
        
        // Инициализируем данные
        treeData.relatives = [];
        treeData.mode = mode;
        
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
                            return false; // Не закрывать окно
                        }
                        showTreeSettingsModal();
                        return true; // Закрыть окно
                    }
                }
            ]
        });
        
        // Инициализация обработчиков событий
        setTimeout(() => {
            // Обработчик выбора линии
            document.getElementById('family-line').addEventListener('change', function(e) {
                treeData.familyLine = e.target.value;
            });
            
            // Обработчик кнопки добавления родственника
            document.getElementById('add-relative-btn').addEventListener('click', showAddRelativeModal);
            
            // Обновляем список родственников
            updateRelativesList();
        }, 100);
    }
    
    // Показать окно добавления родственника
    function showAddRelativeModal(relativeToEdit = null) {
        const isEdit = !!relativeToEdit;
        const relative = relativeToEdit || {};
        
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
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Линия родства *</label>
                    <select class="ms-form-control" id="relative-line" required>
                        <option value="">-- Выберите линию --</option>
                        <option value="father" ${relative.line === 'father' ? 'selected' : ''}>Линия отца</option>
                        <option value="mother" ${relative.line === 'mother' ? 'selected' : ''}>Линия матери</option>
                    </select>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Биография</label>
                    <textarea class="ms-form-control ms-form-textarea" id="bio" rows="3">${relative.bio || ''}</textarea>
                </div>
                
                <div class="ms-form-group">
                    <label class="ms-form-label">Заметки</label>
                    <textarea class="ms-form-control ms-form-textarea" id="notes" rows="2">${relative.notes || ''}</textarea>
                </div>
            </form>
        `;
        
        window.ModalSystem.createModal('add-relative', {
            title: isEdit ? '✏️ Редактировать родственника' : '👤 Добавить родственника',
            content: content,
            width: '550px',
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
                        return true; // Закрыть окно
                    }
                }
            ]
        });
    }
    
    // Сохранить родственника
    function saveRelative(existingId = null) {
        // Получаем значения из формы
        const lastName = document.getElementById('last-name').value.trim();
        const firstName = document.getElementById('first-name').value.trim();
        const middleName = document.getElementById('middle-name').value.trim();
        const birthDate = document.getElementById('birth-date').value;
        const deathDate = document.getElementById('death-date').value;
        const role = document.getElementById('relative-role').value;
        const line = document.getElementById('relative-line').value;
        const bio = document.getElementById('bio').value.trim();
        const notes = document.getElementById('notes').value.trim();
        
        // Валидация
        if (!lastName || !firstName || !role || !line) {
            window.Modal.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля!');
            return false;
        }
        
        // Находим название роли
        const roleObj = CONFIG.ROLES.find(r => r.value === role);
        const roleText = roleObj ? roleObj.label : role;
        
        // Создаем объект родственника
        const relative = {
            id: existingId || Date.now(),
            lastName: lastName,
            firstName: firstName,
            middleName: middleName,
            fullName: `${lastName} ${firstName} ${middleName || ''}`.trim(),
            birthDate: birthDate || null,
            deathDate: deathDate || null,
            role: role,
            roleText: roleText,
            line: line,
            lineText: line === 'father' ? 'Линия отца' : 'Линия матери',
            bio: bio,
            notes: notes,
            createdAt: new Date().toISOString()
        };
        
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
    
    // Обновить список родственников
    function updateRelativesList() {
        const container = document.getElementById('relatives-container');
        const listContainer = document.getElementById('relatives-list');
        const emptyAlert = document.getElementById('empty-list-alert');
        
        if (!container) return;
        
        // Если нет родственников, показываем сообщение
        if (treeData.relatives.length === 0) {
            if (emptyAlert) emptyAlert.style.display = 'block';
            if (listContainer) listContainer.style.display = 'none';
            return;
        }
        
        // Скрываем сообщение о пустом списке
        if (emptyAlert) emptyAlert.style.display = 'none';
        
        // Создаем или обновляем список
        let listHtml = '';
        
        treeData.relatives.forEach((relative, index) => {
            const initials = `${relative.firstName.charAt(0)}${relative.lastName.charAt(0)}`;
            const lineColor = relative.line === 'father' ? '#007bff' : '#e83e8c';
            
            listHtml += `
                <div class="ms-relative-item" data-id="${relative.id}">
                    <div class="ms-relative-avatar" style="background: ${lineColor}">
                        ${initials}
                    </div>
                    <div class="ms-relative-info">
                        <h4 class="ms-relative-name">${relative.fullName}</h4>
                        <p class="ms-relative-details">
                            ${relative.roleText} • ${relative.lineText}
                            ${relative.birthDate ? `• 📅 ${formatDate(relative.birthDate)}` : ''}
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
        
        // Если контейнер списка еще не создан, создаем его
        if (!listContainer) {
            const newListContainer = document.createElement('div');
            newListContainer.id = 'relatives-list';
            newListContainer.innerHTML = listHtml;
            
            // Находим правильное место для вставки
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
                </select>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin-top: 0; font-size: 16px;">Предпросмотр структуры:</h4>
                <div style="font-family: monospace; font-size: 12px; background: white; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6;">
                    <pre style="margin: 0;">${generateTreePreview()}</pre>
                </div>
            </div>
            
            <div class="ms-alert ms-alert-info">
                <strong>📊 Статистика:</strong><br>
                👥 Всего родственников: ${treeData.relatives.length}<br>
                👨 Линия отца: ${treeData.relatives.filter(r => r.line === 'father').length}<br>
                👩 Линия матери: ${treeData.relatives.filter(r => r.line === 'mother').length}
            </div>
        `;
        
        window.ModalSystem.createModal('tree-settings', {
            title: '⚙️ Настройки дерева',
            content: content,
            width: '600px',
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
                        // Сохраняем настройки
                        treeData.treeName = document.getElementById('tree-name').value.trim() || 'Мое семейное дерево';
                        treeData.style = document.getElementById('tree-style').value;
                        
                        // Запускаем построение
                        buildTree();
                        return true;
                    }
                }
            ]
        });
    }
    
    // Построить дерево
    function buildTree() {
        // Показываем окно прогресса
        const progressContent = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">🌳</div>
                <h4 style="margin: 0 0 15px 0; color: #007bff;">Строим ваше семейное древо...</h4>
                <p style="color: #6c757d; margin-bottom: 20px;">
                    Обрабатываем ${treeData.relatives.length} родственников
                </p>
                
                <div class="ms-progress">
                    <div id="progress-bar" class="ms-progress-bar" style="width: 0%">0%</div>
                </div>
                
                <p style="color: #999; font-size: 14px; margin-top: 20px;">
                    ⏳ Пожалуйста, подождите...
                </p>
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
            progress += 20;
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
                progressBar.textContent = `${progress}%`;
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                
                // Закрываем окно прогресса и показываем результат
                setTimeout(() => {
                    window.ModalSystem.closeModal('building-progress');
                    showResultModal();
                }, 500);
            }
        }, 300);
    }
    
    // Показать результат
    function showResultModal() {
        const content = `
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 48px; color: #28a745; margin-bottom: 15px;">✅</div>
                <h4 style="margin: 0 0 10px 0; color: #007bff;">Дерево построено успешно!</h4>
                <p style="color: #6c757d; margin-bottom: 20px;">
                    <strong>${treeData.treeName}</strong><br>
                    ${treeData.relatives.length} родственников • ${treeData.style} стиль
                </p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 0 auto 20px; max-width: 400px;">
                    <div style="font-family: monospace; font-size: 11px; text-align: left; background: white; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6;">
                        <pre style="margin: 0; white-space: pre-wrap;">${generateTreePreview()}</pre>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;">
                    <button class="ms-btn ms-btn-primary" id="view-tree-btn">
                        👀 Просмотреть
                    </button>
                    <button class="ms-btn ms-btn-success" id="export-tree-btn">
                        📥 Экспорт
                    </button>
                </div>
                
                <p style="color: #999; font-size: 13px;">
                    Дерево успешно построено. Вы можете просмотреть его или экспортировать данные.
                </p>
            </div>
        `;
        
        window.ModalSystem.createModal('tree-result', {
            title: '🎉 Готово!',
            content: content,
            width: '500px',
            buttons: [
                {
                    text: 'Закрыть',
                    type: 'secondary'
                },
                {
                    text: 'Создать новое',
                    type: 'primary',
                    onClick: function() {
                        // Очищаем данные и начинаем заново
                        treeData.relatives = [];
                        setTimeout(() => window.startTreeBuilder(treeData.mode), 300);
                        return true;
                    }
                }
            ]
        });
        
        // Инициализация кнопок
        setTimeout(() => {
            document.getElementById('view-tree-btn')?.addEventListener('click', function() {
                window.Modal.alert('Просмотр дерева', 'Функция просмотра будет реализована в следующем обновлении.');
            });
            
            document.getElementById('export-tree-btn')?.addEventListener('click', exportTree);
        }, 100);
    }
    
    // Экспорт дерева
    function exportTree() {
        try {
            // Создаем данные для экспорта
            const exportData = {
                treeName: treeData.treeName,
                familyLine: treeData.familyLine,
                style: treeData.style,
                relatives: treeData.relatives,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            // Преобразуем в JSON
            const jsonData = JSON.stringify(exportData, null, 2);
            
            // Создаем blob и ссылку для скачивания
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Создаем ссылку для скачивания
            const a = document.createElement('a');
            a.href = url;
            a.download = `${treeData.treeName.replace(/\s+/g, '_')}_генеалогическое_дерево.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Освобождаем память
            URL.revokeObjectURL(url);
            
            // Показываем уведомление
            window.Modal.alert(
                '✅ Экспорт завершен', 
                `Дерево "${treeData.treeName}" успешно экспортировано в JSON файл.`
            );
            
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            window.Modal.alert('❌ Ошибка', 'Не удалось экспортировать дерево. Попробуйте еще раз.');
        }
    }
    
    // Генерация предпросмотра дерева
    function generateTreePreview() {
        if (treeData.relatives.length === 0) {
            return 'Дерево пустое';
        }
        
        let preview = '';
        
        // Находим корневого родственника (родителя)
        const root = treeData.relatives.find(r => 
            r.role === 'father' || r.role === 'mother' || 
            r.role === 'grandfather' || r.role === 'grandmother'
        ) || treeData.relatives[0];
        
        if (root) {
            preview += `     ${root.firstName.charAt(0)}. ${root.lastName}\n`;
            preview += `       |\n`;
            preview += `   ┌───┴───┐\n`;
            
            // Находим детей
            const children = treeData.relatives.filter(r => 
                ['son', 'daughter', 'grandson', 'granddaughter'].includes(r.role)
            );
            
            if (children.length > 0) {
                let line = '   ';
                children.forEach((child, i) => {
                    line += `${child.firstName.charAt(0)}. ${child.lastName}   `;
                    if ((i + 1) % 2 === 0 && i !== children.length - 1) {
                        preview += line + '\n';
                        line = '   ';
                    }
                });
                if (line.trim() !== '') {
                    preview += line;
                }
            }
        }
        
        return preview || 'Структура дерева формируется...';
    }
    
    // Форматирование даты
    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch (e) {
            return dateString;
        }
    }
    
    // Показать уведомление
    function showNotification(title, message) {
        // Создаем элемент уведомления
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
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Добавляем стили для анимаций уведомлений
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
    
    // Глобальные функции для редактирования и удаления
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
                updateRelativesList();
                showNotification('Удалено', 'Родственник удален из дерева');
            }
        );
    };
    
    // Экспортируем функции для отладки
    window.treeBuilder = {
        getData: () => treeData,
        addRelative: () => showAddRelativeModal(),
        editRelative: window.editRelative,
        deleteRelative: window.deleteRelative,
        exportTree: exportTree
    };
    
    console.log('✅ Tree Builder готов к использованию');
})();