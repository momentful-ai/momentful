import { mergeName } from '../../lib/utils';
import { formatDate } from '../../lib/utils';
import { Project } from '../../types';
import { useState, useRef, memo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { MoreVertical } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { Check } from 'lucide-react';
import { X } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { Clock } from 'lucide-react';
import { ProjectPreviewCollage } from './ProjectPreviewCollage';

interface ProjectCardProps {
    projectId: string;
    project: Project;
    onClick: (projectId: string) => void;
    onDelete: (projectId: string) => void;
    onUpdateName: (projectId: string, name: string) => Promise<void>;
    index: number;
  }

export const ProjectCard = memo(function ProjectCard({
    projectId,
    project,
    onClick,
    onDelete,
    onUpdateName,
    index
  }: ProjectCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(project.name);
    const inputRef = useRef<HTMLInputElement>(null);
  
    const handleStartEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditedName(project.name);
      setTimeout(() => inputRef.current?.focus(), 0);
    };
  
    const handleSave = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editedName.trim() && editedName !== project.name) {
        await onUpdateName(projectId, editedName.trim());
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
          onUpdateName(projectId, editedName.trim());
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
              onClick={!isEditing ? () => onClick(projectId) : undefined}
        className={mergeName(
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
                      onDelete(projectId);
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
  });
  