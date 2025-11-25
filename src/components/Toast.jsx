import React, { useState, useEffect } from 'react';
import '../style/componentsStyle/Toast.css';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                if (onClose) onClose();
            }, 300); // Tempo per animazione fadeout
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getToastIcon = () => {
        switch (type) {
            case 'success':
                return 'bi-check-circle-fill';
            case 'error':
                return 'bi-exclamation-triangle-fill';
            case 'warning':
                return 'bi-exclamation-circle-fill';
            default:
                return 'bi-info-circle-fill';
        }
    };

    const getToastClass = () => {
        const baseClass = 'toast-notification';
        const typeClass = `toast-${type}`;
        const visibilityClass = isVisible ? 'toast-visible' : 'toast-hidden';

        return `${baseClass} ${typeClass} ${visibilityClass}`;
    };

    return (
        <div className={getToastClass()}>
            <div className="toast-content">
                <i className={`toast-icon bi ${getToastIcon()}`}></i>
                <span className="toast-message">{message}</span>
                <button
                    className="toast-close-button"
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => {
                            if (onClose) onClose();
                        }, 300);
                    }}
                    aria-label="Chiudi notifica"
                >
                    <i className="bi bi-x"></i>
                </button>
            </div>
        </div>
    );
};

export default Toast;