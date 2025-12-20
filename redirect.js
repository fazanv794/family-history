// redirect.js - Перенаправления для неавторизованных пользователей

console.log('🔄 Redirect.js загружен');

// Функция для проверки и перенаправления
window.checkAndRedirect = function() {
    const protectedPages = ['app.html', 'tree.html', 'timeline.html', 'media.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Если пользователь на защищенной странице без авторизации
    if (protectedPages.includes(currentPage) && !window.currentUser) {
        console.log('🚫 Неавторизованный доступ к защищенной странице');
        
        // Сохраняем текущую страницу для возврата
        sessionStorage.setItem('returnUrl', currentPage);
        
        // Показываем уведомление
        if (window.showNotification) {
            window.showNotification('Для доступа необходимо войти в систему', 'error');
        }
        
        // Перенаправляем через 1 секунду
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
        
        return false;
    }
    
    return true;
};

// Автоматическая проверка при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Ждем немного чтобы app.js успел загрузить currentUser
    setTimeout(() => {
        window.checkAndRedirect();
    }, 500);
});