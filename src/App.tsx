import { useState } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { ToastProvider } from './components/ToastContainer';
import { Project } from './types';

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <ThemeProvider defaultTheme="light">
      <ToastProvider>
        <Layout>
          {selectedProject ? (
            <ProjectWorkspace
              project={selectedProject}
              onBack={() => setSelectedProject(null)}
              onUpdateProject={setSelectedProject}
            />
          ) : (
            <Dashboard onSelectProject={setSelectedProject} />
          )}
        </Layout>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
