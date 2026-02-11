
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Clock, 
  Settings2,
  CheckCircle2,
  Type,
  AlignLeft,
  LayoutList,
  Calendar,
  BookOpen,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Toast } from '../components/ui/Toast';
import type { ToastType } from '../components/ui/Toast';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { AssessmentType, ContentStatus } from '../types';
import type {Assessment, User, MCQQuestion, PsychologySubject,PsychologyTopic} from '../types';

const AssessmentEdit: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('settings');
  
  // Data for validation and selection
  const [subjects, setSubjects] = useState<PsychologySubject[]>([]);
  const [existingAssessments, setExistingAssessments] = useState<Assessment[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [assessment, setAssessment] = useState<Partial<Assessment>>({
    title: '',
    type: AssessmentType.QUIZ,
    subject: '', // Stores Subject ID or Name
    subjectId: '', // Explicit ID
    topicId: '',
    timeLimit: 30,
    items: 0,
    scheduleType: 'FLEXIBLE',
    status: ContentStatus.DRAFT,
    questions: [],
    authorId: user.id,
    authorName: user.name
  });

  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false
  });

  // Load Data
  useEffect(() => {
    // Load Subjects
    const savedSubjects = localStorage.getItem('psychology_core_subjects');
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    }

    // Load Existing Assessments for Validation
    const savedAssessments = localStorage.getItem('system_assessments');
    if (savedAssessments) {
      const parsedAssessments: Assessment[] = JSON.parse(savedAssessments);
      setExistingAssessments(parsedAssessments);

      // If editing, load current assessment
      if (id) {
        const found = parsedAssessments.find((a) => a.id === id);
        if (found) setAssessment(found);
      }
    }
  }, [id]);

  // Validation Logic
  useEffect(() => {
    validateConstraints(assessment.type, assessment.subject, assessment.topicId);
  }, [assessment.type, assessment.subject, assessment.topicId, existingAssessments]);

  const validateConstraints = (
    type?: AssessmentType, 
    subjectIdentifier?: string, 
    topicIdentifier?: string
  ) => {
    if (!type || !subjectIdentifier) {
      setValidationError(null);
      return;
    }

    // Find assessments that are NOT the current one being edited
    const otherAssessments = existingAssessments.filter(a => a.id !== id);

    if (type === AssessmentType.PRE_ASSESSMENT || type === AssessmentType.POST_ASSESSMENT) {
      // Rule: 1 Pre/Post per Subject
      const exists = otherAssessments.find(a => 
        a.type === type && (a.subject === subjectIdentifier || a.subjectId === subjectIdentifier)
      );
      
      if (exists) {
        setValidationError(`A ${type === AssessmentType.PRE_ASSESSMENT ? 'Pre-Assessment' : 'Post-Assessment'} already exists for this subject.`);
      } else {
        setValidationError(null);
      }
    } else if (type === AssessmentType.QUIZ) {
      // Rule: 1 Quiz per Topic
      if (!topicIdentifier) {
        // Warning: Topic must be selected for quiz, but not an "error" yet until save
        setValidationError(null); 
        return;
      }

      const exists = otherAssessments.find(a => 
        a.type === AssessmentType.QUIZ && 
        (a.subject === subjectIdentifier || a.subjectId === subjectIdentifier) &&
        a.topicId === topicIdentifier
      );

      if (exists) {
        setValidationError("A Quiz already exists for this specific topic.");
      } else {
        setValidationError(null);
      }
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const addQuestion = () => {
    const newQuestion: MCQQuestion = {
      id: 'q-' + Date.now(),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1
    };
    setAssessment(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion],
      items: (prev.questions?.length || 0) + 1
    }));
    setSelectedId(newQuestion.id);
  };

  const updateQuestion = (qId: string, updates: Partial<MCQQuestion>) => {
    setAssessment(prev => ({
      ...prev,
      questions: prev.questions?.map(q => q.id === qId ? { ...q, ...updates } : q)
    }));
  };

  const removeQuestion = (qId: string) => {
    setQuestionToDelete(qId);
  };

  const confirmRemoveQuestion = () => {
    if (!questionToDelete) return;
    setAssessment(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== questionToDelete),
      items: (prev.questions?.length || 1) - 1
    }));
    
    if (selectedId === questionToDelete) {
      setSelectedId('settings');
    }
    
    setQuestionToDelete(null);
    showToast("Question removed from assessment.", "info");
  };

  const handleSave = async (status: ContentStatus = ContentStatus.DRAFT) => {
    if (!assessment.title) {
      showToast("Title is required.", "error");
      return;
    }

    if (!assessment.subject) {
      showToast("Please select a Subject.", "error");
      return;
    }

    if (assessment.type === AssessmentType.QUIZ && !assessment.topicId) {
      showToast("Please select a Topic for the Quiz.", "error");
      return;
    }

    if (validationError) {
      showToast("Validation Error: " + validationError, "error");
      return;
    }

    setIsProcessing(true);
    showToast("Saving assessment...", "loading");
    await new Promise(r => setTimeout(r, 1000));

    const finalItem: Assessment = {
      ...(assessment as Assessment),
      id: assessment.id || 'as-' + Date.now(),
      status,
      items: assessment.questions?.length || 0,
      lastUpdated: new Date().toISOString(),
      dateCreated: assessment.dateCreated || new Date().toISOString(),
      revisionNotes: assessment.revisionNotes || []
    };

    const updatedList = id 
      ? existingAssessments.map(i => i.id === id ? finalItem : i)
      : [...existingAssessments, finalItem];

    localStorage.setItem('system_assessments', JSON.stringify(updatedList));
    setIsProcessing(false);
    showToast("Assessment saved successfully.", "success");
    setTimeout(() => navigate('/assessments'), 1000);
  };

  const currentQuestion = useMemo(() => 
    assessment.questions?.find(q => q.id === selectedId), 
  [assessment.questions, selectedId]);

  // Helper to get topics for selected subject
  const availableTopics = useMemo(() => {
    const subj = subjects.find(s => s.name === assessment.subject || s.id === assessment.subject);
    
    const flattenTopics = (nodes: PsychologyTopic[]): {id: string, title: string}[] => {
      let result: {id: string, title: string}[] = [];
      nodes.forEach(node => {
        result.push({ id: node.id, title: node.title });
        if (node.subTopics) {
          result = [...result, ...flattenTopics(node.subTopics)];
        }
      });
      return result;
    };

    return subj ? flattenTopics(subj.topics) : [];
  }, [assessment.subject, subjects]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assessments')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Breadcrumbs className="mb-0" items={[
            { label: 'Assessments', path: '/assessments' }, 
            { label: id ? 'Edit Exam' : 'New Assessment' }
          ]} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(ContentStatus.DRAFT)} disabled={isProcessing}>
             Save Draft
          </Button>
          <Button onClick={() => handleSave(ContentStatus.PENDING)} disabled={isProcessing} className="font-bold shadow-sm">
            <Save className="mr-2 h-4 w-4" /> Submit Assessment
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden border rounded-xl bg-card shadow-sm border-border">
        {/* SIDEBAR */}
        <aside className="w-[280px] border-r flex flex-col bg-slate-50/50">
          <div className="p-6 border-b bg-white">
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">Exam Structure</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Manage questions & settings</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <button
              onClick={() => setSelectedId('settings')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all",
                selectedId === 'settings' ? "bg-primary text-white shadow-sm" : "hover:bg-muted text-slate-600"
              )}
            >
              <Settings2 className={cn("h-4 w-4", selectedId === 'settings' ? "text-white" : "text-muted-foreground")} />
              Assessment Settings
            </button>
            
            {validationError && (
              <div className="mx-3 mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-700 font-medium leading-tight flex gap-2">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                {validationError}
              </div>
            )}

            <div className="px-3 py-4 flex items-center gap-2">
               <div className="h-px bg-border flex-1" />
               <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">Questions</span>
               <div className="h-px bg-border flex-1" />
            </div>

            {assessment.questions?.map((q, idx) => (
              <div 
                key={q.id}
                onClick={() => setSelectedId(q.id)}
                className={cn(
                  "group flex items-center justify-between py-2 px-3 rounded-lg transition-all cursor-pointer mb-1",
                  selectedId === q.id ? "bg-primary/10 text-primary font-bold shadow-sm" : "hover:bg-muted text-slate-600 font-medium"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-sm text-[10px] border shrink-0",
                    selectedId === q.id ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                  )}>
                    {idx + 1}
                  </span>
                  <span className="text-sm truncate select-none">
                    {q.text || <span className="italic opacity-50">Untitled Question</span>}
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-all"
                  title="Delete Question"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {assessment.questions?.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-[11px] text-muted-foreground font-medium px-4 italic opacity-60">No questions added.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <Button 
              variant="outline" 
              onClick={addQuestion}
              className="w-full h-10 rounded-lg border-2 border-dashed border-border text-slate-900 font-bold hover:bg-slate-50 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>
        </aside>

        {/* MAIN EDITOR AREA */}
        <main className="flex-1 overflow-y-auto bg-white">
          {selectedId === 'settings' ? (
             <div className="p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
                <div className="space-y-1 border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-900">Assessment Configuration</h3>
                  <p className="text-sm text-muted-foreground">Define the scope, timing, and categorization of the exam.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Type className="h-3 w-3" /> Exam Title
                    </label>
                    <Input 
                      value={assessment.title}
                      onChange={e => setAssessment({...assessment, title: e.target.value})}
                      placeholder="e.g., Midterm Examination on Abnormal Psych"
                      className="h-12 text-base font-bold shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <BookOpen className="h-3 w-3" /> Target Subject
                      </label>
                      <select 
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        value={assessment.subject}
                        onChange={e => setAssessment({
                          ...assessment, 
                          subject: e.target.value,
                          subjectId: e.target.value, // In this implementation, value is ID or Name, better to use ID if robust
                          topicId: '' // Reset topic when subject changes
                        })}
                      >
                        <option value="">-- Select Subject --</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <LayoutList className="h-3 w-3" /> Assessment Type
                      </label>
                      <select 
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        value={assessment.type}
                        onChange={e => setAssessment({...assessment, type: e.target.value as AssessmentType})}
                      >
                        <option value={AssessmentType.PRE_ASSESSMENT}>Pre-Assessment</option>
                        <option value={AssessmentType.QUIZ}>Topic Quiz</option>
                        <option value={AssessmentType.POST_ASSESSMENT}>Post-Assessment</option>
                      </select>
                    </div>
                  </div>

                  {/* Topic Selection - Only for Quizzes */}
                  {assessment.type === AssessmentType.QUIZ && (
                     <div className="space-y-2 animate-in slide-in-from-top-2">
                       <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                         <Layers className="h-3 w-3" /> Specific Topic
                       </label>
                       <select 
                         className={cn(
                           "flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20",
                           !assessment.subject && "opacity-50 cursor-not-allowed"
                         )}
                         value={assessment.topicId}
                         onChange={e => setAssessment({...assessment, topicId: e.target.value})}
                         disabled={!assessment.subject}
                       >
                         <option value="">-- Select Topic --</option>
                         {availableTopics.length > 0 ? availableTopics.map(t => (
                           <option key={t.id} value={t.id}>{t.title}</option>
                         )) : (
                           <option disabled>No topics available for selected subject</option>
                         )}
                       </select>
                       {!assessment.subject && <p className="text-[10px] text-rose-500">Please select a subject first.</p>}
                     </div>
                  )}

                  {validationError && (
                    <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 animate-in shake">
                      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-rose-800">Configuration Error</p>
                        <p className="text-xs text-rose-700">{validationError}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Time Limit (Minutes)
                    </label>
                    <Input 
                      type="number"
                      value={assessment.timeLimit}
                      onChange={e => setAssessment({...assessment, timeLimit: parseInt(e.target.value)})}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <AlignLeft className="h-3 w-3" /> Description / Instructions
                    </label>
                    <textarea 
                      className="w-full min-h-[100px] p-4 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm leading-relaxed text-slate-700 bg-slate-50/30 transition-all"
                      placeholder="Enter instructions for the students..."
                    />
                  </div>
                  
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3">
                     <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
                     <div className="space-y-1">
                        <p className="text-xs font-bold text-blue-900">Scheduling</p>
                        <p className="text-[10px] text-blue-700">This assessment is currently set to <strong>{assessment.scheduleType}</strong> mode.</p>
                     </div>
                  </div>
                </div>
             </div>
          ) : currentQuestion ? (
            <div className="p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b pb-4">
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">Edit Question</h3>
                   <p className="text-xs text-muted-foreground">Multiple Choice Question (MCQ)</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Points:</span>
                    <Input 
                      type="number" 
                      className="w-16 h-8 text-center" 
                      value={currentQuestion.points}
                      onChange={(e) => updateQuestion(currentQuestion.id, { points: parseInt(e.target.value) })}
                    />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1">Question Stem</label>
                <textarea 
                  value={currentQuestion.text}
                  onChange={(e) => updateQuestion(currentQuestion.id, { text: e.target.value })}
                  className="w-full min-h-[100px] p-4 text-base rounded-lg border border-border shadow-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none leading-relaxed"
                  placeholder="Type your question here..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1">Answer Options</label>
                <div className="grid gap-4">
                  {currentQuestion.options.map((opt, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center gap-3 p-2 pr-4 rounded-xl border transition-all",
                        currentQuestion.correctAnswer === idx ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-white border-border"
                      )}
                    >
                       <button
                         onClick={() => updateQuestion(currentQuestion.id, { correctAnswer: idx })}
                         className={cn(
                           "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-all border-2",
                           currentQuestion.correctAnswer === idx ? "bg-emerald-500 border-emerald-500 text-white" : "bg-muted hover:bg-muted/80 border-transparent text-slate-500"
                         )}
                         title="Mark as Correct Answer"
                       >
                         {String.fromCharCode(65 + idx)}
                       </button>
                       <Input 
                         value={opt}
                         onChange={(e) => {
                           const newOpts = [...currentQuestion.options];
                           newOpts[idx] = e.target.value;
                           updateQuestion(currentQuestion.id, { options: newOpts });
                         }}
                         className={cn(
                           "flex-1 h-10 border-transparent bg-transparent focus:bg-white transition-all",
                           currentQuestion.correctAnswer === idx && "font-medium text-emerald-900"
                         )}
                         placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                       />
                       {currentQuestion.correctAnswer === idx && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
              <Settings2 className="h-12 w-12 text-slate-400 mb-4" />
              <h4 className="text-lg font-bold text-slate-900 tracking-tight">Select an item</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Choose a question or settings from the sidebar to begin editing.</p>
            </div>
          )}
        </main>
      </div>

      <ConfirmationModal
        isOpen={questionToDelete !== null}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={confirmRemoveQuestion}
        title="Remove Question"
        message="Are you sure you want to remove this question from the assessment?"
        confirmText="Remove"
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default AssessmentEdit;
