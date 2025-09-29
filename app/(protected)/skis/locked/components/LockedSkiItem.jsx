// components/ManageLockedSkisPage/LockedSkiItem.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { RiLockLine, RiDeleteBinLine } from "react-icons/ri";
import Button from '@/components/ui/Button';

const LockedSkiItem = ({ ski, handleDelete }) => {

  const confirmDelete = (e) => {
    e.stopPropagation(); // Prevent triggering any parent click events
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this locked ski?"
    );
    if (isConfirmed) {
      handleDelete(ski.id);
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-100 border border-gray-200 py-2.5 px-5 rounded-xl shadow">
      <div className="flex items-center space-x-3">
        <RiLockLine className="text-gray-700 text-xl" />
        <div>
          <div className="font-semibold text-gray-800">Serial Number</div>
          <div className="text-gray-600">{ski.serialNumber}</div>
        </div>
      </div>
      <Button onClick={confirmDelete} variant="danger" className="flex items-center text-sm">
        <RiDeleteBinLine className="mr-1" />
        Delete
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
