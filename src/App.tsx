import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import HomePage from './pages/HomePage';
import GitMigrationGuidePage from './pages/GitMigrationGuidePage';

function AppContent() {
  const location = useLocation();
  const isGitMigrationPage = location.pathname === '/guide/git-migration';

  return (
    <div className="flex h-screen">
      {!isGitMigrationPage && <Sidebar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/guide/git-migration" element={<GitMigrationGuidePage />} />
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
