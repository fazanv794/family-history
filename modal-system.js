// modal-system.js - улучшенная версия с поддержкой форм
class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.initStyles();
    }

    initStyles() {
        if (document.getElementById('modal-system-styles')) return;

        const styles = `
            .ms-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s;
                backdrop-filter: blur(5px);
            }
            
            .ms-modal-overlay.active {
                opacity: 1;
            }
            
            .ms-modal {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0,0,0,0.25);
                transform: translateY(30px);
                transition: transform 0.3s;
            }
            
            .ms-modal.active {
                transform: translateY(0);
            }
            
            .ms-modal-header {
                padding: 24px;
                background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                color: white;
                position: relative;
            }
            
            .ms-modal-title {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            
            .ms-modal-subtitle {
                margin: 8px 0 0 0;
                opacity: 0.9;
                font-size: 14px;
            }
            
            .ms-modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255,255,255,0.2);
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                color: white;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .ms-modal-close:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .ms-modal-body {
                padding: 0;
                max-height: calc(90vh - 140px);
                overflow-y: auto;
            }
            
            .ms-modal-content {
                padding: 24px;
            }
            
            .ms-modal-footer {
                padding: 20px 24px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                gap: 12px;
            }
            
            .ms-modal-button {
                padding: 12px 24px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                transition: all 0.2s;
                min-width: 100px;
            }
            
            .ms-modal-button-primary {
                background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                color: white;
            }
            
            .ms-modal-button-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(67, 97, 238, 0.3);
            }
            
            .ms-modal-button-secondary {
                background: #6c757d;
                color: white;
            }
            
            .ms-modal-button-secondary:hover {
                background: #5a6268;
            }
            
            .ms-modal-button-success {
                background: #2ecc71;
                color: white;
            }
            
            .ms-modal-button-success:hover {
                background: #27ae60;
            }
            
            /* Формы */
            .ms-form-group {
                margin-bottom: 20px;
            }
            
            .ms-form-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #333;
            }
            
            .ms-form-input, .ms-form-textarea, .ms-form-select {
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                transition: border 0.2s;
            }
            
            .ms-form-input:focus, .ms-form-textarea:focus, .ms-form-select:focus {
                outline: none;
                border-color: #4361ee;
                box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
            }
            
            .ms-form-textarea {
                min-height: 100px;
                resize: vertical;
            }
            
            .ms-form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .ms-form-file {
                border: 2px dashed #ddd;
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                cursor: pointer;
                transition: border 0.2s;
            }
            
            .ms-form-file:hover {
                border-color: #4361ee;
            }
            
            .ms-form-file input {
                display: none;
            }
            
            .ms-form-file-label {
                color: #666;
                font-size: 14px;
            }
            
            .ms-form-file-icon {
                font-size: 32px;
                color: #4361ee;
                margin-bottom: 10px;
            }
            
            /* Списки */
            .ms-relative-list {
                border: 1px solid #e9ecef;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .ms-relative-item {
                padding: 16px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                align-items: center;
                gap: 15px;
                transition: background 0.2s;
            }
            
            .ms-relative-item:hover {
                background: #f8f9fa;
            }
            
            .ms-relative-item:last-child {
                border-bottom: none;
            }
            
            .ms-relative-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #4361ee;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: bold;
            }
            
            .ms-relative-info {
                flex: 1;
            }
            
            .ms-relative-name {
                font-weight: 600;
                margin: 0 0 5px 0;
                color: #333;
            }
            
            .ms-relative-details {
                font-size: 12px;
                color: #666;
                margin: 0;
            }
            
            .ms-relative-actions {
                display: flex;
                gap: 8px;
            }
            
            .ms-action-button {
                padding: 6px 12px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 12px;
            }
            
            /* Шаги */
            .ms-steps {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                position: relative;
            }
            
            .ms-steps:before {
                content: '';
                position: absolute;
                top: 15px;
                left: 0;
                right: 0;
                height: 2px;
                background: #e9ecef;
                z-index: 1;
            }
            
            .ms-step {
                position: relative;
                z-index: 2;
                text-align: center;
                flex: 1;
            }
            
            .ms-step-circle {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #e9ecef;
                color: #666;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 8px;
                font-weight: 600;
                transition: all 0.3s;
            }
            
            .ms-step.active .ms-step-circle {
                background: #4361ee;
                color: white;
            }
            
            .ms-step-label {
                font-size: 12px;
                color: #666;
            }
            
            .ms-step.active .ms-step-label {
                color: #4361ee;
                font-weight: 500;
            }
            
            /* Дерево */
            .ms-tree-preview {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                margin-top: 20px;
                border: 2px dashed #e9ecef;
            }
            
            .ms-tree-placeholder {
                color: #666;
                font-size: 14px;
            }
            
            /* Уведомления */
            .ms-alert {
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .ms-alert-info {
                background: #e3f2fd;
                color: #0d47a1;
                border-left: 4px solid #2196f3;
            }
            
            .ms-alert-success {
                background: #e8f5e9;
                color: #1b5e20;
                border-left: 4px solid #4caf50;
            }
            
            .ms-alert-icon {
                font-size: 20px;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = 'modal-system-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    createModal(id, options = {}) {
        const defaultOptions = {
            title: 'Модальное окно',
            subtitle: '',
            content: '',
            buttons: [],
            width: '600px',
            closeOnOverlay: true,
            showCloseButton: true,
            showSteps: false,
            currentStep: 1,
            totalSteps: 3
        };

        const config = { ...defaultOptions, ...options };

        // Закрываем старое окно с таким же ID
        this.closeModal(id);

        // Создаем overlay
        const overlay = document.createElement('div');
        overlay.className = 'ms-modal-overlay';
        overlay.id = `ms-overlay-${id}`;

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'ms-modal';
        modal.id = `ms-modal-${id}`;
        modal.style.width = config.width;

        // Шаги (если нужны)
        let stepsHTML = '';
        if (config.showSteps) {
            stepsHTML = `
                <div class="ms-steps">
                    ${Array.from({length: config.totalSteps}, (_, i) => i + 1)
                        .map(step => `
                            <div class="ms-step ${step <= config.currentStep ? 'active' : ''}">
                                <div class="ms-step-circle">${step}</div>
                                <div class="ms-step-label">Шаг ${step}</div>
                            </div>
                        `).join('')}
                </div>
            `;
        }

        // Заголовок
        const header = document.createElement('div');
        header.className = 'ms-modal-header';
        header.innerHTML = `
            ${config.showCloseButton ? '<button class="ms-modal-close">&times;</button>' : ''}
            <h2 class="ms-modal-title">${config.title}</h2>
            ${config.subtitle ? `<p class="ms-modal-subtitle">${config.subtitle}</p>` : ''}
            ${stepsHTML}
        `;

        // Тело
        const body = document.createElement('div');
        body.className = 'ms-modal-body';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'ms-modal-content';
        
        if (typeof config.content === 'string') {
            contentDiv.innerHTML = config.content;
        } else if (config.content instanceof HTMLElement) {
            contentDiv.appendChild(config.content);
        } else if (typeof config.content === 'function') {
            contentDiv.appendChild(config.content());
        }
        
        body.appendChild(contentDiv);

        // Футер с кнопками
        const footer = document.createElement('div');
        footer.className = 'ms-modal-footer';

        config.buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `ms-modal-button ms-modal-button-${btn.type || 'secondary'}`;
            button.textContent = btn.text;
            button.onclick = (e) => {
                if (btn.onClick) btn.onClick(e);
                if (btn.closeOnClick !== false) this.closeModal(id);
            };
            footer.appendChild(button);
        });

        // Собираем всё вместе
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);

        // Добавляем в DOM
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Обработчики
        if (config.showCloseButton) {
            overlay.querySelector('.ms-modal-close').onclick = () => this.closeModal(id);
        }

        if (config.closeOnOverlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) this.closeModal(id);
            };
        }

        // Закрытие по ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') this.closeModal(id);
        };
        document.addEventListener('keydown', escHandler);

        // Сохраняем данные
        this.modals.set(id, { overlay, escHandler });

        // Анимация
        setTimeout(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        }, 10);

        return overlay;
    }

    closeModal(id) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const { overlay, escHandler } = modalData;

        document.removeEventListener('keydown', escHandler);

        overlay.querySelector('.ms-modal').classList.remove('active');
        overlay.classList.remove('active');

        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.modals.delete(id);

            if (this.modals.size === 0) {
                document.body.style.overflow = '';
            }
        }, 300);
    }

    updateModal(id, options) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const { overlay } = modalData;
        const modal = overlay.querySelector('.ms-modal');
        
        if (options.title) {
            const titleEl = modal.querySelector('.ms-modal-title');
            if (titleEl) titleEl.textContent = options.title;
        }
        
        if (options.content) {
            const contentEl = modal.querySelector('.ms-modal-content');
            if (contentEl) {
                contentEl.innerHTML = '';
                if (typeof options.content === 'string') {
                    contentEl.innerHTML = options.content;
                } else if (options.content instanceof HTMLElement) {
                    contentEl.appendChild(options.content);
                }
            }
        }
    }
}

// Глобальный экземпляр
window.ModalSystem = new ModalSystem();