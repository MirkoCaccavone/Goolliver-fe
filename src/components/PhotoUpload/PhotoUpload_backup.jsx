import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { photoAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import './PhotoUpload.css';

const PhotoUpload = ({ contest, onUploadSuccess, onCancel }) => {
    const { token } = useAuthStore();
    const [uploadState, setUploadState] = useState('idle'); // idle, uploading, moderating, approved, rejected, pending, payment
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

    const fileInputRef = useRef(null);    // Mutation per l'upload
    const uploadMutation = useMutation({
        mutationFn: async (formData) => {
            try {
                // Usiamo photoAPI che gestisce automaticamente CORS e auth
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
            handleModerationResult(response);
        },
        onError: (error) => {
            console.error('Upload error:', error);
            setErrorMessage('Errore durante l\'upload. Riprova.');
            setUploadState('idle');
            setUploadProgress(0);
        }
    });

    // Gestisce il risultato della moderazione
    const handleModerationResult = (response) => {
        const { moderation_status, moderation_result } = response.data || response;

        setModerationResult(moderation_result);

        switch (moderation_status) {
            case 'approved':
                setUploadState('approved');
                break;
            case 'rejected':
                setUploadState('rejected');
                break;
            case 'pending':
                setUploadState('pending');
                break;
            default:
                setUploadState('approved'); // Default fallback
        }
    };

    // Gestisce la selezione del file
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

            // Auto-popola alcuni campi se possibile
            setPhotoData(prev => ({
                ...prev,
                title: prev.title || file.name.replace(/\.[^/.]+$/, "")
            }));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 1,
        disabled: uploadState !== 'idle'
    });

    // Handles form submission
    const handleSubmit = async () => {
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
    }

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

    // Debug dei dati inviati
    console.log('Upload data:', {
        contestId: contest.id,
        title: photoData.title,
        titleLength: photoData.title ? photoData.title.length : 0,
        titleTrimmed: photoData.title ? photoData.title.trim() : '',
        description: photoData.description,
        file: selectedFile ? selectedFile.name : 'No file'
    });
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
};

// Handle payment
const handlePayment = () => {
    setUploadState('payment');

    // Simulate payment processing
    setTimeout(() => {
        setUploadState('completed');
        if (onUploadSuccess) {
            onUploadSuccess({
                ...moderationResult,
                contest_id: contest.id,
                ...photoData
            });
        }
    }, 3000);
};

// Reset component
const handleReset = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setPreviewUrl(null);
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
};

// Handle retry
const handleRetry = () => {
    if (uploadState === 'rejected') {
        handleReset();
    } else {
        handleSubmit();
    }
};

