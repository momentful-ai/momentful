import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { Project } from './types';

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
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
  );
}

export default App;
