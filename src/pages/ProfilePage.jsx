
import React, { useState, useRef, useEffect } from 'react';
import '../style/pagesStyle/ProfilePage.css';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';

const ProfilePage = () => {
    const { t } = useTranslation();
    const { user, token, updateUser, setAuth } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');

    // Sincronizza il campo name con lo stato utente ogni volta che user cambia
    useEffect(() => {
        setName(user?.name || '');
        setEmail(user?.email || '');
        setPhone(user?.phone || '');
    }, [user]);
    // Costruisci l'URL assoluto per l'avatar se presente
    // Mostra avatar solo se è un URL valido
    const isValidAvatarUrl = user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/storage/'));
    const avatarUrl = isValidAvatarUrl
        ? (user.avatar.startsWith('/storage/')
            ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}${user.avatar}`
            : user.avatar)
        : null;
    const [avatarPreview, setAvatarPreview] = useState(avatarUrl);

    // Aggiorna avatarPreview quando cambia avatarUrl
    useEffect(() => {
        setAvatarPreview(avatarUrl);
    }, [avatarUrl]);
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef();
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    // Rimuovi avatar
    // Conferma rimozione avatar
    const confirmRemoveAvatar = () => {
        setShowConfirmModal(true);
    };

    const handleRemoveAvatar = async () => {
        setLoading(true);
        setSuccess('');
        setError('');
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('remove_avatar', 'true'); // flag esplicito per rimozione
            formData.append('_method', 'PATCH');
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
            const res = await fetch(`${apiBase}/user`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                const userRes = await fetch(`${apiBase}/user`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const userData = await userRes.json();
                console.log('DEBUG GET /user dopo rimozione avatar:', userData);
                if (userRes.ok && userData.user) {
                    setAuth(userData.user, token);
                }
                setAvatarPreview(null);
                setAvatarFile(null);
                setSuccess('Avatar rimosso!');
            } else {
                setError(data.message || 'Errore durante la rimozione');
            }
        } catch (err) {
            setError('Errore di rete');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');
        setError('');
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            if (avatarFile) formData.append('avatar', avatarFile);
            formData.append('_method', 'PATCH');
            console.log('Invio POST /user con:', { name, email, phone });

            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
            const res = await fetch(`${apiBase}/user`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();
            console.log('PATCH /user response:', data);
            if (res.ok) {
                // Ricarica dati utente dal backend
                const userRes = await fetch(`${apiBase}/user`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const userData = await userRes.json();
                console.log('GET /user response:', userData);
                if (userRes.ok && userData.user) {
                    setAuth(userData.user, token);
                }
                setSuccess('Profilo aggiornato!');
            } else {
                setError(data.message || 'Errore durante l’aggiornamento');
            }
        } catch (err) {
            setError('Errore di rete');
        }
        setLoading(false);
    };

    return (
        <div className="profile-page container my-5">
            {/* Modal conferma rimozione avatar - con CSS esterno */}
            {showConfirmModal && (
                <div className="profile-confirm-modal-backdrop">
                    <div className="modal d-block profile-confirm-modal" tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{t('confirm_remove_avatar_title')}</h5>
                                </div>
                                <div className="modal-body">
                                    <p>{t('confirm_remove_avatar_message')}</p>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                                        {t('cancel')}
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={() => { setShowConfirmModal(false); handleRemoveAvatar(); }}>
                                        {t('remove_avatar')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card p-4">
                        <h1 className="h2 mb-4 text-center">{t('my_profile')}</h1>
                        <form onSubmit={handleSubmit} encType="multipart/form-data">
                            <div className="mb-4 text-center">
                                <div className="avatar-wrapper mb-2">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar"
                                            className="rounded-circle border"
                                            style={{ width: 120, height: 120, objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span className="bg-primary text-white fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: 120, height: 120, fontSize: 48 }}>
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleAvatarChange}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm me-2"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {t('change_avatar')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={confirmRemoveAvatar}
                                    disabled={loading || !user?.avatar}
                                >
                                    {t('remove_avatar')}
                                </button>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">{t('name')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    minLength={2}
                                    maxLength={255}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">{t('email')}</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    maxLength={255}
                                    required
                                    disabled={!!user?.provider}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">{t('phone')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    maxLength={20}
                                    placeholder={t('add_or_edit_phone')}
                                />
                            </div>
                            {success && <div className="alert alert-success">{t(success)}</div>}
                            {error && <div className="alert alert-danger">{t(error)}</div>}
                            <div className="d-grid">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? t('saving') : t('save_changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;