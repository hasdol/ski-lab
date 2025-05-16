import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../helpers/helpers';

const GrindHistory = ({ grindHistory }) => {
  const { t } = useTranslation();

  if (!grindHistory || grindHistory.length === 0) {
    return <i>{t('no_grind_history')}</i>;
  }

  return (
    <div className="my-4">
      <h3 className="text-2xl font-semibold mb-5">{t('grind_history')}</h3>
      <ul className="space-y-4">
        {grindHistory.map((entry, index) => (
          <li
            key={index}
            className="flex justify-between items-center px-2 border-l-2 border-gray-300"
          >
            <div>
              <p className="font-semibold">
                {t('grind')}: {entry.grind || '--'}
                {index === 0 && (
                  <span className="ml-1 text-sm text-gray-500">
                    ({t('current')})
                  </span>
                )}
              </p>
              <p className='text-sm'>
                {t('grind_date')}: {formatDate(entry.grindDate)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GrindHistory;
