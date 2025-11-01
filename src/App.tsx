import { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace/ProjectWorkspace';
import { ImageEditor } from './components/ImageEditor';
import { ToastProvider } from './contexts/ToastProvider';
import { Project, MediaAsset } from './types';

type View =
  | { type: 'dashboard' }
  | { type: 'project'; project: Project }
  | { type: 'editor'; asset: MediaAsset; projectId: string; project: Project };

function App() {
  const [view, setView] = useState<View>({ type: 'dashboard' });

  const handleSelectProject = useCallback((project: Project) => {
    setView({ type: 'project', project });
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView({ type: 'dashboard' });
  }, []);

  const handleEditImage = useCallback((asset: MediaAsset, projectId: string) => {
    if (view.type === 'project') {
      setView({ type: 'editor', asset, projectId, project: view.project });
    }
  }, [view]);

  const [returningFromEditor, setReturningFromEditor] = useState(false);

  const handleUpdateProject = useCallback((project: Project) => {
    setView({ type: 'project', project });
  }, []);

  // Reset returningFromEditor flag after it's been used
  const handleProjectWorkspaceMounted = useCallback(() => {
    if (returningFromEditor) {
      // Reset the flag after a brief delay to allow ProjectWorkspace to read it
      setTimeout(() => setReturningFromEditor(false), 100);
    }
  }, [returningFromEditor]);

  return (
    <ToastProvider>
      {view.type === 'editor' ? (
        <div key="editor" className="animate-fade-in">
          <ImageEditor
            asset={view.asset}
            projectId={view.projectId}
            onClose={() => {
              setReturningFromEditor(true);
              setView({ type: 'project', project: view.project });
            }}
            onSave={() => {
              setReturningFromEditor(true);
              setView({ type: 'project', project: view.project });
            }}
          />
        </div>
      ) : (
        <Layout>
          {view.type === 'project' ? (
            <div key={`project-${view.project.id}`} className="animate-fade-in">
              <ProjectWorkspace
                key={`workspace-${returningFromEditor ? 'from-editor' : 'normal'}-${view.project.id}`}
                project={view.project}
                onBack={handleBackToDashboard}
                onUpdateProject={handleUpdateProject}
                onEditImage={handleEditImage}
                defaultTab={returningFromEditor ? 'edited' : undefined}
                onMounted={handleProjectWorkspaceMounted}
              />
            </div>
          ) : (
            <div key="dashboard" className="animate-fade-in">
              <Dashboard onSelectProject={handleSelectProject} />
            </div>
          )}
        </Layout>
      )}
    </ToastProvider>
  );
}

export default App;
