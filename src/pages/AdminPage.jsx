import React from 'react';

const AdminPage = () => {
    return (
        <div className="min-vh-100 bg-light">
            <div className="container py-5">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-gear display-1 text-muted mb-4"></i>
                                <h1 className="h2 fw-bold text-dark mb-3">Admin Dashboard</h1>
                                <p className="text-muted mb-4">
                                    Pannello amministrazione - in sviluppo
                                </p>
                                <div className="alert alert-warning d-inline-block">
                                    🔧 Admin panel coming soon...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;