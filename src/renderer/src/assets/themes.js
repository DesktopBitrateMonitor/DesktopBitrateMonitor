const sharedColors = {
  primary: '#6366F1', // Electric Indigo
  secondary: '#06B6D4' // Cyan
};

export const themes = {
  light: {
    name: 'light',
    colors: {
      ...sharedColors,
      background: '#F8FAFC', // Mist
      surface: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      muted: '#CBD5F5'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      ...sharedColors,
      background: '#0F172A', // Void
      surface: '#1E293B', // Charcoal
      textPrimary: '#F8FAFC', // Mist
      textSecondary: '#94A3B8', // Slate
      muted: '#1F2933'
    }
  }
};
