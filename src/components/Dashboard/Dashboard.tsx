import React, { useState, useCallback } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { database } from '../../lib/database';
import { Project } from '../../types';
import { useUserId } from '../../hooks/useUserId';
import { useToast } from '../../hooks/useToast';
import { useProjects } from '../../hooks/useProjects';
import { DashboardSkeleton } from '../LoadingSkeleton';
import { ConfirmDialog } from '../ConfirmDialog';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ProjectCard } from './ProjectCard';

interface DashboardProps {
  onSelectProject: (project: Project) => void;
}

export function Dashboard({ onSelectProject }: DashboardProps) {
  const userId = useUserId();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { data: projects = [], isLoading: loading, error } = useProjects();

  // Handle error from the query
  React.useEffect(() => {
    if (error) {
      console.error('Error loading projects:', error);
      showToast('Failed to load projects. Please refresh the page.', 'error');
    }
  }, [error, showToast]);

  const createProject = useCallback(async () => {
    if (!userId) return;

    try {
      const data = await database.projects.create(userId, 'Untitled Project', '');
      // Invalidate and refetch the projects query
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      onSelectProject(data);
    } catch (error) {
      console.error('Error creating project:', error);
      showToast('Failed to create project. Please try again.', 'error');
    }
  }, [userId, showToast, onSelectProject, queryClient]);

  const deleteProject = useCallback(async (project: Project) => {
    try {
      await database.projects.delete(project.id);
      // Invalidate and refetch the projects query
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Failed to delete project. Please try again.', 'error');
    } finally {
      setProjectToDelete(null);
    }
  }, [showToast, queryClient]);

  const handleSelectProject = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      onSelectProject(project);
    }
  }, [projects, onSelectProject]);

  const handleDeleteProject = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
    }
  }, [projects]);

  const handleUpdateProjectName = useCallback(async (projectId: string, name: string) => {
    try {
      await database.projects.update(projectId, { name });
      // Invalidate and refetch the projects query
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project name updated', 'success');
    } catch (error) {
      console.error('Error updating project name:', error);
      showToast('Failed to update project name', 'error');
    }
  }, [showToast, queryClient]);


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
              projectId={project.id}
              project={project}
              onClick={handleSelectProject}
              onDelete={handleDeleteProject}
              onUpdateName={handleUpdateProjectName}
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

