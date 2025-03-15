import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const BackBtn = () => {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <div>
      <button
        type="button"
        className="flex items-center px-5 py-3 bg-sbtn text-text rounded hover:bg-hoverSbtn"
        onClick={() => router.back()}
      >
        {t('back')}
      </button>
    </div>
  );
};

export default BackBtn;
