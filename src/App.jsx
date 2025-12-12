import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { TaskLists } from './pages/TaskLists';
import { Activity } from './pages/Activity';
import { Integrations } from './pages/Integrations';
import { Settings } from './pages/Settings';
import { Graph } from './pages/Graph';
import { startAutoRefresh, stopAutoRefresh } from './services/taskService';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  // Start auto-refresh for OAuth tokens
  useEffect(() => {
    startAutoRefresh();
    return () => stopAutoRefresh();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<TaskLists />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/graph" element={<Graph />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
