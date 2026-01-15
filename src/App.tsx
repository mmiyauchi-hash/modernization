import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import HomePage from './pages/HomePage';
import GitMigrationGuidePage from './pages/GitMigrationGuidePage';
import ProjectDetailPage from './pages/ProjectDetailPage';

function AppContent() {
  const location = useLocation();
  const isGitMigrationPage = location.pathname === '/guide/git-migration';
  const isProjectPage = location.pathname.startsWith('/project/');

  return (
    <div className="flex h-screen">
      {!isGitMigrationPage && !isProjectPage && <Sidebar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/guide/git-migration" element={<GitMigrationGuidePage />} />
        <Route path="/project/:projectId" element={<ProjectDetailPage />} />
      </Routes>
    </div>
  );
}

function App() {
  try {
    return (
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    );
  } catch (error) {
    console.error('App error:', error);
    return <div>Error: {String(error)}</div>;
  }
}

export default App;