return (
    <div className="photo-upload-container">
        {/* Upload Area - Idle State */}
        {uploadState === 'idle' && (
            <div className="upload-state-idle">
                <div
                    {...getRootProps()}
                    className={`upload-dropzone ${isDragActive ? 'drag-over' : ''}`}
                >
                    <input {...getInputProps()} ref={fileInputRef} />
                    <div className="upload-icon">
                        <i className="bi bi-cloud-upload"></i>
                    </div>
                    <h3 className="upload-title">
                        {isDragActive ? 'Rilascia qui la foto!' : 'Carica la tua foto'}
                    </h3>
                    <p className="upload-subtitle">
                        Trascina la foto qui o clicca per selezionarla
                    </p>
                    <button
                        type="button"
                        className="upload-action-button action-primary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <i className="bi bi-folder2-open"></i>
                        Seleziona File
                    </button>

                    <div className="upload-requirements">
                        <strong>Requisiti:</strong><br />
                        • Formati: JPG, PNG, WEBP<br />
                        • Dimensione max: 10MB<br />
                        • Risoluzione consigliata: min 1920x1080px
                    </div>
                </div>

                {errorMessage && (
                    <div className="alert alert-danger mt-3">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {errorMessage}
                    </div>
                )}
            </div>
        )}

        {/* Photo Preview & Form */}
        {selectedFile && uploadState === 'idle' && (
            <div>
                <div className="photo-preview-container">
                    <img src={previewUrl} alt="Preview" className="photo-preview" />
                    <div className="photo-preview-overlay">
                        <button
                            className="preview-action-button preview-action-remove"
                            onClick={handleReset}
                            title="Rimuovi foto"
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    </div>
                </div>

                {/* Photo Details Form */}
                <div className="upload-form">
                    <div className="upload-form-group">
                        <label className="upload-form-label">Titolo *</label>
                        <input
                            type="text"
                            className="upload-form-input"
                            value={photoData.title}
                            onChange={(e) => setPhotoData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Dai un titolo alla tua foto..."
                        />
                    </div>

                    <div className="upload-form-group">
                        <label className="upload-form-label">Descrizione</label>
                        <textarea
                            className="upload-form-input upload-form-textarea"
                            value={photoData.description}
                            onChange={(e) => setPhotoData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Racconta la storia dietro questa foto..."
                        />
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <div className="upload-form-group">
                                <label className="upload-form-label">Luogo</label>
                                <input
                                    type="text"
                                    className="upload-form-input"
                                    value={photoData.location}
                                    onChange={(e) => setPhotoData(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Dove è stata scattata?"
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="upload-form-group">
                                <label className="upload-form-label">Fotocamera</label>
                                <input
                                    type="text"
                                    className="upload-form-input"
                                    value={photoData.camera_model}
                                    onChange={(e) => setPhotoData(prev => ({ ...prev, camera_model: e.target.value }))}
                                    placeholder="Canon EOS R5, iPhone 14 Pro..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="upload-form-group">
                        <label className="upload-form-label">Impostazioni</label>
                        <input
                            type="text"
                            className="upload-form-input"
                            value={photoData.settings}
                            onChange={(e) => setPhotoData(prev => ({ ...prev, settings: e.target.value }))}
                            placeholder="f/2.8, 1/125s, ISO 200, 50mm..."
                        />
                    </div>

                    <div className="d-flex gap-2 mt-3">
                        <button
                            className="upload-action-button action-primary flex-fill"
                            onClick={handleSubmit}
                            disabled={!photoData.title.trim()}
                        >
                            <i className="bi bi-upload"></i>
                            Carica e Partecipa
                        </button>
                        <button
                            className="upload-action-button action-secondary"
                            onClick={handleReset}
                        >
                            <i className="bi bi-arrow-clockwise"></i>
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Upload Progress */}
        {uploadState === 'uploading' && (
            <div className="status-card status-card-uploading">
                <div className="status-icon">
                    <div className="upload-spinner"></div>
                </div>
                <div className="status-content">
                    <h4>Upload in corso...</h4>
                    <p>Stiamo caricando la tua foto sui nostri server.</p>
                    <div className="upload-progress-container">
                        <div className="upload-progress-bar">
                            <div
                                className="upload-progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <div className="upload-progress-text">
                            <span>Upload</span>
                            <span>{uploadProgress}%</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Moderation State */}
        {uploadState === 'moderating' && (
            <div className="status-card status-card-moderating">
                <div className="status-icon">
                    <i className="bi bi-robot"></i>
                </div>
                <div className="status-content">
                    <h4>Moderazione AI in corso...</h4>
                    <p>La nostra IA sta analizzando la foto per garantire la qualità del contest.</p>
                    <div className="upload-progress-container">
                        <div className="upload-progress-bar">
                            <div className="upload-progress-fill" style={{ width: '100%' }}></div>
                        </div>
                        <div className="upload-progress-text">
                            <span>Analisi contenuti</span>
                            <span><div className="upload-spinner"></div></span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Approved State */}
        {uploadState === 'approved' && (
            <div className="status-card status-card-approved">
                <div className="status-icon">
                    <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="status-content">
                    <h4>Foto Approvata! ✨</h4>
                    <p>Perfetto! La tua foto ha superato la moderazione automatica.</p>

                    <div className="payment-section">
                        <div className="payment-amount">
                            <i className="bi bi-credit-card"></i>
                            €{contest.entry_fee}
                        </div>
                        <p className="payment-description">
                            Quota di partecipazione per pubblicare la foto nel contest
                        </p>
                    </div>

                    <div className="status-actions">
                        <button
                            className="upload-action-button action-primary"
                            onClick={handlePayment}
                        >
                            <i className="bi bi-credit-card"></i>
                            Procedi al Pagamento
                        </button>
                        <button
                            className="upload-action-button action-secondary"
                            onClick={handleReset}
                        >
                            <i className="bi bi-arrow-left"></i>
                            Carica Altra Foto
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Rejected State */}
        {uploadState === 'rejected' && (
            <div className="status-card status-card-rejected">
                <div className="status-icon">
                    <i className="bi bi-x-circle-fill"></i>
                </div>
                <div className="status-content">
                    <h4>Foto Non Approvata</h4>
                    <p>La foto non rispetta i criteri del contest. Motivo: {moderationResult?.reason || 'Contenuto non appropriato'}</p>
                    <p><strong>Puoi caricare una nuova foto senza costi aggiuntivi.</strong></p>

                    <div className="status-actions">
                        <button
                            className="upload-action-button action-primary"
                            onClick={handleRetry}
                        >
                            <i className="bi bi-upload"></i>
                            Carica Nuova Foto
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
            </div>
        )}

        {/* Pending State */}
        {uploadState === 'pending' && (
            <div className="status-card status-card-pending">
                <div className="status-icon">
                    <i className="bi bi-clock-fill"></i>
                </div>
                <div className="status-content">
                    <h4>Revisione Manuale Richiesta</h4>
                    <p>La foto richiede una revisione manuale da parte dei moderatori.</p>

                    <div className="payment-section">
                        <div className="payment-amount">
                            <i className="bi bi-credit-card"></i>
                            €{contest.entry_fee}
                        </div>
                        <p className="payment-description">
                            Effettua il pagamento ora. Se la foto verrà rifiutata riceverai un credito per partecipare nuovamente.
                        </p>
                    </div>

                    <div className="status-actions">
                        <button
                            className="upload-action-button action-primary"
                            onClick={handlePayment}
                        >
                            <i className="bi bi-credit-card"></i>
                            Paga e Attendi Revisione
                        </button>
                        <button
                            className="upload-action-button action-secondary"
                            onClick={handleReset}
                        >
                            <i className="bi bi-arrow-left"></i>
                            Carica Altra Foto
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Payment Processing */}
        {uploadState === 'payment' && (
            <div className="status-card status-card-uploading">
                <div className="status-icon">
                    <div className="upload-spinner"></div>
                </div>
                <div className="status-content">
                    <h4>Elaborazione Pagamento...</h4>
                    <p>Stiamo processando il tuo pagamento in modo sicuro.</p>
                </div>
            </div>
        )}

        {/* Completed State */}
        {uploadState === 'completed' && (
            <div className="status-card status-card-approved">
                <div className="status-icon">
                    <i className="bi bi-trophy-fill"></i>
                </div>
                <div className="status-content">
                    <h4>Partecipazione Completata! 🎉</h4>
                    <p>La tua foto è ora live nel contest e può ricevere voti!</p>

                    <div className="status-actions">
                        <button
                            className="upload-action-button action-primary"
                            onClick={() => window.location.reload()}
                        >
                            <i className="bi bi-eye"></i>
                            Vedi la Tua Foto
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
            </div>
        )}
    </div>
);
};

export default PhotoUpload;