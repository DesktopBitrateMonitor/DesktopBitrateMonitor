import { Box, Tab, Tabs } from '@mui/material';
import React, { useCallback, useState } from 'react';
import JsEditor from '../components/JsEditor';
import PreviewOverlay from '../components/PreviewOverlay';
import HtmlEditor from '../components/HtmlEditor';
import CssEditor from '../components/CssEditor';
import JavascriptIcon from '@mui/icons-material/Javascript';
import CssIcon from '@mui/icons-material/Css';
import HtmlIcon from '@mui/icons-material/Html';

import { useTranslation } from 'react-i18next';

const ExpertPanel = ({ workingConfig, setWorkingConfig }) => {
  const { t } = useTranslation();

  const TAB_CONFIG = [
    {
      value: 'html',
      label: t('overlayEditor.panels.html'),
      icon: HtmlIcon,
      content: (
        <HtmlEditor
          key={'html'}
          workingConfig={workingConfig}
          setWorkingConfig={setWorkingConfig}
        />
      )
    },
    {
      value: 'css',
      label: t('overlayEditor.panels.css'),
      icon: CssIcon,
      content: (
        <CssEditor key={'css'} workingConfig={workingConfig} setWorkingConfig={setWorkingConfig} />
      )
    },
    {
      value: 'js',
      label: t('overlayEditor.panels.js'),
      icon: JavascriptIcon,
      content: (
        <JsEditor key={'js'} workingConfig={workingConfig} setWorkingConfig={setWorkingConfig} />
      )
    }
  ];

  const [activeValue, setActiveValue] = useState(TAB_CONFIG[0].value);

  const handleChange = useCallback(
    (event, newValue) => {
      setActiveValue(newValue);
    },
    [setActiveValue]
  );
  return (
    <div>
      <Tabs
        value={activeValue}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          px: 1
        }}
      >
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <Tab
              key={tab.value}
              value={tab.value}
              icon={<Icon fontSize="large" />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500, minHeight: 44 }}
            />
          );
        })}
      </Tabs>
      <Box
        sx={{
          flex: '1 1 0',
          pt: 2,
          px: 1.5,
          pb: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}
      >
        <PreviewOverlay workingConfig={workingConfig} fullWidth />
        {TAB_CONFIG.map((tab) => {
          if (tab.value === activeValue) {
            return tab.content;
          }
          return null;
        })}
      </Box>
    </div>
  );
};

export default ExpertPanel;
