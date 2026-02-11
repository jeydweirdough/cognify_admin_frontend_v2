
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  ChevronRight,
  Bold,
  Italic,
  List,
  Heading2,
  Settings,
} from 'lucide-react';
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import type { PsychologySubject, PsychologyTopic } from '../types';
import { logActivity } from '../services/logService';

const PsychologyCoreEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('general');
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);
  
  const [subject, setSubject] = useState<Partial<PsychologySubject>>({
    name: '',
    description: '',
    color: '#1e40af',
    topics: []
  });

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false
  });

  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem('psychology_core_subjects');
      if (saved) {
        const subjects: PsychologySubject[] = JSON.parse(saved);
        const found = subjects.find(s => s.id === id);
        if (found) {
          setSubject(found);
        } else {
          showToast("Subject not found.", "error");
          setTimeout(() => navigate('/core-subjects'), 1500);
        }
      }
    }
  }, [id, navigate]);

  // Sync editor content when switching topics
  useEffect(() => {
    if (selectedTopicId !== 'general' && editorRef.current) {
      const topic = subject.topics?.find(t => t.id === selectedTopicId);
      if (topic) {
        editorRef.current.innerHTML = topic.description || '';
      }
    }
  }, [selectedTopicId]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const handleSave = async () => {
    if (!subject.name) {
      showToast("Subject name is required.", "error");
      return;
    }

    // Save current editor content before submitting
    const updatedSubject = { ...subject };
    if (selectedTopicId !== 'general' && editorRef.current) {
      updatedSubject.topics = updatedSubject.topics?.map(t => 
        t.id === selectedTopicId ? { ...t, description: editorRef.current?.innerHTML } : t
      );
    }

    setIsProcessing(true);
    showToast(id ? "Updating subject..." : "Creating subject...", "loading");
    
    await new Promise(r => setTimeout(r, 800));

    const saved = localStorage.getItem('psychology_core_subjects');
    let subjects: PsychologySubject[] = saved ? JSON.parse(saved) : [];

    if (id) {
      subjects = subjects.map(s => s.id === id ? updatedSubject as PsychologySubject : s);
      logActivity("Updated Core Subject", updatedSubject.name || "Unknown", id);
    } else {
      const newSubject: PsychologySubject = {
        ...(updatedSubject as PsychologySubject),
        id: 's-' + Date.now(),
        topics: updatedSubject.topics || []
      };
      subjects.push(newSubject);
      logActivity("Created Core Subject", newSubject.name, newSubject.id);
    }

    localStorage.setItem('psychology_core_subjects', JSON.stringify(subjects));
    setIsProcessing(false);
    showToast(id ? "Subject curriculum updated." : "New core subject created.", "success");
    setTimeout(() => navigate('/core-subjects'), 1000);
  };

  const addTopic = () => {
    const newTopic: PsychologyTopic = {
      id: 't-' + Date.now(),
      title: 'New Topic',
      description: ''
    };
    setSubject(prev => ({
      ...prev,
      topics: [...(prev.topics || []), newTopic]
    }));
    setSelectedTopicId(newTopic.id);
    showToast("Topic added to curriculum.", "info");
  };

  const updateTopicTitle = (title: string) => {
    setSubject(prev => ({
      ...prev,
      topics: prev.topics?.map(t => t.id === selectedTopicId ? { ...t, title } : t)
    }));
  };

  const confirmDeleteTopic = () => {
    if (!topicToDelete) return;
    setSubject(prev => ({
      ...prev,
      topics: (prev.topics || []).filter(t => t.id !== topicToDelete)
    }));
    if (selectedTopicId === topicToDelete) {
      setSelectedTopicId('general');
    }
    setTopicToDelete(null);
    showToast("Topic removed.", "info");
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const currentTopic = subject.topics?.find(t => t.id === selectedTopicId);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/core-subjects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Breadcrumbs className="mb-0" items={[
            { label: 'Psychology Core', path: '/core-subjects' },
            { label: id ? `Edit: ${subject.name}` : 'New Core Subject' }
          ]} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/core-subjects')}>Cancel</Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            <Save className="mr-2 h-4 w-4" /> 
            {id ? 'Save Changes' : 'Create Subject'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden border rounded-xl bg-card shadow-sm">
        {/* Sidebar Navigation */}
        <aside className="w-80 border-r flex flex-col bg-slate-50/50">
          <div className="p-6 border-b bg-white">
            <h3 className="font-bold text-lg text-slate-800">Course Curriculum</h3>
            <p className="text-xs text-muted-foreground mt-1">Organize your course content</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => setSelectedTopicId('general')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                selectedTopicId === 'general' ? "bg-primary text-white shadow-sm" : "hover:bg-muted text-slate-600"
              )}
            >
              <Settings className={cn("h-4 w-4", selectedTopicId === 'general' ? "text-white" : "text-slate-400 group-hover:text-primary")} />
              <span>General Subject Info</span>
            </button>
            
            <div className="px-4 py-3">
               <div className="h-px bg-slate-200 w-full" />
            </div>

            {subject.topics?.map((topic, index) => (
              <div key={topic.id} className="relative group">
                <button
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left",
                    selectedTopicId === topic.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-slate-600 font-medium"
                  )}
                >
                  <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", selectedTopicId === topic.id && "rotate-90 text-primary")} />
                  <span className="truncate">
                    {index + 1}. {topic.title}
                  </span>
                </button>
                <button 
                  className="absolute right-2 top-3 h-7 w-7 opacity-0 group-hover:opacity-100 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-md transition-all"
                  onClick={(e) => { e.stopPropagation(); setTopicToDelete(topic.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {subject.topics?.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No topics added yet.
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <Button 
              variant="outline" 
              className="w-full border-2 border-dashed h-12 rounded-xl hover:border-primary hover:bg-primary/5 hover:text-primary transition-all font-bold"
              onClick={addTopic}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Topic
            </Button>
          </div>
        </aside>

        {/* Main Editor Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {selectedTopicId === 'general' ? (
            <div className="p-10 max-w-3xl space-y-8 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">General Subject Settings</h3>
                <p className="text-sm text-muted-foreground">Modify core administrative identifiers and branding.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Subject Title</label>
                  <Input 
                    value={subject.name}
                    onChange={e => setSubject({...subject, name: e.target.value})}
                    placeholder="e.g. Theories of Personality"
                    className="h-12 text-lg font-bold bg-muted/20 border-transparent focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Institutional Description</label>
                  <textarea 
                    className="w-full min-h-[150px] p-4 rounded-xl border-transparent bg-muted/20 focus:bg-background focus:border-primary outline-none transition-all text-base leading-relaxed"
                    value={subject.description}
                    onChange={e => setSubject({...subject, description: e.target.value})}
                    placeholder="Describe the scope of this board subject..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Branding Color</label>
                    <div className="flex gap-4 items-center">
                       <div 
                        className="h-12 w-12 rounded-xl border-2 shadow-sm shrink-0" 
                        style={{ backgroundColor: subject.color }} 
                       />
                       <Input 
                        type="color"
                        value={subject.color}
                        onChange={e => setSubject({...subject, color: e.target.value})}
                        className="h-12 cursor-pointer border-transparent bg-muted/20"
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Active Status</label>
                    <div className="h-12 flex items-center px-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold gap-2">
                      <CheckCircle className="h-5 w-5" /> Institutional Live
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : currentTopic ? (
            <div className="p-10 max-w-4xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Content Title</label>
                <Input 
                  value={currentTopic.title}
                  onChange={e => updateTopicTitle(e.target.value)}
                  placeholder="Introduction to..."
                  className="h-12 text-lg font-bold bg-muted/20 border-transparent focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Content Body</label>
                <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                  {/* Editor Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-slate-50 border-b flex-wrap">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => execCommand('bold')}><Bold className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => execCommand('italic')}><Italic className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => execCommand('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                    <div className="w-px h-6 bg-slate-300 mx-2" />
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => execCommand('formatBlock', 'H2')}><Heading2 className="h-4 w-4" /></Button>
                  </div>
                  {/* Editor Area */}
                  <div 
                    ref={editorRef}
                    contentEditable
                    className="min-h-[450px] p-8 text-base outline-none prose prose-slate max-w-none leading-relaxed text-slate-700 bg-white"
                    onBlur={(e) => {
                      const updatedTopics = subject.topics?.map(t => 
                        t.id === selectedTopicId ? { ...t, description: e.currentTarget.innerHTML } : t
                      );
                      setSubject({ ...subject, topics: updatedTopics });
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center text-muted-foreground opacity-50">
               <AlertCircle className="h-16 w-16 mb-4" />
               <p className="text-lg font-medium">Select an item from the curriculum to edit.</p>
            </div>
          )}
        </main>
      </div>

      <ConfirmationModal
        isOpen={topicToDelete !== null}
        onClose={() => setTopicToDelete(null)}
        onConfirm={confirmDeleteTopic}
        title="Remove Curriculum Topic"
        message="Are you sure you want to remove this topic from the subject curriculum?"
        confirmText="Remove Topic"
      />

      <Toast 
        message={toast.message} type={toast.type} isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default PsychologyCoreEdit;
