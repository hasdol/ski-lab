import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../helpers/helpers';

const GrindHistory = ({ grindHistory }) => {
    const { t } = useTranslation();

    if (!grindHistory || grindHistory.length === 0) {
        return <i>{t('no_grind_history')}</i>;
    }

    return (
        <div className="mt-4">
            <h3 className="text-2xl font-semibold mb-2">{t('grind_history')}</h3>
            <ul className='space-y-2'>
                {grindHistory.map((entry, index) => (
                    <li key={index} className="flex justify-between items-center space-x-2 py-2 rounded-xl">
                        <div>
                            <p className="font-semibold">{t('grind')}: {entry.grind || '--'}</p>
                            <p>{t('grind_date')}: {formatDate(entry.grindDate)}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GrindHistory;
