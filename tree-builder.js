// tree-builder.js - Пошаговое построение генеалогического дерева

console.log('🌳 Tree Builder загружается...');

// Инициализируем данные дерева
if (!window.treeData) {
    window.treeData = {
        people: [],
        currentPerson: null,
        treeStructure: null
    };
}

// Основная функция пошагового построения
window.startTreeBuilder = function() {
    console.log('🚀 Запуск пошагового построения дерева');
    console.log('Текущий пользователь:', window.currentUser);
    
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для построения дерева необходимо войти в систему', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    // Показываем начальное окно
    showTreeBuilderStartModal();
}

// Начальное модальное окно
function showTreeBuilderStartModal() {
    console.log('📋 Показываем стартовое окно');
    
    const modalHtml = `<div class="modal show" id="tree-builder-start-modal">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Пошаговое построение генеалогического древа</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 30px 20px;">
                    <i class="fas fa-tree" style="font-size: 4rem; color: #48bb78; margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 15px; color: #4a5568;">Создайте ваше первое древо</h3>
                    <p style="margin-bottom: 25px; color: #718096; line-height: 1.6;">
                        Начните с себя, затем добавляйте родственников по очереди.<br>
                        Система автоматически построит дерево на основе добавленных связей.
                    </p>
                    
                    <div class="start-options" style="margin-top: 30px;">
                        <button class="btn btn-large" id="start-with-self">
                            <i class="fas fa-user"></i> Начать с себя
                        </button>
                        <button class="btn btn-large btn-secondary" id="start-with-other">
                            <i class="fas fa-users"></i> Начать с другого родственника
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        console.log('✅ Оверлей найден, добавляем HTML');
        overlay.innerHTML = modalHtml;
        overlay.classList.remove('hidden');
        
        // Обработчики
        document.getElementById('start-with-self')?.addEventListener('click', () => {
            console.log('👤 Начинаем с себя');
            overlay.classList.add('hidden');
            setTimeout(() => addNewPerson('self'), 100);
        });
        
        document.getElementById('start-with-other')?.addEventListener('click', () => {
            console.log('👥 Начинаем с другого');
            overlay.classList.add('hidden');
            setTimeout(() => addNewPerson('other'), 100);
        });
        
        // Закрытие
        document.querySelector('#tree-builder-start-modal .modal-close')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
    } else {
        console.error('❌ Оверлей не найден!');
    }
}

// Добавление нового человека
window.addNewPerson = function(defaultRelation = 'self') {
    console.log('➕ Добавляем нового человека, роль по умолчанию:', defaultRelation);
    
    const modalHtml = `<div class="modal show" id="add-person-builder-modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>${defaultRelation === 'self' ? 'Добавьте себя' : 'Добавить родственника'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="add-person-builder-form">
                    <div class="form-section">
                        <h4 style="color: #4a5568; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                            <i class="fas fa-user"></i> Основная информация
                        </h4>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="builder-first-name">Имя *</label>
                                <input type="text" id="builder-first-name" placeholder="Иван" required>
                            </div>
                            <div class="form-group">
                                <label for="builder-last-name">Фамилия *</label>
                                <input type="text" id="builder-last-name" placeholder="Иванов" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="builder-birth-date">Дата рождения</label>
                                <input type="date" id="builder-birth-date">
                            </div>
                            <div class="form-group">
                                <label for="builder-death-date">Дата смерти</label>
                                <input type="date" id="builder-death-date">
                            </div>
                            <div class="form-group">
                                <label for="builder-gender">Пол *</label>
                                <select id="builder-gender" required>
                                    <option value="">Выберите пол</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section" style="margin-top: 25px;">
                        <h4 style="color: #4a5568; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                            <i class="fas fa-link"></i> Связи и родство
                        </h4>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="builder-relation">Роль в древе *</label>
                                <select id="builder-relation" required ${defaultRelation === 'self' ? 'disabled' : ''}>
                                    <option value="">Выберите роль</option>
                                    <option value="self" ${defaultRelation === 'self' ? 'selected' : ''}>Я (центральная персона)</option>
                                    <option value="spouse">Супруг/супруга</option>
                                    <option value="father">Отец</option>
                                    <option value="mother">Мать</option>
                                    <option value="son">Сын</option>
                                    <option value="daughter">Дочь</option>
                                    <option value="grandfather">Дедушка</option>
                                    <option value="grandmother">Бабушка</option>
                                    <option value="grandson">Внук</option>
                                    <option value="granddaughter">Внучка</option>
                                    <option value="great_grandfather">Прадедушка</option>
                                    <option value="great_grandmother">Прабабушка</option>
                                    <option value="great_grandson">Правнук</option>
                                    <option value="great_granddaughter">Правнучка</option>
                                    <option value="brother">Брат</option>
                                    <option value="sister">Сестра</option>
                                </select>
                                ${defaultRelation === 'self' ? '<input type="hidden" id="builder-relation-hidden" value="self">' : ''}
                            </div>
                            
                            <div class="form-group">
                                <label for="builder-line">Линия родства</label>
                                <select id="builder-line">
                                    <option value="both">Обе линии</option>
                                    <option value="father">Отцовская линия</option>
                                    <option value="mother">Материнская линия</option>
                                    <option value="unknown">Неизвестно</option>
                                </select>
                            </div>
                        </div>
                        
                        ${window.treeData.people.length > 0 ? `
                        <div class="form-group">
                            <label for="builder-related-to">Родственник по отношению к:</label>
                            <select id="builder-related-to">
                                <option value="">Не указано</option>
                                ${window.treeData.people.map(person => 
                                    `<option value="${person.id}">${person.first_name} ${person.last_name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="form-section" style="margin-top: 25px;">
                        <h4 style="color: #4a5568; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                            <i class="fas fa-file-alt"></i> Дополнительная информация
                        </h4>
                        
                        <div class="form-group">
                            <label for="builder-bio">Биография</label>
                            <textarea id="builder-bio" rows="3" placeholder="Расскажите историю этого человека..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="builder-photo-url">Фотография (URL)</label>
                            <input type="url" id="builder-photo-url" placeholder="https://example.com/photo.jpg">
                            <small style="color: #718096;">Или оставьте пустым для автоматического аватара</small>
                        </div>
                    </div>
                    
                    <div class="modal-footer" style="margin-top: 30px; display: flex; justify-content: space-between;">
                        <button type="button" class="btn btn-secondary cancel-btn">
                            Отмена
                        </button>
                        <button type="submit" class="btn">
                            <i class="fas fa-check"></i> ${defaultRelation === 'self' ? 'Начать построение' : 'Добавить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = modalHtml;
        overlay.classList.remove('hidden');
        
        // Устанавливаем значение по умолчанию для роли
        if (defaultRelation === 'self') {
            document.getElementById('builder-relation').value = 'self';
        }
        
        // Обработка формы
        document.getElementById('add-person-builder-form')?.addEventListener('submit', function(e) {
            e.preventDefault();
            savePerson();
        });
        
        // Закрытие
        document.querySelector('#add-person-builder-modal .modal-close')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
        
        document.querySelector('#add-person-builder-modal .cancel-btn')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
            // Если ещё нет людей, показываем стартовое окно
            if (window.treeData.people.length === 0) {
                setTimeout(() => showTreeBuilderStartModal(), 300);
            }
        });
    }
}

