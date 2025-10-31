// SkiFilterDrawer.jsx
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
} from '@mui/material';
import { RiLayoutGridLine } from 'react-icons/ri';
import { MdViewAgenda } from 'react-icons/md';

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
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: 280,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {/* --- Section 1: Filter (Style, Type, Archived) --- */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" textAlign="center" gutterBottom>
            Filter
          </Typography>

          {/* Style Filter */}
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
              {/* NEW: dp option to match tabs */}
              <MenuItem value="dp">DP</MenuItem>
            </Select>
          </FormControl>

          {/* Ski Type Filter */}
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

          {/* Archived Filter */}
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
        </Box>

        {/* --- Section 2: Sorting (Field & Direction) --- */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" textAlign="center" gutterBottom>
            Sort
          </Typography>

          {/* Sort By */}
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

          {/* Sort Direction */}
          <ToggleButtonGroup
            exclusive
            size="small"
            value={sortDirection}
            onChange={(e, newVal) => newVal && setSortDirection(newVal)}
            sx={{ alignSelf: 'center' }}
          >
            <ToggleButton value="asc" sx={{ px: 2, py: 1 }}>
              ASC
            </ToggleButton>
            <ToggleButton value="desc" sx={{ px: 2, py: 1 }}>
              DESC
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* --- Section 3: View Mode (Card or Table) --- */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" textAlign="center" gutterBottom>
            View
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={viewMode}
            onChange={(e, newVal) => newVal && setViewMode(newVal)}
            sx={{ alignSelf: 'center' }}
          >
            <ToggleButton value="card" sx={{ p: 2 }}>
              <MdViewAgenda />
            </ToggleButton>
            <ToggleButton value="table" sx={{ p: 2 }}>
              <RiLayoutGridLine />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* --- Bottom Buttons: Reset & Close --- */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            sx={{
              flex: 1,
              backgroundColor: 'oklch(37.1% 0 0)',
              color: 'white',
              px: 4,
              py: 1,
            }}
            onClick={onClose}
          >
            Apply
          </Button>
          <Button
            sx={{
              flex: 1,
              backgroundColor: 'oklch(92.2% 0 0)',
              color: 'black',
              px: 2,
              py: 1,
            }}
            onClick={resetFilter}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SkiFilter;
