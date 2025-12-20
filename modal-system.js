/**
 * ModalSystem - система модальных окон
 */

class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.zIndex = 10000;
        this.initStyles();
        console.log('✅ ModalSystem инициализирован');
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
                z-index: ${this.zIndex};
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s, visibility 0.3s;
                backdrop-filter: blur(5px);
            }
            
            .ms-modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .ms-modal {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0,0,0,0.25);
                transform: translateY(30px) scale(0.95);
                transition: transform 0.3s;
            }
            
            .ms-modal.active {
                transform: translateY(0) scale(1);
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
            
            .ms-modal-button-danger {
                background: #e74c3c;
                color: white;
            }
            
            .ms-modal-button-danger:hover {
                background: #c0392b;
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
            
            /* Шаги */
            .ms-steps {
                display: flex;
                justify-content: space-between;
                margin: 20px 0 30px;
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
            
            body.ms-modal-open {
                overflow: hidden;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = 'modal-system-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    createModal(id, options = {}) {
        // Закрываем старое окно с таким же ID
        this.closeModal(id);

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

        // Создаем overlay
        const overlay = document.createElement('div');
        overlay.className = 'ms-modal-overlay';
        overlay.id = `ms-overlay-${id}`;

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
        const headerHTML = `
            <div class="ms-modal-header">
                ${config.showCloseButton ? '<button class="ms-modal-close">&times;</button>' : ''}
                <h2 class="ms-modal-title">${config.title}</h2>
                ${config.subtitle ? `<p class="ms-modal-subtitle">${config.subtitle}</p>` : ''}
                ${stepsHTML}
            </div>
        `;

        // Тело
        const bodyHTML = `
            <div class="ms-modal-body">
                <div class="ms-modal-content">
                    ${typeof config.content === 'string' ? config.content : ''}
                </div>
            </div>
        `;

        // Футер
        let footerHTML = '';
        if (config.buttons && config.buttons.length > 0) {
            const buttonsHTML = config.buttons.map(btn => `
                <button class="ms-modal-button ms-modal-button-${btn.type || 'secondary'}"
                        onclick="window.ModalSystem.handleButtonClick('${id}', ${JSON.stringify(btn).replace(/'/g, "\\'")})">
                    ${btn.text}
                </button>
            `).join('');

            footerHTML = `
                <div class="ms-modal-footer">
                    ${buttonsHTML}
                </div>
            `;
        }

        // Собираем модальное окно
        const modalHTML = `
            <div class="ms-modal" id="ms-modal-${id}" style="width: ${config.width}">
                ${headerHTML}
                ${bodyHTML}
                ${footerHTML}
            </div>
        `;

        overlay.innerHTML = modalHTML;
        document.body.appendChild(overlay);
        document.body.classList.add('ms-modal-open');

        // Обработчики событий
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

        // Сохраняем конфиг и обработчики
        this.modals.set(id, {
            overlay,
            escHandler,
            config
        });

        // Анимация появления
        setTimeout(() => {
            overlay.classList.add('active');
            overlay.querySelector('.ms-modal').classList.add('active');
        }, 10);

        // Если передан HTMLElement, добавляем его в контент
        if (config.content instanceof HTMLElement) {
            const contentDiv = overlay.querySelector('.ms-modal-content');
            contentDiv.innerHTML = '';
            contentDiv.appendChild(config.content);
        }

        return overlay;
    }

    handleButtonClick(modalId, buttonConfig) {
        if (buttonConfig.onClick && typeof buttonConfig.onClick === 'function') {
            buttonConfig.onClick();
        }
        
        if (buttonConfig.closeOnClick !== false) {
            this.closeModal(modalId);
        }
    }

    closeModal(id) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const { overlay, escHandler } = modalData;

        // Удаляем обработчик ESC
        document.removeEventListener('keydown', escHandler);

        // Анимация закрытия
        const modal = overlay.querySelector('.ms-modal');
        modal.classList.remove('active');
        overlay.classList.remove('active');

        // Удаляем через время
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.modals.delete(id);

            // Если нет открытых модалок, разблокируем скролл
            if (this.modals.size === 0) {
                document.body.classList.remove('ms-modal-open');
            }
        }, 300);
    }

    closeAll() {
        this.modals.forEach((_, id) => this.closeModal(id));
    }
}

// Создаем глобальный экземпляр
window.ModalSystem = new ModalSystem();

// Простые утилиты
window.Modal = {
    alert: function(title, message) {
        return window.ModalSystem.createModal('alert_' + Date.now(), {
            title,
            content: `<p>${message}</p>`,
            buttons: [{
                text: 'OK',
                type: 'primary'
            }]
        });
    },

    confirm: function(title, message, onConfirm, onCancel) {
        return window.ModalSystem.createModal('confirm_' + Date.now(), {
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary',
                    onClick: onCancel
                },
                {
                    text: 'Подтвердить',
                    type: 'primary',
                    onClick: onConfirm
                }
            ]
        });
    },

    prompt: function(title, defaultValue, onConfirm) {
        const inputId = 'prompt-input-' + Date.now();
        const content = `
            <p>${title}</p>
            <input type="text" 
                   id="${inputId}" 
                   value="${defaultValue || ''}"
                   class="ms-form-input"
                   placeholder="Введите значение">
        `;

        return window.ModalSystem.createModal('prompt_' + Date.now(), {
            title,
            content,
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary'
                },
                {
                    text: 'OK',
                    type: 'primary',
                    onClick: () => {
                        const input = document.getElementById(inputId);
                        if (onConfirm) onConfirm(input.value);
                    }
                }
            ]
        });
    }
};

console.log('✅ ModalSystem загружен');