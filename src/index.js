import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GLOBAL_KEYFRAMES } from './ui/kit';

const globalStyle = document.createElement('style');
globalStyle.textContent = GLOBAL_KEYFRAMES;
document.head.appendChild(globalStyle);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
// pb migration Fri May 15 13:45:36 EEST 2026
