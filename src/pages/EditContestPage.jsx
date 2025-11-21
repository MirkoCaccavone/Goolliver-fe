import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contestAPI } from '../services/api';


const EditContestPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        prize: '',
        start_date: '',
        end_date: '',
        max_participants: '',
        status: '',
    });

    useEffect(() => {
        setLoading(true);
        contestAPI.getById(id)
            .then(res => {
                const c = res.data;
                setForm({
                    title: c.title || '',
                    description: c.description || '',
                    prize: c.prize || '',
                    start_date: c.start_date ? c.start_date.slice(0, 10) : '',
                    end_date: c.end_date ? c.end_date.slice(0, 10) : '',
                    max_participants: c.max_participants || '',
                    status: c.status || '',
                });
                setLoading(false);
            })
            .catch(() => {
                setError('Errore nel caricamento dati contest');
                setLoading(false);
            });
    }, [id]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await contestAPI.update(id, {
                ...form,
                max_participants: Number(form.max_participants),
            });
            setSuccess('Contest aggiornato con successo!');
            setTimeout(() => navigate('/admin-dashboard'), 1200);
        } catch (err) {
            setError('Errore durante il salvataggio.');
        }
        setSaving(false);
    };

    if (loading) return <div className="container mt-5">Caricamento dati contest...</div>;

    return (
        <div className="container mt-5" style={{ maxWidth: 600 }}>
            <h2>Modifica Contest</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Titolo</label>
                    <input type="text" className="form-control" name="title" value={form.title} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Descrizione</label>
                    <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={3} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Premio</label>
                    <input type="text" className="form-control" name="prize" value={form.prize} onChange={handleChange} />
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
                    <label className="form-label">Stato</label>
                    <select className="form-select" name="status" value={form.status} onChange={handleChange} required>
                        <option value="active">Attivo</option>
                        <option value="ended">Concluso</option>
                        <option value="draft">Bozza</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva modifiche'}</button>
                <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/admin-dashboard')} disabled={saving}>Annulla</button>
            </form>
        </div>
    );
};

export default EditContestPage;
