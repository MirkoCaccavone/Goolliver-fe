import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import '../style/pagesStyle/HomePage.css';
import JumboHero from '../components/JumboHero';
import Footer from '../components/Footer';
import HomePlanesAndClouds from '../components/HomePlanesAndClouds';
import { FiCamera, FiAward, FiUsers, FiHeart } from "react-icons/fi";
import { contestAPI, photoAPI } from '../services/api';
import ContestCard from '../components/ContestCard/ContestCard';

const HomePage = () => {
    const { isAuthenticated, user } = useAuthStore();
    const { t } = useTranslation();

    // Stato per posizione dei due aerei
    const [plane1Pos, setPlane1Pos] = useState({ top: 20, left: 10 });
    const [plane2Pos, setPlane2Pos] = useState({ top: 100, left: 100 });
    const [target1, setTarget1] = useState({ top: 20, left: 10 });
    const [target2, setTarget2] = useState({ top: 100, left: 100 });
    const plane1Ref = useRef();
    const plane2Ref = useRef();

    // Stato per i contest attivi a cui l'utente può partecipare
    const [availableContests, setAvailableContests] = useState([]);
    // Stato per tutte le entries dell'utente
    const [userEntries, setUserEntries] = useState([]);

    // Stato per i contest a cui l'utente ha partecipato con status desiderato
    const [participatedContests, setParticipatedContests] = useState([]);


    // Funzione per generare una nuova destinazione casuale all'interno di home-how-section
    const getRandomTarget = () => {
        const padding = 20;
        const sectionClass = isAuthenticated ? 'home-auth-section' : 'home-how-section';
        const section = document.querySelector(`.${sectionClass}`);
        let maxW = window.innerWidth - 220 - padding;
        let maxH = window.innerHeight - 60 - padding;
        if (section) {
            const rect = section.getBoundingClientRect();
            maxW = rect.width - 220 - padding;
            maxH = rect.height - 60 - padding;
        }
        return {
            top: Math.max(padding, Math.random() * maxH),
            left: Math.max(padding, Math.random() * maxW)
        };
    };

    // Movimento aereo 1 (più veloce)
    useEffect(() => {
        let animFrame;
        let last = Date.now();
        function animate() {
            const now = Date.now();
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            const speed = 140; // aereo 1 più veloce
            const dx = target1.left - plane1Pos.left;
            const dy = target1.top - plane1Pos.top;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 8) {
                setTarget1(getRandomTarget());
            } else {
                const move = Math.min(speed * dt, dist);
                setPlane1Pos(pos => ({
                    top: pos.top + (dy / dist) * move,
                    left: pos.left + (dx / dist) * move
                }));
            }
            animFrame = requestAnimationFrame(animate);
        }
        animFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrame);
    }, [target1, plane1Pos.left, plane1Pos.top]);

    // Movimento aereo 2 (più lento)
    useEffect(() => {
        let animFrame;
        let last = Date.now();
        function animate() {
            const now = Date.now();
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            const speed = 80; // aereo 2 più lento
            const dx = target2.left - plane2Pos.left;
            const dy = target2.top - plane2Pos.top;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 8) {
                setTarget2(getRandomTarget());
            } else {
                const move = Math.min(speed * dt, dist);
                setPlane2Pos(pos => ({
                    top: pos.top + (dy / dist) * move,
                    left: pos.left + (dx / dist) * move
                }));
            }
            animFrame = requestAnimationFrame(animate);
        }
        animFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrame);
    }, [target2, plane2Pos.left, plane2Pos.top]);

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

    // Recupera tutte le entries dell'utente loggato
    useEffect(() => {
        if (isAuthenticated && user) {
            photoAPI.getUserPhotos().then(res => {
                setUserEntries(res.data.entries);
            });
        } else {
            setUserEntries([]);
        }
    }, [isAuthenticated, user]);


    // useEffect per recuperare i contest attivi a cui l'utente può partecipare
    // Recupera tutti i contest dal backend
    const [allContests, setAllContests] = useState([]);
    useEffect(() => {
        if (isAuthenticated && user) {
            contestAPI.getAll().then(res => {
                setAllContests(res.data);
            });
        } else {
            setAllContests([]);
        }
    }, [isAuthenticated, user]);

    // Calcola i contest attivi a cui l'utente può partecipare
    useEffect(() => {
        if (isAuthenticated && user && allContests.length > 0) {
            const activeContests = allContests.filter(contest => contest.status === 'active');
            const userContestIds = userEntries.map(entry => String(entry.contest_id));
            const filtered = activeContests.filter(contest => !userContestIds.includes(String(contest.id)));
            setAvailableContests(filtered);
        } else {
            setAvailableContests([]);
        }
    }, [isAuthenticated, user, allContests, userEntries]);

    // Calcola i contest a cui l'utente ha partecipato con status desiderati
    useEffect(() => {
        if (isAuthenticated && user && allContests.length > 0) {
            const validStatuses = ['active', 'pending_voting', 'voting'];
            const participatedContestIds = userEntries.map(entry => String(entry.contest_id));
            const uniqueContestIds = [...new Set(participatedContestIds)];
            const filteredContests = allContests.filter(
                contest => uniqueContestIds.includes(String(contest.id)) && validStatuses.includes(contest.status)
            );
            setParticipatedContests(filteredContests);
        } else {
            setParticipatedContests([]);
        }
    }, [isAuthenticated, user, allContests, userEntries]);

    // Debug: mostra dati in console
    useEffect(() => {
        console.log('userEntries:', userEntries);
        console.log('participatedContests:', participatedContests);
    }, [userEntries, participatedContests]);

    return (
        <>
            <div className="home-root">
                {/* Hero Section (per tutti) */}
                <JumboHero />

                {/* Sezione autenticato */}
                {isAuthenticated ? (
                    <section className="home-auth-section">
                        <HomePlanesAndClouds
                            plane1Pos={plane1Pos}
                            plane2Pos={plane2Pos}
                            plane1Ref={plane1Ref}
                            plane2Ref={plane2Ref}
                        />
                        <div className="home-auth-container">
                            <h2 className="home-auth-title">{t('welcome_back')}, <span className="home-auth-username">{user?.name || t('user')}</span>!</h2>

                            {/* Contest attivi a cui può partecipare */}
                            <section className='home-auth-section-contest'>
                                {availableContests.length > 0 && (
                                    <div className="home-auth-contests">
                                        <h3>{t('active_contests')}</h3>
                                        <div className="home-contest-cards-flex">
                                            {availableContests.map(contest => (
                                                <ContestCard key={contest.id} contest={contest} variant="home" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Contest a cui ha già partecipato con status active, pending_voting, voting */}
                            <section className='home-auth-section-contest'>
                                {participatedContests.length > 0 && (
                                    <div className="home-auth-contests">
                                        <h3>Contest a cui hai partecipato</h3>
                                        <div className="home-contest-cards-flex">
                                            {participatedContests.map(contest => {
                                                // Trova la participation dell'utente per questo contest
                                                const participation = userEntries.find(entry => String(entry.contest_id) === String(contest.id));
                                                return (
                                                    <ContestCard key={contest.id} contest={contest} variant="home" userParticipation={participation} />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Contest terminati (status ended) */}
                            <section className='home-auth-section-contest'>
                                {isAuthenticated && allContests.filter(contest => contest.status === 'ended').length > 0 && (
                                    <div className="home-auth-contests">
                                        <h3>Contest terminati</h3>
                                        <div className="home-contest-cards-flex">
                                            {allContests.filter(contest => contest.status === 'ended').map(contest => (
                                                <ContestCard key={contest.id} contest={contest} variant="home" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* <p className="home-auth-subtitle">{t('home_logged_subtitle')}</p> */}
                            {/* Qui puoi aggiungere: contest attivi, foto recenti, notifiche, ecc. */}
                        </div>
                    </section>
                ) : (
                    <>
                        {/* Sezione non autenticato: come funziona, call to action, ecc. */}
                        <section className="home-how-section">
                            <HomePlanesAndClouds
                                plane1Pos={plane1Pos}
                                plane2Pos={plane2Pos}
                                plane1Ref={plane1Ref}
                                plane2Ref={plane2Ref}
                            />
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
                                        <div className="home-stats-icon">
                                            <FiCamera />
                                        </div>
                                        <div className="home-stats-value">1000+</div>
                                        <div className="home-stats-label">{t('photos_uploaded')}</div>
                                    </div>

                                    <div className="home-stats-card">
                                        <div className="home-stats-icon">
                                            <FiAward />
                                        </div>
                                        <div className="home-stats-value">50+</div>
                                        <div className="home-stats-label">{t('active_contests')}</div>
                                    </div>

                                    <div className="home-stats-card">
                                        <div className="home-stats-icon">
                                            <FiUsers />
                                        </div>
                                        <div className="home-stats-value">500+</div>
                                        <div className="home-stats-label">{t('active_users')}</div>
                                    </div>

                                    <div className="home-stats-card">
                                        <div className="home-stats-icon">
                                            <FiHeart />
                                        </div>
                                        <div className="home-stats-value">10k+</div>
                                        <div className="home-stats-label">{t('votes_cast')}</div>
                                    </div>

                                </div>
                            </div>
                        </section>
                    </>
                )}

                <Footer />
            </div >
        </>
    );
};

export default HomePage;