'use client'
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';


const CookieConsent = () => {
    const { t } = useTranslation();

    const [hasConsented, setHasConsented] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (consent === 'true') {
            setHasConsented(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setHasConsented(true);
    };

    if (hasConsented) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-slate-700 text-white p-5 text-center z-50">
            <p className="mb-4">
                {t('cookie_concent')}
            </p>
            <button
                onClick={handleAccept}
                className="px-4 py-2 bg-white text-gray-800 rounded hover:bg-gray-200 transition-colors"
            >
                Aksepter
            </button>
        </div>
    );
};

export default CookieConsent;
