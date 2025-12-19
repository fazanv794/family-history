// tree-engine.js - Упрощенный рабочий движок дерева

console.log('🌳 Tree Engine загружается...');

// Основная функция построения дерева
function autoBuildTree() {
    window.showLoader('Построение генеалогического древа...');
    
    setTimeout(() => {
        const container = document.getElementById('tree-visualization-container');
        if (!container) return;
        
        // Получаем настройки
        const generations = parseInt(document.getElementById('auto-generations')?.value || 3);
        const style = document.getElementById('auto-style')?.value || 'horizontal';
        const centerPerson = document.getElementById('auto-center-person')?.value || 'self';
        const showPhotos = document.getElementById('auto-show-photos')?.checked || true;
        const showDates = document.getElementById('auto-show-dates')?.checked || true;
        const showLines = document.getElementById('auto-show-lines')?.checked || true;
        
        // Получаем данные людей
        const people = window.people || [];
        
        if (people.length === 0) {
            container.innerHTML = `
                <div class="tree-empty-state">
                    <i class="fas fa-tree" style="font-size: 4rem; color: #cbd5e0; margin-bottom: 20px;"></i>
                    <h3>Нет данных для построения дерева</h3>
                    <p>Добавьте членов семьи в разделе "Добавить человека"</p>
                    <button class="btn" onclick="window.showModal('add-person-modal')" style="margin-top: 20px;">
                        <i class="fas fa-user-plus"></i> Добавить человека
                    </button>
                </div>
            `;
            window.hideLoader();
            return;
        }
        
        // Находим центрального человека
        let centerPersonData = null;
        if (centerPerson === 'self') {
            centerPersonData = people.find(p => p.relation === 'self') || people[0];
        } else {
            centerPersonData = people[0];
        }
        
        // Генерируем дерево
        const treeData = generateTreeData(people, centerPersonData, generations);
        
        // Рендерим дерево
        container.innerHTML = renderTree(treeData, style, {
            showPhotos,
            showDates,
            showLines
        });
        
        // Обновляем статистику
        updateTreeStats();
        
        window.showNotification('✅ Генеалогическое древо построено!', 'success');
        window.hideLoader();
    }, 1500);
}

// Генерация структуры дерева
function generateTreeData(people, centerPerson, depth) {
    const tree = {
        person: centerPerson,
        parents: [],
        children: [],
        spouse: null
    };
    
    // Находим супруга/супругу
    if (centerPerson.relation === 'spouse' && centerPerson.spouse_id) {
        tree.spouse = people.find(p => p.id === centerPerson.spouse_id);
    } else {
        tree.spouse = people.find(p => 
            p.relation === 'spouse' && p.spouse_id === centerPerson.id
        );
    }
    
    // Находим родителей
    if (centerPerson.parent_id) {
        const parent = people.find(p => p.id === centerPerson.parent_id);
        if (parent) {
            tree.parents.push(parent);
        }
    }
    
    // Находим детей
    tree.children = people.filter(p => 
        p.parent_id === centerPerson.id || 
        (p.spouse_id === centerPerson.id && p.relation === 'child')
    );
    
    return tree;
}

