import { Search } from '@mui/icons-material';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback } from 'react';
import { useAlert } from '../../../contexts/AlertContext';
import { useData } from '../../../contexts/DataContext';

const GeneralSettings = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const {
    data: { appConfig },
    updateStoreLocally
  } = useData();

  const { showAlert } = useAlert();

  const handleSwitchChange = useCallback(
    async (event) => {
      const isChecked = event.target.checked;
      const newValue = isChecked ? 'quit' : 'minimize';
      updateStoreLocally('appConfig', { ...appConfig, onQuit: newValue });

      const res = await window.storeApi.set('app-config', 'onQuit', newValue);

      if (res.success) {
        showAlert({
          message: `App will now ${isChecked ? 'quit' : 'minimize'} on close.`,
          severity: 'info'
        });
      } else {
        showAlert({ message: 'Failed to update setting.', severity: 'error' });
      }
    },
    [appConfig, updateStoreLocally]
  );

  const handleSelectChange = useCallback(
    async (event) => {
      const newLanguage = event.target.value;
      console.log('Selected language:', event);
      updateStoreLocally('appConfig', { ...appConfig, language: newLanguage });
      const res = await window.storeApi.set('app-config', 'language', newLanguage);

      if (res.success) {
        showAlert({
          message: `Language changed`,
          severity: 'info'
        });
      } else {
        showAlert({ message: 'Failed to update language.', severity: 'error' });
      }
    },
    [appConfig, updateStoreLocally]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            General Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure general application settings here.
          </Typography>
        </Box>
        <TextField
          label="Search for setting"
          InputProps={{
            endAdornment: <Search />
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <FormControl size="small" sx={{ width: '180px' }}>
            <InputLabel>App Language</InputLabel>
            <Select label="App Language" onChange={handleSelectChange} value={appConfig.language}>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="de">German</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body1">Quit App on close</Typography>
          <Switch
            checked={appConfig.onQuit === 'quit' ? true : false}
            onChange={handleSwitchChange}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default GeneralSettings;
