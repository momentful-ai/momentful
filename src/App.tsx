import { useState } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { ImageEditor } from './components/ImageEditor';
import { ToastProvider } from './components/ToastContainer';
import { Project, MediaAsset } from './types';

type View =
  | { type: 'dashboard' }
  | { type: 'project'; project: Project }
  | { type: 'editor'; asset: MediaAsset; projectId: string; project: Project };

function App() {
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextView, setNextView] = useState<View | null>(null);

  const handleSelectProject = (project: Project) => {
    setIsTransitioning(true);
    setNextView({ type: 'project', project });
    setTimeout(() => {
      setView({ type: 'project', project });
      setIsTransitioning(false);
      setNextView(null);
    }, 250);
  };

  const handleBackToDashboard = () => {
    setIsTransitioning(true);
    setNextView({ type: 'dashboard' });
    setTimeout(() => {
      setView({ type: 'dashboard' });
      setIsTransitioning(false);
      setNextView(null);
    }, 250);
  };

  const handleEditImage = (asset: MediaAsset, projectId: string) => {
    if (view.type === 'project') {
      setView({ type: 'editor', asset, projectId, project: view.project });
    }
  };

  const handleUpdateProject = (project: Project) => {
    setView({ type: 'project', project });
  };

  return (
    <ThemeProvider defaultTheme="light">
      <ToastProvider>
        {view.type === 'editor' ? (
          <div key="editor" className="animate-fade-in">
            <ImageEditor
              asset={view.asset}
              projectId={view.projectId}
              onClose={() => {
                setView({ type: 'project', project: view.project });
              }}
              onSave={() => {
                setView({ type: 'project', project: view.project });
              }}
            />
          </div>
        ) : (
          <Layout>
            {view.type === 'project' ? (
              <div
                key={`project-${view.project.id}`}
                className={isTransitioning ? 'animate-fade-out' : 'animate-fade-in-scale'}
              >
                <ProjectWorkspace
                  project={view.project}
                  onBack={handleBackToDashboard}
                  onUpdateProject={handleUpdateProject}
                  onEditImage={handleEditImage}
                />
              </div>
            ) : (
              <div
                key="dashboard"
                className={isTransitioning ? 'animate-scale-out' : 'animate-fade-in'}
              >
                <Dashboard onSelectProject={handleSelectProject} />
              </div>
            )}
          </Layout>
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
