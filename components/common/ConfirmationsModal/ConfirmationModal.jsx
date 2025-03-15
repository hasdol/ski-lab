"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose } from "react-icons/md";

const ConfirmationModal = ({ onClose, onArchive, onDelete }) => {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-down animate-duration-300">
      <div className="bg-container p-5 my-4 rounded-xl">
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold">{t('choose_an_action')}</h3>
          <button
            className="p-1 rounded-full hover:opacity-90"
            onClick={onClose}
          >
            <MdClose size={25} />
          </button>
        </div>
        <ul className="list my-4">
          <li>
            <span className="font-semibold">{t('archive')}:</span> {t('archive_info')}
          </li>
          <li>
            <span className="font-semibold">{t('delete')}:</span> {t('delete_info')}
          </li>
        </ul>
        <div className="flex justify-center space-x-4">
          <button
            className="bg-btn text-btntxt text-sm px-4 py-2 rounded-xl hover:opacity-90"
            onClick={onArchive}
          >
            {t('archive')}
          </button>
          <button
            className="bg-red-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-red-600"
            onClick={onDelete}
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
