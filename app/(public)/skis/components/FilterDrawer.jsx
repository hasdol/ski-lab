// SkiFilterDrawer.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
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

const SkiFilterDrawer = ({
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
  const { t } = useTranslation();

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: 280,            // Keep the original drawer width
          p: 3,                  // More padding all around
          display: 'flex',
          flexDirection: 'column',
          gap: 4,                // Bigger gap between each major section
        }}
      >
        {/* --- Section 1: Filter (Style, Type, Archived) --- */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" textAlign="center" gutterBottom>
            {t('filter')}
          </Typography>

          {/* Style Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>{t('style')}</InputLabel>
            <Select
              label={t('style')}
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
            >
              <MenuItem value="all">{t('all')}</MenuItem>
              <MenuItem value="classic">{t('classic')}</MenuItem>
              <MenuItem value="skate">{t('skate')}</MenuItem>
            </Select>
          </FormControl>

          {/* Ski Type Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>{t('ski_type')}</InputLabel>
            <Select
              label={t('ski_type')}
              value={skiTypeFilter}
              onChange={(e) => setSkiTypeFilter(e.target.value)}
            >
              <MenuItem value="all">{t('all')}</MenuItem>
              <MenuItem value="cold">{t('cold')}</MenuItem>
              <MenuItem value="universal">{t('universal')}</MenuItem>
              <MenuItem value="warm">{t('warm')}</MenuItem>
            </Select>
          </FormControl>

          {/* Archived Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>{t('archived')}</InputLabel>
            <Select
              label={t('archived')}
              value={archivedFilter}
              onChange={(e) => setArchivedFilter(e.target.value)}
            >
              <MenuItem value="notArchived">{t('active_only')}</MenuItem>
              <MenuItem value="archived">{t('archived_only')}</MenuItem>
              <MenuItem value="all">{t('show_all')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* --- Section 2: Sorting (Field & Direction) --- */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" textAlign="center" gutterBottom>
            {t('sort')}
          </Typography>

          {/* Sort By */}
          <FormControl size="small" fullWidth>
            <InputLabel>{t('sort_by')}</InputLabel>
            <Select
              label={t('sort_by')}
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <MenuItem value="serialNumber">{t('serial_number')}</MenuItem>
              <MenuItem value="style">{t('style')}</MenuItem>
              <MenuItem value="brand">{t('brand')}</MenuItem>
              <MenuItem value="model">{t('model')}</MenuItem>
              <MenuItem value="grind">{t('grind')}</MenuItem>
              <MenuItem value="base">Base</MenuItem>
              <MenuItem value="length">{t('length')}</MenuItem>
              <MenuItem value="stiffness">{t('stiffness')}</MenuItem>
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
            {t('view')}
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
              backgroundColor: 'var(--color-btn)',
              color: 'var(--color-btntxt)',
              px: 4,
              py:1
            }}
            onClick={resetFilter}
          >
            {t('reset')}
          </Button>
          <Button
            sx={{
              flex: 1,
              backgroundColor: 'var(--color-sbtn)',
              color: 'var(--color-text)',
              px: 2,
              py:1
            }}
            onClick={onClose}
          >
            {t('close')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SkiFilterDrawer;
