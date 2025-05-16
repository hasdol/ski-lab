import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../helpers/helpers';

const GrindHistory = ({ grindHistory }) => {
  const { t } = useTranslation();

  if (!grindHistory || grindHistory.length === 0) {
    return <i>No grind history</i>;
  }

  return (
    <div className="my-10">
      <h3 className="text-2xl font-semibold mb-5">Grind history</h3>
      <ul className="space-y-4">
        {grindHistory.map((entry, index) => (
          <li
            key={index}
            className="flex justify-between items-center px-2 border-l-2 border-gray-300"
          >
            <div>
              <p className="font-semibold">
                Grind: {entry.grind || '--'}
                {index === 0 && (
                  <span className="ml-1 text-sm text-gray-500">
                    (Current)
                  </span>
                )}
              </p>
              <p className='text-sm'>
                Grind date: {formatDate(entry.grindDate)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GrindHistory;
