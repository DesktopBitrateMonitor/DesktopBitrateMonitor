import styled from '@emotion/styled';
import React from 'react';
import { alpha } from '@mui/material/styles';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';

// value: 'grid' | 'list'
// onChange(next)
const LayoutToggle = ({ value = 'grid', onChange }) => {
  return (
    <Wrapper role="group" aria-label="Toggle layout">
      <Button data-active={value === 'grid'} onClick={() => onChange?.('grid')} title="Grid">
        <ViewModuleIcon fontSize="small" />
      </Button>
      <Button data-active={value === 'list'} onClick={() => onChange?.('list')} title="List">
        <ViewAgendaIcon fontSize="small" />
      </Button>
    </Wrapper>
  );
};

export default LayoutToggle;

const Wrapper = styled.div(({ theme }) => ({
  display: 'inline-flex',
  background: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.8 : 0.4),
  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
  borderRadius: 10,
  overflow: 'hidden'
}));

const Button = styled.button(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 8px',
  color: theme.palette.text.secondary,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transition: 'background 120ms ease, color 120ms ease',

  "&[data-active='true']": {
    background: alpha(theme.palette.primary.main, 0.18),
    color: theme.palette.primary.main
  },

  ":not([data-active='true']):hover": {
    background: alpha(theme.palette.text.primary, 0.08)
  }
}));
