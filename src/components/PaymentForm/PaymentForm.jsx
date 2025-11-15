import React, { useState } from 'react';
import {
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement
} from '@stripe/react-stripe-js';
import { paymentAPI } from '../../services/api';
import './PaymentForm.css';

const PaymentForm = ({
    entryId,
    amount,
    currency = 'EUR',
    onSuccess,
    onError,
    onCancel,
    isProcessing = false
}) => {
    const stripe = useStripe();
    const elements = useElements();

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [cardComplete, setCardComplete] = useState({
        cardNumber: false,
        cardExpiry: false,
        cardCvc: false
    });

    // Opzioni stile per gli elementi Stripe
    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
                padding: '12px',
            },
            invalid: {
                color: '#9e2146',
            },
        },
        hidePostalCode: true,
    };

    const handleCardChange = (elementType) => (event) => {
        setErrors(prev => ({
            ...prev,
            [elementType]: event.error ? event.error.message : null
        }));

        setCardComplete(prev => ({
            ...prev,
            [elementType]: event.complete
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            console.error('Stripe.js has not loaded yet.');
            return;
        }

        const cardNumberElement = elements.getElement(CardNumberElement);

        if (!cardNumberElement) {
            onError?.('Errore nel caricamento del form carta');
            return;
        }

        setProcessing(true);

        try {
            // Crea Payment Method
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardNumberElement,
            });

            if (error) {
                setErrors({ general: error.message });
                onError?.(error.message);
                setProcessing(false);
                return;
            }

            // Invia Payment Method al backend usando API
            const response = await paymentAPI.processPayment({
                entry_id: entryId,
                payment_method_id: paymentMethod.id,
                amount: amount
            });

            const result = response.data;

            // Se serve azione utente (es. 3D Secure)
            if (response.status === 202 && result.payment_intent?.next_action && result.payment_intent?.id) {
                // Recupera client secret
                const clientSecret = result.payment_intent.client_secret || result.payment_intent.id;
                const nextActionType = result.payment_intent.next_action?.type;
                // Conferma il pagamento con Stripe
                const confirmResult = await stripe.confirmCardPayment(clientSecret);
                if (confirmResult.error) {
                    setErrors({ general: confirmResult.error.message });
                    onError?.(confirmResult.error.message);
                } else if (confirmResult.paymentIntent && confirmResult.paymentIntent.status === 'succeeded') {
                    onSuccess?.({ transaction_id: confirmResult.paymentIntent.id });
                } else {
                    setErrors({ general: 'Pagamento non completato. Riprova.' });
                    onError?.('Pagamento non completato. Riprova.');
                }
            } else if (result.success) {
                onSuccess?.(result.data);
            } else {
                // Stripe error: declined, insufficient_funds, ecc.
                let errorMsg = result.message || 'Pagamento rifiutato. Riprova con un altro metodo.';
                if (result.error && typeof result.error === 'string') {
                    errorMsg = result.error;
                }
                setErrors({ general: errorMsg });
                onError?.(errorMsg);
            }
        } catch (error) {
            console.error('Errore nel pagamento:', error);
            // Se il backend restituisce un messaggio specifico
            let errorMsg = 'Errore di connessione. Riprova più tardi.';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            }
            setErrors({ general: errorMsg });
            onError?.(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const isFormValid = () => {
        return Object.values(cardComplete).every(complete => complete) &&
            !processing &&
            !isProcessing;
    };

    // Permetti retry: se errore, riabilita form per nuovo inserimento
    React.useEffect(() => {
        if (errors.general) {
            setProcessing(false);
        }
    }, [errors.general]);

    return (
        <div className="payment-form">
            <div className="payment-form-header">
                <h3>💳 Dettagli Pagamento</h3>
                <div className="payment-amount">
                    <span className="amount">{currency} {amount}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="stripe-form">
                {/* Numero Carta */}
                <div className="form-group">
                    <label className="form-label">Numero Carta</label>
                    <div className="stripe-input">
                        <CardNumberElement
                            options={cardElementOptions}
                            onChange={handleCardChange('cardNumber')}
                        />
                    </div>
                    {errors.cardNumber && (
                        <div className="error-message">{errors.cardNumber}</div>
                    )}
                </div>

                <div className="form-row">
                    {/* Scadenza */}
                    <div className="form-group">
                        <label className="form-label">Scadenza</label>
                        <div className="stripe-input">
                            <CardExpiryElement
                                options={cardElementOptions}
                                onChange={handleCardChange('cardExpiry')}
                            />
                        </div>
                        {errors.cardExpiry && (
                            <div className="error-message">{errors.cardExpiry}</div>
                        )}
                    </div>

                    {/* CVC */}
                    <div className="form-group">
                        <label className="form-label">CVC</label>
                        <div className="stripe-input">
                            <CardCvcElement
                                options={cardElementOptions}
                                onChange={handleCardChange('cardCvc')}
                            />
                        </div>
                        {errors.cardCvc && (
                            <div className="error-message">{errors.cardCvc}</div>
                        )}
                    </div>
                </div>

                {/* Errore generale */}
                {errors.general && (
                    <div className="error-message general-error">
                        <i className="bi bi-exclamation-triangle"></i>
                        {errors.general}
                    </div>
                )}

                {/* Bottoni */}
                <div className="payment-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cancel-button"
                        disabled={processing || isProcessing}
                    >
                        Annulla
                    </button>

                    <button
                        type="submit"
                        className="pay-button"
                        disabled={!isFormValid()}
                    >
                        {processing || isProcessing ? (
                            <>
                                <div className="spinner"></div>
                                Elaborazione...
                            </>
                        ) : (
                            `Paga ${currency} ${amount}`
                        )}
                    </button>
                </div>

                {/* Sicurezza info */}
                <div className="security-info">
                    <i className="bi bi-shield-check"></i>
                    <span>I tuoi dati sono protetti con crittografia SSL</span>
                </div>
            </form>
        </div>
    );
};

export default PaymentForm;