import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Clock, MoreVertical, Trash2 } from 'lucide-react';
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
  index
}: {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
  index: number;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      onClick={onClick}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
        <h3 className="font-semibold text-lg mb-2 truncate group-hover:text-primary transition-colors">
          {project.name}
        </h3>
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
