// components/ManageLockedSkisPage/LockedSkiItem.jsx

import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { RiLockLine, RiDeleteBinLine } from "react-icons/ri";
import Button from '@/components/common/Button';

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
    <div className="flex items-center justify-between p-2 bg-white rounded-md">
      <RiLockLine className='ml-2' />
      <div className="flex items-center space-x-2">
        <span className="font-semibold">{t('serial_number')}: </span>
        <span>{ski.serialNumber}</span>
      </div>
      <Button
        onClick={confirmDelete}
        variant="danger"
      >
        <RiDeleteBinLine />
      </Button>

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
