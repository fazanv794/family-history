// tree-engine.js - Движок для построения генеалогического древа

class TreeEngine {
    constructor() {
        this.treeData = null;
        this.layout = 'horizontal';
        this.zoom = 1;
        this.generations = 3;
        this.centerPersonId = null;
        this.connections = [];
    }
    
    // Автопостроение дерева
    async autoBuildTree(options) {
        const {
            generations = 3,
            style = 'horizontal',
            centerPerson = 'self',
            showPhotos = true,
            showDates = true,
            showLines = true
        } = options;
        
        this.generations = generations;
        this.layout = style;
        
        window.showLoader('Построение дерева...');
        
        try {
            // Определяем центрального человека
            if (centerPerson === 'self') {
                this.centerPersonId = await this.findSelfPersonId();
            } else if (centerPerson === 'oldest') {
                this.centerPersonId = await this.findOldestPersonId();
            }
            
            // Получаем данные дерева
            const treeData = await this.buildTreeData(this.centerPersonId, generations);
            this.treeData = treeData;
            
            // Визуализируем дерево
            await this.visualizeTree(treeData, {
                layout: style,
                showPhotos,
                showDates,
                showLines
            });
            
            window.showNotification('✅ Дерево успешно построено!', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка построения дерева:', error);
            window.showNotification('Ошибка построения дерева: ' + error.message, 'error');
        } finally {
            window.hideLoader();
        }
    }
    
    async findSelfPersonId() {
        // Находим человека, отмеченного как "я"
        const selfPerson = people.find(p => p.relation === 'self' || p.is_user);
        return selfPerson ? selfPerson.id : (people[0] ? people[0].id : null);
    }
    
    async findOldestPersonId() {
        // Находим самого старшего по дате рождения
        if (people.length === 0) return null;
        
        const sorted = [...people].sort((a, b) => {
            const dateA = a.birth_date ? new Date(a.birth_date) : new Date('1900-01-01');
            const dateB = b.birth_date ? new Date(b.birth_date) : new Date('1900-01-01');
            return dateA - dateB;
        });
        return sorted[0] ? sorted[0].id : null;
    }
    
    async buildTreeData(centerId, generations) {
        if (!centerId) return null;
        
        const centerPerson = people.find(p => p.id === centerId);
        if (!centerPerson) return null;
        
        // Рекурсивно строим дерево
        const tree = {
            person: centerPerson,
            parents: [],
            children: [],
            spouse: null,
            siblings: []
        };
        
        // В демо-режиме создаем фиктивные данные для родителей
        if (generations > 1) {
            tree.parents = await this.generateParents(centerPerson, generations - 1);
        }
        
        // В демо-режиме создаем фиктивные данные для детей
        if (generations > 0) {
            tree.children = await this.generateChildren(centerPerson, generations - 1);
        }
        
        // Ищем супруга
        tree.spouse = await this.findSpouse(centerPerson);
        
        return tree;
    }
    
    async generateParents(person, depth) {
        if (depth <= 0) return [];
        
        // Генерируем фиктивных родителей для демо
        const parents = [];
        
        // Отец
        const father = {
            id: `parent_father_${person.id}`,
            first_name: 'Иван',
            last_name: person.last_name || 'Иванов',
            birth_date: this.generateBirthDate(person.birth_date, -30),
            relation: 'parent',
            gender: 'male',
            photo_url: 'https://via.placeholder.com/150/4299e1/ffffff?text=Отец'
        };
        
        // Мать
        const mother = {
            id: `parent_mother_${person.id}`,
            first_name: 'Мария',
            last_name: 'Петрова',
            birth_date: this.generateBirthDate(person.birth_date, -28),
            relation: 'parent',
            gender: 'female',
            photo_url: 'https://via.placeholder.com/150/d69e2e/ffffff?text=Мать'
        };
        
        // Добавляем их родителей (бабушек/дедушек)
        if (depth > 1) {
            father.parents = await this.generateParents(father, depth - 1);
            mother.parents = await this.generateParents(mother, depth - 1);
        }
        
        parents.push(father, mother);
        return parents;
    }
    
    async generateChildren(person, depth) {
        if (depth <= 0) return [];
        
        // Генерируем фиктивных детей для демо
        const children = [];
        const childCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < childCount; i++) {
            const gender = Math.random() > 0.5 ? 'male' : 'female';
            const child = {
                id: `child_${person.id}_${i}`,
                first_name: gender === 'male' ? 'Алексей' : 'Анна',
                last_name: person.last_name || 'Иванов',
                birth_date: this.generateBirthDate(person.birth_date, 25),
                relation: 'child',
                gender: gender,
                photo_url: `https://via.placeholder.com/150/${gender === 'male' ? '4299e1' : 'd69e2e'}/ffffff?text=${gender === 'male' ? 'Сын' : 'Дочь'}`
            };
            
            // Добавляем детей детей (внуков)
            if (depth > 1) {
                child.children = await this.generateChildren(child, depth - 1);
            }
            
            children.push(child);
        }
        
        return children;
    }
    
