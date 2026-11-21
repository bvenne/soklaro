import { createRoot } from 'react-dom/client';
import './app/globals.css';

const pages = {
  '/': () => import('./app/page'),
  '/app': () => import('./app/app/page'),
  '/privacy': () => import('./app/privacy/content'),
  '/impressum': () => import('./app/impressum/content'),
};
const path = document.documentElement.dataset.page || location.pathname.replace(/\/$/, '') || '/';
const load = pages[path as keyof typeof pages];
if (load) {
  void load().then(({ default: Page }) => createRoot(document.getElementById('root')!).render(<Page />));
}
