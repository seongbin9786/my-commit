import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { DailySummaryPage } from './pages/DailySummaryPage';
import { LogWriterPage } from './pages/LogWriterPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LogWriterPage />,
  },
  {
    path: '/summary',
    element: <DailySummaryPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
]);

export const Routes = () => <RouterProvider router={router} />;
