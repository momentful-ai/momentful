import { useState, useEffect, useRef } from 'react';
import { Plus, FolderOpen, Clock, MoreVertical, Trash2, Pencil, Check, X, Image as ImageIcon } from 'lucide-react';
import { database } from '../lib/database';
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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsWithMedia = await database.projects.list();
      setProjects(projectsWithMedia);
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('Failed to load projects. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const data = await database.projects.create(userId, 'Untitled Project', '');
      setProjects([data, ...projects]);
      showToast('Project created successfully!', 'success');
    } catch (error) {
      console.error('Error creating project:', error);
      showToast('Failed to create project. Please try again.', 'error');
    }
  };

  const deleteProject = async (project: Project) => {
    try {
      await database.projects.delete(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      showToast('Project deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Failed to delete project. Please try again.', 'error');
    } finally {
      setProjectToDelete(null);
    }
  };


  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
            Your Projects
          </h2>
          <p className="text-base text-muted-foreground">
            Create stunning marketing visuals with AI
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
                  await database.projects.update(project.id, { name });
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
        <ProjectPreviewCollage project={project} />
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

function ProjectPreviewCollage({ project }: { project: any }) {
  const previewImages = project.previewImages || [];
  const imageCount = previewImages.length;

  const getImageUrl = (storagePath: string) => {
    return database.storage.getPublicUrl('user-uploads', storagePath);
  };

  if (imageCount === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <FolderOpen className="w-16 h-16 text-muted-foreground/50" />
          <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
        </div>
      </div>
    );
  }

  if (imageCount === 1) {
    return (
      <img
        src={getImageUrl(previewImages[0])}
        alt="Project preview"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
    );
  }

  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 h-full gap-0.5">
        {previewImages.map((path: string, idx: number) => (
          <div key={idx} className="relative overflow-hidden">
            <img
              src={getImageUrl(path)}
              alt={`Preview ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    );
  }

  if (imageCount === 3) {
    return (
      <div className="grid grid-cols-2 h-full gap-0.5">
        <div className="relative overflow-hidden">
          <img
            src={getImageUrl(previewImages[0])}
            alt="Preview 1"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="grid grid-rows-2 gap-0.5">
          {previewImages.slice(1, 3).map((path: string, idx: number) => (
            <div key={idx} className="relative overflow-hidden">
              <img
                src={getImageUrl(path)}
                alt={`Preview ${idx + 2}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
      {previewImages.slice(0, 4).map((path: string, idx: number) => (
        <div key={idx} className="relative overflow-hidden">
          <img
            src={getImageUrl(path)}
            alt={`Preview ${idx + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      ))}
    </div>
  );
}
