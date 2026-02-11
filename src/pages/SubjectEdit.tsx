
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Settings,
  ChevronRight,
  Bold,
  Italic,
  List,
  Heading2,
  AlertCircle,
  FolderPlus,
  Settings2,
  Type,
  AlignLeft,
  Palette,
  RotateCcw,
} from 'lucide-react';
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import type { PsychologySubject, PsychologyTopic,  User, } from '../types';
import { ContentStatus, } from '../types';
import { logActivity } from '../services/logService';

interface SubjectEditProps {
  user: User;
}

const SubjectEdit: React.FC<SubjectEditProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | 'metadata' | null>('metadata');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
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
        }
      }
    }
  }, [id]);

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

  const updateNodeInTree = (nodes: PsychologyTopic[], targetId: string, updates: Partial<PsychologyTopic>): PsychologyTopic[] => {
    return nodes.map(node => {
      if (node.id === targetId) return { ...node, ...updates };
      if (node.subTopics) return { ...node, subTopics: updateNodeInTree(node.subTopics, targetId, updates) };
      return node;
    });
  };

  const currentTopic = useMemo(() => {
    if (!selectedTopicId || selectedTopicId === 'metadata') return null;
    return findTopic(subject.topics || [], selectedTopicId);
  }, [selectedTopicId, subject.topics]);

  useEffect(() => {
    if (editorRef.current && currentTopic) {
      editorRef.current.innerHTML = currentTopic.description || '';
    }
  }, [selectedTopicId]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
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

  const handleAddModule = () => {
    const newModule: PsychologyTopic = {
      id: 't-' + Date.now(),
      title: 'Untitled Module',
      description: '',
      subTopics: [],
      status: ContentStatus.DRAFT
    };
    setSubject(prev => ({
      ...prev,
      topics: [...(prev.topics || []), newModule]
    }));
    setSelectedTopicId(newModule.id);
  };

  const handleAddSubTopic = (parentId: string) => {
    const newSub: PsychologyTopic = {
      id: 't-' + Date.now(),
      title: 'New Sub-Topic',
      description: '',
      subTopics: [],
      status: ContentStatus.DRAFT
    };
    const updatedTopics = updateNodeInTree(subject.topics || [], parentId, {
      subTopics: [...(findTopic(subject.topics || [], parentId)?.subTopics || []), newSub]
    });
    setSubject(prev => ({ ...prev, topics: updatedTopics }));
    setSelectedTopicId(newSub.id);
    
    // Auto-expand parent
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.add(parentId);
      return next;
    });
  };

  const handleUpdateTopic = (updates: Partial<PsychologyTopic>) => {
    if (!selectedTopicId || selectedTopicId === 'metadata') return;
    const updatedTopics = updateNodeInTree(subject.topics || [], selectedTopicId, updates);
    setSubject(prev => ({ ...prev, topics: updatedTopics }));
  };

  const handleDeleteTopic = (id: string) => {
    setTopicToDelete(id);
  };

  const confirmDeleteTopic = () => {
    if (!topicToDelete) return;
    // Instead of deleting immediately, mark as REMOVAL_PENDING
    const updatedTopics = updateNodeInTree(subject.topics || [], topicToDelete, { status: ContentStatus.REMOVAL_PENDING });
    setSubject(prev => ({ ...prev, topics: updatedTopics }));
    
    // If we are currently viewing the item we just marked for deletion, switch to metadata
    if (selectedTopicId === topicToDelete) setSelectedTopicId('metadata');
    
    showToast("Item marked for removal. Save changes to pending review.", "info");
    setTopicToDelete(null);
  };

  const handleRestoreTopic = (id: string) => {
    const updatedTopics = updateNodeInTree(subject.topics || [], id, { status: ContentStatus.DRAFT });
    setSubject(prev => ({ ...prev, topics: updatedTopics }));
    showToast("Item restored.", "info");
  };

  const handleSaveAll = async () => {
    if (!subject.name) {
       showToast("Subject name is required.", "error");
       return;
    }
    setIsProcessing(true);
    showToast("Synchronizing with repository...", "loading");
    await new Promise(r => setTimeout(r, 1000));

    const saved = localStorage.getItem('psychology_core_subjects');
    let subjectsList: PsychologySubject[] = saved ? JSON.parse(saved) : [];

    const finalSubject: PsychologySubject = {
      ...(subject as PsychologySubject),
      id: subject.id || 's-' + Date.now(),
      topics: subject.topics || [],
      // If editing an existing subject, revert status to PENDING to trigger re-approval
      status: id ? ContentStatus.PENDING : ContentStatus.DRAFT,
      lastUpdated: new Date().toISOString()
    };

    if (id) {
      subjectsList = subjectsList.map(s => s.id === id ? finalSubject : s);
    } else {
      subjectsList.push(finalSubject);
    }

    localStorage.setItem('psychology_core_subjects', JSON.stringify(subjectsList));
    logActivity(id ? "Updated Subject Shell" : "Created Subject Shell", finalSubject.name, finalSubject.id);
    
    setIsProcessing(false);
    showToast("Repository updated successfully.", "success");
    if (!id) navigate('/subjects');
  };

  const execCommand = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const TreeItem = ({ node }: { node: PsychologyTopic; key?: React.Key }) => {
    const active = selectedTopicId === node.id;
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.subTopics && node.subTopics.length > 0;
    const isRemovalPending = node.status === ContentStatus.REMOVAL_PENDING;
    
    return (
      <div className="flex flex-col">
        <div className={cn(
          "group flex items-center justify-between py-2 px-3 rounded-lg transition-all cursor-pointer",
          active ? "bg-primary/10 text-primary font-bold shadow-sm" : "hover:bg-muted text-slate-600 font-medium",
          isRemovalPending && "bg-rose-50 hover:bg-rose-100/50 border border-rose-100"
        )}
        onClick={() => setSelectedTopicId(node.id)}>
          <div className="flex items-center gap-1 overflow-hidden">
            <div 
               role="button"
               onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
               className={cn(
                 "p-0.5 rounded-md hover:bg-slate-200/50 text-muted-foreground transition-colors",
                 !hasChildren && "opacity-0 pointer-events-none"
               )}
             >
               <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", isExpanded && "rotate-90")} />
             </div>
            <span className={cn("text-sm truncate select-none flex items-center gap-2", isRemovalPending && "line-through text-rose-500")}>
              {node.title}
              {isRemovalPending && <Badge variant="destructive" className="h-4 text-[9px] px-1 py-0">Deleting</Badge>}
            </span>
          </div>
          
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isRemovalPending && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleAddSubTopic(node.id); }}
                className="p-1 hover:bg-white rounded text-muted-foreground hover:text-primary transition-colors"
                title="Add Sub-topic"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
            )}
            
            {isRemovalPending ? (
              <button 
                onClick={(e) => { e.stopPropagation(); handleRestoreTopic(node.id); }}
                className="p-1 hover:bg-emerald-100 rounded text-muted-foreground hover:text-emerald-600 transition-colors"
                title="Restore Item"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteTopic(node.id); }}
                className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-3 border-l border-border pl-2 mt-0.5 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
            {node.subTopics!.map((sub) => (
              <TreeItem key={sub.id} node={sub} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/subjects')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Breadcrumbs className="mb-0" items={[{ label: 'Repository', path: '/subjects' }, { label: id ? subject.name || 'Edit' : 'New Subject' }]} />
        </div>
        <Button onClick={handleSaveAll} disabled={isProcessing} className="font-bold shadow-sm">
          <Save className="mr-2 h-4 w-4" /> Save Repository Changes
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden border rounded-xl bg-card shadow-sm border-border">
        {/* SIDEBAR */}
        <aside className="w-[280px] border-r flex flex-col bg-slate-50/50">
          <div className="p-6 border-b bg-white">
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">Curriculum</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Manage modular structure</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <button
              onClick={() => setSelectedTopicId('metadata')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all",
                selectedTopicId === 'metadata' ? "bg-primary text-white shadow-sm" : "hover:bg-muted text-slate-600"
              )}
            >
              <Settings2 className={cn("h-4 w-4", selectedTopicId === 'metadata' ? "text-white" : "text-muted-foreground")} />
              Subject Settings
            </button>

            <div className="px-3 py-4 flex items-center gap-2">
               <div className="h-px bg-border flex-1" />
               <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">Units</span>
               <div className="h-px bg-border flex-1" />
            </div>

            {subject.topics?.map((topic) => (
              <TreeItem key={topic.id} node={topic} />
            ))}

            {subject.topics?.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-[11px] text-muted-foreground font-medium px-4 italic opacity-60">Curriculum empty.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <Button 
              variant="outline" 
              onClick={handleAddModule}
              className="w-full h-10 rounded-lg border-2 border-dashed border-border text-slate-900 font-bold hover:bg-slate-50 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Top Module
            </Button>
          </div>
        </aside>

        {/* MAIN EDITOR AREA */}
        <main className="flex-1 overflow-y-auto bg-white">
          {selectedTopicId === 'metadata' ? (
             <div className="p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
                <div className="space-y-1 border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-900">Subject Information</h3>
                  <p className="text-sm text-muted-foreground">Branding and scope for the core shell.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Type className="h-3 w-3" /> Subject Title
                    </label>
                    <Input 
                      value={subject.name}
                      onChange={e => setSubject({...subject, name: e.target.value})}
                      placeholder="e.g., Abnormal Psychology"
                      className="h-12 text-base font-bold shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <AlignLeft className="h-3 w-3" /> Institutional Scope
                    </label>
                    <textarea 
                      className="w-full min-h-[140px] p-4 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm leading-relaxed text-slate-700 bg-slate-50/30 transition-all"
                      value={subject.description}
                      onChange={e => setSubject({...subject, description: e.target.value})}
                      placeholder="Scope of this board subject..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Palette className="h-3 w-3" /> Subject Color
                    </label>
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50/30">
                       <div 
                        className="h-12 w-12 rounded-lg border-2 shadow-sm shrink-0" 
                        style={{ backgroundColor: subject.color }} 
                       />
                       <div className="flex-1 space-y-1">
                          <Input 
                            type="text"
                            value={subject.color}
                            onChange={e => setSubject({...subject, color: e.target.value})}
                            className="h-10 font-mono text-xs uppercase"
                            placeholder="#000000"
                          />
                       </div>
                       <input 
                         type="color" 
                         value={subject.color}
                         onChange={e => setSubject({...subject, color: e.target.value})}
                         className="h-10 w-10 border-0 p-0 cursor-pointer bg-transparent"
                       />
                    </div>
                  </div>
                </div>
             </div>
          ) : currentTopic ? (
            <div className="p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1">Module Title</label>
                <Input 
                  value={currentTopic.title}
                  onChange={(e) => handleUpdateTopic({ title: e.target.value })}
                  className={cn("h-12 text-lg font-bold shadow-sm", currentTopic.status === ContentStatus.REMOVAL_PENDING && "text-rose-500 line-through")}
                />
                {currentTopic.status === ContentStatus.REMOVAL_PENDING && (
                  <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-2 rounded-lg text-xs font-bold border border-rose-100">
                     <AlertCircle className="h-4 w-4" /> This module is marked for deletion.
                     <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={() => handleRestoreTopic(currentTopic.id)}>Restore</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1">Content Body</label>
                <div className={cn("border border-border rounded-xl overflow-hidden bg-white shadow-sm flex flex-col min-h-[500px]", currentTopic.status === ContentStatus.REMOVAL_PENDING && "opacity-50 pointer-events-none")}>
                  {/* Toolbar */}
                  <div className="flex items-center gap-1.5 p-3 bg-muted/20 border-b border-border shrink-0">
                    <button 
                      onClick={() => execCommand('bold')}
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-white text-slate-600 hover:text-primary transition-all shadow-sm border border-transparent hover:border-border"
                      title="Bold"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => execCommand('italic')}
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-white text-slate-600 hover:text-primary transition-all shadow-sm border border-transparent hover:border-border"
                      title="Italic"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => execCommand('insertUnorderedList')}
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-white text-slate-600 hover:text-primary transition-all shadow-sm border border-transparent hover:border-border"
                      title="List"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-border mx-1" />
                    <button 
                      onClick={() => execCommand('formatBlock', 'H2')}
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-white text-slate-600 hover:text-primary transition-all shadow-sm border border-transparent hover:border-border"
                      title="Heading"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  {/* Editor */}
                  <div 
                    ref={editorRef}
                    contentEditable
                    onBlur={(e) => handleUpdateTopic({ description: e.currentTarget.innerHTML })}
                    data-placeholder="Describe content here..."
                    className="flex-1 p-8 text-sm leading-relaxed text-slate-700 outline-none prose prose-slate max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
              <Settings className="h-12 w-12 text-slate-400 mb-4" />
              <h4 className="text-lg font-bold text-slate-900 tracking-tight">Select a curriculum node</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Choose a module or settings from the sidebar to begin.</p>
            </div>
          )}
        </main>
      </div>

      <ConfirmationModal
        isOpen={topicToDelete !== null}
        onClose={() => setTopicToDelete(null)}
        onConfirm={confirmDeleteTopic}
        title="Remove Curriculum Topic"
        message="Are you sure you want to remove this topic from the subject curriculum? This will mark it for deletion upon saving."
        confirmText="Mark for Removal"
      />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default SubjectEdit;
