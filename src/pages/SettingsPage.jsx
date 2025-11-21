import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const SettingsPage = () => {
    const { t } = useTranslation();
    // Handler cancellazione account con doppia conferma e chiamata API reale
    const handleDeleteAccount = async () => {
        const firstConfirm = window.confirm(
            t('Se elimini l\'account perderai tutti i dati, le foto caricate e le partecipazioni ai contest. Vuoi continuare?')
        );
        if (!firstConfirm) return;
        const secondConfirm = window.confirm(
            t('Questa azione è irreversibile. Sei sicuro di voler eliminare definitivamente il tuo account?')
        );
        if (!secondConfirm) return;
        try {
            // Chiamata API reale
            const { authAPI } = await import('../services/api');
            await authAPI.deleteAccount();
            // Logout
            localStorage.removeItem('goolliver-auth');
            // Redirect con messaggio di feedback
            window.location.href = `/login?accountDeleted=1`;
        } catch (error) {
            console.error('Errore cancellazione account:', error);
            alert(t('Si è verificato un errore durante la cancellazione dell\'account. Riprova più tardi.'));
        }
    };
    const [notifications, setNotifications] = React.useState(true);
    const [privacy, setPrivacy] = React.useState('public');
    const [theme, setTheme] = React.useState(localStorage.getItem('goolliver-theme') || 'light');
    const [language, setLanguage] = React.useState(i18n.language || localStorage.getItem('language') || 'it');
    // rimosso doppia dichiarazione

    React.useEffect(() => {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
        localStorage.setItem('goolliver-theme', theme);
    }, [theme]);

    React.useEffect(() => {
        if (language !== i18n.language) {
            i18n.changeLanguage(language);
        }
        localStorage.setItem('language', language);
    }, [language]);

    return (
        <div className="settings-page container my-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card p-4">
                        <h1 className="h2 mb-4 text-center">{t('settings')}</h1>

                        {/* Notifiche */}
                        <div className="mb-4">
                            <h5>{t('notifications')}</h5>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="notificationsSwitch"
                                    checked={notifications}
                                    onChange={e => setNotifications(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="notificationsSwitch">
                                    {t('Receive email notifications')}
                                </label>
                            </div>
                        </div>

                        {/* Privacy */}
                        <div className="mb-4">
                            <h5>{t('privacy')}</h5>
                            <select
                                className="form-select"
                                value={privacy}
                                onChange={e => setPrivacy(e.target.value)}
                            >
                                <option value="public">{t('Public profile')}</option>
                                <option value="private">{t('Private profile')}</option>
                            </select>
                        </div>

                        {/* Tema */}
                        <div className="mb-4">
                            <h5>{t('theme')}</h5>
                            <select
                                className="form-select"
                                value={theme}
                                onChange={e => setTheme(e.target.value)}
                            >
                                <option value="light">{t('light')}</option>
                                <option value="dark">{t('dark')}</option>
                            </select>
                        </div>

                        {/* Lingua */}
                        <div className="mb-4">
                            <h5>{t('language')}</h5>
                            <select
                                className="form-select"
                                value={language}
                                onChange={e => setLanguage(e.target.value)}
                            >
                                <option value="it">Italiano</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        {/* Gestione account */}
                        <div className="mb-4">
                            <h5>{t('account')}</h5>
                            <button className="btn btn-outline-danger" type="button" onClick={handleDeleteAccount}>
                                {t('Delete account')}
                            </button>
                            <button className="btn btn-outline-secondary ms-2" type="button">
                                {t('Download your data')}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;