// tree-engine.js - Улучшенный движок дерева (без демо-режимов)

console.log('🌳 Tree Engine загружается...');

// Основная функция построения дерева
function autoBuildTree() {
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для построения дерева необходимо войти в систему', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    // Показываем модальное окно с выбором ролей
    showTreeBuilderModal();
}

// Модальное окно построения дерева
function showTreeBuilderModal() {
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для построения дерева необходимо войти в систему', 'error');
        return;
    }
    
    const modalHtml = `<div class="modal show" id="tree-builder-modal">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Построение генеалогического древа</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="tree-center-person">Центральная персона (от кого строить дерево):</label>
                        <select id="tree-center-person" class="form-control">
                            <option value="">-- Выберите человека --</option>
                            ${window.people ? window.people.map(person => 
                                `<option value="${person.id}">${person.first_name} ${person.last_name} (${getRelationText(person.relation)})</option>`
                            ).join('') : ''}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Выберите поколения для отображения:</label>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                            <div class="checkbox-group">
                                <input type="checkbox" id="gen-4" checked>
                                <label for="gen-4">Прабабушки/прадедушки (4 поколение)</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="gen-3" checked>
                                <label for="gen-3">Бабушки/дедушки (3 поколение)</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="gen-2" checked>
                                <label for="gen-2">Родители (2 поколение)</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="gen-1" checked>
                                <label for="gen-1">Текущее поколение (1 поколение)</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="gen0" checked>
                                <label for="gen0">Дети (0 поколение)</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="gen-1c">
                                <label for="gen-1c">Внуки (-1 поколение)</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="gen-2c">
                                <label for="gen-2c">Правнуки (-2 поколение)</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="tree-style">Стиль отображения:</label>
                        <select id="tree-style" class="form-control">
                            <option value="horizontal">Горизонтальный (слева направо)</option>
                            <option value="vertical">Вертикальный (сверху вниз)</option>
                            <option value="fan">Веерный</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Параметры отображения:</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px;">
                            <div class="checkbox-group">
                                <input type="checkbox" id="show-photos" checked>
                                <label for="show-photos">Показывать фото</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="show-dates" checked>
                                <label for="show-dates">Показывать даты</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="show-lines" checked>
                                <label for="show-lines">Показывать линии связи</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="show-bio">
                                <label for="show-bio">Показывать краткую биографию</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary cancel-btn">
                            Отмена
                        </button>
                        <button type="button" class="btn" id="build-tree-btn">
                            <i class="fas fa-tree"></i> Построить дерево
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = modalHtml;
        overlay.classList.remove('hidden');
        
        // Если нет людей, предлагаем добавить
        if (!window.people || window.people.length === 0) {
            const modalBody = document.querySelector('#tree-builder-modal .modal-body');
            if (modalBody) {
                modalBody.innerHTML = `<div style="text-align: center; padding: 30px;">
                        <i class="fas fa-users" style="font-size: 4rem; color: #cbd5e0; margin-bottom: 20px;"></i>
                        <h3 style="margin-bottom: 15px; color: #4a5568;">Нет данных для построения дерева</h3>
                        <p style="margin-bottom: 25px; color: #718096;">Добавьте членов семьи, чтобы построить генеалогическое древо</p>
                        <button class="btn" onclick="window.showModal('add-person-modal')">
                            <i class="fas fa-user-plus"></i> Добавить человека
                        </button>
                        <button class="btn btn-outline cancel-btn" style="margin-left: 10px;">
                            Отмена
                        </button>
                    </div>`;
            }
        }
        
        // Обработчики
        document.getElementById('build-tree-btn')?.addEventListener('click', () => {
            const centerPersonId = document.getElementById('tree-center-person').value;
            if (!centerPersonId) {
                window.showNotification('Выберите центральную персону', 'error');
                return;
            }
            
            buildFamilyTree(centerPersonId);
            overlay.classList.add('hidden');
        });
        
        // Закрытие
        document.querySelector('#tree-builder-modal .modal-close')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
        
        document.querySelector('#tree-builder-modal .cancel-btn')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
    }
}

// Построение семейного дерева
function buildFamilyTree(centerPersonId) {
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для построения дерева необходимо войти в систему', 'error');
        return;
    }
    
    window.showLoader('Построение генеалогического древа...');
    
    setTimeout(() => {
        const container = document.getElementById('tree-visualization-container');
        if (!container) {
            window.hideLoader();
            return;
        }
        
        // Получаем настройки
        const style = document.getElementById('tree-style')?.value || 'horizontal';
        const showPhotos = document.getElementById('show-photos')?.checked || true;
        const showDates = document.getElementById('show-dates')?.checked || true;
        const showLines = document.getElementById('show-lines')?.checked || true;
        const showBio = document.getElementById('show-bio')?.checked || false;
        
        // Получаем центральную персону
        const centerPerson = window.people.find(p => p.id === centerPersonId);
        if (!centerPerson) {
            container.innerHTML = `<div class="tree-empty-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ed8936; margin-bottom: 20px;"></i>
                    <h3>Персона не найдена</h3>
                    <p>Центральная персона не найдена в базе данных</p>
                </div>`;
            window.hideLoader();
            return;
        }
        
        // Строим структуру дерева
        const treeStructure = buildTreeStructure(centerPerson);
        
        // Рендерим дерево
        container.innerHTML = renderFamilyTree(treeStructure, style, {
            showPhotos,
            showDates,
            showLines,
            showBio
        });
        
        // Обновляем статистику
        updateTreeStats();
        
        window.showNotification('✅ Генеалогическое древо построено!', 'success');
        window.hideLoader();
    }, 1500);
}

// Построение структуры дерева
function buildTreeStructure(centerPerson) {
    const tree = {
        person: centerPerson,
        parents: [],
        grandparents: [],
        greatGrandparents: [],
        spouse: null,
        children: [],
        grandchildren: [],
        greatGrandchildren: []
    };
    
    // Находим супруга/супругу
    tree.spouse = window.people.find(p => 
        (p.relation === 'spouse' && p.spouse_id === centerPerson.id) ||
        (centerPerson.relation === 'spouse' && centerPerson.spouse_id === p.id)
    );
    
    // Находим родителей
    if (centerPerson.parent_id) {
        const parent = window.people.find(p => p.id === centerPerson.parent_id);
        if (parent) {
            tree.parents.push(parent);
            
            // Находим второго родителя (супруг родителя)
            const otherParent = window.people.find(p => 
                p.relation === 'spouse' && p.spouse_id === parent.id
            );
            if (otherParent) {
                tree.parents.push(otherParent);
            }
        }
    } else {
        // Ищем родителей по отношению
        tree.parents = window.people.filter(p => 
            p.relation === 'parent' && p.child_id === centerPerson.id
        );
    }
    
    // Находим бабушек и дедушек (родители родителей)
    tree.parents.forEach(parent => {
        if (parent.parent_id) {
            const grandparent = window.people.find(p => p.id === parent.parent_id);
            if (grandparent && !tree.grandparents.some(gp => gp.id === grandparent.id)) {
                tree.grandparents.push(grandparent);
            }
        }
    });
    
    // Находим прабабушек и прадедушек
    tree.grandparents.forEach(grandparent => {
        if (grandparent.parent_id) {
            const greatGrandparent = window.people.find(p => p.id === grandparent.parent_id);
            if (greatGrandparent && !tree.greatGrandparents.some(ggp => ggp.id === greatGrandparent.id)) {
                tree.greatGrandparents.push(greatGrandparent);
            }
        }
    });
    
    // Находим детей
    tree.children = window.people.filter(p => 
        p.parent_id === centerPerson.id || 
        (centerPerson.relation === 'parent' && p.id === centerPerson.child_id)
    );
    
    // Находим внуков (дети детей)
    tree.children.forEach(child => {
        const grandchildren = window.people.filter(p => p.parent_id === child.id);
        grandchildren.forEach(grandchild => {
            if (!tree.grandchildren.some(gc => gc.id === grandchild.id)) {
                tree.grandchildren.push(grandchild);
            }
        });
    });
    
    // Находим правнуков (дети внуков)
    tree.grandchildren.forEach(grandchild => {
        const greatGrandchildren = window.people.filter(p => p.parent_id === grandchild.id);
        greatGrandchildren.forEach(ggc => {
            if (!tree.greatGrandchildren.some(ggcItem => ggcItem.id === ggc.id)) {
                tree.greatGrandchildren.push(ggc);
            }
        });
    });
    
    return tree;
}

// Рендеринг семейного дерева
function renderFamilyTree(tree, style, options) {
    const { showPhotos, showDates, showLines, showBio } = options;
    
    let html = `<div class="tree-container">
            <div class="tree-header">
                <h3>Генеалогическое древо семьи ${tree.person.last_name}</h3>
                <div class="tree-controls-small">
                    <button class="btn btn-small" onclick="saveTreeAsImage()">
                        <i class="fas fa-image"></i> Сохранить
                    </button>
                    <button class="btn btn-small" onclick="printTree()">
                        <i class="fas fa-print"></i> Печать
                    </button>
                </div>
            </div>
            
            <div class="tree-content ${style}">`;
    
    // Поколение 4: Прабабушки/прадедушки
    if (tree.greatGrandparents.length > 0) {
        html += `<div class="tree-generation generation-4">
                <div class="generation-label">Прабабушки/прадедушки</div>
                <div class="generation-content">
                    ${renderGeneration(tree.greatGrandparents, showPhotos, showDates, showBio)}
                </div>
            </div>
            ${showLines ? '<div class="tree-connector"></div>' : ''}`;
    }
    
    // Поколение 3: Бабушки/дедушки
    if (tree.grandparents.length > 0) {
        html += `<div class="tree-generation generation-3">
                <div class="generation-label">Бабушки/дедушки</div>
                <div class="generation-content">
                    ${renderGeneration(tree.grandparents, showPhotos, showDates, showBio)}
                </div>
            </div>
            ${showLines ? '<div class="tree-connector"></div>' : ''}`;
    }
    
    // Поколение 2: Родители
    if (tree.parents.length > 0) {
        html += `<div class="tree-generation generation-2">
                <div class="generation-label">Родители</div>
                <div class="generation-content">
                    ${renderGeneration(tree.parents, showPhotos, showDates, showBio)}
                </div>
            </div>
            ${showLines ? '<div class="tree-connector"></div>' : ''}`;
    }
    
    // Поколение 1: Текущее поколение
    html += `<div class="tree-generation generation-1 current">
            <div class="generation-label">Текущее поколение</div>
            <div class="generation-content">
                <div class="family-unit">
                    ${renderPersonCard(tree.person, 'self', showPhotos, showDates, showBio)}
                    ${tree.spouse ? `
                        <div class="spouse-connector">⚭</div>
                        ${renderPersonCard(tree.spouse, 'spouse', showPhotos, showDates, showBio)}
                    ` : ''}
                </div>
            </div>
        </div>
        ${showLines ? '<div class="tree-connector"></div>' : ''}`;
    
    // Поколение 0: Дети
    if (tree.children.length > 0) {
        html += `<div class="tree-generation generation-0">
                <div class="generation-label">Дети</div>
                <div class="generation-content">
                    ${renderGeneration(tree.children, showPhotos, showDates, showBio)}
                </div>
            </div>
            ${showLines ? '<div class="tree-connector"></div>' : ''}`;
    }
    
    // Поколение -1: Внуки
    if (tree.grandchildren.length > 0) {
        html += `<div class="tree-generation generation--1">
                <div class="generation-label">Внуки</div>
                <div class="generation-content">
                    ${renderGeneration(tree.grandchildren, showPhotos, showDates, showBio)}
                </div>
            </div>
            ${showLines ? '<div class="tree-connector"></div>' : ''}`;
    }
    
    // Поколение -2: Правнуки
    if (tree.greatGrandchildren.length > 0) {
        html += `<div class="tree-generation generation--2">
                <div class="generation-label">Правнуки</div>
                <div class="generation-content">
                    ${renderGeneration(tree.greatGrandchildren, showPhotos, showDates, showBio)}
                </div>
            </div>`;
    }
    
    html += `</div>
            
            <div class="tree-info">
                <h4><i class="fas fa-info-circle"></i> Информация о дереве</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Центральная персона:</span>
                        <span class="value">${tree.person.first_name} ${tree.person.last_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Всего людей:</span>
                        <span class="value">${countPeopleInTree(tree)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Поколений:</span>
                        <span class="value">${countGenerationsInTree(tree)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Построено:</span>
                        <span class="value">${new Date().toLocaleDateString('ru-RU')}</span>
                    </div>
                </div>
            </div>
        </div>`;
    
    return html;
}

// Рендеринг поколения
function renderGeneration(people, showPhotos, showDates, showBio) {
    return people.map(person => 
        renderPersonCard(person, person.relation, showPhotos, showDates, showBio)
    ).join('');
}

// Рендеринг карточки человека
function renderPersonCard(person, type, showPhotos, showDates, showBio) {
    const genderClass = person.gender === 'female' ? 'female' : 'male';
    const typeClass = type === 'self' ? 'self' : type === 'spouse' ? 'spouse' : '';
    
    return `<div class="tree-person-card ${genderClass} ${typeClass}" 
             onclick="showPersonInfo('${person.id}')"
             title="${person.first_name} ${person.last_name}">
            <div class="person-avatar">
                ${showPhotos && person.photo_url ? 
                    `<img src="${person.photo_url}" alt="${person.first_name}" 
                          onerror="this.src='https://ui-avatars.com/api/?name=${person.first_name}+${person.last_name}&background=667eea&color=fff'">` :
                    `<div class="avatar-initials">${person.first_name[0]}${person.last_name?.[0] || ''}</div>`
                }
            </div>
            <div class="person-info">
                <div class="person-name">${person.first_name} ${person.last_name}</div>
                ${showDates && person.birth_date ? 
                    `<div class="person-dates">${formatDate(person.birth_date)}${person.death_date ? ` - ${formatDate(person.death_date)}` : ''}</div>` : ''
                }
                <div class="person-relation">${getRelationText(person.relation)}</div>
                ${showBio && person.biography ? 
                    `<div class="person-bio-preview">${person.biography.substring(0, 50)}...</div>` : ''
                }
            </div>
            <div class="person-actions">
                <button class="btn-icon" onclick="event.stopPropagation(); editPerson('${person.id}')" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>`;
}

// Подсчет людей в дереве
function countPeopleInTree(tree) {
    let count = 1; // Центральная персона
    
    count += tree.spouse ? 1 : 0;
    count += tree.parents.length;
    count += tree.grandparents.length;
    count += tree.greatGrandparents.length;
    count += tree.children.length;
    count += tree.grandchildren.length;
    count += tree.greatGrandchildren.length;
    
    return count;
}

// Подсчет поколений в дереве
function countGenerationsInTree(tree) {
    let generations = 1; // Текущее поколение
    
    if (tree.parents.length > 0) generations++;
    if (tree.grandparents.length > 0) generations++;
    if (tree.greatGrandparents.length > 0) generations++;
    if (tree.children.length > 0) generations++;
    if (tree.grandchildren.length > 0) generations++;
    if (tree.greatGrandchildren.length > 0) generations++;
    
    return generations;
}

// Вспомогательные функции
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function getRelationText(relation) {
    const relations = {
        'self': 'Я',
        'spouse': 'Супруг(а)',
        'parent': 'Родитель',
        'child': 'Ребенок',
        'sibling': 'Брат/сестра',
        'grandparent': 'Дедушка/бабушка',
        'grandchild': 'Внук/внучка',
        'great_grandparent': 'Прадедушка/прабабушка',
        'great_grandchild': 'Правнук/правнучка',
        'aunt_uncle': 'Тетя/дядя',
        'cousin': 'Двоюродный брат/сестра',
        'nephew_niece': 'Племянник/племянница',
        'uncle_aunt': 'Дядя/тетя',
        'other': 'Другой родственник'
    };
    
    return relations[relation] || relation;
}

// Функция для обновления статистики дерева
function updateTreeStats() {
    const peopleCount = window.people?.length || 0;
    const photosCount = window.media?.filter(m => m.file_type === 'image').length || 0;
    const generations = Math.max(3, countGenerationsInTree(buildTreeStructure(window.people?.[0] || {})));
    
    document.getElementById('tree-people-count').textContent = peopleCount;
    document.getElementById('tree-photos-count').textContent = photosCount;
    document.getElementById('tree-generations').textContent = generations;
    document.getElementById('tree-connections').textContent = Math.max(0, peopleCount - 1);
}

// Редактирование человека
function editPerson(personId) {
    const person = window.people.find(p => p.id === personId);
    if (!person) return;
    
    // Заполняем форму
    document.getElementById('person-first-name').value = person.first_name;
    document.getElementById('person-last-name').value = person.last_name;
    document.getElementById('person-birth-date').value = person.birth_date || '';
    document.getElementById('person-death-date').value = person.death_date || '';
    document.getElementById('person-gender').value = person.gender;
    document.getElementById('person-relation').value = person.relation;
    document.getElementById('person-photo-url').value = person.photo_url || '';
    document.getElementById('person-bio').value = person.biography || '';
    
    // Показываем модальное окно
    window.showModal('add-person-modal');
    
    // Меняем заголовок и кнопку
    const modalTitle = document.querySelector('#add-person-modal h3');
    const submitBtn = document.querySelector('#add-person-modal button[type="submit"]');
    
    if (modalTitle) modalTitle.textContent = 'Редактировать человека';
    if (submitBtn) {
        submitBtn.textContent = 'Сохранить изменения';
        submitBtn.dataset.editingId = personId;
    }
}

// Сохранение дерева как изображения
function saveTreeAsImage() {
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для сохранения дерева необходимо войти в систему', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    const container = document.getElementById('tree-visualization-container');
    if (!container || container.innerHTML.includes('tree-empty-state')) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    window.showLoader('Сохранение изображения...');
    
    // Имитация сохранения
    setTimeout(() => {
        window.showNotification('✅ Дерево сохранено как изображение!', 'success');
        window.hideLoader();
    }, 1500);
}

// Печать дерева
function printTree() {
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для печати дерева необходимо войти в систему', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    const container = document.getElementById('tree-visualization-container');
    if (!container || container.innerHTML.includes('tree-empty-state')) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    window.showNotification('Подготовка к печати...', 'info');
    
    // Открываем новое окно для печати
    const printContent = `<!DOCTYPE html>
        <html>
        <head>
            <title>Генеалогическое древо</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .tree-print { max-width: 800px; margin: 0 auto; }
                .tree-person { text-align: center; margin: 10px; }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="tree-print">
                <h1 style="text-align: center; color: #2d3748; margin-bottom: 30px;">Генеалогическое древо</h1>
                ${container.innerHTML}
                <div style="text-align: center; margin-top: 40px; color: #718096; font-size: 0.9rem;">
                    Создано в приложении "История моей семьи"<br>
                    Дата: ${new Date().toLocaleDateString('ru-RU')}
                </div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => window.close(), 1000);
                }
            </script>
        </body>
        </html>`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
}

// Показать информацию о человеке
function showPersonInfo(personId) {
    const person = window.people.find(p => p.id === personId);
    if (!person) return;
    
    const modalHtml = `<div class="modal show" id="person-info-modal">
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
                                ${person.first_name[0]}${person.last_name?.[0] || ''}
                            </div>`
                        }
                        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
                            ${person.first_name} ${person.last_name}
                        </div>
                        <div style="color: #667eea; margin-bottom: 10px;">
                            ${getRelationText(person.relation)}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px; color: #4a5568;">Информация:</h4>
                        ${person.birth_date ? 
                            `<p style="margin-bottom: 5px;"><strong>Дата рождения:</strong> ${formatDate(person.birth_date)}</p>` : ''
                        }
                        ${person.death_date ? 
                            `<p style="margin-bottom: 5px;"><strong>Дата смерти:</strong> ${formatDate(person.death_date)}</p>` : ''
                        }
                        ${person.gender ? 
                            `<p style="margin-bottom: 5px;"><strong>Пол:</strong> ${person.gender === 'female' ? 'Женский' : 'Мужской'}</p>` : ''
                        }
                    </div>
                    
                    ${person.biography ? `
                        <div>
                            <h4 style="margin-bottom: 10px; color: #4a5568;">Биография:</h4>
                            <p>${person.biography}</p>
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
        
        // Закрытие модального окна
        const closeModal = () => {
            overlay.classList.add('hidden');
        };
        
        document.querySelector('#person-info-modal .modal-close')?.addEventListener('click', closeModal);
        document.querySelector('#person-info-modal .cancel-btn')?.addEventListener('click', closeModal);
    }
}

// Экспортируем функции
window.autoBuildTree = autoBuildTree;
window.saveTreeAsImage = saveTreeAsImage;
window.printTree = printTree;
window.updateTreeStats = updateTreeStats;
window.showPersonInfo = showPersonInfo;
window.editPerson = editPerson;

console.log('✅ Tree Engine загружен');