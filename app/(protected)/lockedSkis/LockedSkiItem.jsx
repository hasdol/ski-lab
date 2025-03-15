// components/ManageLockedSkisPage/LockedSkiItem.jsx

import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { RiLockLine, RiDeleteBinLine } from "react-icons/ri";

const LockedSkiItem = ({ ski, handleDelete }) => {
  const { t } = useTranslation();

  const confirmDelete = (e) => {
    e.stopPropagation(); // Prevent triggering any parent click events
    const isConfirmed = window.confirm(
      t('delete_ski_promt') + " " + t('delete_ski_promt_2')
    );
    if (isConfirmed) {
      handleDelete(ski.id);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-container rounded">
      <RiLockLine className='ml-2'/>
      <div className="flex items-center space-x-2">
        <span className="font-semibold">{t('serial_number')}: </span>
        <span>{ski.serialNumber}</span>
      </div>
      <div className='bg-background p-2 rounded-full '>
        <button
          onClick={confirmDelete}
          className="text-delete p-2 rounded-full shadow bg-container hover:bg-delete hover:text-btntxt focus:outline-none"
          title={t('delete_ski')}
        >
          <RiDeleteBinLine />
        </button>
      </div>

    </div>
  );
};

LockedSkiItem.propTypes = {
  ski: PropTypes.shape({
    id: PropTypes.string.isRequired,
    serialNumber: PropTypes.string.isRequired,
  }).isRequired,
  handleDelete: PropTypes.func.isRequired,
};

export default LockedSkiItem;
