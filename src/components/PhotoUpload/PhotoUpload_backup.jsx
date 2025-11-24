// ...existing code...
import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { photoAPI, paymentAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import stripePromise from '../../utils/stripe';
import PaymentForm from '../PaymentForm/PaymentForm';
import { useToastStore } from '../../stores/toastStore';
import { useNavigate } from 'react-router-dom';
import './PhotoUpload.css';

const PhotoUpload = ({ contest, onUploadSuccess, onCancel }) => {
    // ...existing code...

    // Funzione helper per creare una entry (deve essere dentro il componente per accedere a selectedFile, contest, photoData)
    const createEntry = async () => {
        const formData = new FormData();
        formData.append('photo', selectedFile);
        formData.append('contest_id', contest.id);
        formData.append('title', photoData.title);
        formData.append('description', photoData.description);
        formData.append('location', photoData.location);
        formData.append('camera_model', photoData.camera_model);
        formData.append('settings', photoData.settings);
        // payment_status: 'pending' (verrà aggiornato dopo il pagamento)
        formData.append('payment_status', 'pending');
        return await photoAPI.upload(formData);
    };
    const { token, user } = useAuthStore();
    // Query crediti utente
    const { data: creditsData } = useQuery({
        queryKey: ['userCredits'],
        queryFn: photoAPI.getUserCredits,
        enabled: !!user
    });
    const userCredits = creditsData?.data?.photo_credits ?? 0;
    const creditValue = 0.2;
    const maxUsableCredits = Math.min(userCredits, 10);
    const creditEuroValue = (userCredits * creditValue).toFixed(2);
    const maxDiscount = (maxUsableCredits * creditValue).toFixed(2);
    const entryFee = contest?.entry_fee || 2.0;
    const finalAmount = (entryFee - maxDiscount > 0 ? (entryFee - maxDiscount) : 0).toFixed(2);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null); // 'card' | 'credit' | 'mixed'
    const queryClient = useQueryClient();
    const [uploadState, setUploadState] = useState('idle');
    const [paymentEntryId, setPaymentEntryId] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [photoData, setPhotoData] = useState({
        title: '',
        description: '',
        camera_model: '',
        settings: ''
    });
    const [moderationResult, setModerationResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const showToast = useToastStore((state) => state.showToast);
    const navigate = useNavigate();

    const fileInputRef = useRef(null);

    // Verifica se l'utente ha già partecipato a questo contest
    const [forceCleanup, setForceCleanup] = useState(false);
    const { data: userPhotos, isLoading: userPhotosLoading, refetch } = useQuery({
        queryKey: ['user-photos', forceCleanup],
        queryFn: () => forceCleanup
            ? photoAPI.getUserPhotos({ cleanup_pending: 1 })
            : photoAPI.getUserPhotos(),
        select: (response) => {
            const photos = response.data?.entries || [];
            return photos;
        },
        enabled: !!user,
    });

    // useEffect: controlla stato entry su mount/refresh
    React.useEffect(() => {
        if (!user?.id || !contest?.id) return;
        fetch(`http://127.0.0.1:8000/api/entries/last?user_id=${user.id}&contest_id=${contest.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.expired) {
                    setErrorMessage(data.message || 'Upload scaduto. Carica una nuova foto.');
                    setUploadState('idle');
                    setShowPaymentForm(false);
                    setModerationResult(null);
                } else if (data.entry) {
                    if (data.entry.payment_status === 'completed' && data.entry.moderation_status === 'approved') {
                        setUploadState('completed');
                        setModerationResult(data.entry);
                        setShowPaymentForm(false);
                        setErrorMessage('');
                    } else if (data.entry.payment_status === 'pending') {
                        setUploadState('payment');
                        setModerationResult(data.entry);
                        setShowPaymentForm(true);
                        setErrorMessage('');
                    } else {
                        setUploadState('idle');
                        setShowPaymentForm(false);
                        setModerationResult(null);
                        setErrorMessage('');
                    }
                } else {
                    setUploadState('idle');
                    setShowPaymentForm(false);
                    setModerationResult(null);
                    setErrorMessage('');
                }
            })
            .catch(() => {
                setErrorMessage('Errore nel recupero dello stato della partecipazione.');
            });
    }, [user?.id, contest?.id]);


    // Se la pagina viene caricata con una entry pending già esistente (refresh), elimina la entry
    React.useEffect(() => {
        if (userPhotos && Array.isArray(userPhotos)) {
            const pending = userPhotos.find(photo => photo.contest_id === contest?.id && photo.payment_status === 'pending');
            if (pending && uploadState === 'idle') {
                photoAPI.delete(pending.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['user-photos'] });
                    setUploadState('idle');
                    setModerationResult(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setPhotoData({
                        title: '',
                        description: '',
                        location: '',
                        camera_model: '',
                        settings: ''
                    });
                });
            }
        }
    }, [userPhotos, contest?.id, queryClient, uploadState]);

    // Gestisce il risultato della moderazione - DEVE essere definito prima degli hooks di dropzone
    // handleModerationResult: NON deve mai creare entry nel DB, solo aggiornare lo stato locale
    const handleModerationResult = useCallback((response) => {
        setModerationResult(response);
        queryClient.invalidateQueries({ queryKey: ['user-photos'] });
        queryClient.invalidateQueries({ queryKey: ['contest-entries', contest?.id] });
        queryClient.invalidateQueries({ queryKey: ['contest-participation', contest?.id] });
        switch (response.moderation_status) {
            case 'rejected':
                setUploadState('rejected');
                break;
            case 'approved':
                setUploadState('approved');
                break;
            case 'pending':
                setUploadState('pending');
                break;
            case 'pending_review':
                setUploadState('pending_review');
                break;
            default:
                setUploadState('approved');
        }
    }, [queryClient, contest?.id]);

    // Mutation per l'upload - DEVE essere prima di qualsiasi return
    const uploadMutation = useMutation({
        mutationFn: async (formData) => {
            // Usa photoAPI.upload per upload e moderazione AI
            try {
                console.log('Starting upload...');
                const response = await photoAPI.upload(formData);
                return response.data;
            } catch (error) {
                console.error('Upload error details:', error);
                if (error.response?.data) {
                    console.error('Backend error response:', error.response.data);
                }
                throw error;
            }
        },
        onSuccess: (response) => {
            console.log('Upload success:', response);
            handleModerationResult(response.entry || response);
        },
        onError: (error) => {
            console.error('Upload error:', error);
            let errorMsg = 'Errore durante l\'upload. Riprova.';
            if (error.response?.data) {
                const data = error.response.data;
                if (data.message) {
                    errorMsg = data.message;
                } else if (data.error) {
                    errorMsg = data.error;
                } else if (data.errors) {
                    const firstError = Object.values(data.errors)[0];
                    if (Array.isArray(firstError) && firstError.length > 0) {
                        errorMsg = firstError[0];
                    }
                }
            }
            setErrorMessage(errorMsg);
            setUploadState('error');
            setUploadProgress(0);
        }
    });


    // Gestisce la selezione del file - DEVE essere definito prima dei return
    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setErrorMessage('');

        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors.some(e => e.code === 'file-too-large')) {
                setErrorMessage('File troppo grande. Massimo 10MB.');
            } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
                setErrorMessage('Tipo file non supportato. Solo JPG, PNG, WEBP.');
            }
            return;
        }

        const file = acceptedFiles[0];
        if (file) {
            console.log('File selected:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });
            setSelectedFile(file);

            // Crea preview
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(file);

            // Auto-popola il titolo
            setPhotoData(prev => ({
                ...prev,
                title: prev.title || file.name.replace(/\.[^/.]+$/, "")
            }));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.webp']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 1,
        disabled: uploadState !== 'idle'
    });

    // Gestisce l'invio del form - solo moderazione AI
    const handleSubmit = useCallback(async () => {
        if (selectedPaymentMethod === 'mixed') {
            // In modalità pagamento misto, la submit viene gestita dal PaymentForm
            return;
        }
        if (!selectedFile) {
            setErrorMessage('Seleziona una foto prima di procedere.');
            return;
        }

        console.log('File validation before upload:', {
            file: selectedFile,
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
            isFile: selectedFile instanceof File
        });

        if (!photoData.title.trim()) {
            setErrorMessage('Il titolo è obbligatorio.');
            return;
        }

        setUploadState('uploading');
        setUploadProgress(0);
        setErrorMessage('');

        const formData = new FormData();
        formData.append('photo', selectedFile);
        formData.append('contest_id', contest.id);
        formData.append('title', photoData.title);
        formData.append('description', photoData.description);
        formData.append('location', photoData.location);
        formData.append('camera_model', photoData.camera_model);
        formData.append('settings', photoData.settings);

        // Simulate moderation delay
        setTimeout(() => {
            if (uploadState === 'uploading') {
                setUploadState('moderating');
            }
        }, 2000);

        uploadMutation.mutate(formData);
    }, [selectedFile, photoData, contest.id, uploadState, uploadMutation, selectedPaymentMethod]);

    // Gestisce il reset
    const handleReset = useCallback(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadState('idle');
        setUploadProgress(0);
        setModerationResult(null);
        setErrorMessage('');
        setPhotoData({
            title: '',
            description: '',
            location: '',
            camera_model: '',
            settings: ''
        });
    }, []);

    // Gestisce il reset per caricare un'altra foto (elimina Entry e resetta tutto)
    const handleResetForNewUpload = useCallback(async () => {
        try {
            // Se c'è un moderationResult con ID, elimina l'Entry dal database
            if (moderationResult?.id) {
                console.log('🗑️ Eliminazione Entry dal database:', moderationResult.id);
                await photoAPI.delete(moderationResult.id);
                console.log('✅ Entry eliminata con successo');
            }
        } catch (error) {
            console.error('❌ Errore nell\'eliminazione Entry:', error);
            // Continua comunque con il reset locale
        }

        // Resetta lo stato locale
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadState('idle');
        setUploadProgress(0);
        setModerationResult(null);
        setErrorMessage('');
        setPhotoData({
            title: '',
            description: '',
            location: '',
            camera_model: '',
            settings: ''
        });

        // Invalida le query per resettare lo stato di partecipazione
        queryClient.invalidateQueries({ queryKey: ['user-photos'] });
        queryClient.invalidateQueries({ queryKey: ['contest-entries', contest?.id] });
        queryClient.invalidateQueries({ queryKey: ['contest-participation', contest?.id] });

        console.log('🔄 Reset completo per nuovo upload - Entry eliminata e cache invalidata');
    }, [moderationResult, queryClient, contest?.id]);

    // Gestisce il pagamento
    const handlePayment = useCallback(() => {
        setUploadState('payment');
    }, []);

    // Gestisce il successo del pagamento
    const handlePaymentSuccess = useCallback(async (paymentData) => {
        // Calcola creditsToUse in base a paymentData
        const creditsToUse = typeof paymentData.creditsToUse === 'number' ? paymentData.creditsToUse : (typeof paymentData.creditsToUse === 'string' ? parseInt(paymentData.creditsToUse, 10) : 0);
        try {
            let entryId = paymentEntryId;
            let entryResponse = null;
            // Se non abbiamo già una entry, creala
            if (!entryId) {
                entryResponse = await createEntry();
                entryId = entryResponse.data?.entry?.id || entryResponse.data?.id;
                if (!entryId) {
                    console.error('[UPLOAD] Entry ID non trovato:', entryResponse);
                    throw new Error('Impossibile creare la entry');
                }
                setPaymentEntryId(entryId);
            }

            // 2. Processa il pagamento
            const paymentPayload = {
                entry_id: entryId,
                payment_method_id: paymentData.paymentMethodId, // deve essere fornito dal PaymentForm
                amount: paymentData.amount,
                creditsToUse: creditsToUse > 0 ? creditsToUse : undefined
            };
            const paymentResult = await paymentAPI.processPayment(paymentPayload);
            console.log('[PAGAMENTO] Risposta paymentAPI.processPayment:', paymentResult);
            if (paymentResult.success === false) {
                console.error('[PAGAMENTO] Pagamento fallito:', paymentResult);
                throw new Error(paymentResult.message || 'Pagamento fallito');
            }

            // 3. Successo: aggiorna stato e mostra conferma
            setUploadState('completed');
            queryClient.invalidateQueries({ queryKey: ['user-photos'] });
            queryClient.invalidateQueries({ queryKey: ['contest-entries', contest.id] });
            queryClient.invalidateQueries({ queryKey: ['contest', contest.id] });
            queryClient.invalidateQueries({ queryKey: ['contest-participation', contest.id] });
            if (onUploadSuccess) {
                // Se abbiamo appena creato la entry, usiamo quella, altrimenti fetch locale
                onUploadSuccess({
                    ...(entryResponse ? entryResponse.entry : {}),
                    contest_id: contest.id,
                    ...photoData,
                    payment: paymentResult
                });
            }
            showToast('Pagamento completato con successo!', 'success', 4000);
            setTimeout(() => {
                navigate(`/contest/${contest.id}`);
            }, 2500);
        } catch (error) {
            console.error('[ERRORE] handlePaymentSuccess:', error);
            let errorMsg = error?.message || '';
            // Messaggio utente più chiaro
            if (!errorMsg || errorMsg.match(/400|Request failed/i)) {
                errorMsg = 'Il pagamento non è andato a buon fine. Nessun importo è stato addebitato. Puoi riprovare.';
            }
            if (errorMsg.includes('Pagamento fallito')) {
                errorMsg = 'Pagamento rifiutato: controlla i dati della carta o usa un altro metodo.';
            }
            setPaymentEntryId(null); // Reset entryId su QUALSIASI errore di pagamento
            showToast(errorMsg, 'error', 6000);
            setErrorMessage(errorMsg);
            setUploadState('payment'); // Permette di ripetere il pagamento
        }
    }, [contest.id, onUploadSuccess, photoData, queryClient, selectedFile, navigate, showToast]);

    const handlePaymentError = useCallback((error) => {
        console.error('❌ Errore pagamento:', error);
        setErrorMessage(`Errore nel pagamento: ${error}`);
        setUploadState('idle');

        // Mostra Toast di errore
        showToast(`Errore nel pagamento: ${error}`, 'error', 4000);
        // Invalida e refetcha le query per aggiornare lo stato locale
        queryClient.invalidateQueries({ queryKey: ['user-photos'] });
        queryClient.invalidateQueries({ queryKey: ['contest-entries', contest.id] });
        queryClient.invalidateQueries({ queryKey: ['contest-participation', contest.id] });
        queryClient.refetchQueries({ queryKey: ['user-photos'] });
        queryClient.refetchQueries({ queryKey: ['contest-entries', contest.id] });
        queryClient.refetchQueries({ queryKey: ['contest-participation', contest.id] });

        // Pulizia entry pending solo dopo errore pagamento
        photoAPI.getUserPhotos({ cleanup_pending: 1 }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['user-photos'] });
        });

        // Resetta lo stato locale per permettere nuovo upload
        setSelectedFile(null);
        setPreviewUrl(null);
        setModerationResult(null);
        setPhotoData({
            title: '',
            description: '',
            location: '',
            camera_model: '',
            settings: ''
        });
    }, [moderationResult, queryClient, contest.id]);

    const handlePaymentCancel = useCallback(() => {
        console.log('🚫 Pagamento annullato');
        setUploadState(moderationResult?.moderation_status || 'approved');
    }, [moderationResult]);

    // Gestisce il retry
    const handleRetry = useCallback(() => {
        if (uploadState === 'rejected') {
            handleReset();
        } else {
            handleSubmit();
        }
    }, [uploadState, handleReset, handleSubmit]);

    // TEMPORANEO: Disabilita controllo partecipazione fino all'implementazione del sistema di pagamento
    // Determina la partecipazione utente: solo entry con payment_status === 'completed' sono valide
    const userParticipation = (userPhotos && Array.isArray(userPhotos))
        ? userPhotos.find(photo =>
            photo.contest_id === contest?.id && photo.payment_status === 'completed'
        )
        : null;
    if (userPhotosLoading) {
        return (
            <div className="photo-upload-container">
                <div className="loading-message">
                    <div className="loading-icon">
                        <i className="bi bi-hourglass-split"></i>
                    </div>
                    <p>Controllo partecipazione...</p>
                </div>
            </div>
        );
    }

    // Se ha già partecipato con stato attivo, mostra messaggio invece del form
    if (userParticipation && ['approved', 'pending', 'pending_review'].includes(userParticipation.moderation_status)) {
        return (
            <div className="photo-upload-container">
                <div className="already-participated-message">
                    <div className="message-icon">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <h3>Stai già partecipando!</h3>
                    <p>Hai già caricato una foto per questo contest.</p>
                    <div className="participation-status">
                        <strong>Stato:</strong> {' '}
                        {userParticipation.moderation_status === 'approved' && 'Approvata - Partecipazione attiva'}
                        {userParticipation.moderation_status === 'pending' && 'In revisione automatica'}
                        {userParticipation.moderation_status === 'pending_review' && 'In revisione manuale'}
                    </div>
                    <button
                        onClick={onCancel}
                        className="upload-action-button action-secondary"
                        style={{ marginTop: '1rem' }}
                    >
                        <i className="bi bi-arrow-left"></i>
                        Torna alla Gallery
                    </button>
                </div>
            </div>
        );
    }

    // Se esiste una entry 'pending', mostra stato di attesa pagamento SOLO se non si sta già mostrando il form di pagamento
    // ...AVVISO PAGAMENTO PENDING RIMOSSO: ora si mostra solo il form di pagamento se necessario...

    // Se NON ha una entry completed, mostra bottone retry dopo errore
    const hasCompletedEntry = (userPhotos && Array.isArray(userPhotos))
        ? userPhotos.some(photo => photo.contest_id === contest?.id && photo.payment_status === 'completed')
        : false;

    if (!hasCompletedEntry && uploadState === 'error') {
        return (
            <div className="photo-upload-container">
                <div className="error-message">
                    <div className="message-icon">
                        <i className="bi bi-x-circle-fill"></i>
                    </div>
                    <h3>Errore nell'upload o pagamento</h3>
                    <p>{errorMessage || 'Si è verificato un errore. Riprova.'}</p>
                    <button
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['user-photos'] });
                            queryClient.invalidateQueries({ queryKey: ['contest-entries', contest?.id] });
                            queryClient.invalidateQueries({ queryKey: ['contest-participation', contest?.id] });
                            queryClient.refetchQueries({ queryKey: ['user-photos'] });
                            queryClient.refetchQueries({ queryKey: ['contest-entries', contest?.id] });
                            queryClient.refetchQueries({ queryKey: ['contest-participation', contest?.id] });
                            handleReset();
                        }}
                        className="upload-action-button action-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        <i className="bi bi-arrow-repeat"></i>
                        Riprova upload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="photo-upload-container">
            {/* DEBUG: Mostra tutte le entry dell'utente per questo contest */}
            <div style={{ background: '#f8f9fa', border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
                <strong>DEBUG ENTRIES (contest {contest?.id}):</strong>
                <ul style={{ fontSize: '0.95em', margin: '0.5em 0 0 0', padding: 0 }}>
                    {(userPhotos || []).filter(photo => photo.contest_id === contest?.id).map(photo => (
                        <li key={photo.id} style={{ marginBottom: '0.3em' }}>
                            <span style={{ fontWeight: 'bold' }}>ID:</span> {photo.id} | <span style={{ fontWeight: 'bold' }}>Status:</span> {photo.payment_status} | <span style={{ fontWeight: 'bold' }}>Moderation:</span> {photo.moderation_status}
                        </li>
                    ))}
                    {((userPhotos || []).filter(photo => photo.contest_id === contest?.id).length === 0) && (
                        <li style={{ color: '#888' }}>Nessuna entry per questo contest</li>
                    )}
                </ul>
            </div>
            {/* Upload Area - Idle State */}
            {uploadState === 'idle' && (
                <div className="upload-state-idle">
                    <div
                        {...getRootProps()}
                        className={`upload-dropzone ${isDragActive ? 'drag-over' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <div className="upload-icon">
                            <i className="bi bi-cloud-upload"></i>
                        </div>
                        <h3>Carica la tua Foto</h3>
                        <p>Trascina qui la tua foto o clicca per selezionare</p>
                        <div className="upload-requirements">
                            <small>JPG, PNG, WEBP • Max 10MB</small>
                        </div>
                    </div>

                    {selectedFile && (
                        <div className="photo-preview-section">
                            <h4>Anteprima e Dettagli</h4>
                            <div className="photo-preview-container">
                                <img src={previewUrl} alt="Preview" className="photo-preview" />
                            </div>

                            <div className="photo-form">
                                <div className="form-group">
                                    <label htmlFor="title">Titolo *</label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={photoData.title}
                                        onChange={(e) => setPhotoData({ ...photoData, title: e.target.value })}
                                        placeholder="Inserisci un titolo per la tua foto"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Descrizione</label>
                                    <textarea
                                        id="description"
                                        value={photoData.description}
                                        onChange={(e) => setPhotoData({ ...photoData, description: e.target.value })}
                                        placeholder="Racconta la storia della tua foto..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="location">Luogo</label>
                                    <input
                                        type="text"
                                        id="location"
                                        value={photoData.location}
                                        onChange={(e) => setPhotoData({ ...photoData, location: e.target.value })}
                                        placeholder="Dove è stata scattata?"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="camera">Fotocamera</label>
                                    <input
                                        type="text"
                                        id="camera"
                                        value={photoData.camera_model}
                                        onChange={(e) => setPhotoData({ ...photoData, camera_model: e.target.value })}
                                        placeholder="Modello fotocamera"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="settings">Impostazioni</label>
                                    <input
                                        type="text"
                                        id="settings"
                                        value={photoData.settings}
                                        onChange={(e) => setPhotoData({ ...photoData, settings: e.target.value })}
                                        placeholder="ISO, Apertura, Velocità..."
                                    />
                                </div>

                                {errorMessage && (
                                    <div className="error-message">
                                        <i className="bi bi-exclamation-triangle"></i>
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="upload-action-button action-primary"
                                        onClick={handleSubmit}
                                        disabled={!selectedFile || !photoData.title.trim()}
                                    >
                                        <i className="bi bi-upload"></i>
                                        Carica Foto
                                    </button>
                                    <button
                                        type="button"
                                        className="upload-action-button action-secondary"
                                        onClick={handleReset}
                                    >
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Progress State */}
            {uploadState === 'uploading' && (
                <div className="upload-state-progress">
                    <div className="progress-content">
                        <div className="progress-icon">
                            <i className="bi bi-cloud-upload"></i>
                        </div>
                        <h3>Caricamento in corso...</h3>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="progress-text">
                            <span>{uploadProgress}%</span>
                        </p>
                        <small>Preparazione per la moderazione AI...</small>
                    </div>
                </div>
            )}

            {/* Moderation State */}
            {uploadState === 'moderating' && (
                <div className="upload-state-moderating">
                    <div className="moderation-content">
                        <div className="moderation-icon">
                            <div className="spinner-border text-info" role="status">
                                <span className="visually-hidden">Analisi in corso...</span>
                            </div>
                        </div>
                        <h3>Analisi AI in corso</h3>
                        <p>La tua foto è sotto analisi per verificare la conformità alle regole del contest...</p>

                        <div className="moderation-steps">
                            <div className="step-item active">
                                <i className="bi bi-check-circle"></i>
                                Upload completato
                            </div>
                            <div className="step-item active">
                                <i className="bi bi-eye"></i>
                                Analisi contenuto
                            </div>
                            <div className="step-item">
                                <i className="bi bi-shield-check"></i>
                                Verifica finale
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Approved State */}
            {uploadState === 'approved' && moderationResult && (
                <div className="upload-state-approved">
                    <div className="approval-content">
                        <div className="approval-icon success">
                            <i className="bi bi-check-circle"></i>
                        </div>
                        <h3>Foto Approvata! 🎉</h3>
                        <p>La tua foto ha superato la moderazione AI ed è pronta per la pubblicazione.</p>

                        <div className="approval-details">
                            <div className="detail-item">
                                <strong>Contest:</strong> {contest.title}
                            </div>
                            <div className="detail-item">
                                <strong>Titolo:</strong> {photoData.title}
                            </div>
                            <div className="detail-item">
                                <strong>Costo partecipazione:</strong> €{contest.entry_fee || 0}
                            </div>
                        </div>

                        <div className="approval-actions">
                            <button
                                className="upload-action-button action-primary action-large"
                                onClick={handlePayment}
                            >
                                <i className="bi bi-credit-card"></i>
                                Procedi al Pagamento
                            </button>
                            <button
                                className="upload-action-button action-secondary"
                                onClick={handleReset}
                            >
                                <i className="bi bi-arrow-counterclockwise"></i>
                                Carica Altra Foto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment State - Stripe Integration o errore pagamento */}
            {uploadState === 'payment' && errorMessage ? (
                <div className="upload-state-payment-error">
                    <div className="error-content">
                        <i className="bi bi-exclamation-triangle"></i>
                        <h3>Pagamento non riuscito</h3>
                        <p>{errorMessage}</p>
                        <div className="error-actions">
                            <button
                                className="upload-action-button action-primary"
                                onClick={handleRetry}
                            >
                                <i className="bi bi-arrow-repeat"></i>
                                Riprova Pagamento
                            </button>
                            {handleReset && (
                                <button
                                    className="upload-action-button action-secondary"
                                    onClick={handleReset}
                                >
                                    <i className="bi bi-arrow-left"></i>
                                    Torna al Contest
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (uploadState === 'payment' && !errorMessage) ? (
                <div className="upload-state-payment">
                    {/* Scelta metodo pagamento */}
                    {!selectedPaymentMethod && (
                        <div className="payment-method-choice">
                            <h3>Scegli il metodo di pagamento</h3>
                            <div className="payment-options">
                                <button
                                    className="upload-action-button action-primary"
                                    onClick={() => setSelectedPaymentMethod('card')}
                                >
                                    <i className="bi bi-credit-card"></i> Carta di credito
                                </button>
                                {userCredits > 0 && (
                                    <button
                                        className="upload-action-button action-secondary"
                                        onClick={() => {
                                            if (userCredits < 10) {
                                                setSelectedPaymentMethod('mixed');
                                                setShowPaymentForm(true);
                                                setUploadState('pending_review');
                                            } else {
                                                setSelectedPaymentMethod('credit');
                                            }
                                        }}
                                    >
                                        <i className="bi bi-coin"></i> Usa credit{userCredits > 1 ? 'i' : 'o'}
                                    </button>
                                )}
                            </div>
                            <div className="payment-info">
                                <span>Crediti disponibili: <strong>{userCredits}</strong> (valore: €{creditEuroValue})</span>
                                <span> Costo partecipazione: <strong>€{entryFee}</strong></span>
                                {userCredits > 0 && (
                                    <span>Sconto massimo: <strong>€{maxDiscount}</strong> ({maxUsableCredits} crediti)</span>
                                )}
                                <span>Importo da pagare: <strong>€{finalAmount}</strong></span>
                            </div>
                        </div>
                    )}
                    {/* Pagamento con carta */}
                    {selectedPaymentMethod === 'card' && (
                        <Elements stripe={stripePromise}>
                            <PaymentForm
                                amount={contest.entry_fee || 0}
                                currency="EUR"
                                onSuccess={handlePaymentSuccess}
                                onError={handlePaymentError}
                                onCancel={() => setSelectedPaymentMethod(null)}
                            />
                        </Elements>
                    )}
                    {/* Pagamento con crediti */}
                    {selectedPaymentMethod === 'credit' && (
                        <div className="payment-credit-confirm">
                            <h3>Conferma pagamento con crediti</h3>
                            <p>
                                Vuoi usare <strong>{maxUsableCredits} credito{maxUsableCredits !== 1 ? 'i' : ''}</strong> per uno sconto di <strong>€{maxDiscount}</strong>?<br />
                                Pagherai <strong>€{finalAmount}</strong> invece di €{entryFee}.
                            </p>
                            <button
                                className="upload-action-button action-primary"
                                onClick={async () => {
                                    try {
                                        const formData = new FormData();
                                        formData.append('photo', selectedFile);
                                        formData.append('contest_id', contest.id);
                                        formData.append('title', photoData.title);
                                        formData.append('description', photoData.description);
                                        formData.append('location', photoData.location);
                                        formData.append('camera_model', photoData.camera_model);
                                        formData.append('settings', photoData.settings);
                                        formData.append('payment_method', 'credit');
                                        // La logica backend scala i crediti e crea la entry
                                        const response = await photoAPI.upload(formData);
                                        setUploadState('completed');
                                        queryClient.invalidateQueries({ queryKey: ['user-photos'] });
                                        queryClient.invalidateQueries({ queryKey: ['contest-entries', contest.id] });
                                        queryClient.invalidateQueries({ queryKey: ['contest', contest.id] });
                                        queryClient.invalidateQueries({ queryKey: ['contest-participation', contest.id] });
                                        queryClient.invalidateQueries({ queryKey: ['userCredits'] });
                                        if (onUploadSuccess) {
                                            onUploadSuccess({
                                                ...(response?.entry || {}),
                                                contest_id: contest.id,
                                                ...photoData,
                                                payment: response?.payment
                                            });
                                        }
                                        showToast('Pagamento con crediti completato!', 'success', 4000);
                                        setTimeout(() => {
                                            navigate(`/contest/${contest.id}`);
                                        }, 2500);
                                    } catch (error) {
                                        setPaymentEntryId(null);
                                        showToast(error?.message || 'Errore pagamento crediti', 'error', 6000);
                                        setErrorMessage(error?.message || 'Errore pagamento crediti');
                                        setUploadState('payment');
                                        setSelectedPaymentMethod(null);
                                    }
                                }}
                            >
                                Conferma e usa {maxUsableCredits} credito{maxUsableCredits !== 1 ? 'i' : ''}
                            </button>
                            <button
                                className="upload-action-button action-secondary"
                                onClick={() => setSelectedPaymentMethod(null)}
                            >
                                Annulla
                            </button>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Pending Review State */}
            {uploadState === 'pending_review' && moderationResult && !showPaymentForm && (
                <div className="upload-state-pending-review">
                    <div className="pending-review-content">
                        <div className="pending-review-icon">
                            <i className="bi bi-eye-fill"></i>
                        </div>
                        <h3>Foto Incerta! ⚠️</h3>
                        <p>La tua foto verrà revisionata da un nostro moderatore.</p>

                        <div className="review-info">
                            <div className="info-box warning">
                                <div className="info-icon">
                                    <i className="bi bi-info-circle"></i>
                                </div>
                                <div className="info-text">
                                    <strong>Cosa significa?</strong><br />
                                    Il sistema automatico ha rilevato alcuni elementi che necessitano di verifica umana.
                                    Questo è normale per garantire la qualità del contest.
                                </div>
                            </div>
                        </div>

                        <div className="approval-details">
                            <div className="detail-item">
                                <strong>Contest:</strong> {contest.title}
                            </div>
                            <div className="detail-item">
                                <strong>Titolo:</strong> {photoData.title}
                            </div>
                            <div className="detail-item">
                                <strong>Costo partecipazione:</strong> €{contest.entry_fee || 0}
                            </div>
                        </div>

                        <div className="payment-section">
                            <p className="payment-note">
                                <i className="bi bi-exclamation-circle"></i>
                                Procedi con il pagamento per completare l'iscrizione.
                                La foto sarà pubblicata solo dopo l'approvazione manuale.
                            </p>

                            <div className="action-buttons">
                                <button
                                    className="payment-button"
                                    onClick={() => setShowPaymentForm(true)}
                                    disabled={!photoData.title.trim()}
                                >
                                    <i className="bi bi-credit-card"></i>
                                    Procedi al Pagamento
                                </button>

                                <button
                                    className="upload-another-button"
                                    onClick={handleResetForNewUpload}
                                >
                                    <i className="bi bi-camera"></i>
                                    Carica Altra Foto
                                </button>
                            </div>

                            <div className="payment-security">
                                <i className="bi bi-shield-check"></i>
                                Transazione sicura SSL
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {uploadState === 'pending_review' && moderationResult && showPaymentForm && (
                <div className="upload-state-payment">
                    {/* Scelta metodo pagamento: carta o crediti */}
                    {!selectedPaymentMethod && (
                        <div className="payment-method-choice">
                            <h3>Scegli il metodo di pagamento</h3>
                            <div className="payment-options">
                                <button
                                    className="upload-action-button action-primary"
                                    onClick={() => setSelectedPaymentMethod('card')}
                                >
                                    <i className="bi bi-credit-card"></i> Carta di credito
                                </button>
                                {userCredits > 0 && (
                                    <button
                                        className="upload-action-button action-secondary"
                                        onClick={() => {
                                            if (userCredits < 10) {
                                                setSelectedPaymentMethod('mixed');
                                                setShowPaymentForm(true);
                                            } else {
                                                setSelectedPaymentMethod('credit');
                                            }
                                        }}
                                    >
                                        <i className="bi bi-coin"></i> Usa credit{userCredits > 1 ? 'i' : 'o'}
                                    </button>
                                )}
                            </div>
                            <div className="payment-info">
                                <span>Crediti disponibili: <strong>{userCredits}</strong></span>
                                <span> Costo partecipazione: <strong>€{contest.entry_fee || 0}</strong></span>
                            </div>
                        </div>
                    )}
                    {/* Pagamento con carta */}
                    {selectedPaymentMethod === 'card' && (
                        <Elements stripe={stripePromise}>
                            <PaymentForm
                                amount={contest.entry_fee || 0}
                                currency="EUR"
                                onSuccess={handlePaymentSuccess}
                                onError={handlePaymentError}
                                onCancel={() => setSelectedPaymentMethod(null)}
                            />
                        </Elements>
                    )}
                    {/* Pagamento con crediti */}
                    {selectedPaymentMethod === 'credit' && userCredits >= 10 && (
                        <div className="payment-credit-confirm">
                            <h3>Conferma pagamento con crediti</h3>
                            <p>Vuoi usare <strong>10 crediti</strong> per partecipare gratuitamente?</p>
                            <button
                                className="upload-action-button action-primary"
                                onClick={async () => {
                                    try {
                                        const formData = new FormData();
                                        formData.append('photo', selectedFile);
                                        formData.append('contest_id', contest.id);
                                        formData.append('title', photoData.title);
                                        formData.append('description', photoData.description);
                                        formData.append('location', photoData.location);
                                        formData.append('camera_model', photoData.camera_model);
                                        formData.append('settings', photoData.settings);
                                        formData.append('payment_method', 'credit');
                                        // La logica backend scala i crediti e crea la entry
                                        const response = await photoAPI.upload(formData);
                                        setUploadState('completed');
                                        queryClient.invalidateQueries({ queryKey: ['user-photos'] });
                                        queryClient.invalidateQueries({ queryKey: ['contest-entries', contest.id] });
                                        queryClient.invalidateQueries({ queryKey: ['contest', contest.id] });
                                        queryClient.invalidateQueries({ queryKey: ['contest-participation', contest.id] });
                                        if (onUploadSuccess) {
                                            onUploadSuccess({
                                                ...(response?.entry || {}),
                                                contest_id: contest.id,
                                                ...photoData,
                                                payment: response?.payment
                                            });
                                        }
                                        showToast('Pagamento con crediti completato!', 'success', 4000);
                                        setTimeout(() => {
                                            navigate(`/contest/${contest.id}`);
                                        }, 2500);
                                    } catch (error) {
                                        setPaymentEntryId(null);
                                        showToast(error?.message || 'Errore pagamento crediti', 'error', 6000);
                                        setErrorMessage(error?.message || 'Errore pagamento crediti');
                                        setUploadState('payment');
                                        setSelectedPaymentMethod(null);
                                    }
                                }}
                            >
                                Conferma e usa 10 crediti
                            </button>
                            <button
                                className="upload-action-button action-secondary"
                                onClick={() => setSelectedPaymentMethod(null)}
                            >
                                Annulla
                            </button>
                        </div>
                    )}
                    {/* Pagamento misto: crediti tra 1 e 9, mostra form carta con sconto */}
                    {selectedPaymentMethod === 'mixed' && userCredits > 0 && userCredits < 10 && showPaymentForm && (
                        <Elements stripe={stripePromise}>
                            <PaymentForm
                                amount={parseFloat(finalAmount)}
                                currency="EUR"
                                creditsToUse={userCredits}
                                onSuccess={(data) => handlePaymentSuccess({ ...data, creditsToUse: userCredits })}
                                onError={handlePaymentError}
                                onCancel={() => { setSelectedPaymentMethod(null); setShowPaymentForm(false); }}
                            />
                        </Elements>
                    )}
                </div>
            )}

            {/* Completed State */}
            {uploadState === 'completed' && (
                <div className="upload-state-completed">
                    <div className="completion-content">
                        <div className="completion-icon success">
                            <i className="bi bi-trophy"></i>
                        </div>
                        {moderationResult?.moderation_status === 'pending_review' ? (
                            <>
                                <h3>Pagamento Completato! 💳</h3>
                                <p>Un moderatore controllerà la tua foto al più presto e la pubblicherà nel contest <strong>{contest.title}</strong>!</p>
                            </>
                        ) : (
                            <>
                                <h3>Partecipazione Confermata! 🏆</h3>
                                <p>La tua foto è ora in gara nel contest <strong>{contest.title}</strong>!</p>
                            </>
                        )}

                        <div className="completion-stats">
                            <div className="stat-item">
                                <div className="stat-value">{contest.current_participants + 1}</div>
                                <div className="stat-label">Partecipanti</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">€{contest.prize}</div>
                                <div className="stat-label">Premio</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{Math.ceil((new Date(contest.end_date) - new Date()) / (1000 * 60 * 60 * 24))}</div>
                                <div className="stat-label">Giorni rimasti</div>
                            </div>
                        </div>

                        <div className="completion-actions">
                            <button
                                className="upload-action-button action-primary action-large"
                                onClick={() => window.location.href = `/contest/${contest.id}`}
                            >
                                <i className="bi bi-eye"></i>
                                Vedi Contest
                            </button>
                            <button
                                className="upload-action-button action-secondary"
                                onClick={() => window.location.href = '/my-photos'}
                            >
                                <i className="bi bi-images"></i>
                                Le mie Foto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejected State */}
            {uploadState === 'rejected' && moderationResult && (
                <div className="upload-state-rejected">
                    <div className="rejection-content">
                        <div className="rejection-icon error">
                            <i className="bi bi-x-circle"></i>
                        </div>
                        <h3>Foto Non Approvata</h3>
                        <p>La tua foto non ha superato la moderazione automatica.</p>
                        {moderationResult.rejection_reason && (
                            <div className="rejection-reason">
                                <strong>Motivo:</strong> {moderationResult.rejection_reason}
                            </div>
                        )}
                        <div className="rejection-tips">
                            <h4>💡 Suggerimenti:</h4>
                            <ul>
                                <li>Assicurati che la foto rispetti il tema del contest</li>
                                <li>Evita contenuti inappropriati o offensivi</li>
                                <li>Verifica che la qualità dell'immagine sia buona</li>
                                <li>Controlla che non ci siano elementi protetti da copyright</li>
                            </ul>
                        </div>
                        <div className="rejection-actions">
                            <button
                                className="upload-action-button action-primary"
                                onClick={handleResetForNewUpload}
                            >
                                <i className="bi bi-arrow-repeat"></i>
                                Carica Nuova Foto
                            </button>
                            <button
                                className="upload-action-button action-secondary"
                                onClick={onCancel}
                            >
                                <i className="bi bi-arrow-left"></i>
                                Torna al Contest
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending State */}
            {uploadState === 'pending' && (
                <div className="upload-state-pending">
                    <div className="pending-content">
                        <div className="pending-icon warning">
                            <i className="bi bi-clock"></i>
                        </div>
                        <h3>In Attesa di Revisione</h3>
                        <p>La tua foto richiede una revisione manuale da parte dei moderatori.</p>

                        <div className="pending-info">
                            <div className="info-item">
                                <i className="bi bi-info-circle"></i>
                                <span>Tempo di attesa stimato: 24-48 ore</span>
                            </div>
                            <div className="info-item">
                                <i className="bi bi-envelope"></i>
                                <span>Riceverai una notifica via email</span>
                            </div>
                        </div>

                        <div className="pending-actions">
                            <button
                                className="upload-action-button action-secondary"
                                onClick={() => window.location.href = '/my-photos'}
                            >
                                <i className="bi bi-images"></i>
                                Le mie Foto
                            </button>
                            <button
                                className="upload-action-button action-secondary"
                                onClick={onCancel}
                            >
                                <i className="bi bi-arrow-left"></i>
                                Torna al Contest
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {errorMessage && uploadState !== 'idle' && uploadState !== 'payment' && (
                <div className="error-state">
                    <div className="error-content">
                        <i className="bi bi-exclamation-triangle"></i>
                        <h3>Errore nell'upload</h3>
                        {/* <p>{errorMessage}</p> */}
                        <button
                            className="upload-action-button action-primary"
                            onClick={handleRetry}
                        >
                            <i className="bi bi-arrow-repeat"></i>
                            Riprova
                        </button>
                        {onCancel && (
                            <button
                                className="upload-action-button action-secondary"
                                onClick={onCancel}
                            >
                                <i className="bi bi-arrow-left"></i>
                                Torna al Contest
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoUpload;