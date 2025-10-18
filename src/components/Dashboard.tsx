import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import { useUserId } from '../hooks/useUserId';
import { useToast } from './ToastContainer';
import { DashboardSkeleton } from './LoadingSkeleton';
import { ConfirmDialog } from './ConfirmDialog';

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
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Projects</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Create stunning marketing visuals with AI
          </p>
        </div>
        <button
          onClick={createProject}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span className="sm:inline">New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 sm:p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No projects yet
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Get started by creating your first project. Upload product images, edit them with AI, and generate professional videos.
          </p>
          <button
            onClick={createProject}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project)}
              onDelete={() => setProjectToDelete(project)}
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

function ProjectCard({ project, onClick, onDelete }: { project: Project; onClick: () => void; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
    >
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FolderOpen className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-slate-700" />
            </button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[150px] z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1 truncate">
          {project.name}
        </h3>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">
          {project.description || 'No description'}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Updated {formatDate(project.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}