// Сохранение человека
function savePerson() {
    const relation = document.getElementById('builder-relation-hidden') ? 
                   'self' : document.getElementById('builder-relation').value;
    
    const person = {
        id: 'person_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        first_name: document.getElementById('builder-first-name').value.trim(),
        last_name: document.getElementById('builder-last-name').value.trim(),
        birth_date: document.getElementById('builder-birth-date').value || null,
        death_date: document.getElementById('builder-death-date').value || null,
        gender: document.getElementById('builder-gender').value,
        relation: relation,
        line: document.getElementById('builder-line').value,
        related_to: document.getElementById('builder-related-to') ? 
                   document.getElementById('builder-related-to').value || null : null,
        biography: document.getElementById('builder-bio')?.value.trim() || '',
        photo_url: document.getElementById('builder-photo-url')?.value.trim() || null,
        created_at: new Date().toISOString()
    };
    
    // Валидация
    if (!person.first_name || !person.last_name || !person.gender || !person.relation) {
        window.showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    // Добавляем в данные
    window.treeData.people.push(person);
    
    // Если это первый человек, делаем его текущим
    if (window.treeData.people.length === 1) {
        window.treeData.currentPerson = person;
    }
    
    // Показываем уведомление
    window.showNotification(`✅ ${person.first_name} ${person.last_name} добавлен в древо`, 'success');
    
    // Закрываем модальное окно
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    // Обновляем предпросмотр
    setTimeout(() => updateTreePreview(), 100);
}

// Обновление предпросмотра дерева
window.updateTreePreview = function() {
    console.log('🔄 Обновляем предпросмотр, людей:', window.treeData.people.length);
    
    const container = document.getElementById('tree-visualization-container');
    if (!container) {
        console.error('❌ Контейнер дерева не найден!');
        return;
    }
    
    if (window.treeData.people.length === 0) {
        container.innerHTML = `<div class="tree-empty-state">
            <i class="fas fa-tree" style="font-size: 4rem; color: #cbd5e0; margin-bottom: 20px;"></i>
            <h3>Дерево еще не построено</h3>
            <p>Начните добавлять родственников, чтобы построить ваше первое генеалогическое древо</p>
            <button class="btn" onclick="startTreeBuilder()" style="margin-top: 20px;">
                <i class="fas fa-plus-circle"></i> Начать построение
            </button>
        </div>`;
        return;
    }
    
    let html = `<div class="tree-preview-container">
        <div class="preview-header">
            <h3>Предпросмотр дерева (${window.treeData.people.length} человек)</h3>
            <div class="preview-controls">
                <button class="btn btn-small" onclick="addNewPerson()">
                    <i class="fas fa-user-plus"></i> Добавить родственника
                </button>
                ${window.treeData.people.length >= 2 ? `
                <button class="btn btn-small btn-success" onclick="buildFinalTree()">
                    <i class="fas fa-tree"></i> Автопостроение дерева
                </button>
                ` : ''}
            </div>
        </div>
        
        <div class="preview-content">
            <div class="people-list">`;
    
    // Показываем всех добавленных людей
    window.treeData.people.forEach(person => {
        const relationText = getRelationText(person.relation);
        const lineText = getLineText(person.line);
        
        html += `<div class="person-preview-card ${person.gender}" data-id="${person.id}">
            <div class="person-preview-avatar">
                ${person.photo_url ? 
                    `<img src="${person.photo_url}" alt="${person.first_name}" onerror="this.src='https://ui-avatars.com/api/?name=${person.first_name}+${person.last_name}&background=${person.gender === 'female' ? 'ed64a6' : '4299e1'}&color=fff'">` :
                    `<div class="avatar-initials">${person.first_name[0]}${person.last_name[0] || ''}</div>`
                }
            </div>
            <div class="person-preview-info">
                <div class="person-preview-name">
                    <strong>${person.first_name} ${person.last_name}</strong>
                </div>
                <div class="person-preview-details">
                    <span class="relation-badge">${relationText}</span>
                    ${lineText ? `<span class="line-badge">${lineText}</span>` : ''}
                    ${person.birth_date ? `<br><small>📅 ${formatDate(person.birth_date)}</small>` : ''}
                </div>
            </div>
            <div class="person-preview-actions">
                <button class="btn-icon" onclick="editPersonInBuilder('${person.id}')" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>`;
    });
    
    html += `</div>
            
            <div class="preview-stats">
                <h4><i class="fas fa-chart-bar"></i> Статистика:</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Всего людей:</span>
                        <span class="stat-value">${window.treeData.people.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Мужчин:</span>
                        <span class="stat-value">${window.treeData.people.filter(p => p.gender === 'male').length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Женщин:</span>
                        <span class="stat-value">${window.treeData.people.filter(p => p.gender === 'female').length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Поколений:</span>
                        <span class="stat-value">${countGenerations()}</span>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 8px;">
                    <h5 style="color: #4a5568; margin-bottom: 10px;">${window.treeData.people.length < 2 ? 'Следующие шаги:' : 'Готово к построению!'}</h5>
                    <ul style="color: #718096; padding-left: 20px;">
                        ${window.treeData.people.length < 2 ? 
                            `<li>Добавьте минимум ${2 - window.treeData.people.length} родственника</li>
                             <li>Нажмите "Добавить родственника"</li>` : 
                            `<li>Дерево готово к построению</li>
                             <li>Нажмите "Автопостроение дерева"</li>`
                        }
                    </ul>
                </div>
            </div>
        </div>
    </div>`;
    
    container.innerHTML = html;
    
    // Обновляем статистику
    updateTreeStats();
}

// Финальное построение дерева
window.buildFinalTree = function() {
    console.log('🌳 Запуск финального построения');
    
    if (window.treeData.people.length < 2) {
        window.showNotification('Добавьте минимум 2 человека для построения дерева', 'error');
        return;
    }
    
    window.showLoader('Построение полного генеалогического древа...');
    
    setTimeout(() => {
        // Находим центральную персону
        const self = window.treeData.people.find(p => p.relation === 'self') || window.treeData.people[0];
        
        // Строим простое дерево для демонстрации
        const container = document.getElementById('tree-visualization-container');
        if (!container) return;
        
        container.innerHTML = buildTreeVisualization(self);
        
        window.showNotification('✅ Генеалогическое древо успешно построено!', 'success');
        window.hideLoader();
    }, 1500);
}

// Построение визуализации дерева
function buildTreeVisualization(self) {
    const familyName = self.last_name || '';
    
    return `<div class="final-tree-container">
        <div class="tree-header">
            <h2>Генеалогическое древо семьи ${familyName}</h2>
            <div class="tree-actions">
                <button class="btn btn-small" onclick="saveTreeAsImage()">
                    <i class="fas fa-image"></i> Сохранить
                </button>
                <button class="btn btn-small" onclick="printTree()">
                    <i class="fas fa-print"></i> Печать
                </button>
                <button class="btn btn-small btn-secondary" onclick="startTreeBuilder()">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
            </div>
        </div>
        
        <div class="tree-visualization" style="text-align: center; padding: 40px 20px;">
            <h3 style="color: #4a5568; margin-bottom: 40px;">Ваше генеалогическое древо</h3>
            
            <div style="display: inline-block; text-align: center;">
                <!-- Поколение 3: Прабабушки/прадедушки -->
                <div style="margin-bottom: 40px;">
                    <div class="gen-label">Прабабушки/прадедушки</div>
                    <div class="gen-content">
                        ${renderGenerationPeople(['great_grandfather', 'great_grandmother'])}
                    </div>
                </div>
                
                <!-- Поколение 2: Бабушки/дедушки -->
                <div style="margin-bottom: 40px;">
                    <div class="gen-label">Бабушки/дедушки</div>
                    <div class="gen-content">
                        ${renderGenerationPeople(['grandfather', 'grandmother'])}
                    </div>
                </div>
                
                <!-- Поколение 1: Родители -->
                <div style="margin-bottom: 40px;">
                    <div class="gen-label">Родители</div>
                    <div class="gen-content">
                        ${renderGenerationPeople(['father', 'mother'])}
                    </div>
                </div>
                
                <!-- Поколение 0: Я и супруг -->
                <div style="margin-bottom: 40px;">
                    <div class="gen-label current">Текущее поколение</div>
                    <div class="gen-content" style="display: flex; justify-content: center; gap: 40px;">
                        ${renderPersonBox(self, 'Я', true)}
                        ${renderGenerationPeople(['spouse'])}
                    </div>
                </div>
                
                <!-- Поколение -1: Дети -->
                <div style="margin-bottom: 40px;">
                    <div class="gen-label">Дети</div>
                    <div class="gen-content">
                        ${renderGenerationPeople(['son', 'daughter'])}
                    </div>
                </div>
                
                <!-- Поколение -2: Внуки -->
                <div>
                    <div class="gen-label">Внуки</div>
                    <div class="gen-content">
                        ${renderGenerationPeople(['grandson', 'granddaughter'])}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="tree-info-panel">
            <h3><i class="fas fa-info-circle"></i> Информация о дереве</h3>
            <div class="info-content">
                <p><strong>Центральная персона:</strong> ${self.first_name} ${self.last_name}</p>
                <p><strong>Всего родственников:</strong> ${window.treeData.people.length}</p>
                <p><strong>Дата построения:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                <p><strong>Поколений в дереве:</strong> ${countGenerations()}</p>
            </div>
        </div>
    </div>`;
}

// Рендеринг людей по ролям
function renderGenerationPeople(roles) {
    const people = window.treeData.people.filter(p => roles.includes(p.relation));
    if (people.length === 0) return '';
    
    return people.map(person => renderPersonBox(person, getRelationText(person.relation))).join('');
}

// Рендеринг карточки человека
function renderPersonBox(person, title, isCenter = false) {
    if (!person) return '';
    
    return `<div class="tree-person-box ${person.gender} ${isCenter ? 'center-person' : ''}" 
             onclick="showPersonDetails('${person.id}')" 
             style="display: inline-block; margin: 0 10px;">
        <div class="person-avatar">
            ${person.photo_url ? 
                `<img src="${person.photo_url}" alt="${person.first_name}" 
                     onerror="this.src='https://ui-avatars.com/api/?name=${person.first_name}+${person.last_name}&background=${person.gender === 'female' ? 'ed64a6' : '4299e1'}&color=fff'">` :
                `<div class="avatar-initials">${person.first_name[0]}${person.last_name[0] || ''}</div>`
            }
        </div>
        <div class="person-info">
            <div class="person-name">${person.first_name} ${person.last_name}</div>
            <div class="person-title">${title}</div>
            ${person.birth_date ? `<div class="person-date">📅 ${formatDate(person.birth_date)}</div>` : ''}
        </div>
    </div>`;
}

// Вспомогательные функции
function getRelationText(relation) {
    const relations = {
        'self': 'Я',
        'spouse': 'Супруг(а)',
        'father': 'Отец',
        'mother': 'Мать',
        'son': 'Сын',
        'daughter': 'Дочь',
        'brother': 'Брат',
        'sister': 'Сестра',
        'grandfather': 'Дедушка',
        'grandmother': 'Бабушка',
        'grandson': 'Внук',
        'granddaughter': 'Внучка',
        'great_grandfather': 'Прадедушка',
        'great_grandmother': 'Прабабушка',
        'great_grandson': 'Правнук',
        'great_granddaughter': 'Правнучка'
    };
    return relations[relation] || relation;
}

function getLineText(line) {
    const lines = {
        'father': 'Отцовская',
        'mother': 'Материнская',
        'both': 'Обе линии',
        'unknown': 'Неизвестно'
    };
    return lines[line] || line;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    } catch (e) {
        return dateString;
    }
}

