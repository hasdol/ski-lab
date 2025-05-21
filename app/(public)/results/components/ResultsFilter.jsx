// src/components/Filter/Filter.js

import React, { useEffect, useState } from 'react';
import {
    Drawer,
    IconButton,
    Box,
    Typography,
    Slider,
    Button,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import { FaTemperatureThreeQuarters } from 'react-icons/fa6';
import DateSort from './ResultsDateSort'; // Adjust the path if necessary

const ResultsFilter = ({
    open,
    onClose,
    tempRange,
    onTempCommit,
    sortOrder,
    setSortOrder,
    resetFilter,
    styleFilter,
    setStyleFilter,
}) => {

    // Local range for smooth sliding without re‑queries
    const [localRange, setLocalRange] = useState(tempRange);
    useEffect(() => setLocalRange(tempRange), [tempRange]); // keep in sync

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 300, padding: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Filter
                </Typography>

                {/* Sort by Date */}
                <Box sx={{ my: 4 }}>
                    <DateSort sortOrder={sortOrder} setSortOrder={setSortOrder} />
                </Box>

                {/* Filter by Style */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Style
                    </Typography>
                    <RadioGroup
                        value={styleFilter}
                        onChange={(e) => setStyleFilter(e.target.value)}
                    >
                        <FormControlLabel
                            value="all"
                            control={<Radio />}
                            label='All'
                        />
                        <FormControlLabel
                            value="classic"
                            control={<Radio />}
                            label='Classic'
                        />
                        <FormControlLabel
                            value="skate"
                            control={<Radio />}
                            label='Skate'
                        />
                    </RadioGroup>
                </Box>

                {/* Filter by Temperature */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, mt: 4 }}>
                    <FaTemperatureThreeQuarters size={24} style={{ marginRight: 8 }} />
                    <Typography variant="subtitle1">Temperature range</Typography>
                </Box>
                <Slider
                    value={localRange}
                    onChange={(_, val) => setLocalRange(val)}
                    onChangeCommitted={(_, val) => onTempCommit(val)}
                    valueLabelDisplay="on"
                    sx={{ color: 'var(--color-btn)' }}
                    min={-35}
                    max={20}
                />

                {/* Bottom Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Button
                        sx={{
                            flex: 1,
                            backgroundColor: 'oklch(37.1% 0 0)',
                            color: 'white',
                            px: 4,
                            py: 1
                        }}
                        onClick={resetFilter}
                    >
                        REset
                    </Button>
                    <Button
                        sx={{
                            flex: 1,
                            backgroundColor: 'oklch(92.2% 0 0)',
                            color: 'black',
                            px: 2,
                            py: 1
                        }}
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default ResultsFilter;
