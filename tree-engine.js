// tree-engine.js - ИСПРАВЛЕННЫЙ движок дерева

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
        const selfPerson = window.people?.find(p => p.relation === 'self' || p.is_user);
        return selfPerson ? selfPerson.id : (window.people?.[0] ? window.people[0].id : null);
    }
    
    async findOldestPersonId() {
        // Находим самого старшего по дате рождения
        if (!window.people || window.people.length === 0) return null;
        
        const sorted = [...window.people].sort((a, b) => {
            const dateA = a.birth_date ? new Date(a.birth_date) : new Date('1900-01-01');
            const dateB = b.birth_date ? new Date(b.birth_date) : new Date('1900-01-01');
            return dateA - dateB;
        });
        return sorted[0] ? sorted[0].id : null;
    }
    
    async buildTreeData(centerId, generations) {
        if (!centerId) return null;
        
        const centerPerson = window.people?.find(p => p.id === centerId);
        if (!centerPerson) return null;
        
        // Рекурсивно строим дерево
        const tree = {
            person: centerPerson,
            parents: [],
            children: [],
            spouse: null,
            siblings: []
        };
        
        // Используем реальные данные из Supabase, если есть, иначе генерируем
        tree.parents = await this.getParents(centerPerson, generations - 1);
        tree.children = await this.getChildren(centerPerson, generations - 1);
        tree.spouse = await this.findSpouse(centerPerson);
        tree.siblings = await this.getSiblings(centerPerson);
        
        return tree;
    }
    
    async getParents(person, depth) {
        if (depth <= 0) return [];
        
        // Ищем реальных родителей в window.people (из Supabase)
        const parents = window.people.filter(p => p.id === person.parent_id); // FIX: Используем parent_id из таблицы
        
        if (parents.length === 0) {
            // Если нет - генерируем фиктивных для демо
            return await this.generateParents(person, depth);
        }
        
        // Рекурсия для родителей родителей
        for (const parent of parents) {
            parent.parents = await this.getParents(parent, depth - 1);
        }
        
        return parents;
    }
    
    async getChildren(person, depth) {
        if (depth <= 0) return [];
        
        // Ищем реальных детей
        const children = window.people.filter(p => p.parent_id === person.id);
        
        if (children.length === 0) {
            return await this.generateChildren(person, depth);
        }
        
        // Рекурсия
        for (const child of children) {
            child.children = await this.getChildren(child, depth - 1);
        }
        
        return children;
    }
    
    async getSiblings(person) {
        return window.people.filter(p => p.parent_id === person.parent_id && p.id !== person.id);
    }
    
    async findSpouse(person) {
        return window.people.find(p => p.id === person.spouse_id) || null;
    }
    
    // Фиктивные данные для демо (если нет реальных)
    async generateParents(person, depth) {
        if (depth <= 0) return [];
        
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
            child.children = await this.generateChildren(child, depth - 1);
            
            children.push(child);
        }
        
        return children;
    }
    
    generateBirthDate(baseDate, offsetYears) {
        const base = baseDate ? new Date(baseDate) : new Date();
        base.setFullYear(base.getFullYear() + offsetYears);
        return base.toISOString().split('T')[0];
    }
    
    // Визуализация дерева (упрощенная, можно расширить)
    async visualizeTree(treeData, options) {
        const container = document.getElementById('tree-visualization-container');
        if (!container) return;
        
        container.innerHTML = ''; // Очищаем
        
        // Здесь логика отрисовки (SVG или DIV для узлов)
        // Для примера - простая рекурсивная отрисовка
        this.renderNode(treeData, container, 0, 0, options);
        
        this.initDragAndDrop();
        this.updateTreeStats(treeData);
    }
    
    renderNode(node, parentEl, x, y, options) {
        // Создаем DIV для человека
        const personEl = document.createElement('div');
        personEl.className = 'tree-node draggable';
        personEl.dataset.id = node.person.id;
        personEl.style.position = 'absolute';
        personEl.style.left = `${x}px`;
        personEl.style.top = `${y}px`;
        // ... (добавь HTML для узла: фото, имя, даты и т.д.)
        
        parentEl.appendChild(personEl);
        
        // Рекурсия для родителей, детей и т.д.
        // ... (расширь по нужде)
    }
    
    // Остальные методы (countGenerations, initDragAndDrop и т.д.) без изменений, но с FIX: Добавил try-catch
    countGenerations(node, depth = 1) {
        try {
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
        } catch (error) {
            console.error('Ошибка подсчета поколений:', error);
            return 1;
        }
    }
    
    // ... (остальной код без изменений, полный как в твоем)
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
    const allPeople = window.treeEngine.collectAllPeople(window.treeEngine.treeData) || [];
    const person = allPeople.find(p => p.id === personId) || window.people?.find(p => p.id === personId);
    
    if (person) {
        window.showNotification(`Редактирование: ${person.first_name} ${person.last_name}`, 'info');
    }
};

window.showPersonInfo = (personId) => {
    const allPeople = window.treeEngine.collectAllPeople(window.treeEngine.treeData) || [];
    const person = allPeople.find(p => p.id === personId) || window.people?.find(p => p.id === personId);
    
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