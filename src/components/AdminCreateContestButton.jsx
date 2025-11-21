import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

const AdminCreateContestButton = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        max_participants: 100,
        prize: '',
        entry_fee: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // Formatto le date in formato ISO compatibile Laravel
            const formatDate = (dateStr, endOfDay = false) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const hh = endOfDay ? '23' : '00';
                const min = endOfDay ? '59' : '00';
                const ss = endOfDay ? '59' : '00';
                // ISO 8601: YYYY-MM-DDTHH:mm:ss
                return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
            };
            const contestData = {
                ...form,
                start_date: formatDate(form.start_date),
                end_date: formatDate(form.end_date, true),
                prize: form.prize,
                entry_fee: form.entry_fee
            };
            const { contestAPI } = await import('../services/api');
            const res = await contestAPI.create(contestData);
            setSuccess(t('adminPage.contestCreated', 'Contest creato con successo!'));
            setForm({ title: '', description: '', start_date: '', end_date: '', max_participants: 100, prize: '', entry_fee: '' });
            queryClient.invalidateQueries(['contests']);
        } catch (err) {
            setError(err?.response?.data?.message || 'Errore creazione contest');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button className="btn btn-primary mb-4" onClick={() => setShowModal(true)}>
                <i className="bi bi-plus-circle me-2"></i>
                {t('adminPage.createContest', 'Crea contest')}
            </button>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('adminPage.createContest', 'Crea contest')}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    {success && <div className="alert alert-success">{success}</div>}
                                    <div className="mb-3">
                                        <label className="form-label">Titolo</label>
                                        <input type="text" className="form-control" name="title" value={form.title} onChange={handleChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Descrizione</label>
                                        <textarea className="form-control" name="description" value={form.description} onChange={handleChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Data inizio</label>
                                        <input type="date" className="form-control" name="start_date" value={form.start_date} onChange={handleChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Data fine</label>
                                        <input type="date" className="form-control" name="end_date" value={form.end_date} onChange={handleChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Max partecipanti</label>
                                        <input type="number" className="form-control" name="max_participants" value={form.max_participants} onChange={handleChange} min={1} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Premio</label>
                                        <input type="text" className="form-control" name="prize" value={form.prize} onChange={handleChange} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Costo partecipazione (€)</label>
                                        <input type="number" className="form-control" name="entry_fee" value={form.entry_fee} onChange={handleChange} min={0} step="0.01" />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Chiudi
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Creazione...' : 'Crea contest'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminCreateContestButton;
