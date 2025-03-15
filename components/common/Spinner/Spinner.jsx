// Spinner.js
import React from 'react';
import './Spinner.css';
import { BsSnow2 } from "react-icons/bs";
import { useTranslation } from 'react-i18next';


const Spinner = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-96 flex flex-col items-center justify-center animate-fade">
      <BsSnow2 className="text-4xl text-text rotate-animation " />
      <i className='text-sm mt-1'>{t('loading')}</i>
    </div>
  )
};

export default Spinner;
