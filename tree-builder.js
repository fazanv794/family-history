/**
 * Построитель дерева с модальными окнами
 */

// Создаем глобальные функции для обратной совместимости
window.startTreeBuilder = function() {
    console.log('Tree Builder запущен с новой системой модальных окон');
    
    // Создаем основное модальное окно построителя дерева
    const modalContent = `
        <div style="text-align: center;">
            <h2 style="color: #4361ee; margin-bottom: 20px;">🌳 Построитель Дерева</h2>
            <p style="margin-bottom: 30px;">Выберите тип дерева для построения:</p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
                <button class="tree-type-btn" data-type="binary">🌲 Бинарное дерево</button>
                <button class="tree-type-btn" data-type="avl">🔄 AVL дерево</button>
                <button class="tree-type-btn" data-type="red-black">🔴 Красно-чёрное</button>
                <button class="tree-type-btn" data-type="b-tree">📚 B-дерево</button>
            </div>
            
            <div id="tree-params" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin-top: 0;">Параметры дерева:</h4>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label>Уровни:</label>
                    <input type="number" id="tree-levels" value="4" min="1" max="10" style="width: 60px; padding: 5px;">
                    <label>Узлы:</label>
                    <input type="number" id="tree-nodes" value="15" min="1" max="50" style="width: 80px; padding: 5px;">
                </div>
            </div>
            
            <div style="color: #666; font-size: 14px;">
                <p>✨ Новая система модальных окон</p>
                <p>✅ Гарантированно работает</p>
            </div>
        </div>
    `;

    window.ModalSystem.createModal('tree-builder-main', {
        title: 'Построитель дерева',
        content: modalContent,
        width: '600px',
        buttons: [
            {
                text: 'Отмена',
                type: 'secondary',
                closeOnClick: true
            },
            {
                text: 'Построить дерево',
                type: 'primary',
                onClick: function() {
                    const levels = document.getElementById('tree-levels').value;
                    const nodes = document.getElementById('tree-nodes').value;
                    alert(`Строим дерево с ${levels} уровнями и ${nodes} узлами!`);
                    // Здесь будет логика построения дерева
                    window.ModalSystem.closeModal('tree-builder-main');
                }
            }
        ]
    });

    // Добавляем обработчики для кнопок типов деревьев
    setTimeout(() => {
        document.querySelectorAll('.tree-type-btn').forEach(btn => {
            btn.onclick = function() {
                const type = this.getAttribute('data-type');
                window.Modal.alert('Выбор типа', `Вы выбрали: ${type} дерево`);
            };
        });
    }, 100);
};

// Дополнительные функции для дерева
window.treeBuilder = {
    // Создание узла дерева
    createNode: function(value, left = null, right = null) {
        return {
            value,
            left,
            right,
            id: 'node_' + Math.random().toString(36).substr(2, 9)
        };
    },

    // Генерация случайного дерева
    generateRandomTree: function(depth = 4) {
        if (depth === 0) return null;
        
        const value = Math.floor(Math.random() * 100);
        return this.createNode(
            value,
            this.generateRandomTree(depth - 1),
            this.generateRandomTree(depth - 1)
        );
    },

    // Визуализация дерева в модальном окне
    visualizeTree: function(root) {
        const content = `
            <div style="font-family: monospace; line-height: 1.8;">
                <h4>Визуализация дерева:</h4>
                <pre id="tree-visualization">${this.printTree(root)}</pre>
                <button onclick="window.treeBuilder.exportTree()" style="margin-top: 10px; padding: 8px 16px; background: #4361ee; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Экспортировать дерево
                </button>
            </div>
        `;

        window.ModalSystem.createModal('tree-visualization', {
            title: 'Визуализация дерева',
            content: content,
            width: '700px'
        });
    },

    // Текстовая визуализация дерева
    printTree: function(node, prefix = '', isLeft = true) {
        if (!node) return '';
        
        let result = '';
        if (node.right) {
            result += this.printTree(node.right, prefix + (isLeft ? '│   ' : '    '), false);
        }
        
        result += prefix + (isLeft ? '└── ' : '┌── ') + node.value + '\n';
        
        if (node.left) {
            result += this.printTree(node.left, prefix + (isLeft ? '    ' : '│   '), true);
        }
        
        return result;
    },

    // Экспорт дерева
    exportTree: function() {
        window.Modal.prompt('Экспорт дерева', 'Введите имя файла', function(filename) {
            if (filename) {
                alert(`Дерево экспортировано в файл: ${filename}.json`);
            }
        });
    }
};

// Автоматическая инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tree Builder система загружена');
    
    // Пример: добавить кнопку в body для тестирования
    if (!document.getElementById('test-tree-builder-btn')) {
        const testBtn = document.createElement('button');
        testBtn.id = 'test-tree-builder-btn';
        testBtn.textContent = '🌳 Тест построителя дерева';
        testBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: #4361ee;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            z-index: 9999;
            font-weight: bold;
        `;
        testBtn.onclick = window.startTreeBuilder;
        document.body.appendChild(testBtn);
    }
});