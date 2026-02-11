
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  RotateCcw, 
  Clock,
  Layers,
  BookMarked,
  ListOrdered,
  ChevronRight,
  ChevronDown,
  Edit,
  CircleDashed,
  CheckCircle2,
  Trash2,
  FileUp,
  FileText,
  Download
} from 'lucide-react';
import { Button, cn } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Toast } from '../components/ui/Toast';
import type { ToastType } from '../components/ui/Toast';
import type { PsychologySubject, PsychologyTopic, User } from '../types';
import { ContentStatus, UserRole } from '../types';

const SubjectView: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<PsychologySubject | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const isAdmin = user.role === UserRole.ADMIN;

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false
  });

  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem('psychology_core_subjects');
      if (saved) {
        const found = JSON.parse(saved).find((s: PsychologySubject) => s.id === id);
        if (found) setSubject(found);
      }
    }
  }, [id]);

  // const showToast = (message: string, type: ToastType) => {
  //   setToast({ message, type, visible: true });
  // };

  // Helper to check if all topics are approved (and none are pending removal)
  const areAllTopicsApproved = (topics: PsychologyTopic[]): boolean => {
    if (!topics || topics.length === 0) return true;
    return topics.every(topic => 
      topic.status === ContentStatus.APPROVED && 
      (!topic.subTopics || areAllTopicsApproved(topic.subTopics))
    );
  };

  const handleAdminReview = async (action: 'APPROVE' | 'REVISION') => {
    if (!subject) return;
    setIsProcessing(true);
    setToast({ message: action === 'APPROVE' ? "Validating curriculum..." : "Sending feedback...", type: 'loading', visible: true });
    
    await new Promise(r => setTimeout(r, 1200));

    const saved = localStorage.getItem('psychology_core_subjects');
    let items: PsychologySubject[] = saved ? JSON.parse(saved) : [];

    // Helper to approve valid topics and remove pending-deletion ones
    const processTopicsForApproval = (topics: PsychologyTopic[]): PsychologyTopic[] => {
      return topics
        .filter(t => t.status !== ContentStatus.REMOVAL_PENDING) // Remove items marked for deletion
        .map(t => ({
          ...t,
          status: ContentStatus.APPROVED,
          subTopics: t.subTopics ? processTopicsForApproval(t.subTopics) : []
        }));
    };

    // If approving, clean up the tree. If revision, keep the tree as is (including removal pending) so users can see changes.
    const updatedTopics = action === 'APPROVE' 
      ? processTopicsForApproval(subject.topics)
      : subject.topics;

    const updated: PsychologySubject = {
      ...subject,
      topics: updatedTopics,
      status: action === 'APPROVE' ? ContentStatus.APPROVED : ContentStatus.REVISION_REQUESTED,
      revisionNotes: adminNote ? [...(subject.revisionNotes || []), {
        id: Date.now().toString(),
        adminId: user.id,
        adminName: user.name,
        note: adminNote,
        timestamp: new Date().toISOString()
      }] : subject.revisionNotes
    };

    items = items.map(s => s.id === subject.id ? updated : s);
    localStorage.setItem('psychology_core_subjects', JSON.stringify(items));
    setSubject(updated);
    
    setIsProcessing(false);
    setToast({ message: action === 'APPROVE' ? "Subject curriculum live." : "Revision requested.", type: 'success', visible: true });
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const findTopic = (nodes: PsychologyTopic[], targetId: string): PsychologyTopic | undefined => {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.subTopics) {
        const found = findTopic(node.subTopics, targetId);
        if (found) return found;
      }
    }
    return undefined;
  };

  const selectedTopic = useMemo(() => {
    if (!selectedTopicId || !subject) return null;
    return findTopic(subject.topics, selectedTopicId);
  }, [selectedTopicId, subject]);

  const isFullyApproved = useMemo(() => {
    if (!subject) return false;
    // Subject must be approved AND all topics must be approved (no drafts, no pending removals)
    return subject.status === ContentStatus.APPROVED && areAllTopicsApproved(subject.topics);
  }, [subject]);

  const RecursiveTree = ({ nodes }: { nodes: PsychologyTopic[] }) => {
    return (
      <div className="space-y-1">
        {nodes.map(node => {
          const hasChildren = node.subTopics && node.subTopics.length > 0;
          const isExpanded = expandedNodes.has(node.id);
          const isSelected = selectedTopicId === node.id;
          const isApproved = node.status === ContentStatus.APPROVED;
          const isRemovalPending = node.status === ContentStatus.REMOVAL_PENDING;
          const isPDF = node.format === 'PDF';
          
          return (
            <div key={node.id} className="pl-2">
              <div 
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm",
                  isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-slate-700",
                  isRemovalPending && "bg-rose-50 hover:bg-rose-100"
                )}
                onClick={(e) => {
                   e.stopPropagation();
                   setSelectedTopicId(node.id);
                }}
              >
                <div 
                  role="button"
                  onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                  className={cn(
                    "p-0.5 rounded-md hover:bg-slate-200/50 text-muted-foreground transition-colors",
                    !hasChildren && "opacity-0 pointer-events-none"
                  )}
                >
                   {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                
                {isRemovalPending ? (
                  <Trash2 className="h-3 w-3 text-rose-500 shrink-0" />
                ) : isApproved ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <CircleDashed className="h-3 w-3 text-amber-500 shrink-0" />
                )}
                
                <span className={cn("truncate flex items-center gap-2", isRemovalPending && "line-through text-rose-600")}>
                  {isPDF ? <FileUp className="h-3 w-3 opacity-70" /> : <FileText className="h-3 w-3 opacity-70" />}
                  {node.title}
                </span>
                
                {isRemovalPending && <Badge variant="destructive" className="ml-auto text-[9px] px-1 py-0 h-4">Del</Badge>}
              </div>
              {hasChildren && isExpanded && (
                <div className="ml-2 border-l border-border pl-1">
                   <RecursiveTree nodes={node.subTopics!} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!subject) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading subject repository...</div>;

  return (
    <div className="space-y-6 w-full pb-20">
      <Breadcrumbs items={[
        { label: 'Repository', path: '/subjects' },
        { label: `Review: ${subject.name}` }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/subjects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Subject Validation</h2>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{backgroundColor: subject.color}}></span>
              {subject.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && !isFullyApproved && (
            <>
               <Button variant="outline" className="text-rose-600" onClick={() => handleAdminReview('REVISION')} disabled={isProcessing}>
                 <RotateCcw className="mr-2 h-4 w-4" /> Request Revision
               </Button>
               <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAdminReview('APPROVE')} disabled={isProcessing}>
                 <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
               </Button>
            </>
          )}
          {isAdmin && isFullyApproved && (
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-100">
                <CheckCircle2 className="h-4 w-4" /> All Content Approved
             </div>
          )}
          <Button variant="outline" onClick={() => navigate(`/subjects/edit/${subject.id}`)}>
             <Edit className="mr-2 h-4 w-4" /> Edit Content
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-primary/10 shadow-lg min-h-[600px] flex flex-col">
            <CardHeader className="bg-muted/20 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle>{subject.name}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center text-xs"><Layers className="w-3 h-3 mr-1" /> {subject.topics.length} Top-level Units</span>
                  <span className="flex items-center text-xs"><Clock className="w-3 h-3 mr-1" /> Updated: {subject.lastUpdated || 'Recently'}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <Badge variant={subject.status === ContentStatus.APPROVED ? 'default' : 'secondary'} className={cn(subject.status === ContentStatus.APPROVED && "bg-emerald-500")}>
                    {subject.status || ContentStatus.DRAFT}
                 </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-1">
               {/* Left Tree */}
               <div className="w-1/3 border-r bg-slate-50/50 p-4 overflow-y-auto max-h-[600px]">
                 <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground mb-4 px-2">
                    <ListOrdered className="h-4 w-4" /> Curriculum Map
                 </div>
                 {subject.topics.length > 0 ? (
                    <RecursiveTree nodes={subject.topics} />
                 ) : (
                    <p className="text-xs text-muted-foreground italic px-2">No curriculum structure defined.</p>
                 )}
               </div>

               {/* Right Content */}
               <div className="flex-1 p-8 overflow-y-auto max-h-[600px]">
                  {selectedTopic ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                       <div className="flex items-center justify-between border-b pb-4">
                          <h3 className={cn("text-2xl font-bold text-slate-800", selectedTopic.status === ContentStatus.REMOVAL_PENDING && "text-rose-600 line-through")}>
                            {selectedTopic.title}
                          </h3>
                          {selectedTopic.status === ContentStatus.REMOVAL_PENDING ? (
                             <Badge variant="destructive">Pending Removal</Badge>
                          ) : (
                             <Badge variant={selectedTopic.status === ContentStatus.APPROVED ? 'default' : 'secondary'} className={cn(selectedTopic.status === ContentStatus.APPROVED && "bg-emerald-500")}>
                                {selectedTopic.status || 'DRAFT'}
                             </Badge>
                          )}
                       </div>
                       
                       {selectedTopic.status === ContentStatus.REMOVAL_PENDING && (
                         <div className="my-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm font-medium flex gap-2">
                           <Trash2 className="h-5 w-5 shrink-0" />
                           <p>This item has been marked for deletion. Approving this subject will permanently remove it from the curriculum.</p>
                         </div>
                       )}

                       {selectedTopic.format === 'PDF' ? (
                         <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-slate-50 text-center">
                           <FileText className="h-16 w-16 text-primary/40 mb-4" />
                           <h3 className="text-lg font-bold">PDF Document</h3>
                           <p className="text-sm text-muted-foreground mb-6">This unit is a PDF document resource.</p>
                           <Button onClick={() => window.open(selectedTopic.fileUrl, '_blank')} disabled={!selectedTopic.fileUrl}>
                             <Download className="mr-2 h-4 w-4" /> Open Document
                           </Button>
                         </div>
                       ) : (
                         <div 
                           className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed"
                           dangerouslySetInnerHTML={{ __html: selectedTopic.description || '<p class="italic opacity-50">No content description provided.</p>' }}
                         />
                       )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                       <BookMarked className="h-16 w-16 mb-4" />
                       <p>Select a topic from the curriculum map to review details.</p>
                    </div>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Compliance Review</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
               {isAdmin && !isFullyApproved ? (
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase text-muted-foreground">Reviewer Note</label>
                   <textarea 
                    className="w-full min-h-[150px] p-3 border rounded-xl text-sm outline-none bg-muted/5 focus:ring-2 focus:ring-primary/10 resize-none"
                    placeholder="Provide justification for revision or approval..."
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                   />
                 </div>
               ) : (
                 <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                   <p className="text-xs text-emerald-800 leading-relaxed italic">
                     "This curriculum has been verified for Board Exam Simulation standards."
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
                <span className="text-muted-foreground">Main Author</span>
                <span className="font-bold">{subject.authorName || 'Admin'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Units</span>
                <span className="font-bold">{subject.topics.length}</span>
              </div>
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

export default SubjectView;
