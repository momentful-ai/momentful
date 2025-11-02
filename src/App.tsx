import { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace/ProjectWorkspace';
import { ImageEditor } from './components/ImageEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { ToastProvider } from './contexts/ToastProvider';
import { Project, MediaAsset } from './types';

type View =
  | { type: 'dashboard' }
  | { type: 'project'; project: Project }
  | { type: 'editor'; asset: MediaAsset; projectId: string; project: Project }
  | { type: 'video-generator'; projectId: string; project: Project; initialSelectedImageId?: string };

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

  const handleNavigateToVideoGenerator = useCallback((projectId: string, imageId?: string) => {
    if (view.type === 'editor') {
      setView({ type: 'video-generator', projectId, project: view.project, initialSelectedImageId: imageId });
    } else if (view.type === 'project') {
      setView({ type: 'video-generator', projectId, project: view.project, initialSelectedImageId: imageId });
    }
  }, [view]);

  const handleSelectImageToEdit = useCallback(() => {
    // For now, we'll need to convert EditedImage to MediaAsset or handle differently
    // This is a placeholder - the actual implementation may need to fetch the MediaAsset
    // or allow ImageEditor to accept EditedImage directly
    // For now, just navigate back to project workspace
    if (view.type === 'editor') {
      setReturningFromEditor(true);
      setView({ type: 'project', project: view.project });
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
              // Notify that save completed, but don't close the editor
              // User stays in editor to see the new image in the timeline
            }}
            onNavigateToVideo={(imageId) => handleNavigateToVideoGenerator(view.projectId, imageId)}
            onSelectImageToEdit={handleSelectImageToEdit}
          />
        </div>
      ) : view.type === 'video-generator' ? (
        <div key="video-generator" className="animate-fade-in">
          <VideoGenerator
            projectId={view.projectId}
            initialSelectedImageId={view.initialSelectedImageId}
            onClose={() => {
              setView({ type: 'project', project: view.project });
            }}
            onSave={() => {
              // setView({ type: 'project', project: view.project });
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
