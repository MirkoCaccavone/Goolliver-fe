
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const ModerationPage = () => {
    const { t } = useTranslation();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImg, setModalImg] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectPhotoId, setRejectPhotoId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectCategory, setRejectCategory] = useState('inappropriate');
    const [rejectLoading, setRejectLoading] = useState(false);
    const rejectCategories = [
        'adult', 'violence', 'hatred', 'harassment', 'self_harm', 'illegal', 'spam', 'inappropriate'
    ];

    useEffect(() => {
        fetchPhotos(page);
        // eslint-disable-next-line
    }, [page]);

    const fetchPhotos = async (pageNum = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/moderation/photos/pending`, {
                params: { page: pageNum, per_page: 20 }
            });
            setPhotos(res.data.data || []);
            setPagination(res.data.pagination);
        } catch (err) {
            setError(t('moderationPage.errorLoading'));
        }
        setLoading(false);
    };

    const handleModerate = async (photoId, action) => {
        setError(null);
        if (action === 'reject') {
            setRejectPhotoId(photoId);
            setRejectModalOpen(true);
            setRejectReason('');
            setRejectCategory('inappropriate');
            return;
        }
        try {
            await api.post(`/moderation/photos/${photoId}/${action}`);
            setPhotos(photos.filter(photo => photo.id !== photoId));
        } catch (err) {
            setError(t('moderationPage.errorUpdate'));
        }
    };

    const submitReject = async (e) => {
        e.preventDefault();
        setRejectLoading(true);
        setError(null);
        try {
            await api.post(`/moderation/photos/${rejectPhotoId}/reject`, {
                reason: rejectReason,
                category: rejectCategory
            });
            setPhotos(photos.filter(photo => photo.id !== rejectPhotoId));
            setRejectModalOpen(false);
        } catch (err) {
            setError(t('moderationPage.errorReject'));
        }
        setRejectLoading(false);
    };

    if (loading) return <div>{t('moderationPage.loading')}</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="container py-4">
            <h2 className="mb-4">{t('moderationPage.title')}</h2>
            {photos.length === 0 ? (
                <div className="alert alert-info">{t('moderationPage.noPhotos')}</div>
            ) : (
                <ul className="list-unstyled">
                    {photos.map(photo => (
                        <li key={photo.id} className="mb-4 border rounded p-3 shadow-sm">
                            <div className="row align-items-center">
                                <div className="col-md-3">
                                    <img src={photo.photo_url || photo.thumbnail_url} alt={photo.title} style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer' }} onClick={() => { setModalImg(photo.photo_url || photo.thumbnail_url); setModalOpen(true); }} />
                                    <button className="btn btn-outline-primary mt-2 w-100" onClick={() => { setModalImg(photo.photo_url || photo.thumbnail_url); setModalOpen(true); }}>
                                        {t('moderationPage.enlarge')}
                                    </button>
                                </div>
                                <div className="col-md-6">
                                    <div><strong>{t('moderationPage.photoTitle')}:</strong> {photo.title || t('moderationPage.noTitle')}</div>
                                    <div><strong>{t('moderationPage.author')}:</strong> {photo.user?.name} ({photo.user?.email})</div>
                                    <div><strong>{t('moderationPage.contest')}:</strong> {photo.contest?.title}</div>
                                    <div><strong>{t('moderationPage.uploadDate')}:</strong> {new Date(photo.created_at).toLocaleString()}</div>
                                    <div><strong>{t('moderationPage.moderationStatus')}:</strong> {photo.moderation_status}</div>
                                    <div><strong>{t('moderationPage.aiScore')}:</strong> {photo.moderation_score}</div>
                                    <div><strong>{t('moderationPage.description')}:</strong> {photo.description}</div>
                                </div>
                                <div className="col-md-3 text-end">
                                    <button className="btn btn-success me-2" onClick={() => handleModerate(photo.id, 'approve')}>{t('moderationPage.approve')}</button>
                                    <button className="btn btn-danger" onClick={() => handleModerate(photo.id, 'reject')}>{t('moderationPage.reject')}</button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {pagination && pagination.last_page > 1 && (
                <nav className="mt-4">
                    <ul className="pagination justify-content-center">
                        {[...Array(pagination.last_page)].map((_, idx) => (
                            <li key={idx} className={`page-item${pagination.current_page === idx + 1 ? ' active' : ''}`}>
                                <button className="page-link" onClick={() => setPage(idx + 1)}>{idx + 1}</button>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}

            {/* Modal per immagine ingrandita */}
            {modalOpen && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.7)' }} tabIndex="-1" onClick={() => setModalOpen(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('moderationPage.enlargedImage')}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                            </div>
                            <div className="modal-body text-center">
                                <img src={modalImg} alt={t('moderationPage.enlargedImage')} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal per rifiuto */}
            {rejectModalOpen && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.7)' }} tabIndex="-1" onClick={() => setRejectModalOpen(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <form onSubmit={submitReject}>
                                <div className="modal-header">
                                    <h5 className="modal-title">{t('moderationPage.rejectPhoto')}</h5>
                                    <button type="button" className="btn-close" onClick={() => setRejectModalOpen(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">{t('moderationPage.rejectReason')}</label>
                                        <input type="text" className="form-control" value={rejectReason} onChange={e => setRejectReason(e.target.value)} required maxLength={500} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('moderationPage.category')}</label>
                                        <select className="form-select" value={rejectCategory} onChange={e => setRejectCategory(e.target.value)} required>
                                            {rejectCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setRejectModalOpen(false)} disabled={rejectLoading}>{t('cancel')}</button>
                                    <button type="submit" className="btn btn-danger" disabled={rejectLoading || !rejectReason}>{t('moderationPage.reject')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModerationPage;
