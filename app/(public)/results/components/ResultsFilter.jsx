// src/components/Filter/Filter.js

import React, { useEffect, useState } from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  Slider,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { FaTemperatureThreeQuarters } from 'react-icons/fa6';
import { RiCloseLine } from 'react-icons/ri';
import DateSort from './ResultsDateSort';
import Button from '@/components/ui/Button';

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
  const [localRange, setLocalRange] = useState(tempRange);
  useEffect(() => setLocalRange(tempRange), [tempRange]);

  const paperClass =
    'bg-white/80 backdrop-blur-xl border-l border-gray-200 shadow-2xl rounded-l-3xl';

  const sectionClass =
    'rounded-2xl border border-gray-200 bg-white/70 p-4';

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ className: paperClass }}>
      <Box className="w-[320px] p-4 md:p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <p className="text-xs text-gray-500">Refine your results</p>
          </div>

          <IconButton onClick={onClose} aria-label="Close">
            <RiCloseLine />
          </IconButton>
        </div>

        {/* Sort */}
        <div className={sectionClass}>
          <Typography variant="subtitle1" gutterBottom>
            Sort by date
          </Typography>
          <DateSort sortOrder={sortOrder} setSortOrder={setSortOrder} />
        </div>

        {/* Style */}
        <div className={sectionClass}>
          <Typography variant="subtitle1" gutterBottom>
            Style
          </Typography>
          <RadioGroup value={styleFilter} onChange={(e) => setStyleFilter(e.target.value)}>
            <FormControlLabel value="all" control={<Radio />} label="All" />
            <FormControlLabel value="classic" control={<Radio />} label="Classic" />
            <FormControlLabel value="skate" control={<Radio />} label="Skate" />
            <FormControlLabel value="dp" control={<Radio />} label="DP" />
          </RadioGroup>
        </div>

        {/* Temperature */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-2">
            <FaTemperatureThreeQuarters size={18} />
            <Typography variant="subtitle1">Temperature range</Typography>
          </div>

          <Slider
            value={localRange}
            onChange={(_, val) => setLocalRange(val)}
            onChangeCommitted={(_, val) => onTempCommit(val)}
            valueLabelDisplay="on"
            sx={{ color: 'oklch(54.6% 0.245 262.881)' }}
            min={-35}
            max={20}
          />
        </div>

        {/* Bottom Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="secondary" onClick={resetFilter}>
            Reset
          </Button>
          <Button variant="primary" onClick={onClose}>
            Apply
          </Button>
        </div>
      </Box>
    </Drawer>
  );
};

export default ResultsFilter;
