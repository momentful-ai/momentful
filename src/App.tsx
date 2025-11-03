import { useState, useCallback, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
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
              storage_path: asset.storage_path,
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
            storage_path: asset.storage_path,
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

  const handleSelectImageToEdit = useCallback((image: EditedImage) => {
    // When editing an image from the history, we want to use it as the new source
    // for generating further edits. We need to create/update the editor view
    // to use this image as the sourceEditedImage
    if (view.type === 'editor') {
      // Create a synthetic MediaAsset from the edited image so the editor can work with it
      const syntheticAsset: MediaAsset = {
        id: image.id,
        project_id: image.project_id,
        user_id: image.user_id,
        file_name: `edited-${image.id}.png`,
        file_type: 'image',
        file_size: 0, // We don't have the actual file size
        storage_path: image.storage_path,
        thumbnail_url: image.edited_url,
        width: image.width,
        height: image.height,
        sort_order: 0,
        created_at: image.created_at,
      };

      // Update the editor view to use this edited image as the new source
      setView({
        type: 'editor',
        asset: syntheticAsset,
        projectId: view.projectId,
        project: view.project,
        sourceEditedImage: image, // This will be used as the source in the preview
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
        {view.type === 'editor' ? (
          <Suspense key="editor" fallback={<div className="flex items-center justify-center h-screen">Loading editor...</div>}>
            <ImageEditor
              asset={view.asset}
              projectId={view.projectId}
              sourceEditedImage={view.sourceEditedImage}
              onClose={() => {
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
        ) : view.type === 'video-generator' ? (
          <Suspense key="video-generator" fallback={<div className="flex items-center justify-center h-screen">Loading video generator...</div>}>
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
