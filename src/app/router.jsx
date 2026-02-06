import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Home from '../pages/Home/Home';

const Guide = lazy(() => import('../pages/Guide/Guide'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'guide',
        element: (
          <Suspense fallback={<div className="route-fallback">Cargando guia...</div>}>
            <Guide />
          </Suspense>
        ),
      },
    ],
  },
]);

export default router;
