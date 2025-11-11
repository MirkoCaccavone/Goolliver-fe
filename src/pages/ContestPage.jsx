import React from 'react';
import { useParams } from 'react-router-dom';

const ContestPage = () => {
    const { id } = useParams();

    return (
        <div className="min-vh-100 bg-light">
            <div className="container py-5">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-trophy display-1 text-muted mb-4"></i>
                                <h1 className="h2 fw-bold text-dark mb-3">Contest #{id}</h1>
                                <p className="text-muted mb-4">
                                    Pagina contest in sviluppo - sarà la prossima implementazione
                                </p>
                                <div className="alert alert-info d-inline-block">
                                    🚧 Contest page coming soon...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContestPage;