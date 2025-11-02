import { useState, useCallback, Suspense } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace/ProjectWorkspace';
import { ImageEditor } from './components/ImageEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { ToastProvider } from './contexts/ToastProvider';
import { Project, MediaAsset, EditedImage } from './types';
import { database } from './lib/database';

type View =
  | { type: 'dashboard' }
  | { type: 'project'; project: Project }
  | { type: 'editor'; asset: MediaAsset; projectId: string; project: Project; sourceEditedImage?: EditedImage }
  | { type: 'video-generator'; projectId: string; project: Project; initialSelectedImageId?: string };

function App() {
  const [view, setView] = useState<View>({ type: 'dashboard' });

  const handleSelectProject = useCallback((project: Project) => {
    setView({ type: 'project', project });
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView({ type: 'dashboard' });
  }, []);

  const handleEditImage = useCallback(async (asset: MediaAsset | EditedImage, projectId: string) => {
    if (view.type === 'project') {
      // If it's an EditedImage, we need to fetch the source MediaAsset for the editor
      // The editor needs the source asset for history, but we'll use the edited image as the source
      if ('prompt' in asset && 'edited_url' in asset) {
        // It's an EditedImage - fetch the source MediaAsset
        if (asset.source_asset_id) {
          try {
            const sourceAsset = await database.mediaAssets.getById(asset.source_asset_id);
            setView({ type: 'editor', asset: sourceAsset, projectId, project: view.project, sourceEditedImage: asset });
          } catch (error) {
            console.error('Failed to fetch source asset:', error);
            // Fallback: create a synthetic asset
            const syntheticAsset: MediaAsset = {
              id: asset.source_asset_id,
              project_id: asset.project_id,
              user_id: asset.user_id,
              file_name: `edited-${asset.id}.png`,
              file_type: 'image',
              file_size: 0,
              storage_path: asset.edited_url,
              thumbnail_url: asset.edited_url,
              width: asset.width,
              height: asset.height,
              sort_order: 0,
              created_at: asset.created_at,
            };
            setView({ type: 'editor', asset: syntheticAsset, projectId, project: view.project, sourceEditedImage: asset });
          }
        } else {
          // No source_asset_id - create synthetic asset
          const syntheticAsset: MediaAsset = {
            id: asset.id,
            project_id: asset.project_id,
            user_id: asset.user_id,
            file_name: `edited-${asset.id}.png`,
            file_type: 'image',
            file_size: 0,
            storage_path: asset.edited_url,
            thumbnail_url: asset.edited_url,
            width: asset.width,
            height: asset.height,
            sort_order: 0,
            created_at: asset.created_at,
          };
          setView({ type: 'editor', asset: syntheticAsset, projectId, project: view.project, sourceEditedImage: asset });
        }
      } else {
        // It's a MediaAsset
        setView({ type: 'editor', asset, projectId, project: view.project });
      }
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
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading editor...</div>}>
            <ImageEditor
              asset={view.asset}
              projectId={view.projectId}
              sourceEditedImage={view.sourceEditedImage}
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
          </Suspense>
        </div>
      ) : view.type === 'video-generator' ? (
        <div key="video-generator" className="animate-fade-in">
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading video generator...</div>}>
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
          </Suspense>
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