function countGenerations() {
    const gens = new Set();
    window.treeData.people.forEach(person => {
        let gen = 0;
        switch(person.relation) {
            case 'great_grandfather': case 'great_grandmother': gen = 3; break;
            case 'grandfather': case 'grandmother': gen = 2; break;
            case 'father': case 'mother': gen = 1; break;
            case 'self': case 'spouse': case 'brother': case 'sister': gen = 0; break;
            case 'son': case 'daughter': gen = -1; break;
            case 'grandson': case 'granddaughter': gen = -2; break;
            case 'great_grandson': case 'great_granddaughter': gen = -3; break;
        }
        gens.add(gen);
    });
    return gens.size;
}

function editPersonInBuilder(personId) {
    window.showNotification('Редактирование в разработке', 'info');
}

function showPersonDetails(personId) {
    const person = window.treeData.people.find(p => p.id === personId);
    if (!person) return;
    
    const modalHtml = `<div class="modal show" id="person-details-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>${person.first_name} ${person.last_name}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 20px;">
                    ${person.photo_url ? 
                        `<img src="${person.photo_url}" alt="${person.first_name}" 
                              style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin: 0 auto 15px;">` :
                        `<div style="width: 150px; height: 150px; background: ${person.gender === 'female' ? '#ed64a6' : '#4299e1'}; 
                              color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                              margin: 0 auto 15px; font-size: 3rem;">
                            ${person.first_name[0]}${person.last_name[0] || ''}
                        </div>`
                    }
                    <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">
                        ${person.first_name} ${person.last_name}
                    </div>
                    <div style="color: #667eea; margin-bottom: 10px;">
                        ${getRelationText(person.relation)}
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #4a5568;">Основная информация:</h4>
                    ${person.birth_date ? 
                        `<p style="margin-bottom: 5px;"><strong>Дата рождения:</strong> ${formatDate(person.birth_date)}</p>` : ''
                    }
                    ${person.death_date ? 
                        `<p style="margin-bottom: 5px;"><strong>Дата смерти:</strong> ${formatDate(person.death_date)}</p>` : ''
                    }
                    ${person.gender ? 
                        `<p style="margin-bottom: 5px;"><strong>Пол:</strong> ${person.gender === 'female' ? 'Женский' : 'Мужской'}</p>` : ''
                    }
                    ${person.line ? 
                        `<p style="margin-bottom: 5px;"><strong>Линия родства:</strong> ${getLineText(person.line)}</p>` : ''
                    }
                </div>
                
                ${person.biography ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px; color: #4a5568;">Биография:</h4>
                        <p style="color: #718096; line-height: 1.6;">${person.biography}</p>
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary cancel-btn">
                    Закрыть
                </button>
            </div>
        </div>
    </div>`;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = modalHtml;
        overlay.classList.remove('hidden');
        
        // Закрытие
        document.querySelector('#person-details-modal .modal-close')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
        
        document.querySelector('#person-details-modal .cancel-btn')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
    }
}

// Обновление статистики
function updateTreeStats() {
    const peopleCount = window.treeData?.people?.length || 0;
    const photosCount = window.treeData?.people?.filter(p => p.photo_url).length || 0;
    const generations = countGenerations();
    
    if (document.getElementById('tree-people-count')) {
        document.getElementById('tree-people-count').textContent = peopleCount;
    }
    if (document.getElementById('tree-photos-count')) {
        document.getElementById('tree-photos-count').textContent = photosCount;
    }
    if (document.getElementById('tree-generations')) {
        document.getElementById('tree-generations').textContent = generations;
    }
    if (document.getElementById('tree-connections')) {
        document.getElementById('tree-connections').textContent = Math.max(0, peopleCount - 1);
    }
}

console.log('✅ Tree Builder загружен и готов к работе');