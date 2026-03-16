import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, Stack, Typography } from '@mui/material';

const InfoCard = ({ title, content, hint = null, sx, ...props }) => {
  const theme = useTheme();
  const border = theme.palette.divider;
  const accent = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.12);

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid',
        borderColor: border,
        background: (t) =>
          t.palette.mode === 'dark'
            ? `radial-gradient(circle at top left, ${accent}, ${alpha(t.palette.background.paper, 0.92)} 45%)`
            : `radial-gradient(circle at top left, ${accent}, ${alpha(t.palette.background.paper, 0.98)} 55%)`,
        boxShadow: (t) =>
          `0 16px 42px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.42 : 0.16)}`,
        minWidth: 260,
        ...sx
      }}
      {...props}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          pointerEvents: 'none'
        }}
      />

      <Stack spacing={2} sx={{ position: 'relative', p: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: theme.palette.primary.main,
              boxShadow: `0 0 0 6px ${alpha(theme.palette.primary.main, 0.12)}`
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {hint ? (
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.2 }}>
                {hint}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Box
          sx={{
            borderRadius: 1.5,
            p: 1.5,
            backgroundColor: alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.35 : 0.5),
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.6)
          }}
        >
          {content}
        </Box>
      </Stack>
    </Card>
  );
};

export default InfoCard;
