import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook, FiTwitter } from "react-icons/fi";
import "../style/componentsStyle/Footer.css"

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">

                {/* --- COLONNA 1: BRAND + DESCRIZIONE --- */}
                <div className="footer-col">
                    <h2 className="footer-logo">Goolly</h2>
                    <p className="footer-desc">
                        La piattaforma fotografica dove puoi partecipare a contest, votare e vincere premi.
                        Libera la tua creatività, condividi i tuoi scatti e scala la classifica.
                    </p>

                    <div className="footer-socials">
                        <a href="#" aria-label="Instagram"><FiInstagram /></a>
                        <a href="#" aria-label="Facebook"><FiFacebook /></a>
                        <a href="#" aria-label="Twitter"><FiTwitter /></a>
                    </div>
                </div>

                {/* --- COLONNA 2: LINK UTILI --- */}
                <div className="footer-col">
                    <h3 className="footer-title">Link Utili</h3>
                    <ul className="footer-links">
                        <li><a href="/about">Chi Siamo</a></li>
                        <li><a href="/contests">Contests</a></li>
                        <li><a href="/pricing">Prezzi & Crediti</a></li>
                        <li><a href="/faq">FAQ</a></li>
                        <li><a href="/contact">Contatti</a></li>
                    </ul>
                </div>

                {/* --- COLONNA 3: LEGAL --- */}
                <div className="footer-col">
                    <h3 className="footer-title">Legal</h3>
                    <ul className="footer-links">
                        <li><a href="/terms">Termini e Condizioni</a></li>
                        <li><a href="/privacy">Privacy Policy</a></li>
                        <li><a href="/cookie">Cookie Policy</a></li>
                        <li><a href="/refunds">Politica Rimborsi</a></li>
                    </ul>
                </div>

                {/* --- COLONNA 4: CONTATTI --- */}
                <div className="footer-col">
                    <h3 className="footer-title">Supporto</h3>

                    <ul className="footer-contact-list">
                        <li><FiMail /> support@goolly.com</li>
                        <li><FiPhone /> +39 123 456 7890</li>
                        <li><FiMapPin /> Roma, Italia</li>
                    </ul>
                </div>
            </div>

            {/* --- COPYRIGHT --- */}
            <div className="footer-bottom">
                © {new Date().getFullYear()} Goolly — Tutti i diritti riservati.
            </div>
        </footer>
    );
};

export default Footer;