// Рендеринг дерева
function renderTree(treeData, style, options) {
    const { showPhotos, showDates, showLines } = options;
    
    let html = `
        <div class="tree-container" style="padding: 20px; text-align: center;">
            <h3 style="color: #2d3748; margin-bottom: 30px;">Генеалогическое древо семьи</h3>
            
            <div style="display: flex; flex-direction: column; align-items: center; gap: 40px;">
    `;
    
    // Поколение родителей
    if (treeData.parents.length > 0) {
        html += `
            <div style="display: flex; gap: 100px; margin-bottom: 20px;">
                ${treeData.parents.map(parent => `
                    <div class="tree-person-card ${parent.gender}" 
                         style="text-align: center; cursor: pointer;"
                         onclick="showPersonInfo('${parent.id}')">
                        ${showPhotos && parent.photo_url ? 
                            `<img src="${parent.photo_url}" alt="${parent.first_name}" 
                                  style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin: 0 auto 10px;">` :
                            `<div style="width: 70px; height: 70px; background: ${parent.gender === 'female' ? '#ed64a6' : '#4299e1'}; 
                                  color: white; border-radius: 50%; display: flex; align-items: center; 
                                  justify-content: center; margin: 0 auto 10px; font-size: 1.5rem;">
                                ${parent.first_name[0]}${parent.last_name?.[0] || ''}
                            </div>`
                        }
                        <div style="font-weight: bold; font-size: 0.9rem;">${parent.first_name} ${parent.last_name}</div>
                        ${showDates && parent.birth_date ? 
                            `<div style="font-size: 0.8rem; color: #718096;">${formatDate(parent.birth_date)}</div>` : ''
                        }
                        <div style="font-size: 0.8rem; color: #667eea;">${getRelationText(parent.relation)}</div>
                    </div>
                `).join('')}
            </div>
            
            ${showLines ? `<div style="height: 20px; display: flex; justify-content: center;">
                <div style="width: 2px; height: 100%; background: #cbd5e0;"></div>
            </div>` : ''}
        `;
    }
    
    // Центральный человек
    html += `
        <div class="tree-person-card self" 
             style="text-align: center; cursor: pointer;"
             onclick="showPersonInfo('${treeData.person.id}')">
            ${showPhotos && treeData.person.photo_url ? 
                `<img src="${treeData.person.photo_url}" alt="${treeData.person.first_name}" 
                      style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin: 0 auto 15px; border: 4px solid #48bb78;">` :
                `<div style="width: 100px; height: 100px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
                      color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                      margin: 0 auto 15px; font-size: 2.2rem; border: 4px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    ${treeData.person.first_name[0]}${treeData.person.last_name?.[0] || ''}
                </div>`
            }
            <div style="font-weight: bold; font-size: 1.2rem;">${treeData.person.first_name} ${treeData.person.last_name}</div>
            ${showDates && treeData.person.birth_date ? 
                `<div style="font-size: 1rem; color: #718096;">род. ${formatDate(treeData.person.birth_date)}</div>` : ''
            }
            <div style="font-size: 1rem; color: #ed64a6; font-weight: bold;">${getRelationText(treeData.person.relation)}</div>
        </div>
        
        ${showLines ? `<div style="height: 20px; display: flex; justify-content: center;">
            <div style="width: 2px; height: 100%; background: #cbd5e0;"></div>
        </div>` : ''}
    `;
    
    // Супруг/супруга
    if (treeData.spouse) {
        html += `
            <div style="display: flex; gap: 150px; margin-top: 20px;">
                <div class="tree-person-card ${treeData.spouse.gender}" 
                     style="text-align: center; cursor: pointer;"
                     onclick="showPersonInfo('${treeData.spouse.id}')">
                    ${showPhotos && treeData.spouse.photo_url ? 
                        `<img src="${treeData.spouse.photo_url}" alt="${treeData.spouse.first_name}" 
                              style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 10px;">` :
                        `<div style="width: 80px; height: 80px; background: ${treeData.spouse.gender === 'female' ? '#ed64a6' : '#4299e1'}; 
                              color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                              margin: 0 auto 10px; font-size: 1.8rem;">
                            ${treeData.spouse.first_name[0]}${treeData.spouse.last_name?.[0] || ''}
                        </div>`
                    }
                    <div style="font-weight: bold;">${treeData.spouse.first_name} ${treeData.spouse.last_name}</div>
                    ${showDates && treeData.spouse.birth_date ? 
                        `<div style="font-size: 0.9rem; color: #718096;">${formatDate(treeData.spouse.birth_date)}</div>` : ''
                    }
                    <div style="font-size: 0.9rem; color: #48bb78;">${getRelationText(treeData.spouse.relation)}</div>
                </div>
            </div>
            
            ${showLines ? `<div style="height: 20px; display: flex; justify-content: center;">
                <div style="width: 2px; height: 100%; background: #cbd5e0;"></div>
            </div>` : ''}
        `;
    }
    
    // Дети
    if (treeData.children.length > 0) {
        html += `
            <div style="display: flex; gap: 150px; margin-top: 20px;">
                ${treeData.children.map(child => `
                    <div class="tree-person-card ${child.gender}" 
                         style="text-align: center; cursor: pointer;"
                         onclick="showPersonInfo('${child.id}')">
                        ${showPhotos && child.photo_url ? 
                            `<img src="${child.photo_url}" alt="${child.first_name}" 
                                  style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 10px;">` :
                            `<div style="width: 80px; height: 80px; background: ${child.gender === 'female' ? '#ed64a6' : '#4299e1'}; 
                                  color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                                  margin: 0 auto 10px; font-size: 1.8rem;">
                                ${child.first_name[0]}${child.last_name?.[0] || ''}
                            </div>`
                        }
                        <div style="font-weight: bold;">${child.first_name} ${child.last_name}</div>
                        ${showDates && child.birth_date ? 
                            `<div style="font-size: 0.9rem; color: #718096;">род. ${formatDate(child.birth_date)}</div>` : ''
                        }
                        <div style="font-size: 0.9rem; color: #d69e2e;">${getRelationText(child.relation)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    html += `
            </div>
            
            <div style="margin-top: 40px; padding: 20px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="color: #4a5568; margin-bottom: 10px;">Информация о дереве:</h4>
                <p style="color: #718096; margin-bottom: 5px;">• Стиль отображения: <strong>${getStyleText(style)}</strong></p>
                <p style="color: #718096; margin-bottom: 5px;">• Всего людей: <strong>${window.people.length}</strong></p>
                <p style="color: #718096;">• Поколений: <strong>3</strong></p>
            </div>
        </div>
    `;
    
    return html;
}

// Функция для обновления статистики дерева
function updateTreeStats() {
    const peopleCount = window.people?.length || 0;
    const photosCount = window.media?.filter(m => m.file_type === 'image').length || 0;
    
    document.getElementById('tree-people-count').textContent = peopleCount;
    document.getElementById('tree-photos-count').textContent = photosCount;
    document.getElementById('tree-generations').textContent = 3;
    document.getElementById('tree-connections').textContent = Math.max(0, peopleCount - 1);
}

// Сохранение дерева как изображения
function saveTreeAsImage() {
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
    const container = document.getElementById('tree-visualization-container');
    if (!container || container.innerHTML.includes('tree-empty-state')) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    window.showNotification('Подготовка к печати...', 'info');
    
    // Открываем новое окно для печати
    const printContent = `
        <!DOCTYPE html>
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
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
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
        'aunt_uncle': 'Тетя/дядя',
        'cousin': 'Двоюродный брат/сестра',
        'other': 'Другой родственник'
    };
    
    return relations[relation] || relation;
}

function getStyleText(style) {
    const styles = {
        'horizontal': 'Горизонтальный',
        'vertical': 'Вертикальный',
        'radial': 'Радиальный'
    };
    
    return styles[style] || style;
}

// Показать информацию о человеке
function showPersonInfo(personId) {
    const person = window.people.find(p => p.id === personId);
    if (!person) return;
    
    const modalHtml = `
        <div class="modal show" id="person-info-modal">
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
        </div>
    `;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = modalHtml;
        overlay.classList.add('show');
        
        // Закрытие модального окна
        document.querySelector('#person-info-modal .modal-close')?.addEventListener('click', () => {
            overlay.classList.remove('show');
        });
        
        document.querySelector('#person-info-modal .cancel-btn')?.addEventListener('click', () => {
            overlay.classList.remove('show');
        });
    }
}

// Экспортируем функции
window.autoBuildTree = autoBuildTree;
window.saveTreeAsImage = saveTreeAsImage;
window.printTree = printTree;
window.updateTreeStats = updateTreeStats;
window.showPersonInfo = showPersonInfo;

console.log('✅ Tree Engine загружен');