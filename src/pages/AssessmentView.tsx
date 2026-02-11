
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  RotateCcw, 
  Clock,
  Layers,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Button, cn } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import { ContentStatus, UserRole } from '../types';
import type { Assessment, User } from '../types';

const AssessmentView: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = user.role === UserRole.ADMIN;

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false
  });

  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem('system_assessments');
      if (saved) {
        const found = JSON.parse(saved).find((a: Assessment) => a.id === id);
        if (found) setAssessment(found);
      }
    }
  }, [id]);

  const handleAdminReview = async (action: 'APPROVE' | 'REVISION') => {
    if (!assessment) return;
    setIsProcessing(true);
    setToast({ message: action === 'APPROVE' ? "Publishing exam..." : "Sending feedback...", type: 'loading', visible: true });
    
    await new Promise(r => setTimeout(r, 1200));

    const saved = localStorage.getItem('system_assessments');
    let items: Assessment[] = saved ? JSON.parse(saved) : [];

    const updated: Assessment = {
      ...assessment,
      status: action === 'APPROVE' ? ContentStatus.APPROVED : ContentStatus.REVISION_REQUESTED,
      revisionNotes: adminNote ? [...assessment.revisionNotes, {
        id: Date.now().toString(),
        adminId: user.id,
        adminName: user.name,
        note: adminNote,
        timestamp: new Date().toISOString()
      }] : assessment.revisionNotes
    };

    items = items.map(i => i.id === assessment.id ? updated : i);
    localStorage.setItem('system_assessments', JSON.stringify(items));
    
    setIsProcessing(false);
    setToast({ message: action === 'APPROVE' ? "Exam is now live." : "Revision requested.", type: 'success', visible: true });
    setTimeout(() => navigate('/assessments'), 1000);
  };

  if (!assessment) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading exam schema...</div>;

  return (
    <div className="space-y-6 w-full pb-20">
      <Breadcrumbs items={[
        { label: 'Assessments', path: '/assessments' },
        { label: `Review: ${assessment.title}` }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assessments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Exam Validation</h2>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">{assessment.type} | {assessment.subject}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" className="text-rose-600" onClick={() => handleAdminReview('REVISION')} disabled={isProcessing}>
               <RotateCcw className="mr-2 h-4 w-4" /> Request Revision
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAdminReview('APPROVE')} disabled={isProcessing}>
               <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{assessment.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center text-xs"><Layers className="w-3 h-3 mr-1" /> {assessment.items} Questions</span>
                    <span className="flex items-center text-xs"><Clock className="w-3 h-3 mr-1" /> {assessment.timeLimit} Minutes</span>
                  </CardDescription>
                </div>
                {assessment.scheduleType === 'SYNCED' && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    <Calendar className="w-3 h-3 mr-1" /> Scheduled Board Simulation
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {assessment.questions.map((q, idx) => (
                <div key={q.id} className="space-y-4 pb-8 border-b last:border-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg flex gap-3">
                      <span className="text-primary">{idx + 1}.</span>
                      {q.text}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                    {q.options.map((opt, optIdx) => (
                      <div 
                        key={optIdx} 
                        className={cn(
                          "p-4 rounded-xl border-2 text-sm transition-all flex items-center gap-3",
                          q.correctAnswer === optIdx ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold" : "bg-card border-muted/30"
                        )}
                      >
                        <span className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2",
                          q.correctAnswer === optIdx ? "bg-emerald-500 border-emerald-500 text-white" : "bg-muted/20"
                        )}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        {opt}
                        {q.correctAnswer === optIdx && <CheckCircle2 className="h-4 w-4 ml-auto text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Board Prep Compliance</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
               {isAdmin ? (
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase text-muted-foreground">Reviewer Note</label>
                   <textarea 
                    className="w-full min-h-[150px] p-3 border rounded-xl text-sm outline-none bg-muted/5 focus:ring-2 focus:ring-primary/10"
                    placeholder="Provide justification for revision or approval..."
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                   />
                 </div>
               ) : (
                 <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                   <p className="text-xs text-emerald-800 leading-relaxed italic">
                     "This assessment has been verified for Board Exam Simulation standards."
                   </p>
                 </div>
               )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Author</span>
                <span className="font-bold">{assessment.authorName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Type</span>
                <span className="font-bold uppercase text-[9px]">{assessment.type}</span>
              </div>
              {assessment.scheduleDate && (
                <div className="flex justify-between text-xs pt-2 border-t">
                  <span className="text-muted-foreground">Board Date</span>
                  <span className="font-bold text-amber-600">{new Date(assessment.scheduleDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Toast 
        message={toast.message} type={toast.type} isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default AssessmentView;