    async findSpouse(person) {
        // Ищем супруга среди существующих людей
        const spouse = people.find(p => 
            (p.relation === 'spouse' && p.id !== person.id) ||
            (p.last_name === person.last_name && p.relation !== 'self' && p.gender !== person.gender)
        );
        
        if (spouse) return spouse;
        
        // Если супруга нет, создаем фиктивного
        if (person.relation === 'self' || Math.random() > 0.3) {
            return {
                id: `spouse_${person.id}`,
                first_name: person.gender === 'male' ? 'Мария' : 'Иван',
                last_name: person.last_name || 'Иванова',
                birth_date: this.generateBirthDate(person.birth_date, -2),
                relation: 'spouse',
                gender: person.gender === 'male' ? 'female' : 'male',
                photo_url: `https://via.placeholder.com/150/${person.gender === 'male' ? 'd69e2e' : '4299e1'}/ffffff?text=Супруг`
            };
        }
        
        return null;
    }
    
    generateBirthDate(baseDate, yearsOffset) {
        if (!baseDate) {
            const year = 1950 + Math.floor(Math.random() * 50);
            return `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
        }
        
        const base = new Date(baseDate);
        base.setFullYear(base.getFullYear() + yearsOffset);
        return base.toISOString().split('T')[0];
    }
    
    async visualizeTree(treeData, options) {
        const container = document.getElementById('tree-nodes');
        const linesSvg = document.getElementById('tree-lines');
        
        if (!container || !linesSvg) return;
        
        // Очищаем
        container.innerHTML = '';
        linesSvg.innerHTML = '';
        this.connections = [];
        
        if (!treeData) {
            container.innerHTML = '<div class="tree-empty">Нет данных для отображения</div>';
            return;
        }
        
        // Собираем всех людей из дерева
        const allPeople = this.collectAllPeople(treeData);
        
        // Рассчитываем позиции
        const positions = this.calculatePositions(treeData, options.layout, allPeople);
        
        // Отрисовываем узлы
        allPeople.forEach(person => {
            const pos = positions[person.id];
            if (pos) {
                const node = this.createTreeNode(person, pos, options);
                container.appendChild(node);
            }
        });
        
        // Отрисовываем линии связей
        if (options.showLines) {
            this.drawConnections(treeData, positions, linesSvg);
        }
        
        // Обновляем статистику
        this.updateTreeStats(allPeople);
        
        // Инициализируем перетаскивание
        setTimeout(() => this.initDragAndDrop(), 100);
    }
    
    collectAllPeople(node, collected = []) {
        if (!node || !node.person) return collected;
        
        if (!collected.find(p => p.id === node.person.id)) {
            collected.push(node.person);
        }
        
        if (node.parents) {
            node.parents.forEach(parent => {
                this.collectAllPeople(parent, collected);
            });
        }
        
        if (node.children) {
            node.children.forEach(child => {
                this.collectAllPeople(child, collected);
            });
        }
        
        if (node.spouse && !collected.find(p => p.id === node.spouse.id)) {
            collected.push(node.spouse);
        }
        
        return collected;
    }
    
    calculatePositions(treeData, layout, allPeople) {
        const positions = {};
        
        if (layout === 'horizontal') {
            this.calculateHorizontalPositions(treeData, positions, 400, 300, 250, 150);
        } else if (layout === 'vertical') {
            this.calculateVerticalPositions(treeData, positions, 400, 100, 150, 250);
        } else if (layout === 'radial') {
            this.calculateRadialPositions(treeData, positions, 500, 300, 150);
        }
        
        return positions;
    }
    
    calculateHorizontalPositions(node, positions, x, y, levelWidth, levelHeight, depth = 0) {
        if (!node || !node.person) return;
        
        // Сохраняем позицию текущего человека
        positions[node.person.id] = { x, y };
        
        // Позиция для супруга
        if (node.spouse) {
            positions[node.spouse.id] = { x: x + 250, y: y };
        }
        
        // Родители слева
        if (node.parents && node.parents.length > 0) {
            const parentYStart = y - (node.parents.length - 1) * (levelHeight / 2);
            node.parents.forEach((parent, index) => {
                const parentX = x - levelWidth;
                const parentY = parentYStart + index * levelHeight;
                if (parent.person) {
                    positions[parent.person.id] = { x: parentX, y: parentY };
                    
                    // Рекурсивно для их родителей
                    if (parent.parents) {
                        this.calculateHorizontalPositions(parent, positions, parentX - levelWidth, parentY, levelWidth, levelHeight, depth + 1);
                    }
                }
            });
        }
        
        // Дети справа
        if (node.children && node.children.length > 0) {
            const childYStart = y - (node.children.length - 1) * (levelHeight / 2);
            node.children.forEach((child, index) => {
                const childX = x + levelWidth;
                const childY = childYStart + index * levelHeight;
                if (child.person) {
                    positions[child.person.id] = { x: childX, y: childY };
                    
                    // Рекурсивно для их детей
                    if (child.children) {
                        this.calculateHorizontalPositions(child, positions, childX + levelWidth, childY, levelWidth, levelHeight, depth + 1);
                    }
                }
            });
        }
    }
    
    calculateVerticalPositions(node, positions, x, y, levelWidth, levelHeight, depth = 0) {
        if (!node || !node.person) return;
        
        positions[node.person.id] = { x, y };
        
        // Супруг рядом
        if (node.spouse) {
            positions[node.spouse.id] = { x: x + 200, y: y };
        }
        
        // Родители выше
        if (node.parents && node.parents.length > 0) {
            const parentXStart = x - (node.parents.length - 1) * (levelWidth / 2);
            node.parents.forEach((parent, index) => {
                const parentX = parentXStart + index * levelWidth;
                const parentY = y - levelHeight;
                if (parent.person) {
                    positions[parent.person.id] = { x: parentX, y: parentY };
                    
                    if (parent.parents) {
                        this.calculateVerticalPositions(parent, positions, parentX, parentY - levelHeight, levelWidth, levelHeight, depth + 1);
                    }
                }
            });
        }
        
        // Дети ниже
        if (node.children && node.children.length > 0) {
            const childXStart = x - (node.children.length - 1) * (levelWidth / 2);
            node.children.forEach((child, index) => {
                const childX = childXStart + index * levelWidth;
                const childY = y + levelHeight;
                if (child.person) {
                    positions[child.person.id] = { x: childX, y: childY };
                    
                    if (child.children) {
                        this.calculateVerticalPositions(child, positions, childX, childY + levelHeight, levelWidth, levelHeight, depth + 1);
                    }
                }
            });
        }
    }
    
    calculateRadialPositions(node, positions, centerX, centerY, radius, depth = 0, angle = Math.PI / 2, span = Math.PI) {
        if (!node || !node.person) return;
        
        const currentRadius = radius * (depth + 1);
        const currentX = centerX + currentRadius * Math.cos(angle);
        const currentY = centerY + currentRadius * Math.sin(angle);
        
        positions[node.person.id] = { x: currentX, y: currentY };
        
        // Супруг рядом
        if (node.spouse) {
            const spouseAngle = angle + 0.2;
            const spouseX = centerX + currentRadius * Math.cos(spouseAngle);
            const spouseY = centerY + currentRadius * Math.sin(spouseAngle);
            positions[node.spouse.id] = { x: spouseX, y: spouseY };
        }
        
        // Родители
        if (node.parents && node.parents.length > 0) {
            const parentSpan = span / node.parents.length;
            node.parents.forEach((parent, index) => {
                const parentAngle = angle - span/2 + parentSpan * (index + 0.5);
                if (parent.person) {
                    this.calculateRadialPositions(parent, positions, centerX, centerY, radius, depth - 1, parentAngle, parentSpan * 0.8);
                }
            });
        }
        
        // Дети
        if (node.children && node.children.length > 0) {
            const childSpan = span / node.children.length;
            node.children.forEach((child, index) => {
                const childAngle = angle - span/2 + childSpan * (index + 0.5);
                if (child.person) {
                    this.calculateRadialPositions(child, positions, centerX, centerY, radius, depth + 1, childAngle, childSpan * 0.8);
                }
            });
        }
    }
    
    createTreeNode(person, position, options) {
        const node = document.createElement('div');
        node.className = 'tree-node draggable';
        node.dataset.id = person.id;
        node.style.left = `${position.x - 100}px`; // Центрируем (width/2)
        node.style.top = `${position.y - 125}px`; // Центрируем (height/2)
        
        // Цвет в зависимости от пола
        const color = person.gender === 'female' ? '#d69e2e' : (person.gender === 'male' ? '#4299e1' : '#8b4513');
        node.style.borderColor = color;
        
        let photoHtml = '';
        if (options.showPhotos && person.photo_url) {
            photoHtml = `<img src="${person.photo_url}" alt="${person.first_name}">`;
        } else if (options.showPhotos) {
            const icon = person.gender === 'female' ? 'fas fa-female' : (person.gender === 'male' ? 'fas fa-male' : 'fas fa-user');
            photoHtml = `<i class="${icon}"></i>`;
        } else {
            photoHtml = `<i class="fas fa-user"></i>`;
        }
        
        let datesHtml = '';
        if (options.showDates && person.birth_date) {
            const birthYear = new Date(person.birth_date).getFullYear();
            datesHtml = `<div class="tree-node-dates">Род. ${birthYear}</div>`;
        }
        
        node.innerHTML = `
            <div class="tree-node-photo" style="background-color: ${color}">
                ${photoHtml}
            </div>
            <div class="tree-node-name">${person.first_name} ${person.last_name}</div>
            ${datesHtml}
            <div class="tree-node-relation">${getRelationLabel(person.relation)}</div>
            <div class="node-actions">
                <button class="btn-node-edit" onclick="editTreeNode('${person.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-node-info" onclick="showPersonInfo('${person.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        `;
        
        return node;
    }
    
    drawConnections(treeData, positions, svg) {
        // Рисуем связи между родителями и детьми
        this.drawParentChildConnections(treeData, positions, svg);
        
        // Рисуем связи между супругами
        this.drawSpouseConnections(treeData, positions, svg);
    }
    
    drawParentChildConnections(node, positions, svg) {
        if (!node || !node.person) return;
        
        const parentPos = positions[node.person.id];
        if (!parentPos) return;
        
        // Линии к детям
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                if (child.person) {
                    const childPos = positions[child.person.id];
                    if (childPos) {
                        this.drawLine(svg, parentPos, childPos, 'parent-child');
                        this.drawParentChildConnections(child, positions, svg);
                    }
                }
            });
        }
        
        // Линии к родителям
        if (node.parents && node.parents.length > 0) {
            node.parents.forEach(parent => {
                if (parent.person) {
                    const parentPos2 = positions[parent.person.id];
                    if (parentPos2) {
                        this.drawLine(svg, parentPos2, parentPos, 'parent-child');
                        this.drawParentChildConnections(parent, positions, svg);
                    }
                }
            });
        }
    }
    
    drawSpouseConnections(node, positions, svg) {
        if (!node || !node.person || !node.spouse) return;
        
        const spousePos = positions[node.spouse.id];
        const personPos = positions[node.person.id];
        
        if (spousePos && personPos) {
            this.drawLine(svg, personPos, spousePos, 'spouse');
        }
    }
    
    drawLine(svg, from, to, type) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y);
        
        if (type === 'parent-child') {
            line.setAttribute('stroke', '#a0aec0');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-dasharray', '5,5');
        } else if (type === 'spouse') {
            line.setAttribute('stroke', '#e53e3e');
            line.setAttribute('stroke-width', '3');
        }
        
        svg.appendChild(line);
        this.connections.push({ line, from, to, type });
    }
    
    updateTreeStats(allPeople) {
        const peopleCount = allPeople.length;
        const photoCount = allPeople.filter(p => p.photo_url).length;
        const generationCount = this.countGenerations(this.treeData);
        
        document.getElementById('tree-people-count').textContent = peopleCount;
        document.getElementById('tree-photos-count').textContent = photoCount;
        document.getElementById('tree-generations').textContent = generationCount;
    }
    
    countGenerations(node, depth = 1) {
        if (!node) return depth;
        
        let maxDepth = depth;
        
        if (node.parents && node.parents.length > 0) {
            const parentDepth = Math.max(...node.parents.map(p => this.countGenerations(p, depth + 1)));
            maxDepth = Math.max(maxDepth, parentDepth);
        }
        
        if (node.children && node.children.length > 0) {
            const childDepth = Math.max(...node.children.map(c => this.countGenerations(c, depth + 1)));
            maxDepth = Math.max(maxDepth, childDepth);
        }
        
        return maxDepth;
    }
    
    initDragAndDrop() {
        const nodes = document.querySelectorAll('.tree-node.draggable');
        
        nodes.forEach(node => {
            node.addEventListener('mousedown', (e) => {
                if (e.target.closest('.btn-node-edit') || e.target.closest('.btn-node-info')) {
                    return;
                }
                
                this.startDrag(e, node);
            });
        });
        
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
    }
    
    startDrag(e, node) {
        e.preventDefault();
        
        this.isDragging = true;
        this.dragElement = node;
        
        const rect = node.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        node.classList.add('dragging');
        node.style.zIndex = '1000';
    }
    
    drag(e) {
        if (!this.isDragging || !this.dragElement) return;
        
        const container = document.getElementById('tree-visualization-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        let x = e.clientX - rect.left - this.dragOffset.x + 100; // + width/2
        let y = e.clientY - rect.top - this.dragOffset.y + 125; // + height/2
        
        // Ограничиваем перемещение
        x = Math.max(0, Math.min(x, container.clientWidth - 200));
        y = Math.max(0, Math.min(y, container.clientHeight - 250));
        
        this.dragElement.style.left = `${x}px`;
        this.dragElement.style.top = `${y}px`;
        
        // Обновляем линии
        this.updateConnectionLines(this.dragElement.dataset.id, { x: x + 100, y: y + 125 });
    }
    
    stopDrag() {
        if (!this.isDragging || !this.dragElement) return;
        
        this.isDragging = false;
        this.dragElement.classList.remove('dragging');
        this.dragElement.style.zIndex = '';
        this.dragElement = null;
    }
    
    updateConnectionLines(personId, newPos) {
        this.connections.forEach(conn => {
            if (conn.from.personId === personId) {
                conn.line.setAttribute('x1', newPos.x);
                conn.line.setAttribute('y1', newPos.y);
                conn.from.x = newPos.x;
                conn.from.y = newPos.y;
            } else if (conn.to.personId === personId) {
                conn.line.setAttribute('x2', newPos.x);
                conn.line.setAttribute('y2', newPos.y);
                conn.to.x = newPos.x;
                conn.to.y = newPos.y;
            }
        });
    }
}

