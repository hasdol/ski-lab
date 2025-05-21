// src/components/Filter/DateSort.js
import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';


const ResultsDateSort = ({ sortOrder, setSortOrder }) => {

    const handleChange = (event) => {
        setSortOrder(event.target.value);
    };

    return (
        <FormControl fullWidth>
            <InputLabel id="date-sort-label">Sort by date</InputLabel>
            <Select
                labelId="date-sort-label"
                value={sortOrder}
                label='Sort by date'
                onChange={handleChange}
            >
                <MenuItem value="asc">Oldest first</MenuItem>
                <MenuItem value="desc">Newest first</MenuItem>
            </Select>
        </FormControl>
    );
};

export default ResultsDateSort;
