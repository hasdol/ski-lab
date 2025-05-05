// src/components/Filter/DateSort.js
import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';


const DateSort = ({ sortOrder, setSortOrder }) => {
    const { t } = useTranslation();

    const handleChange = (event) => {
        setSortOrder(event.target.value);
    };

    return (
        <FormControl fullWidth>
            <InputLabel id="date-sort-label">{t('sort_by_date')}</InputLabel>
            <Select
                labelId="date-sort-label"
                value={sortOrder}
                label={t('sort_by_date')}
                onChange={handleChange}
            >
                <MenuItem value="asc">{t('oldest_first')}</MenuItem>
                <MenuItem value="desc">{t('newest_first')}</MenuItem>
            </Select>
        </FormControl>
    );
};

export default DateSort;
