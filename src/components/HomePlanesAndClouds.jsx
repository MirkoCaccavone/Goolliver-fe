import React from 'react';

const HomePlanesAndClouds = ({ plane1Pos, plane2Pos, plane1Ref, plane2Ref }) => (
    <>
        {/* --- SVG aereo 1 --- */}
        <svg
            className="home-plane-anim"
            ref={plane1Ref}
            viewBox="0 0 420 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                position: 'absolute',
                top: plane1Pos.top,
                left: plane1Pos.left,
                width: 190,
                height: 50,
                zIndex: 2,
                pointerEvents: 'none',
                transition: 'none'
            }}
        >
            <g>
                <defs>
                    <linearGradient id="planeTrailGradient1" x1="100" y1="45" x2="-180" y2="45" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
                        <stop offset="40%" stopColor="#b0b8c1" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#b0b8c1" stopOpacity="0" />
                    </linearGradient>
                    <filter id="trailBlur1">
                        <feGaussianBlur stdDeviation="3" />
                    </filter>
                </defs>
                <path d="M100,45 Q-40,10 -180,45 Q-40,80 100,45" stroke="url(#planeTrailGradient1)" strokeWidth="12" fill="none" filter="url(#trailBlur1)" />
                <rect x="100" y="39" width="210" height="22" rx="11" fill="#e6eaf0" stroke="#b0b8c1" strokeWidth="2" />
                <ellipse cx="310" cy="50" rx="21" ry="11" fill="#e6eaf0" stroke="#b0b8c1" strokeWidth="2" />
                <polygon points="100,39 60,15 57,27 97,73" fill="#b0b8c1" />
                <polygon points="240,41 160,5 148,23 210,67" fill="#b0b8c1" />
                <polygon points="200,61 120,85 115,75 180,53" fill="#b0b8c1" />
                <ellipse cx="220" cy="67" rx="10" ry="8" fill="#7a8ca3" />
                <ellipse cx="170" cy="69" rx="10" ry="8" fill="#7a8ca3" />
                <rect x="250" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="230" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="210" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="190" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="170" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="150" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="285" y="42" width="18" height="12" rx="4" fill="#7a8ca3" />
                <ellipse cx="250" cy="81" rx="6" ry="6" fill="#444" />
                <ellipse cx="170" cy="81" rx="6" ry="6" fill="#444" />
                <rect x="110" y="57" width="190" height="3" rx="1.5" fill="#b0b8c1" opacity="0.3" />
            </g>
        </svg>
        {/* --- SVG aereo 2 --- */}
        <svg
            className="home-plane-anim"
            ref={plane2Ref}
            viewBox="0 0 420 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                position: 'absolute',
                top: plane2Pos.top,
                left: plane2Pos.left,
                width: 190,
                height: 50,
                zIndex: 2,
                pointerEvents: 'none',
                transition: 'none'
            }}
        >
            <g>
                <defs>
                    <linearGradient id="planeTrailGradient2" x1="100" y1="45" x2="-180" y2="45" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
                        <stop offset="40%" stopColor="#b0b8c1" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#b0b8c1" stopOpacity="0" />
                    </linearGradient>
                    <filter id="trailBlur2">
                        <feGaussianBlur stdDeviation="3" />
                    </filter>
                </defs>
                <path d="M100,45 Q-40,10 -180,45 Q-40,80 100,45" stroke="url(#planeTrailGradient2)" strokeWidth="12" fill="none" filter="url(#trailBlur2)" />
                <rect x="100" y="39" width="210" height="22" rx="11" fill="#e6eaf0" stroke="#b0b8c1" strokeWidth="2" />
                <ellipse cx="310" cy="50" rx="21" ry="11" fill="#e6eaf0" stroke="#b0b8c1" strokeWidth="2" />
                <polygon points="100,39 60,15 57,27 97,73" fill="#b0b8c1" />
                <polygon points="240,41 160,5 148,23 210,67" fill="#b0b8c1" />
                <polygon points="200,61 120,85 115,75 180,53" fill="#b0b8c1" />
                <ellipse cx="220" cy="67" rx="10" ry="8" fill="#7a8ca3" />
                <ellipse cx="170" cy="69" rx="10" ry="8" fill="#7a8ca3" />
                <rect x="250" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="230" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="210" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="190" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="170" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="150" y="46" width="15" height="6" rx="3" fill="#b0b8c1" />
                <rect x="285" y="42" width="18" height="12" rx="4" fill="#7a8ca3" />
                <ellipse cx="250" cy="81" rx="6" ry="6" fill="#444" />
                <ellipse cx="170" cy="81" rx="6" ry="6" fill="#444" />
                <rect x="110" y="57" width="190" height="3" rx="1.5" fill="#b0b8c1" opacity="0.3" />
            </g>
        </svg>

        {/* --- SVG nuvole --- */}

        {/* Nuvola grande */}
        <svg className="home-cloud-anim home-cloud-large" viewBox="0 0 160 80" fill="none" style={{ left: '10vw', top: '8vh', position: 'absolute' }}>
            <ellipse cx="60" cy="40" rx="60" ry="32" fill="#fff" />
            <ellipse cx="120" cy="48" rx="36" ry="24" fill="#fff" />
        </svg>

        {/* Nuvola media */}
        <svg className="home-cloud-anim home-cloud-medium" viewBox="0 0 100 50" fill="none" style={{ left: '70vw', top: '18vh', position: 'absolute' }}>
            <ellipse cx="40" cy="25" rx="36" ry="18" fill="#fff" />
            <ellipse cx="80" cy="30" rx="20" ry="12" fill="#fff" />
        </svg>

        {/* Nuvola piccola */}
        <svg className="home-cloud-anim home-cloud-small" viewBox="0 0 60 30" fill="none" style={{ left: '10vw', top: '70vh', position: 'absolute' }}>
            <ellipse cx="20" cy="15" rx="18" ry="9" fill="#fff" />
            <ellipse cx="45" cy="18" rx="10" ry="6" fill="#fff" />
        </svg>

        {/* Seconda nuvola grande */}
        <svg className="home-cloud-anim home-cloud-large second-cloud" viewBox="0 0 160 80" fill="none" style={{ left: '10vw', top: '220vh', position: 'absolute' }}>
            <ellipse cx="60" cy="40" rx="60" ry="32" fill="#fff" />
            <ellipse cx="120" cy="48" rx="36" ry="24" fill="#fff" />
        </svg>

        {/* Seconda nuvola media */}
        <svg className="home-cloud-anim home-cloud-medium second-cloud" viewBox="0 0 100 50" fill="none" style={{ left: '50vw', top: '145vh', position: 'absolute' }}>
            <ellipse cx="40" cy="25" rx="36" ry="18" fill="#fff" />
            <ellipse cx="80" cy="30" rx="20" ry="12" fill="#fff" />
        </svg>

        {/* Seconda nuvola piccola */}
        <svg className="home-cloud-anim home-cloud-small second-cloud" viewBox="0 0 60 30" fill="none" style={{ left: '80vw', top: '80vh', position: 'absolute' }}>
            <ellipse cx="20" cy="15" rx="18" ry="9" fill="#fff" />
            <ellipse cx="45" cy="18" rx="10" ry="6" fill="#fff" />
        </svg>
    </>
);

export default HomePlanesAndClouds;
