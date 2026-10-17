import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AssociateApp from './always-on/associate/AssociateApp';
createRoot(document.getElementById('root')!).render(<StrictMode><AssociateApp/></StrictMode>);
