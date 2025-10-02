import React from 'react';
import '@mantine/core/styles.css';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import App from './App';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

const theme = createTheme({
  fontFamily: 'Poppins, Inter, sans-serif',
  headings: { fontFamily: 'Poppins, Inter, sans-serif' },
  primaryColor: 'blue',
  defaultRadius: 'xl',
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
