
import React, { useState, useEffect } from 'react';
import { 
  BookMarked, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight, 
  ListOrdered, 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import type { PsychologySubject } from '../types';
import { INITIAL_CORE_SUBJECTS } from '../constants';

const PsychologyCore: React.FC = () => {
  const [subjects, setSubjects] = useState<PsychologySubject[]>([]);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('psychology_core_subjects');
    if (saved) {
      setSubjects(JSON.parse(saved));
    } else {
      setSubjects(INITIAL_CORE_SUBJECTS);
      localStorage.setItem('psychology_core_subjects', JSON.stringify(INITIAL_CORE_SUBJECTS));
    }
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const syncSubjects = (updated: PsychologySubject[]) => {
    setSubjects(updated);
    localStorage.setItem('psychology_core_subjects', JSON.stringify(updated));
  };

  const confirmDeleteSubject = () => {
    if (!subjectToDelete) return;
    const updated = subjects.filter(s => s.id !== subjectToDelete);
    syncSubjects(updated);
    showToast("Subject removed from core curriculum.", "success");
    setSubjectToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Psychology Core Hub' }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Psychology Core Hub</h2>
          <p className="text-muted-foreground">Manage the 4 institutional board exam core subjects and their curriculum.</p>
        </div>
        <Button onClick={() => navigate('/core-subjects/new')}>
          <Plus className="mr-2 h-4 w-4" /> Add New Subject
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {subjects.map((subject) => (
          <Card 
            key={subject.id} 
            className="group overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-1 bg-card cursor-pointer" 
            style={{ borderColor: `${subject.color}20` }}
            onDoubleClick={() => navigate(`/core-subjects/edit/${subject.id}`)}
          >
            <div className="h-2 w-full" style={{ backgroundColor: subject.color }} />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold" style={{ color: subject.color }}>{subject.name}</CardTitle>
                <div className="flex gap-1">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/core-subjects/edit/${subject.id}`);
                    }}
                   >
                     <Edit className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                   </Button>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubjectToDelete(subject.id);
                    }}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2 text-xs h-8 mt-1">
                {subject.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground pt-4 border-t">
                <span className="flex items-center gap-1.5"><ListOrdered className="h-3 w-3" /> Topics ({subject.topics.length})</span>
                <Badge variant="secondary" className="px-2 py-0 text-[10px] bg-muted/50">Active</Badge>
              </div>
              <div className="space-y-1.5 mt-2">
                {subject.topics.slice(0, 3).map(topic => (
                  <div key={topic.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                    <span className="text-xs truncate font-medium">{topic.title}</span>
                  </div>
                ))}
                {subject.topics.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-2 font-medium">
                    + {subject.topics.length - 3} more topics...
                  </p>
                )}
                {subject.topics.length === 0 && <p className="text-[10px] italic text-muted-foreground py-2 text-center bg-muted/20 rounded-lg">No curriculum defined.</p>}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t py-3 flex justify-end">
               <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 text-xs font-bold hover:bg-primary hover:text-white transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/core-subjects/edit/${subject.id}`);
                }}
               >
                 Manage Curriculum <ChevronRight className="h-3 w-3 ml-1" />
               </Button>
            </CardFooter>
          </Card>
        ))}
        {subjects.length === 0 && (
          <Card className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-muted/20 border-dashed border-2">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookMarked className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No Core Subjects Defined</h3>
            <p className="text-sm text-muted-foreground max-w-sm px-4 mt-2">
              Start by creating institutional subjects for the board exam review curriculum.
            </p>
            <Button onClick={() => navigate('/core-subjects/new')} className="mt-6">
              <Plus className="mr-2 h-4 w-4" /> Add First Subject
            </Button>
          </Card>
        )}
      </div>

      <ConfirmationModal
        isOpen={subjectToDelete !== null}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={confirmDeleteSubject}
        title="Delete Core Subject"
        message="Are you sure you want to delete this core subject? All associated curriculum topics and material tags will be permanently disconnected."
        confirmText="Delete Subject"
      />

      <Toast 
        message={toast.message} type={toast.type} isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default PsychologyCore;
