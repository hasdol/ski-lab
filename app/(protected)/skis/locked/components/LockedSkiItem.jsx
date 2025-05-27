// components/ManageLockedSkisPage/LockedSkiItem.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { RiLockLine, RiDeleteBinLine } from "react-icons/ri";
import Button from '@/components/ui/Button';

const LockedSkiItem = ({ ski, handleDelete }) => {

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
    <div className="flex items-center border border-gray-300 rounded-md justify-between p-2">
      <RiLockLine className='ml-2' />
      <div className="flex items-center space-x-2">
        <span className="font-semibold">Serial number </span>
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
