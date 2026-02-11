
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  BookMarked,
  LayoutGrid,
  Eye,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import type { ToastType } from '../components/ui/Toast';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import type { PsychologySubject, User } from '../types';
import { UserRole } from '../types';
import { INITIAL_CORE_SUBJECTS } from '../constants';

interface SubjectManagementProps {
  user: User;
}

const SubjectManagement: React.FC<SubjectManagementProps> = ({ user }) => {
  const [subjects, setSubjects] = useState<PsychologySubject[]>([]);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const isAdmin = user.role === UserRole.ADMIN;

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
    showToast("Subject purged from core curriculum.", "success");
    setSubjectToDelete(null);
  };

  const handleSubjectClick = (subjectId: string) => {
    if (user.role === UserRole.FACULTY) {
      navigate(`/subjects/edit/${subjectId}`);
    } else {
      navigate(`/subjects/view/${subjectId}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <Breadcrumbs items={[{ label: 'Institutional Repository' }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
             <BookMarked className="h-8 w-8 text-primary" />
             Institutional Repository
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {isAdmin ? "Manage and structure the board exam modular content library." : "Browse and access the core curriculum resources."}
          </p>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => navigate('/subjects/new')} 
            className="rounded-lg h-10 px-4 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Subject Shell
          </Button>
        )}
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1 border-b pb-4 border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Curriculum Shells</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {subjects.length > 0 ? subjects.map((s) => (
             <Card 
                key={s.id} 
                className="group border border-border bg-card hover:border-primary/50 transition-all cursor-pointer rounded-xl flex flex-col h-full overflow-hidden shadow-sm"
                onClick={() => handleSubjectClick(s.id)}
              >
               <div className="h-1.5 w-full" style={{ backgroundColor: s.color }} />
               
               <CardHeader className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ backgroundColor: s.color }}>
                       <BookMarked className="h-4 w-4" />
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSubjectToDelete(s.id); }}
                        className="p-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold leading-none tracking-tight group-hover:text-primary transition-colors">
                    {s.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-3 line-clamp-3">
                    {s.description || 'Institutional subject shell.'}
                  </CardDescription>
               </CardHeader>

               <CardFooter className="p-0 border-t bg-muted/20">
                  <button className="w-full py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-all flex items-center justify-center gap-2">
                     {user.role === UserRole.FACULTY ? (
                        <>
                          <Edit className="h-3.5 w-3.5" /> Manage Curriculum
                        </>
                     ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> View Content
                        </>
                     )}
                  </button>
               </CardFooter>
             </Card>
           )) : (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-muted/30 rounded-xl border-2 border-dashed border-border">
                <LayoutGrid className="h-12 w-12 text-muted/30 mb-4" />
                <h3 className="text-lg font-bold text-muted-foreground">Registry Empty</h3>
                <p className="text-muted-foreground text-sm mt-1">Initialize the repository to begin management.</p>
                {isAdmin && (
                  <Button onClick={() => navigate('/subjects/new')} variant="outline" className="mt-6">
                    Initialize Registry
                  </Button>
                )}
             </div>
           )}
        </div>
      </section>

      <ConfirmationModal
        isOpen={subjectToDelete !== null}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={confirmDeleteSubject}
        title="Purge Board Subject"
        message="Are you sure you want to permanently remove this subject shell? This cannot be undone."
        confirmText="Confirm Purge"
      />

      <Toast 
        message={toast.message} type={toast.type} isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default SubjectManagement;
