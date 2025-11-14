import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { photoAPI, paymentAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import stripePromise from '../../utils/stripe';
import PaymentForm from '../PaymentForm/PaymentForm';
import './PhotoUpload.css';

const PhotoUpload = ({ contest, onUploadSuccess, onCancel }) => {
    const { token, user } = useAuthStore();
    const queryClient = useQueryClient();
    const [uploadState, setUploadState] = useState('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [photoData, setPhotoData] = useState({
        title: '',
        description: '',
        location: '',
        camera_model: '',
        settings: ''
    });
    const [moderationResult, setModerationResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const fileInputRef = useRef(null);

    // Verifica se l'utente ha già partecipato a questo contest
    const { data: userPhotos, isLoading: userPhotosLoading } = useQuery({
        queryKey: ['user-photos'],
        queryFn: () => photoAPI.getUserPhotos(),
        select: (response) => {
            console.log('📸 Raw API response:', response);
            const photos = response.data?.entries || [];
            console.log('📸 Parsed user photos:', photos);
            return photos;
        },
        enabled: !!user,
    });

    // Gestisce il risultato della moderazione - DEVE essere definito prima degli hooks di dropzone
    const handleModerationResult = useCallback((response) => {
        setModerationResult(response);

        // Invalida subito le query per aggiornare lo stato di partecipazione
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
            console.log('Entry moderation_status:', response.entry?.moderation_status);
            handleModerationResult(response.entry || response);
        },
        onError: (error) => {
            console.error('Upload error:', error);

            // Estrai messaggio specifico dal backend
            let errorMsg = 'Errore durante l\'upload. Riprova.';

            if (error.response?.data) {
                const data = error.response.data;
                if (data.message) {
                    errorMsg = data.message;
                } else if (data.error) {
                    errorMsg = data.error;
                } else if (data.errors) {
                    // Per errori di validazione Laravel
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

    // Gestisce l'invio del form - DEVE essere definito prima dei return
    const handleSubmit = useCallback(async () => {
        if (!selectedFile) {
            console.error('No file selected for upload');
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

        // Debug dei dati inviati
        console.log('Upload data:', {
            contestId: contest.id,
            title: photoData.title,
            titleLength: photoData.title ? photoData.title.length : 0,
            titleTrimmed: photoData.title ? photoData.title.trim() : '',
            description: photoData.description,
            file: selectedFile ? selectedFile.name : 'No file'
        });

        // Simulate moderation delay
        setTimeout(() => {
            if (uploadState === 'uploading') {
                setUploadState('moderating');
            }
        }, 2000);

        uploadMutation.mutate(formData);
    }, [selectedFile, photoData, contest.id, uploadState, uploadMutation]);

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

    const handlePaymentSuccess = useCallback((paymentData) => {
        console.log('💳 Pagamento completato:', paymentData);
        setUploadState('completed');

        // Invalida le query per aggiornare i dati
        queryClient.invalidateQueries({ queryKey: ['user-photos'] });
        queryClient.invalidateQueries({ queryKey: ['contest-entries', contest.id] });
        queryClient.invalidateQueries({ queryKey: ['contest', contest.id] });
        queryClient.invalidateQueries({ queryKey: ['contest-participation', contest.id] });

        if (onUploadSuccess) {
            onUploadSuccess({
                ...moderationResult,
                contest_id: contest.id,
                ...photoData,
                payment: paymentData
            });
        }
    }, [contest.id, moderationResult, onUploadSuccess, photoData, queryClient]);

    const handlePaymentError = useCallback((error) => {
        console.error('❌ Errore pagamento:', error);
        setErrorMessage(`Errore nel pagamento: ${error}`);
        setUploadState(moderationResult?.moderation_status || 'approved');
    }, [moderationResult]);

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
    // Il problema: Entry con stato 'approved' (foto normali) vengono considerate come partecipazione
    // anche se l'utente non ha ancora pagato, perché il pagamento è solo simulato
    const userParticipation = null; // Sempre null = sempre permette nuovo upload

    // TODO: Implementare sistema di pagamento reale con campo 'paid' nell'Entry
    // Logica futura dovrebbe essere:
    // const userParticipation = (userPhotos && Array.isArray(userPhotos))
    //     ? userPhotos.find(photo => 
    //         photo.contest_id === contest?.id && photo.paid === true
    //       )
    //     : null;    // Mostra loading mentre i dati dell'utente si caricano
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

    // Se ha già partecipato, mostra messaggio invece del form
    if (userParticipation) {
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
                        {userParticipation.moderation_status === 'rejected' && 'Rifiutata - Contatta il supporto'}
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

    return (
        <div className="photo-upload-container">
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

            {/* Payment State - Stripe Integration */}
            {uploadState === 'payment' && (
                <div className="upload-state-payment">
                    <Elements stripe={stripePromise}>
                        <PaymentForm
                            entryId={moderationResult?.id}
                            amount={contest.entry_fee || 0}
                            currency="EUR"
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                            onCancel={handlePaymentCancel}
                        />
                    </Elements>
                </div>
            )}

            {/* Pending Review State */}
            {uploadState === 'pending_review' && moderationResult && (
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
                                    onClick={handlePayment}
                                    disabled={!photoData.title.trim()}
                                >
                                    <i className="bi bi-credit-card"></i>
                                    Paga €{contest.entry_fee || 0} e Completa Iscrizione
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
                                onClick={handleReset}
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

            {errorMessage && uploadState !== 'idle' && (
                <div className="error-state">
                    <div className="error-content">
                        <i className="bi bi-exclamation-triangle"></i>
                        <h3>Errore nell'upload</h3>
                        <p>{errorMessage}</p>
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