// Вспомогательные функции
function getRelationLabel(relation) {
    const labels = {
        'self': 'Я',
        'spouse': 'Супруг/а',
        'parent': 'Родитель',
        'child': 'Ребенок',
        'sibling': 'Брат/сестра',
        'grandparent': 'Дедушка/бабушка',
        'grandchild': 'Внук/внучка',
        'aunt_uncle': 'Тетя/дядя',
        'cousin': 'Двоюродный брат/сестра',
        'other': 'Родственник'
    };
    
    return labels[relation] || relation;
}

// Инициализируем движок
window.treeEngine = new TreeEngine();

// Экспортируем функции для HTML
window.autoBuildTree = async () => {
    const generations = parseInt(document.getElementById('auto-generations').value);
    const style = document.getElementById('auto-style').value;
    const centerPerson = document.getElementById('auto-center-person').value;
    const showPhotos = document.getElementById('auto-show-photos').checked;
    const showDates = document.getElementById('auto-show-dates').checked;
    const showLines = document.getElementById('auto-show-lines').checked;
    
    await window.treeEngine.autoBuildTree({
        generations,
        style,
        centerPerson,
        showPhotos,
        showDates,
        showLines
    });
};

window.editTreeNode = async (personId) => {
    // Находим человека
    const allPeople = window.treeEngine.collectAllPeople(window.treeEngine.treeData) || [];
    const person = allPeople.find(p => p.id === personId) || people.find(p => p.id === personId);
    
    if (person) {
        // Заполняем форму редактирования
        document.getElementById('edit-person-first-name').value = person.first_name || '';
        document.getElementById('edit-person-last-name').value = person.last_name || '';
        document.getElementById('edit-person-birth-date').value = person.birth_date || '';
        document.getElementById('edit-person-relation').value = person.relation || 'other';
        document.getElementById('edit-person-gender').value = person.gender || 'male';
        document.getElementById('edit-person-bio').value = person.biography || '';
        
        // Показываем превью фото
        const preview = document.getElementById('edit-person-photo-preview');
        if (person.photo_url && preview) {
            preview.innerHTML = `<img src="${person.photo_url}" alt="${person.first_name}">`;
        }
        
        // Открываем модальное окно
        openModal('edit-person-modal');
    }
};

window.showPersonInfo = (personId) => {
    const allPeople = window.treeEngine.collectAllPeople(window.treeEngine.treeData) || [];
    const person = allPeople.find(p => p.id === personId) || people.find(p => p.id === personId);
    
    if (person) {
        const info = `
            Имя: ${person.first_name} ${person.last_name}<br>
            Родство: ${getRelationLabel(person.relation)}<br>
            ${person.birth_date ? `Дата рождения: ${new Date(person.birth_date).toLocaleDateString('ru-RU')}<br>` : ''}
            ${person.biography ? `Биография: ${person.biography}` : ''}
        `;
        
        window.showNotification(info, 'info');
    }
};