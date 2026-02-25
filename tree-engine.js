// tree-engine.js - Движок для работы с уже построенным деревом

console.log('🌳 Tree Engine загружается...');

// Функции для работы с построенным деревом
function saveTreeAsImage() {
    // Проверка авторизации
    if (!window.currentUser && !window.treeData?.relatives?.length) {
        window.showNotification('Для сохранения дерева сначала постройте дерево', 'error');
        return;
    }
    
    const container = document.getElementById('tree-visualization-container');
    if (!container || container.innerHTML.includes('tree-empty-state')) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    window.showLoader('Сохранение изображения...');
    
    try {
        // Используем html2canvas для создания изображения
        if (typeof html2canvas === 'undefined') {
            // Динамически загружаем библиотеку
            const script = document.createElement('script');
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            script.onload = () => {
                generateTreeImage();
            };
            script.onerror = () => {
                fallbackSaveTreeAsImage();
            };
            document.head.appendChild(script);
        } else {
            generateTreeImage();
        }
    } catch (error) {
        console.error('Ошибка сохранения изображения:', error);
        fallbackSaveTreeAsImage();
    }
}

function generateTreeImage() {
    const container = document.getElementById('tree-visualization-container');
    
    html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.download = `family-tree-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        window.showNotification('✅ Дерево сохранено как изображение!', 'success');
        window.hideLoader();
    }).catch(error => {
        console.error('Ошибка html2canvas:', error);
        fallbackSaveTreeAsImage();
    });
}

function fallbackSaveTreeAsImage() {
    // Альтернативный метод сохранения
    const container = document.getElementById('tree-visualization-container');
    const treeName = window.treeData?.name || 'Мое семейное дерево';
    const relativesCount = window.treeData?.relatives?.length || 0;
    
    // Создаем простой текстовый файл с информацией о дереве
    let treeText = `Генеалогическое дерево: ${treeName}\n`;
    treeText += `Дата сохранения: ${new Date().toLocaleDateString('ru-RU')}\n`;
    treeText += `Количество родственников: ${relativesCount}\n\n`;
    
    if (window.treeData?.relatives) {
        treeText += "Список родственников:\n";
        window.treeData.relatives.forEach((person, index) => {
            treeText += `${index + 1}. ${person.firstName} ${person.lastName}\n`;
            treeText += `   Отношение: ${getRelationText(person.relation)}\n`;
            treeText += `   Пол: ${person.gender === 'male' ? 'Мужской' : 'Женский'}\n`;
            if (person.birthDate) {
                treeText += `   Дата рождения: ${person.birthDate}\n`;
            }
            treeText += '\n';
        });
    }
    
    const blob = new Blob([treeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-tree-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    window.showNotification('✅ Информация о дереве сохранена в файл!', 'success');
    window.hideLoader();
}

function printTree() {
    // Проверка авторизации
    if (!window.currentUser && !window.treeData?.relatives?.length) {
        window.showNotification('Для печати дерева сначала постройте дерево', 'error');
        return;
    }
    
    const container = document.getElementById('tree-visualization-container');
    if (!container || container.innerHTML.includes('tree-empty-state')) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    window.showNotification('Подготовка к печати...', 'info');
    
    const treeName = window.treeData?.name || 'Генеалогическое древо';
    const relativesCount = window.treeData?.relatives?.length || 0;
    const createdDate = window.treeData?.created ? 
        new Date(window.treeData.created).toLocaleDateString('ru-RU') : 
        new Date().toLocaleDateString('ru-RU');
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${treeName}</title>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: #333;
                    line-height: 1.6;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #2d3748;
                }
                
                .print-header h1 {
                    color: #2d3748;
                    margin-bottom: 10px;
                    font-size: 24px;
                }
                
                .print-meta {
                    color: #718096;
                    font-size: 14px;
                    margin-bottom: 20px;
                }
                
                .tree-print-container {
                    margin: 20px 0;
                }
                
                .generation {
                    margin-bottom: 30px;
                }
                
                .generation-title {
                    color: #4a5568;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    padding-bottom: 5px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .person-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin-bottom: 15px;
                    justify-content: center;
                }
                
                .person-print-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 15px;
                    width: 180px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                
                .person-print-card.male {
                    border-left: 4px solid #4299e1;
                }
                
                .person-print-card.female {
                    border-left: 4px solid #ed64a6;
                }
                
                .person-print-card.self {
                    border-left: 4px solid #48bb78;
                    font-weight: 600;
                }
                
                .person-initials {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 18px;
                    color: white;
                    margin: 0 auto 10px;
                }
                
                .person-initials.male {
                    background: #4299e1;
                }
                
                .person-initials.female {
                    background: #ed64a6;
                }
                
                .person-initials.self {
                    background: #48bb78;
                }
                
                .person-name {
                    font-weight: 500;
                    margin-bottom: 5px;
                }
                
                .person-relation {
                    font-size: 12px;
                    color: #667eea;
                    margin-bottom: 5px;
                }
                
                .person-date {
                    font-size: 11px;
                    color: #718096;
                }
                
                .print-footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    color: #718096;
                    font-size: 12px;
                }
                
                @media print {
                    body {
                        padding: 10px;
                    }
                    
                    .print-header h1 {
                        font-size: 20px;
                    }
                    
                    .person-print-card {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>${treeName}</h1>
                <div class="print-meta">
                    <div>Всего родственников: ${relativesCount}</div>
                    <div>Дата создания: ${createdDate}</div>
                    <div>Дата печати: ${new Date().toLocaleDateString('ru-RU')}</div>
                </div>
            </div>
            
            <div class="tree-print-container">
                ${generatePrintableTree()}
            </div>
            
            <div class="print-footer">
                <p>Создано в приложении "История моей семьи"</p>
                <p>© ${new Date().getFullYear()} История моей семьи. Все права защищены.</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => {
                        if (window.history.length > 1) {
                            window.close();
                        }
                    }, 1000);
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

function generatePrintableTree() {
    const treeRelatives = window.treeData?.relatives || [];
    if (treeRelatives.length === 0) {
        return '<p style="text-align: center; color: #718096; padding: 40px;">Дерево пока не создано</p>';
    }
    
    // Группируем родственников
    const selfPerson = treeRelatives.find(p => p.relation === 'self');
    const parents = treeRelatives.filter(p => p.relation === 'father' || p.relation === 'mother');
    const spouse = treeRelatives.find(p => p.relation === 'spouse' || p.relation === 'partner');
    const children = treeRelatives.filter(p => p.relation === 'son' || p.relation === 'daughter');
    const siblings = treeRelatives.filter(p => p.relation === 'brother' || p.relation === 'sister');
    const others = treeRelatives.filter(p => 
        !['self', 'father', 'mother', 'spouse', 'partner', 'son', 'daughter', 'brother', 'sister'].includes(p.relation)
    );
    
    let html = '';
    
    // Поколение родителей
    if (parents.length > 0) {
        html += '<div class="generation">';
        html += '<div class="generation-title">Родители</div>';
        html += '<div class="person-row">';
        parents.forEach(parent => {
            html += createPrintablePersonCard(parent);
        });
        html += '</div>';
        html += '</div>';
    }
    
    // Центральное поколение
    html += '<div class="generation">';
    html += '<div class="generation-title">Центральное поколение</div>';
    html += '<div class="person-row">';
    
    if (selfPerson) {
        html += createPrintablePersonCard(selfPerson, true);
    }
    
    if (spouse) {
        html += createPrintablePersonCard(spouse);
    }
    
    html += '</div>';
    html += '</div>';
    
    // Поколение детей
    if (children.length > 0) {
        html += '<div class="generation">';
        html += '<div class="generation-title">Дети</div>';
        html += '<div class="person-row">';
        children.forEach(child => {
            html += createPrintablePersonCard(child);
        });
        html += '</div>';
        html += '</div>';
    }
    
    // Братья и сестры
    if (siblings.length > 0) {
        html += '<div class="generation">';
        html += '<div class="generation-title">Братья и сестры</div>';
        html += '<div class="person-row">';
        siblings.forEach(sibling => {
            html += createPrintablePersonCard(sibling);
        });
        html += '</div>';
        html += '</div>';
    }
    
    // Другие родственники
    if (others.length > 0) {
        html += '<div class="generation">';
        html += '<div class="generation-title">Другие родственники</div>';
        html += '<div class="person-row">';
        others.forEach(other => {
            html += createPrintablePersonCard(other);
        });
        html += '</div>';
        html += '</div>';
    }
    
    return html;
}

function createPrintablePersonCard(person, isSelf = false) {
    const genderClass = person.gender === 'male' ? 'male' : 'female';
    const selfClass = isSelf ? 'self' : '';
    const relationText = getRelationText(person.relation);
    const initials = `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`;
    
    return `
        <div class="person-print-card ${genderClass} ${selfClass}">
            <div class="person-initials ${genderClass} ${selfClass}">
                ${initials}
            </div>
            <div class="person-name">${person.firstName} ${person.lastName}</div>
            <div class="person-relation">${relationText}</div>
            ${person.birthDate ? `<div class="person-date">${person.birthDate}</div>` : ''}
        </div>
    `;
}

function getRelationText(relation) {
    const relations = {
        'self': 'Я',
        'father': 'Отец',
        'mother': 'Мать',
        'spouse': 'Супруг/а',
        'partner': 'Партнер',
        'son': 'Сын',
        'daughter': 'Дочь',
        'brother': 'Брат',
        'sister': 'Сестра',
        'grandfather': 'Дедушка',
        'grandmother': 'Бабушка',
        'grandson': 'Внук',
        'granddaughter': 'Внучка',
        'uncle': 'Дядя',
        'aunt': 'Тетя',
        'cousin': 'Двоюродный брат/сестра',
        'nephew': 'Племянник',
        'niece': 'Племянница'
    };
    return relations[relation] || relation;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные дерева
    if (window.treeData && window.treeData.relatives && window.treeData.relatives.length > 0) {
        // Обновляем интерфейс если функция существует
        if (typeof window.updateTreeInterface === 'function') {
            window.updateTreeInterface(window.treeData.relatives, window.treeData.name);
        }
        
        // Обновляем статистику
        if (typeof window.updateTreeStats === 'function') {
            window.updateTreeStats();
        }
    }
    
    // Добавляем кнопку для экспорта в формате JSON
    addExportJsonButton();
});

function addExportJsonButton() {
    const controlsPanel = document.getElementById('tree-controls-panel');
    if (controlsPanel) {
        const exportJsonBtn = document.createElement('button');
        exportJsonBtn.onclick = exportTreeAsJson;
        controlsPanel.appendChild(exportJsonBtn);
    }
}

// Функция для создания интерактивного SVG-дерева
function createInteractiveTree(relatives, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем SVG элемент
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "600");
    svg.setAttribute("viewBox", "0 0 800 600");
    svg.style.cursor = "grab";
    
    // Создаем группу для масштабирования/перемещения
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", "tree-group");
    svg.appendChild(g);
    
    // Добавляем фон
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "800");
    rect.setAttribute("height", "600");
    rect.setAttribute("fill", "#f8fafc");
    g.appendChild(rect);
    
    // Группируем родственников по поколениям
    const generations = groupByGenerations(relatives);
    
    // Позиционируем узлы
    const nodePositions = calculateNodePositions(generations);
    
    // Рисуем соединительные линии
    drawConnections(nodePositions, g);
    
    // Рисуем узлы
    drawNodes(nodePositions, g);
    
    // Добавляем интерактивность
    addTreeInteractivity(svg, g);
    
    container.appendChild(svg);
    
    // Добавляем контролы для дерева
    addTreeControls(container);
}

// Группировка по поколениям
function groupByGenerations(relatives) {
    const generations = {
        'grandparents': [],
        'parents': [],
        'current': [],
        'children': [],
        'grandchildren': []
    };
    
    relatives.forEach(person => {
        switch(person.relation) {
            case 'grandparent':
            case 'grandfather':
            case 'grandmother':
                generations.grandparents.push(person);
                break;
            case 'parent':
            case 'father':
            case 'mother':
                generations.parents.push(person);
                break;
            case 'self':
            case 'spouse':
            case 'sibling':
                generations.current.push(person);
                break;
            case 'child':
            case 'son':
            case 'daughter':
                generations.children.push(person);
                break;
            case 'grandchild':
                generations.grandchildren.push(person);
                break;
        }
    });
    
    return generations;
}

// Функция для добавления интерактивности
function addTreeInteractivity(svg, g) {
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let transform = { x: 0, y: 0, scale: 1 };
    
    // Масштабирование колесиком мыши
    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        
        transform.scale = Math.max(0.1, Math.min(5, transform.scale + delta));
        updateTransform();
    });
    
    // Перемещение
    svg.addEventListener('mousedown', (e) => {
        isPanning = true;
        startPoint = { x: e.clientX - transform.x, y: e.clientY - transform.y };
        svg.style.cursor = 'grabbing';
    });
    
    svg.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        
        transform.x = e.clientX - startPoint.x;
        transform.y = e.clientY - startPoint.y;
        updateTransform();
    });
    
    svg.addEventListener('mouseup', () => {
        isPanning = false;
        svg.style.cursor = 'grab';
    });
    
    svg.addEventListener('mouseleave', () => {
        isPanning = false;
        svg.style.cursor = 'grab';
    });
    
    function updateTransform() {
        g.setAttribute('transform', 
            `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`
        );
    }
}

function exportTreeAsJson() {
    if (!window.treeData || !window.treeData.relatives || window.treeData.relatives.length === 0) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    const exportData = {
        ...window.treeData,
        exportDate: new Date().toISOString(),
        exportFormat: 'JSON',
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-tree-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    window.showNotification('✅ Дерево экспортировано в JSON!', 'success');
}

// Экспортируем функции
window.saveTreeAsImage = saveTreeAsImage;
window.printTree = printTree;
window.updateTreeStats = updateTreeStats;
window.exportTreeAsJson = exportTreeAsJson;

// Также добавляем функцию обновления интерфейса дерева
window.updateTreeInterface = function(relatives, treeName) {
    const container = document.getElementById('tree-visualization-container');
    const emptyState = document.getElementById('tree-empty-state');
    const controlsPanel = document.getElementById('tree-controls-panel');
    
    if (!container) return;
    
    if (!relatives || relatives.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (controlsPanel) controlsPanel.style.display = 'none';
        return;
    }
    
    // Скрываем пустое состояние
    if (emptyState) emptyState.style.display = 'none';
    if (controlsPanel) controlsPanel.style.display = 'flex';
    
    // Используем существующую функцию из tree-builder-simple.js если она доступна
    if (typeof createPersonCard === 'function') {
        // Группируем родственников
        const selfPerson = relatives.find(p => p.relation === 'self');
        const parents = relatives.filter(p => p.relation === 'father' || p.relation === 'mother');
        const spouse = relatives.find(p => p.relation === 'spouse' || p.relation === 'partner');
        const children = relatives.filter(p => p.relation === 'son' || p.relation === 'daughter');
        const siblings = relatives.filter(p => p.relation === 'brother' || p.relation === 'sister');
        
        let html = `
            <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 30px; color: #2d3748;">${treeName}</h3>
                <div style="width: 100%;">
        `;
        
        // Поколение родителей
        if (parents.length > 0) {
            html += '<div style="margin-bottom: 40px;">';
            html += '<h4 style="color: #718096; margin-bottom: 20px;">Родители</h4>';
            html += '<div style="display: flex; justify-content: center; gap: 20px;">';
            parents.forEach(parent => {
                html += createPersonCard(parent);
            });
            html += '</div>';
            html += '</div>';
        }
        
        // Центральное поколение
        html += '<div style="margin-bottom: 40px;">';
        html += '<h4 style="color: #718096; margin-bottom: 20px;">Центральное поколение</h4>';
        html += '<div style="display: flex; justify-content: center; align-items: center; gap: 30px;">';
        
        if (selfPerson) {
            html += createPersonCard(selfPerson, true);
        }
        
        if (spouse) {
            html += '<div style="font-size: 2rem; color: #ed64a6;">♥</div>';
            html += createPersonCard(spouse);
        }
        
        html += '</div>';
        html += '</div>';
        
        // Поколение детей
        if (children.length > 0) {
            html += '<div style="margin-bottom: 40px;">';
            html += '<h4 style="color: #718096; margin-bottom: 20px;">Дети</h4>';
            html += '<div style="display: flex; justify-content: center; gap: 20px;">';
            children.forEach(child => {
                html += createPersonCard(child);
            });
            html += '</div>';
            html += '</div>';
        }
        
        // Братья и сестры
        if (siblings.length > 0) {
            html += '<div>';
            html += '<h4 style="color: #718096; margin-bottom: 20px;">Братья и сестры</h4>';
            html += '<div style="display: flex; justify-content: center; gap: 20px;">';
            siblings.forEach(sibling => {
                html += createPersonCard(sibling);
            });
            html += '</div>';
            html += '</div>';
        }
        
        html += `
                </div>
                <div style="margin-top: 30px; color: #718096;">
                    <p>Всего родственников: ${relatives.length}</p>
                    <button class="btn" onclick="window.startTreeBuilder()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Добавить еще родственников
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    } else {
        // Простой вывод если функция не доступна
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 30px; color: #2d3748;">${treeName}</h3>
                <p style="color: #718096;">В дереве ${relatives.length} родственников</p>
            </div>
        `;
    }
};

console.log('✅ Tree Engine загружен');