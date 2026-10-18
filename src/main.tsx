import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import OverlayApp from './OverlayApp.tsx';
import './index.css';

// ?overlay=1 — страница внутри нативного окна «поверх других приложений» (Android)
const isOverlayWindow = new URLSearchParams(window.location.search).get('overlay') === '1';

createRoot(document.getElementById('root')!).render(isOverlayWindow ? <OverlayApp /> : <App />);
