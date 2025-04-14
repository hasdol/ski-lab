'use client'
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Timestamp } from 'firebase/firestore';
import { RiArrowDownDoubleLine, RiDeleteBinLine } from "react-icons/ri";

import Input from '@/components/common/Input'; // Updated import: using the unified Input component
import Button from '../common/Button';
import { useRouter } from 'next/navigation';

const SkiForm = ({ initialData = {}, onSubmit, isEdit = false }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    serialNumber: '',
    brand: '',
    model: '',
    style: '',
    length: '',
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
        // Format the main grindDate
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
      let preparedData = { ...formData };
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
    <form onSubmit={handleSubmit} className='space-y-2'>
      <Input
        label={t('serial_number')}
        type="number"
        name="serialNumber"
        value={formData.serialNumber}
        onChange={handleChange}
        placeholder={t('serial_number')}
        required
      />
      <Input
        label={t('style')}
        type="select"
        name="style"
        value={formData.style}
        onChange={handleChange}
        placeholder={t('style')}
        required
        options={[
          { label: t('classic'), value: 'classic' },
          { label: t('skate'), value: 'skate' },
          { label: 'DP', value: 'dp' },
        ]}
      />
      <Input
        label={t('brand')}
        type="text"
        name="brand"
        value={formData.brand}
        onChange={handleChange}
        placeholder={t('brand')}
        required
      />
      <Input
        label={t('model')}
        type="text"
        name="model"
        value={formData.model}
        onChange={handleChange}
        placeholder={t('model')}
      />
      <div className={`${isEdit && 'bg-container shadow border border-sbtn rounded my-4 p-4'}`}>
        {isEdit && (
          <h3 className="self-start text-xl mb-4 font-semibold">{t('change_grind')}</h3>
        )}
        <div className="flex flex-col justify-between items-center">
          <div className="w-full grid grid-cols-2 gap-2 items-center">
            <Input
              label={t('grind')}
              type="text"
              name="grind"
              value={formData.grind}
              onChange={handleChange}
              placeholder={t('grind')}
              required
              disabled={isEdit}
            />
            <Input
              label={t('grind_date')}
              type="date"
              name="grindDate"
              value={formData.grindDate}
              onChange={handleChange}
              placeholder={t('grind_date')}
              required
              disabled={isEdit}
            />
          </div>
          {isEdit && (
            <div className="my-4">
              <RiArrowDownDoubleLine size={30} />
            </div>
          )}
          {isEdit && (
            <div className="w-full grid grid-cols-2 gap-2 items-center">
              <Input
                label={t('new_grind')}
                type="text"
                name="newGrind"
                value={formData.newGrind || ''}
                onChange={handleChange}
                placeholder={t('new_grind')}
              />
              <Input
                label={t('grind_date')}
                type="date"
                name="newGrindDate"
                value={formData.newGrindDate || ''}
                onChange={handleChange}
                placeholder={t('grind_date')}
              />
            </div>
          )}
        </div>
        {isEdit && formData.grindHistory.length > 0 && (
          <div className="p-4 flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4">{t('grind_history')}</h3>
            <ul className="space-y-2">
              {formData.grindHistory.map((entry, index) => (
                <li key={index} className="flex justify-between items-center space-x-2">
                  <p>
                    {entry.grind} - {new Date(entry.grindDate).toLocaleDateString()}
                  </p>
                  <Button
                    type="button"
                    onClick={() => handleDeleteGrind(index)}
                    variant="danger"
                  >
                    <RiDeleteBinLine size={12} />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Input
        label={t('ski_type')}
        type="select"
        name="skiType"
        value={formData.skiType}
        onChange={handleChange}
        placeholder={t('ski_type')}
        options={[
          { label: t('cold'), value: 'cold' },
          { label: t('universal'), value: 'universal' },
          { label: t('warm'), value: 'warm' },
        ]}
      />
      <Input
        label={t('length')}
        type="range"
        name="length"
        value={formData.length}
        onChange={handleChange}
        min={170}
        max={220}
        step={1}
        placeholder={t('length')}
        unit="cm"
      />
      <Input
        label={t('stiffness')}
        type="text"
        name="stiffness"
        value={formData.stiffness}
        onChange={handleChange}
        placeholder={t('stiffness')}
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
        label={t('construction')}
        type="text"
        name="construction"
        value={formData.construction}
        onChange={handleChange}
        placeholder={t('construction')}
      />
      <Input
        label={t('comment')}
        type="textarea"
        name="comment"
        value={formData.comment}
        onChange={handleChange}
        placeholder={t('comment')}
      />
      <div className="flex space-x-2 my-4">
        <Button type="submit" loading={isSubmitting} variant="primary">
          {t('save')}
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          {t('back')}
        </Button>
      </div>
    </form>
  );
};

export default SkiForm;
