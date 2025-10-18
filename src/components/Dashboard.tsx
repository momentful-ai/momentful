import { useState, useEffect, useRef } from 'react';
import { Plus, FolderOpen, Clock, MoreVertical, Trash2, Pencil, Check, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import { useUserId } from '../hooks/useUserId';
import { useToast } from './ToastContainer';
import { DashboardSkeleton } from './LoadingSkeleton';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

interface DashboardProps {
  onSelectProject: (project: Project) => void;
}

export function Dashboard({ onSelectProject }: DashboardProps) {
  const userId = useUserId();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('Failed to load projects. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: 'Untitled Project',
          description: '',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setProjects([data, ...projects]);
        showToast('Project created successfully!', 'success');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showToast('Failed to create project. Please try again.', 'error');
    }
  };

  const deleteProject = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      showToast('Project deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Failed to delete project. Please try again.', 'error');
    } finally {
      setProjectToDelete(null);
    }
  };

  const handleFileUpload = async (files: File[], projectId: string) => {
    const imageFiles = files.filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    );

    if (imageFiles.length === 0) {
      showToast('Please upload valid image files', 'error');
      return;
    }

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const storagePath = `${userId}/${projectId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

        const { error: dbError } = await supabase
          .from('media_assets')
          .insert({
            project_id: projectId,
            user_id: userId,
            file_name: file.name,
            file_type: 'image',
            file_size: file.size,
            storage_path: storagePath,
            width: img.width,
            height: img.height,
          });

        if (dbError) throw dbError;
      }

      showToast(`Uploaded ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} successfully`, 'success');
      setPendingFiles([]);
      setShowProjectSelector(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      showToast('Failed to upload some files', 'error');
    }
  };

  const handleDashboardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDashboardDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDraggingFile(false);
    }
  };

  const handleDashboardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    );

    if (imageFiles.length === 0) {
      showToast('Please drop valid image files', 'error');
      return;
    }

    setPendingFiles(imageFiles);
    setShowProjectSelector(true);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div
      onDragOver={handleDashboardDragOver}
      onDragLeave={handleDashboardDragLeave}
      onDrop={handleDashboardDrop}
      className="relative"
    >
      {isDraggingFile && (
        <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card rounded-xl p-8 shadow-2xl border-2 border-dashed border-primary">
            <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
            <p className="text-2xl font-semibold text-primary">Drop images to upload</p>
            <p className="text-muted-foreground mt-2">You'll choose a project next</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
            Your Projects
          </h2>
          <p className="text-base text-muted-foreground flex items-center gap-2">
            <span>Create stunning marketing visuals with AI</span>
            <span className="hidden sm:inline text-muted-foreground/60">•</span>
            <span className="hidden sm:inline text-muted-foreground/60 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Drag images anywhere to upload
            </span>
          </p>
        </div>
        <Button
          onClick={createProject}
          variant="gradient"
          size="lg"
          className="w-full sm:w-auto gap-2"
        >
          <Plus className="w-5 h-5" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-2 border-dashed glass-card p-12 text-center hover-lift">
          <div className="w-20 h-20 gradient-mesh rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FolderOpen className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">
            No projects yet
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
            Get started by creating your first project. Upload product images, edit them with AI, and generate professional videos.
          </p>
          <Button
            onClick={createProject}
            variant="gradient"
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project)}
              onDelete={() => setProjectToDelete(project)}
              onUpdateName={async (name) => {
                try {
                  const { error } = await supabase
                    .from('projects')
                    .update({ name })
                    .eq('id', project.id);
                  if (error) throw error;
                  setProjects((prev) =>
                    prev.map((p) => (p.id === project.id ? { ...p, name } : p))
                  );
                  showToast('Project name updated', 'success');
                } catch (error) {
                  console.error('Error updating project name:', error);
                  showToast('Failed to update project name', 'error');
                }
              }}
              index={index}
            />
          ))}
        </div>
      )}
      {projectToDelete && (
        <ConfirmDialog
          title="Delete Project"
          message={`Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone and will delete all associated media and content.`}
          confirmText="Delete Project"
          type="danger"
          onConfirm={() => deleteProject(projectToDelete)}
          onCancel={() => setProjectToDelete(null)}
        />
      )}

      {showProjectSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Select Project</h2>
                <button
                  onClick={() => {
                    setShowProjectSelector(false);
                    setPendingFiles([]);
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-muted-foreground mt-1">
                Choose which project to upload {pendingFiles.length} image{pendingFiles.length > 1 ? 's' : ''} to
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleFileUpload(pendingFiles, project.id)}
                    className="text-left p-4 rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-105"
                  >
                    <div className="aspect-video bg-muted/30 rounded-lg mb-3 overflow-hidden">
                      {project.thumbnail_url ? (
                        <img
                          src={project.thumbnail_url}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FolderOpen className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description || 'No description'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
  onDelete,
  onUpdateName,
  index
}: {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
  onUpdateName: (name: string) => Promise<void>;
  index: number;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedName(project.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedName.trim() && editedName !== project.name) {
      await onUpdateName(editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(project.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editedName.trim() && editedName !== project.name) {
        onUpdateName(editedName.trim());
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditedName(project.name);
      setIsEditing(false);
    }
  };

  return (
    <Card
      onClick={!isEditing ? onClick : undefined}
      className={cn(
        "group cursor-pointer overflow-hidden hover-lift hover-glow glass-card",
        "animate-slide-up border-2 border-transparent hover:border-primary/20",
        "transition-all duration-300"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'backwards'
      }}
    >
      <div className="aspect-video bg-muted/30 relative overflow-hidden">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="relative">
              <FolderOpen className="w-16 h-16 text-muted-foreground/50" />
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              variant="secondary"
              size="icon"
              className="glass shadow-lg hover:scale-110"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-2 glass-card rounded-lg shadow-2xl py-1 min-w-[160px] z-10 animate-scale-in border">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          {isEditing ? (
            <>
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => {
                  e.stopPropagation();
                  setEditedName(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1 text-lg font-semibold bg-background border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={100}
              />
              <Button
                onClick={handleSave}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <h3 className="flex-1 font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <Button
                onClick={handleStartEdit}
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
          {project.description || 'No description'}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {formatDate(project.updated_at)}</span>
        </div>
      </div>
    </Card>
  );
}
