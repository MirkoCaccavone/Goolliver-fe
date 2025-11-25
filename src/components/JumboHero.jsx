import React, { useState, useEffect } from 'react';
import { contestAPI } from '../services/api';

const heroImages = [
    'public/Screenshot-(244).png',
];

// Genera posizioni random non sovrapposte
function generateRandomPositions(count) {
    const positions = [];
    let attempts = 0;
    const minDist = 8;
    while (positions.length < count && attempts < 3000) {
        const top = Math.random() * 90 + 10;
        const left = Math.random() * 90 + 10;
        if (positions.every(pos => Math.abs(pos.top - top) > minDist && Math.abs(pos.left - left) > minDist)) {
            positions.push({ top, left });
        }
        attempts++;
    }
    // Se non bastano, aggiungi posizioni random anche se vicine
    while (positions.length < count) {
        const top = Math.random() * 60 + 10;
        const left = Math.random() * 70 + 10;
        positions.push({ top, left });
    }
    return positions;
}

const JumboHero = () => {
    const [modalImg, setModalImg] = useState(null);
    const [thumbnails, setThumbnails] = useState([]);
    const [loadingThumbs, setLoadingThumbs] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchContestPhotos() {
            try {
                setLoadingThumbs(true);
                const contestsRes = await contestAPI.getAll();
                const contests = contestsRes.data?.data || contestsRes.data || [];
                const activeContests = contests.filter(c => c.status === 'active' || c.is_active);
                let allPhotos = [];
                for (const c of activeContests) {
                    try {
                        const entriesRes = await contestAPI.getEntries(c.id);
                        const entries = entriesRes.data?.data || entriesRes.data || [];
                        const photos = entries.filter(e => e.photo_url).map(e => ({
                            src: e.photo_url,
                            id: e.id
                        }));
                        allPhotos = [...allPhotos, ...photos];
                    } catch (err) {
                        // ignora errori singoli contest
                    }
                }
                // Genera posizioni random solo una volta, dopo aver raccolto tutte le foto
                const positions = generateRandomPositions(allPhotos.length);
                const thumbs = allPhotos.map((photo, i) => ({
                    src: photo.src,
                    top: `${positions[i]?.top || 0}%`,
                    left: `${positions[i]?.left || 0}%`,
                }));
                if (isMounted) setThumbnails(thumbs);
            } catch (err) {
                setThumbnails([]);
            } finally {
                setLoadingThumbs(false);
            }
        }
        fetchContestPhotos();
        return () => { isMounted = false; };
    }, []);

    return (
        <section className="jumbo">
            <div className="jumbo-img-strip" style={{ position: 'relative' }}>
                {[...heroImages, ...heroImages].map((src, i) => (
                    <div key={i} className="jumbo-img-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                            className="jumbo-img"
                            src={src}
                            alt="hero"
                        />
                        {thumbnails.map((thumb, idx) => (
                            <img
                                key={idx}
                                className="jumbo-thumb"
                                src={thumb.src}
                                alt="thumb"
                                style={{
                                    position: 'absolute',
                                    top: thumb.top,
                                    left: thumb.left,
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    border: '2px solid #fff',
                                    boxShadow: '0 2px 8px #0006',
                                    cursor: 'pointer',
                                    zIndex: 2,
                                }}
                                onClick={() => setModalImg(thumb.src)}
                            />
                        ))}
                    </div>
                ))}
            </div>
            {modalImg && (
                <div className="modal-backdrop" onClick={() => setModalImg(null)}>
                    <img src={modalImg} alt="zoom" className="modal-img" />
                </div>
            )}
        </section>
    );
};

export default JumboHero;
