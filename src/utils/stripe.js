import { loadStripe } from '@stripe/stripe-js';

// Carica Stripe con la chiave pubblica
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default stripePromise;