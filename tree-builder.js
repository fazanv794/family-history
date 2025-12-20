// tree-builder.js - Пошаговое построение генеалогического дерева

console.log('🌳 Tree Builder загружается...');

// Данные для построения дерева
window.treeData = {
    people: [],
    currentPerson: null,
    treeStructure: null
};

// Основная функция пошагового построения
function startTreeBuilder() {
    console.log('🚀 Запуск пошагового построения дерева');
    
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
                    
                    <div style="margin-top: 30px; padding: 20px; background: #f7fafc; border-radius: 8px;">
                        <h4 style="color: #4a5568; margin-bottom: 10px;"><i class="fas fa-info-circle"></i> Как это работает:</h4>
                        <ol style="text-align: left; color: #718096; padding-left: 20px;">
                            <li>Добавляете центральную персону (обычно себя)</li>
                            <li>Добавляете родственников, указывая связь</li>
                            <li>Система автоматически строит связи</li>
                            <li>Когда готово - строится полное дерево</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = modalHtml;
        overlay.classList.remove('hidden');
        
        // Обработчики
        document.getElementById('start-with-self')?.addEventListener('click', () => {
            addNewPerson('self');
            overlay.classList.add('hidden');
        });
        
        document.getElementById('start-with-other')?.addEventListener('click', () => {
            addNewPerson('other');
            overlay.classList.add('hidden');
        });
        
        // Закрытие
        document.querySelector('#tree-builder-start-modal .modal-close')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
    }
}

