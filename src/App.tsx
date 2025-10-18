import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { ToastProvider } from './components/ToastContainer';
import { Project } from './types';

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <ToastProvider>
      <Layout>
        {selectedProject ? (
          <ProjectWorkspace
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
          />
        ) : (
          <Dashboard onSelectProject={setSelectedProject} />
        )}
      </Layout>
    </ToastProvider>
  );
}

export default App;
