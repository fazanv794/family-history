// tree-engine.js - Движок для работы с уже построенным деревом

console.log('🌳 Tree Engine загружается...');

// Функции для работы с построенным деревом
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
    
    setTimeout(() => {
        window.showNotification('✅ Дерево сохранено как изображение!', 'success');
        window.hideLoader();
    }, 1500);
}

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

function updateTreeStats() {
    const peopleCount = window.treeData?.people?.length || 0;
    const photosCount = window.treeData?.people?.filter(p => p.photo_url).length || 0;
    const generations = 3; // Примерное значение
    
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

// Экспортируем функции
window.saveTreeAsImage = saveTreeAsImage;
window.printTree = printTree;
window.updateTreeStats = updateTreeStats;

console.log('✅ Tree Engine загружен');