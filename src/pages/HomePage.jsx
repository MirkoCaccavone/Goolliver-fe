import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import '../style/pagesStyle/HomePage.css';
import JumboHero from '../components/JumboHero';

const HomePage = () => {
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation();

    // Stato per posizione aereo e trail
    const [planePos, setPlanePos] = useState({ top: 20, left: 10 });
    const [target, setTarget] = useState({ top: 20, left: 10 });
    const planeRef = useRef();

    // Funzione per generare una nuova destinazione casuale
    const getRandomTarget = () => {
        const padding = 20;
        const maxW = window.innerWidth - 220 - padding; // 220 = plane width
        const maxH = window.innerHeight - 60 - padding; // 60 = plane height
        return {
            top: Math.max(padding, Math.random() * maxH),
            left: Math.max(padding, Math.random() * maxW)
        };
    };

    // Movimento aereo verso destinazione
    useEffect(() => {
        let animFrame;
        let last = Date.now();
        function animate() {
            const now = Date.now();
            const dt = Math.min((now - last) / 1000, 0.05); // max 50ms step
            last = now;
            const speed = 120; // px/sec
            const dx = target.left - planePos.left;
            const dy = target.top - planePos.top;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 8) {
                setTarget(getRandomTarget());
            } else {
                const move = Math.min(speed * dt, dist);
                setPlanePos(pos => ({
                    top: pos.top + (dy / dist) * move,
                    left: pos.left + (dx / dist) * move
                }));
            }
            animFrame = requestAnimationFrame(animate);
        }
        animFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrame);
        // eslint-disable-next-line
    }, [target, planePos.left, planePos.top]);

    //NUOVO useEffect per animazioni delle sezioni
    useEffect(() => {
        const steps = document.querySelectorAll(".home-how-step");

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = [...steps].indexOf(entry.target);
                        entry.target.classList.add("visible", `delay-${index}`);
                    }
                });
            },
            { threshold: 0.2 }
        );

        steps.forEach(step => observer.observe(step));

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <div className="home-root">
                {/* Hero Section (per tutti) */}
                <JumboHero />

                {/* Sezione autenticato */}
                {isAuthenticated ? (
                    <section className="home-auth-section">
                        <div className="home-auth-container">
                            <h2 className="home-auth-title">{t('welcome_back')}, <span className="home-auth-username">{t('user')}</span>!</h2>
                            <p className="home-auth-subtitle">{t('home_logged_subtitle')}</p>
                            {/* Qui puoi aggiungere: contest attivi, foto recenti, notifiche, ecc. */}
                        </div>
                    </section>
                ) : (
                    <>
                        {/* Sezione non autenticato: come funziona, call to action, ecc. */}
                        <section className="home-how-section">
                            {/* --- SVG aereo realistico, profilo laterale, rivolto verso destra --- */}
                            <svg
                                className="home-plane-anim"
                                ref={planeRef}
                                viewBox="0 0 420 90"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                    position: 'absolute',
                                    top: planePos.top,
                                    left: planePos.left,
                                    width: 190, // più grande
                                    height: 50, // proporzionato
                                    zIndex: 2,
                                    pointerEvents: 'none',
                                    transition: 'none'
                                }}
                            >
                                <g>
                                    {/* Scia: parte dalla coda (sinistra) e si allunga verso sinistra, più lunga */}
                                    <defs>
                                        <linearGradient id="planeTrailGradient" x1="100" y1="45" x2="-180" y2="45" gradientUnits="userSpaceOnUse">
                                            <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
                                            <stop offset="40%" stopColor="#b0b8c1" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#b0b8c1" stopOpacity="0" />
                                        </linearGradient>
                                        <filter id="trailBlur">
                                            <feGaussianBlur stdDeviation="3" />
                                        </filter>
                                    </defs>
                                    <path d="M100,45 Q-40,10 -180,45 Q-40,80 100,45" stroke="url(#planeTrailGradient)" strokeWidth="12" fill="none" filter="url(#trailBlur)" />
                                    {/* Fusoliera */}
                                    <rect x="100" y="39" width="210" height="22" rx="11" fill="#e6eaf0" stroke="#b0b8c1" strokeWidth="2" />
                                    {/* Muso arrotondato (a destra) */}
                                    <ellipse cx="310" cy="50" rx="21" ry="11" fill="#e6eaf0" stroke="#b0b8c1" strokeWidth="2" />
                                    {/* Coda verticale (a sinistra) */}
                                    <polygon points="100,39 60,15 57,27 97,73" fill="#b0b8c1" />
                                    {/* Ali principali */}
                                    <polygon points="240,41 160,5 148,23 210,67" fill="#b0b8c1" />
                                    <polygon points="200,61 120,85 115,75 180,53" fill="#b0b8c1" />
                                    {/* Motori */}
                                    <ellipse cx="220" cy="67" rx="10" ry="8" fill="#7a8ca3" />
                                    <ellipse cx="170" cy="69" rx="10" ry="8" fill="#7a8ca3" />
                                    {/* Finestrini */}
                                    <rect x="250" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                                    <rect x="230" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                                    <rect x="210" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                                    <rect x="190" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                                    <rect x="170" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                                    <rect x="150" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                                    {/* Cockpit */}
                                    <rect x="285" y="42" width="18" height="12" rx="4" fill="#7a8ca3" />
                                    {/* Ruote */}
                                    <ellipse cx="250" cy="81" rx="6" ry="6" fill="#444" />
                                    <ellipse cx="170" cy="81" rx="6" ry="6" fill="#444" />
                                    {/* Dettaglio linea */}
                                    <rect x="110" y="57" width="190" height="3" rx="1.5" fill="#b0b8c1" opacity="0.3" />
                                </g>
                            </svg>

                            {/* --- SVG nuvola animata grande in alto a destra --- */}
                            <svg className="home-cloud-anim home-cloud-large" viewBox="0 0 160 80" fill="none">
                                <ellipse cx="60" cy="40" rx="60" ry="32" fill="#fff" />
                                <ellipse cx="120" cy="48" rx="36" ry="24" fill="#fff" />
                            </svg>
                            {/* --- SVG nuvola media in basso a sinistra --- */}
                            <svg className="home-cloud-anim home-cloud-medium" viewBox="0 0 100 50" fill="none">
                                <ellipse cx="40" cy="25" rx="36" ry="18" fill="#fff" />
                                <ellipse cx="80" cy="30" rx="20" ry="12" fill="#fff" />
                            </svg>
                            {/* --- SVG nuvola piccola in alto a sinistra --- */}
                            <svg className="home-cloud-anim home-cloud-small" viewBox="0 0 60 30" fill="none">
                                <ellipse cx="20" cy="15" rx="18" ry="9" fill="#fff" />
                                <ellipse cx="45" cy="18" rx="10" ry="6" fill="#fff" />
                            </svg>

                            {/* slogan */}
                            <div className='home-how-slogan'>
                                <span><a href="#" className='home-how-slogan-h1'>Carica -  </a></span>
                                <span><a href="#" className='home-how-slogan-h1'> Partecipa -  </a></span>
                                <span><a href="#" className='home-how-slogan-h1'> Vinci</a></span>
                            </div>
                            <div className="home-how-container">
                                {/* <h2 className="home-how-title">{t('how_it_works')}</h2> */}
                                <div className="home-how-steps">

                                    {/* STEP 1 */}
                                    <div className="home-how-step step-uno">
                                        <div className="how-text">
                                            <h3 className="home-how-step-title">{t('upload_photos')}</h3>
                                            <p className="home-how-step-desc">{t('upload_photos_desc')}</p>
                                        </div>

                                        <div className="how-image">
                                            <img src="/carica-photo.jpg" alt="Step 1" />
                                        </div>
                                    </div>

                                    {/* STEP 2 */}
                                    <div className="home-how-step step-due reverse">
                                        <div className="how-text">
                                            <h3 className="home-how-step-title">{t('vote_and_participate')}</h3>
                                            <p className="home-how-step-desc">{t('vote_and_participate_desc')}</p>
                                        </div>

                                        <div className="how-image">
                                            <img src="/vota-photo.jpg" alt="Step 2" />
                                        </div>
                                    </div>

                                    {/* STEP 3 */}
                                    <div className="home-how-step step-tre">
                                        <div className="how-text">
                                            <h3 className="home-how-step-title">{t('win_prizes')}</h3>
                                            <p className="home-how-step-desc">{t('win_prizes_desc')}</p>
                                        </div>

                                        <div className="how-image">
                                            <img src="/vinci-photo.jpg" alt="Step 3" />
                                        </div>
                                    </div>

                                </div>

                                {/* button */}
                                <div className="home-cta">
                                    <button className="home-cta-btn" onClick={() => window.location.href = '/register'}>
                                        {t('get_started')}
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Stats Section */}
                        <section className="home-stats-section">
                            <div className="home-stats-container">
                                <div className="home-stats-list">
                                    <div className="home-stats-card">
                                        <div className="home-stats-value">1000+</div>
                                        <div className="home-stats-label">{t('photos_uploaded')}</div>
                                    </div>
                                    <div className="home-stats-card">
                                        <div className="home-stats-value">50+</div>
                                        <div className="home-stats-label">{t('active_contests')}</div>
                                    </div>
                                    <div className="home-stats-card">
                                        <div className="home-stats-value">500+</div>
                                        <div className="home-stats-label">{t('active_users')}</div>
                                    </div>
                                    <div className="home-stats-card">
                                        <div className="home-stats-value">10k+</div>
                                        <div className="home-stats-label">{t('votes_cast')}</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div >
        </>
    );
};

export default HomePage;