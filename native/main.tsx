import React from 'react';
import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import WeatherApp from '../app/app/page';
import ImprintPage from '../app/impressum/page';
import PrivacyPage from '../app/privacy/page';

const Page = window.location.pathname === '/impressum'
  ? ImprintPage
  : window.location.pathname === '/privacy'
    ? PrivacyPage
    : WeatherApp;

createRoot(document.getElementById('root')!).render(<React.StrictMode><Page /></React.StrictMode>);
