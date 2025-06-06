'use client'
import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { RiArrowDownDoubleLine, RiDeleteBinLine } from "react-icons/ri";
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
// Import the helper instead of using a local version
import { formatDate } from '@/helpers/helpers';

const SkiForm = ({ initialData = {}, onSubmit, isEdit = false }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    serialNumber: '',
    brand: '',
    model: '',
    style: '',
    length: 200, // Default length value
    grind: '',
    grindDate: '',
    stiffness: '',
    base: '',
    construction: '',
    comment: '',
    grindHistory: [],
    newGrind: '',
    newGrindDate: '',
    skiType: '',
    ...initialData,
  });

  useEffect(() => {
    if (isEdit && initialData.grindHistory) {
      setFormData(prev => ({
        ...prev,
        grindHistory: initialData.grindHistory.map(entry => ({
          ...entry,
          grindDate: entry.grindDate.toDate
            ? entry.grindDate.toDate().toISOString().split('T')[0]
            : entry.grindDate,
        })),
        grindDate: initialData.grindDate.toDate
          ? initialData.grindDate.toDate().toISOString().split('T')[0]
          : initialData.grindDate,
      }));
    }
  }, [initialData, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteGrind = (index) => {
    if (window.confirm("Are you sure you want to delete this grind?")) {
      const updatedGrindHistory = formData.grindHistory.filter((_, i) => i !== index);
      updatedGrindHistory.sort((a, b) => new Date(b.grindDate) - new Date(a.grindDate));

      const newCurrentGrind = updatedGrindHistory[0]?.grind || '';
      const newCurrentGrindDate = updatedGrindHistory[0]?.grindDate || '';

      setFormData({
        ...formData,
        grindHistory: updatedGrindHistory,
        grind: newCurrentGrind,
        grindDate: newCurrentGrindDate,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let preparedData = { ...formData, archived: false };
      const convertToTimestamp = (dateStr) =>
        dateStr ? Timestamp.fromDate(new Date(dateStr)) : null;

      if (!isEdit) {
        preparedData.grindHistory = [];
        if (formData.grind && formData.grindDate) {
          preparedData.grindHistory.push({
            grind: formData.grind,
            grindDate: convertToTimestamp(formData.grindDate),
          });
          preparedData.grindDate = convertToTimestamp(formData.grindDate);
        }
      } else {
        preparedData.grindHistory = formData.grindHistory.map(entry => ({
          ...entry,
          grindDate: convertToTimestamp(entry.grindDate),
        }));

        if (formData.newGrind || formData.newGrindDate) {
          const newGrindEntry = {
            grind: formData.newGrind || '',
            grindDate: convertToTimestamp(formData.newGrindDate),
          };
          preparedData.grindHistory = [
            newGrindEntry,
            ...preparedData.grindHistory,
          ];
          preparedData.grindHistory.sort(
            (a, b) => b.grindDate.toMillis() - a.grindDate.toMillis()
          );
        }

        if (preparedData.grindHistory.length > 0) {
          preparedData.grind = preparedData.grindHistory[0].grind;
          preparedData.grindDate = preparedData.grindHistory[0].grindDate;
        } else {
          preparedData.grind = '';
          preparedData.grindDate = null;
        }
      }

      // Remove temporary fields
      delete preparedData.newGrind;
      delete preparedData.newGrindDate;

      await onSubmit(preparedData);
    } catch (error) {
      console.error("Error submitting form: ", error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label='Serial number'
          type="number"
          name="serialNumber"
          value={formData.serialNumber}
          onChange={handleChange}
          placeholder='Serial number'
          required
        />
        <Input
          label='Style'
          type="select"
          name="style"
          value={formData.style}
          onChange={handleChange}
          placeholder='Style'
          required
          options={[
            { label: 'Classic', value: 'classic' },
            { label: 'Skate', value: 'skate' },
            { label: 'DP', value: 'dp' },
          ]}
        />
        <Input
          label='Brand'
          type="text"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          placeholder='Brand'
          required
        />
        <Input
          label='Model'
          type="text"
          name="model"
          value={formData.model}
          onChange={handleChange}
          placeholder='Model'
        />
        <div className={`${isEdit && 'bg-gray-50 rounded-md my-4 p-4'}`}>
          {isEdit && (
            <h3 className="text-xl font-semibold mb-4">Change Grind</h3>
          )}
          <div className="space-y-4">
            {/* Existing grind info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <Input
                label='Grind'
                type="text"
                name="grind"
                value={formData.grind}
                onChange={handleChange}
                placeholder='Grind'
                required
                disabled={isEdit}
              />
              <div className="relative flex flex-col">
                <Input
                  label='Grind date'
                  type="date"
                  name="grindDate"
                  value={formData.grindDate}
                  onChange={handleChange}
                  placeholder='Grind date'
                  required
                  disabled={isEdit}
                />
                {formData.grindDate && (
                  <p className="absolute -bottom-4 text-xs text-gray-500 mt-1">
                    Norwegian format: {formatDate(formData.grindDate)}
                  </p>
                )}
              </div>
            </div>

            {isEdit && (
              <>
                <div className="flex justify-center mb-4 mt-8">
                  <RiArrowDownDoubleLine size={30} />
                </div>
                {/* New grind info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <Input
                    label='New grind'
                    type="text"
                    name="newGrind"
                    value={formData.newGrind || ''}
                    onChange={handleChange}
                    placeholder='New grind'
                  />
                  <div className="relative flex flex-col">
                    <Input
                      label='New grind date'
                      type="date"
                      name="newGrindDate"
                      value={formData.newGrindDate || ''}
                      onChange={handleChange}
                      placeholder='New grind date'
                    />
                    {formData.newGrindDate && (
                      <p className="absolute -bottom-4 text-xs text-gray-500 mt-1">
                        Norwegian format: {formatDate(formData.newGrindDate)}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {isEdit && formData.grindHistory.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold my-8">Grind History</h3>
              <ul className="space-y-2">
                {formData.grindHistory.map((entry, index) => (
                  <li
                    key={index}
                    className="flex  justify-between items-center space-y-1 border-b border-gray-300 pb-2"
                  >
                    <p className="text-sm">
                      {entry.grind} - {formatDate(entry.grindDate)}
                    </p>
                    <Button
                      type="button"
                      onClick={() => handleDeleteGrind(index)}
                      variant="danger"
                    >
                      <RiDeleteBinLine />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Input
          label='Ski type'
          type="select"
          name="skiType"
          value={formData.skiType}
          onChange={handleChange}
          placeholder='Ski type'
          options={[
            { label: 'Cold', value: 'cold' },
            { label: 'Universal', value: 'universal' },
            { label: 'Warm', value: 'warm' },
          ]}
        />
        <Input
          label='Length'
          type="range"
          name="length"
          value={formData.length}
          onChange={handleChange}
          min={170}
          max={220}
          step={1}
          placeholder='Length'
          unit="cm"
        />
        <Input
          label='Stiffness'
          type="text"
          name="stiffness"
          value={formData.stiffness}
          onChange={handleChange}
          placeholder='Stiffness'
        />
        <Input
          label="Base"
          type="text"
          name="base"
          value={formData.base}
          onChange={handleChange}
          placeholder="Base"
        />
        <Input
          label='Construction'
          type="text"
          name="construction"
          value={formData.construction}
          onChange={handleChange}
          placeholder='Construction'
        />
        <Input
          label='Comment'
          type="textarea"
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          placeholder='Comment'
        />
        <div className="flex space-x-2 my-4">
          <Button type="submit" loading={isSubmitting} variant="primary">
            Save
          </Button>
          <Button variant="secondary" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SkiForm;
