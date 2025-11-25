import { useState, useCallback, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace/ProjectWorkspace';
import { UnifiedMediaEditor } from './components/UnifiedMediaEditor';
import { ToastProvider } from './contexts/ToastProvider';
import { Project, MediaAsset, EditedImage } from './types';

type View =
  | { type: 'dashboard' }
  | { type: 'project'; project: Project }
  | { type: 'unified-editor'; initialMode: 'image-edit' | 'video-generate'; projectId: string; project: Project; asset?: MediaAsset; sourceEditedImage?: EditedImage; initialSelectedImageId?: string };

function App() {
  const [view, setView] = useState<View>({ type: 'dashboard' });

  const handleSelectProject = useCallback((project: Project) => {
    setView({ type: 'project', project });
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView({ type: 'dashboard' });
  }, []);

  const handleEditImage = useCallback((asset: MediaAsset | EditedImage, projectId: string) => {
    if (view.type === 'project') {
      // If it's an EditedImage, create a synthetic MediaAsset from its info
      if ('prompt' in asset) {
        const syntheticAsset: MediaAsset = {
          id: `synthetic-${asset.id}`,
          project_id: asset.project_id,
          user_id: asset.user_id,
          file_name: `edited-${asset.id}.png`,
          file_type: 'image',
          file_size: 0,
          storage_path: asset.storage_path,
          thumbnail_url: asset.edited_url,
          width: asset.width,
          height: asset.height,
          sort_order: 0,
          created_at: asset.created_at,
        };
        setView({
          type: 'unified-editor',
          initialMode: 'image-edit',
          asset: syntheticAsset,
          projectId,
          project: view.project,
          sourceEditedImage: asset
        });
      } else {
        // It's a MediaAsset
        setView({
          type: 'unified-editor',
          initialMode: 'image-edit',
          asset: asset as MediaAsset,
          projectId,
          project: view.project
        });
      }
    }
  }, [view]);

  const handleNavigateToVideoGenerator = useCallback((projectId: string, imageId?: string) => {
    if (view.type === 'project') {
      setView({
        type: 'unified-editor',
        initialMode: 'video-generate',
        projectId,
        project: view.project,
        initialSelectedImageId: imageId
      });
    } else if (view.type === 'unified-editor') {
      // Switch mode within unified editor
      setView({
        ...view,
        initialMode: 'video-generate',
        initialSelectedImageId: imageId
      });
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
      <AnimatePresence mode="wait">
        {view.type === 'unified-editor' ? (
          <Suspense key="unified-editor" fallback={<div className="flex items-center justify-center h-screen">Loading editor...</div>}>
            <UnifiedMediaEditor
              initialMode={view.initialMode}
              projectId={view.projectId}
              asset={view.asset}
              sourceEditedImage={view.sourceEditedImage}
              initialSelectedImageId={view.initialSelectedImageId}
              onClose={() => {
                setView({ type: 'project', project: view.project });
              }}
              onSave={() => {
                // Notify that save completed, but don't close the editor
                // User stays in editor to see the new content
              }}
            />
          </Suspense>
        ) : (
          <Layout key="layout">
            {view.type === 'project' ? (
              <div key={`project-${view.project.id}`}>
                <ProjectWorkspace
                  key={`workspace-${returningFromEditor ? 'from-editor' : 'normal'}-${view.project.id}`}
                  project={view.project}
                  onBack={handleBackToDashboard}
                  onUpdateProject={handleUpdateProject}
                  onEditImage={handleEditImage}
                  onGenerateVideo={handleNavigateToVideoGenerator}
                  defaultTab={returningFromEditor ? 'edited' : undefined}
                  onMounted={handleProjectWorkspaceMounted}
                />
              </div>
            ) : (
              <div key="dashboard">
                <Dashboard onSelectProject={handleSelectProject} />
              </div>
            )}
          </Layout>
        )}
      </AnimatePresence>
    </ToastProvider>
  );
}

export default App;
