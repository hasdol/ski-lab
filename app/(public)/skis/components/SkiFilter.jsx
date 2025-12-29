// SkiFilterDrawer.jsx
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
} from '@mui/material';
import { RiLayoutGridLine, RiCloseLine } from 'react-icons/ri';
import { MdViewAgenda } from 'react-icons/md';
import Button from '@/components/ui/Button';

const SkiFilter = ({
  open,
  onClose,
  styleFilter,
  setStyleFilter,
  skiTypeFilter,
  setSkiTypeFilter,
  archivedFilter,
  setArchivedFilter,
  resetFilter,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  viewMode,
  setViewMode,
}) => {
  const paperClass =
    'bg-white/80 backdrop-blur-xl border-l border-gray-200 shadow-2xl rounded-l-3xl';

  const sectionClass =
    'rounded-2xl border border-gray-200 bg-white/70 p-4';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ className: paperClass }}
    >
      <Box className="w-[320px] p-4 md:p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <p className="text-xs text-gray-500">Refine and sort your skis</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-gray-100 text-gray-700"
            aria-label="Close"
            title="Close"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* --- Section 1: Filter (Style, Type, Archived) --- */}
        <div className={sectionClass}>
          <Typography variant="h6" textAlign="center" gutterBottom>
            Filter
          </Typography>

          <div className="flex flex-col gap-3">
            <FormControl size="small" fullWidth>
              <InputLabel>Style</InputLabel>
              <Select
                label="Style"
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="classic">Classic</MenuItem>
                <MenuItem value="skate">Skate</MenuItem>
                <MenuItem value="dp">DP</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Ski Type</InputLabel>
              <Select
                label="Ski Type"
                value={skiTypeFilter}
                onChange={(e) => setSkiTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="cold">Cold</MenuItem>
                <MenuItem value="universal">Universal</MenuItem>
                <MenuItem value="warm">Warm</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Archived</InputLabel>
              <Select
                label="Archived"
                value={archivedFilter}
                onChange={(e) => setArchivedFilter(e.target.value)}
              >
                <MenuItem value="notArchived">Active Only</MenuItem>
                <MenuItem value="archived">Archived Only</MenuItem>
                <MenuItem value="all">Show All</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* --- Section 2: Sorting (Field & Direction) --- */}
        <div className={sectionClass}>
          <Typography variant="h6" textAlign="center" gutterBottom>
            Sort
          </Typography>

          <div className="flex flex-col gap-3">
            <FormControl size="small" fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                label="Sort By"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                <MenuItem value="serialNumber">Serial Number</MenuItem>
                <MenuItem value="style">Style</MenuItem>
                <MenuItem value="brand">Brand</MenuItem>
                <MenuItem value="model">Model</MenuItem>
                <MenuItem value="grind">Grind</MenuItem>
                <MenuItem value="base">Base</MenuItem>
                <MenuItem value="length">Length</MenuItem>
                <MenuItem value="stiffness">Stiffness</MenuItem>
              </Select>
            </FormControl>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={sortDirection}
              onChange={(e, newVal) => newVal && setSortDirection(newVal)}
              sx={{
                alignSelf: 'center',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgb(229 231 235)',
                '& .MuiToggleButton-root': {
                  border: 0,
                  px: 2,
                  py: 1,
                  textTransform: 'none',
                },
              }}
            >
              <ToggleButton value="asc">ASC</ToggleButton>
              <ToggleButton value="desc">DESC</ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>

        {/* --- Section 3: View Mode --- */}
        <div className={sectionClass}>
          <Typography variant="h6" textAlign="center" gutterBottom>
            View
          </Typography>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={viewMode}
            onChange={(e, newVal) => newVal && setViewMode(newVal)}
            sx={{
              alignSelf: 'center',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgb(229 231 235)',
              '& .MuiToggleButton-root': { border: 0, p: 1.5 },
            }}
          >
            <ToggleButton value="card" aria-label="Card view">
              <MdViewAgenda />
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view">
              <RiLayoutGridLine />
            </ToggleButton>
          </ToggleButtonGroup>
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

export default SkiFilter;