// Добавление нового человека
function addNewPerson(defaultRelation = 'self') {
    const modalHtml = `<div class="modal show" id="add-person-builder-modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>Добавить родственника</h3>
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
                            <div class="form-group">
                                <label for="builder-middle-name">Отчество</label>
                                <input type="text" id="builder-middle-name" placeholder="Иванович">
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
                                <select id="builder-relation" required>
                                    <option value="">Выберите роль</option>
                                    <option value="self">Я (центральная персона)</option>
                                    <option value="spouse">Супруг/супруга</option>
                                    <option value="father">Отец</option>
                                    <option value="mother">Мать</option>
                                    <option value="son">Сын</option>
                                    <option value="daughter">Дочь</option>
                                    <option value="brother">Брат</option>
                                    <option value="sister">Сестра</option>
                                    <option value="grandfather">Дедушка</option>
                                    <option value="grandmother">Бабушка</option>
                                    <option value="grandson">Внук</option>
                                    <option value="granddaughter">Внучка</option>
                                    <option value="great_grandfather">Прадедушка</option>
                                    <option value="great_grandmother">Прабабушка</option>
                                    <option value="great_grandson">Правнук</option>
                                    <option value="great_granddaughter">Правнучка</option>
                                    <option value="uncle">Дядя</option>
                                    <option value="aunt">Тетя</option>
                                    <option value="cousin">Двоюродный брат/сестра</option>
                                    <option value="nephew">Племянник</option>
                                    <option value="niece">Племянница</option>
                                </select>
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
                            
                            <div class="form-group">
                                <label for="builder-related-to">Родственник по отношению к:</label>
                                <select id="builder-related-to">
                                    <option value="">Не указано</option>
                                    ${window.treeData.people.map(person => 
                                        `<option value="${person.id}">${person.first_name} ${person.last_name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
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
                            <label for="builder-notes">Заметки</label>
                            <textarea id="builder-notes" rows="2" placeholder="Дополнительные заметки..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="builder-photo-url">Фотография (URL)</label>
                            <div style="display: flex; gap: 10px; align-items: flex-end;">
                                <input type="url" id="builder-photo-url" placeholder="https://example.com/photo.jpg" style="flex: 1;">
                                <button type="button" class="btn btn-small" onclick="showPhotoUpload()">
                                    <i class="fas fa-upload"></i> Загрузить
                                </button>
                            </div>
                            <small style="color: #718096;">Или оставьте пустым для автоматического аватара</small>
                        </div>
                        
                        <div id="photo-preview" style="margin-top: 10px; display: none;">
                            <div style="width: 100px; height: 100px; border-radius: 8px; overflow: hidden; border: 2px solid #e2e8f0;">
                                <img id="preview-image" src="" alt="Предпросмотр" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer" style="margin-top: 30px; display: flex; justify-content: space-between;">
                        <div>
                            <button type="button" class="btn btn-secondary cancel-btn">
                                Отмена
                            </button>
                            <button type="button" class="btn btn-outline" id="save-and-add">
                                <i class="fas fa-user-plus"></i> Сохранить и добавить ещё
                            </button>
                        </div>
                        <button type="submit" class="btn">
                            <i class="fas fa-check"></i> Сохранить и продолжить
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
            document.getElementById('builder-relation').disabled = true;
        }
        
        // Предпросмотр фото
        document.getElementById('builder-photo-url')?.addEventListener('input', function() {
            const url = this.value;
            const preview = document.getElementById('photo-preview');
            const img = document.getElementById('preview-image');
            
            if (url && url.startsWith('http')) {
                img.src = url;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        });
        
        // Обработка формы
        document.getElementById('add-person-builder-form')?.addEventListener('submit', function(e) {
            e.preventDefault();
            savePerson(false); // false - не добавлять ещё
        });
        
        // Кнопка "Сохранить и добавить ещё"
        document.getElementById('save-and-add')?.addEventListener('click', function() {
            savePerson(true); // true - добавить ещё
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
function savePerson(addAnother = false) {
    const person = {
        id: 'person_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        first_name: document.getElementById('builder-first-name').value.trim(),
        last_name: document.getElementById('builder-last-name').value.trim(),
        middle_name: document.getElementById('builder-middle-name').value.trim(),
        birth_date: document.getElementById('builder-birth-date').value || null,
        death_date: document.getElementById('builder-death-date').value || null,
        gender: document.getElementById('builder-gender').value,
        relation: document.getElementById('builder-relation').value,
        line: document.getElementById('builder-line').value,
        related_to: document.getElementById('builder-related-to').value || null,
        biography: document.getElementById('builder-bio').value.trim(),
        notes: document.getElementById('builder-notes').value.trim(),
        photo_url: document.getElementById('builder-photo-url').value.trim() || null,
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
    
    // Обновляем предпросмотр
    updateTreePreview();
    
    // Показываем уведомление
    window.showNotification(`✅ ${person.first_name} ${person.last_name} добавлен в древо`, 'success');
    
    // Закрываем модальное окно
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    // Если нужно добавить ещё
    if (addAnother) {
        setTimeout(() => addNewPerson(), 300);
    }
}

// Обновление предпросмотра дерева
function updateTreePreview() {
    const container = document.getElementById('tree-visualization-container');
    if (!container) return;
    
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
    
    // Сортируем людей по поколениям
    const peopleByGeneration = organizeByGenerations(window.treeData.people);
    
    let html = `<div class="tree-preview-container">
        <div class="preview-header">
            <h3>Предпросмотр дерева (${window.treeData.people.length} человек)</h3>
            <div class="preview-controls">
                <button class="btn btn-small" onclick="addNewPerson()">
                    <i class="fas fa-user-plus"></i> Добавить родственника
                </button>
                <button class="btn btn-small btn-success" onclick="buildFinalTree()" ${window.treeData.people.length < 2 ? 'disabled' : ''}>
                    <i class="fas fa-tree"></i> Автопостроение дерева
                </button>
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
                    ${person.middle_name ? `<br><small>${person.middle_name}</small>` : ''}
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
                <button class="btn-icon btn-danger" onclick="removePerson('${person.id}')" title="Удалить">
                    <i class="fas fa-trash"></i>
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
                        <span class="stat-value">${Object.keys(organizeByGenerations(window.treeData.people)).length}</span>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 8px;">
                    <h5 style="color: #4a5568; margin-bottom: 10px;">Следующие шаги:</h5>
                    <ul style="color: #718096; padding-left: 20px;">
                        <li>Добавьте родителей (отца и мать)</li>
                        <li>Добавьте бабушек и дедушек</li>
                        <li>Добавьте супруга/супругу</li>
                        <li>Добавьте детей</li>
                        <li>Нажмите "Автопостроение" когда готово</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>`;
    
    container.innerHTML = html;
    
    // Обновляем статистику
    updateTreeStats();
}

// Организация по поколениям
function organizeByGenerations(people) {
    const generations = {};
    
    people.forEach(person => {
        let generation = 0; // Центральное поколение
        
        switch(person.relation) {
            case 'self': generation = 0; break;
            case 'spouse': generation = 0; break;
            case 'father': case 'mother': generation = 1; break;
            case 'grandfather': case 'grandmother': generation = 2; break;
            case 'great_grandfather': case 'great_grandmother': generation = 3; break;
            case 'son': case 'daughter': generation = -1; break;
            case 'grandson': case 'granddaughter': generation = -2; break;
            case 'great_grandson': case 'great_granddaughter': generation = -3; break;
            case 'brother': case 'sister': generation = 0; break;
            case 'uncle': case 'aunt': generation = 1; break;
            case 'cousin': generation = 0; break;
            case 'nephew': case 'niece': generation = -1; break;
        }
        
        if (!generations[generation]) {
            generations[generation] = [];
        }
        generations[generation].push(person);
    });
    
    return generations;
}

// Финальное построение дерева
function buildFinalTree() {
    if (window.treeData.people.length < 2) {
        window.showNotification('Добавьте минимум 2 человека для построения дерева', 'error');
        return;
    }
    
    window.showLoader('Построение полного генеалогического древа...');
    
    setTimeout(() => {
        // Строим структуру дерева
        const structure = buildTreeStructureFromData();
        
        // Рендерим дерево
        renderFinalTree(structure);
        
        window.showNotification('✅ Генеалогическое древо успешно построено!', 'success');
        window.hideLoader();
    }, 1500);
}

// Построение структуры из данных
function buildTreeStructureFromData() {
    const structure = {
        self: null,
        spouse: null,
        parents: { father: null, mother: null },
        grandparents: { paternal: { grandfather: null, grandmother: null }, maternal: { grandfather: null, grandmother: null } },
        children: [],
        siblings: [],
        otherRelatives: []
    };
    
    // Находим центральную персону
    structure.self = window.treeData.people.find(p => p.relation === 'self') || window.treeData.people[0];
    
    // Находим супруга
    structure.spouse = window.treeData.people.find(p => p.relation === 'spouse');
    
    // Находим родителей
    structure.parents.father = window.treeData.people.find(p => p.relation === 'father');
    structure.parents.mother = window.treeData.people.find(p => p.relation === 'mother');
    
    // Находим бабушек и дедушек
    if (structure.parents.father) {
        structure.grandparents.paternal.grandfather = window.treeData.people.find(p => 
            p.relation === 'grandfather' && p.line === 'father');
        structure.grandparents.paternal.grandmother = window.treeData.people.find(p => 
            p.relation === 'grandmother' && p.line === 'father');
    }
    
    if (structure.parents.mother) {
        structure.grandparents.maternal.grandfather = window.treeData.people.find(p => 
            p.relation === 'grandfather' && p.line === 'mother');
        structure.grandparents.maternal.grandmother = window.treeData.people.find(p => 
            p.relation === 'grandmother' && p.line === 'mother');
    }
    
    // Находим детей
    structure.children = window.treeData.people.filter(p => 
        p.relation === 'son' || p.relation === 'daughter');
    
    // Находим братьев и сестер
    structure.siblings = window.treeData.people.filter(p => 
        p.relation === 'brother' || p.relation === 'sister');
    
    // Остальные родственники
    structure.otherRelatives = window.treeData.people.filter(p => 
        !structure.self || p.id !== structure.self.id &&
        !structure.spouse || p.id !== structure.spouse.id &&
        !structure.parents.father || p.id !== structure.parents.father.id &&
        !structure.parents.mother || p.id !== structure.parents.mother.id &&
        !structure.children.some(c => c.id === p.id) &&
        !structure.siblings.some(s => s.id === p.id)
    );
    
    return structure;
}

// Рендеринг финального дерева
function renderFinalTree(structure) {
    const container = document.getElementById('tree-visualization-container');
    if (!container) return;
    
    let html = `<div class="final-tree-container">
        <div class="tree-header">
            <h2>Генеалогическое древо семьи ${structure.self?.last_name || ''}</h2>
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
        
        <div class="tree-visualization">
            <!-- Поколение 3: Прабабушки/прадедушки -->
            ${renderGeneration3(structure)}
            
            <!-- Поколение 2: Бабушки/дедушки -->
            ${renderGeneration2(structure)}
            
            <!-- Поколение 1: Родители -->
            ${renderGeneration1(structure)}
            
            <!-- Поколение 0: Я и супруг -->
            ${renderGeneration0(structure)}
            
            <!-- Поколение -1: Дети -->
            ${renderGenerationMinus1(structure)}
            
            <!-- Поколение -2: Внуки -->
            ${renderGenerationMinus2(structure)}
        </div>
        
        <div class="tree-info-panel">
            <h3><i class="fas fa-info-circle"></i> Информация о дереве</h3>
            <div class="info-content">
                <p><strong>Центральная персона:</strong> ${structure.self?.first_name || ''} ${structure.self?.last_name || ''}</p>
                <p><strong>Всего родственников:</strong> ${window.treeData.people.length}</p>
                <p><strong>Дата построения:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                <p><strong>Поколений в дереве:</strong> ${calculateGenerationsCount(structure)}</p>
            </div>
        </div>
    </div>`;
    
    container.innerHTML = html;
}

// Вспомогательные функции рендеринга
function renderGeneration3(structure) {
    const paternalGF = structure.grandparents.paternal.grandfather;
    const paternalGM = structure.grandparents.paternal.grandmother;
    const maternalGF = structure.grandparents.maternal.grandfather;
    const maternalGM = structure.grandparents.maternal.grandmother;
    
    if (!paternalGF && !paternalGM && !maternalGF && !maternalGM) return '';
    
    return `<div class="tree-generation gen-3">
        <div class="gen-label">Прабабушки/прадедушки</div>
        <div class="gen-content">
            ${renderPersonBox(paternalGF, 'Прадедушка (по отцу)')}
            ${renderPersonBox(paternalGM, 'Прабабушка (по отцу)')}
            ${renderPersonBox(maternalGF, 'Прадедушка (по матери)')}
            ${renderPersonBox(maternalGM, 'Прабабушка (по матери)')}
        </div>
    </div>`;
}

function renderGeneration2(structure) {
    // Упрощенная версия для примера
    let html = '<div class="tree-generation gen-2"><div class="gen-label">Бабушки/дедушки</div><div class="gen-content">';
    
    // Поиск бабушек и дедушек по линиям
    window.treeData.people.forEach(person => {
        if (person.relation === 'grandfather' || person.relation === 'grandmother') {
            html += renderPersonBox(person, getRelationText(person.relation) + (person.line ? ` (${getLineText(person.line)})` : ''));
        }
    });
    
    html += '</div></div>';
    return html;
}

function renderGeneration1(structure) {
    let html = '<div class="tree-generation gen-1"><div class="gen-label">Родители</div><div class="gen-content">';
    
    if (structure.parents.father) {
        html += renderPersonBox(structure.parents.father, 'Отец');
    }
    if (structure.parents.mother) {
        html += renderPersonBox(structure.parents.mother, 'Мать');
    }
    
    // Братья и сестры
    if (structure.siblings.length > 0) {
        html += '<div class="siblings-container">';
        structure.siblings.forEach(sibling => {
            html += renderPersonBox(sibling, getRelationText(sibling.relation));
        });
        html += '</div>';
    }
    
    html += '</div></div>';
    return html;
}

function renderGeneration0(structure) {
    return `<div class="tree-generation gen-0 current">
        <div class="gen-label">Текущее поколение</div>
        <div class="gen-content center">
            <div class="couple-container">
                ${structure.self ? renderPersonBox(structure.self, 'Я', true) : ''}
                ${structure.spouse ? `<div class="spouse-connector">⚭</div>${renderPersonBox(structure.spouse, 'Супруг(а)')}` : ''}
            </div>
        </div>
    </div>`;
}

function renderGenerationMinus1(structure) {
    if (structure.children.length === 0) return '';
    
    return `<div class="tree-generation gen--1">
        <div class="gen-label">Дети</div>
        <div class="gen-content">
            ${structure.children.map(child => renderPersonBox(child, getRelationText(child.relation))).join('')}
        </div>
    </div>`;
}

function renderGenerationMinus2(structure) {
    // Поиск внуков
    const grandchildren = window.treeData.people.filter(p => 
        p.relation === 'grandson' || p.relation === 'granddaughter');
    
    if (grandchildren.length === 0) return '';
    
    return `<div class="tree-generation gen--2">
        <div class="gen-label">Внуки</div>
        <div class="gen-content">
            ${grandchildren.map(gc => renderPersonBox(gc, getRelationText(gc.relation))).join('')}
        </div>
    </div>`;
}

function renderPersonBox(person, title, isCenter = false) {
    if (!person) return '';
    
    return `<div class="tree-person-box ${person.gender} ${isCenter ? 'center-person' : ''}" onclick="showPersonDetails('${person.id}')">
        <div class="person-avatar">
            ${person.photo_url ? 
                `<img src="${person.photo_url}" alt="${person.first_name}" onerror="this.src='https://ui-avatars.com/api/?name=${person.first_name}+${person.last_name}&background=${person.gender === 'female' ? 'ed64a6' : '4299e1'}&color=fff'">` :
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
        'great_granddaughter': 'Правнучка',
        'uncle': 'Дядя',
        'aunt': 'Тетя',
        'cousin': 'Двоюродный брат/сестра',
        'nephew': 'Племянник',
        'niece': 'Племянница'
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
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function calculateGenerationsCount(structure) {
    let count = 1; // Центральное поколение
    
    if (structure.parents.father || structure.parents.mother) count++;
    if (structure.grandparents.paternal.grandfather || structure.grandparents.paternal.grandmother || 
        structure.grandparents.maternal.grandfather || structure.grandparents.maternal.grandmother) count++;
    if (structure.children.length > 0) count++;
    
    return count;
}

// Редактирование человека в билдере
function editPersonInBuilder(personId) {
    const person = window.treeData.people.find(p => p.id === personId);
    if (!person) return;
    
    // Заполняем форму редактирования
    showEditPersonModal(person);
}

function showEditPersonModal(person) {
    // Похоже на addNewPerson, но с заполненными данными
    // Для экономии времени пока просто удаляем и добавляем заново
    if (confirm(`Редактировать ${person.first_name} ${person.last_name}?`)) {
        // Удаляем старого
        window.treeData.people = window.treeData.people.filter(p => p.id !== person.id);
        // Обновляем предпросмотр
        updateTreePreview();
        // Открываем форму добавления с данными (упрощенно)
        addNewPerson();
    }
}

function removePerson(personId) {
    const person = window.treeData.people.find(p => p.id === personId);
    if (!person) return;
    
    if (confirm(`Удалить ${person.first_name} ${person.last_name} из дерева?`)) {
        window.treeData.people = window.treeData.people.filter(p => p.id !== personId);
        updateTreePreview();
        window.showNotification('Родственник удален из дерева', 'info');
    }
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
                
                ${person.notes ? `
                    <div>
                        <h4 style="margin-bottom: 10px; color: #4a5568;">Заметки:</h4>
                        <p style="color: #718096; line-height: 1.6;">${person.notes}</p>
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

// Экспортируем функции
window.startTreeBuilder = startTreeBuilder;
window.addNewPerson = addNewPerson;
window.buildFinalTree = buildFinalTree;
window.updateTreePreview = updateTreePreview;

console.log('✅ Tree Builder загружен');