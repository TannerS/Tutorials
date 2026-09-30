import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './styles/global.css';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element missing');

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      {/* On GitHub Pages the app is mounted under /Tutorials/, so the router
          has to strip that prefix before matching. BASE_URL is '/Tutorials/'
          in a build and '/' in dev; the trailing slash is trimmed because
          React Router wants a basename with none (and '' means "no basename",
          which is exactly right for dev). */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
