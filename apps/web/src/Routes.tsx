import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const module = await import('./pages/LogWriterPage');
      return {
        Component: module.LogWriterPage,
      };
    },
  },
  {
    path: '/summary',
    lazy: async () => {
      const module = await import('./pages/DailySummaryPage');
      return {
        Component: module.DailySummaryPage,
      };
    },
  },
]);

export const Routes = () => <RouterProvider router={router} />;
