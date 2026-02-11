
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  FileUp, 
  Save, 
  Send, 
  ArrowLeft, 
  Bold, 
  Italic, 
  List, 
  AlertCircle,
} from 'lucide-react';
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import type { ContentItem, User } from '../types';
import { ContentStatus } from '../types';

const ContentEdit: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contentItem, setContentItem] = useState<Partial<ContentItem>>({
    title: '',
    subject: 'General', // Defaulted as curriculum is being replaced
    topicId: 'None',
    type: 'MODULE',
    format: 'TEXT',
    content: '',
    revisionNotes: [],
    status: ContentStatus.DRAFT,
    submissionCount: 0,
    revisionCount: 0
  });

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false
  });

  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem('system_content');
      if (saved) {
        const items: ContentItem[] = JSON.parse(saved);
        const found = items.find(i => i.id === id);
        if (found) {
          setContentItem(found);
          if (found.format === 'TEXT' && editorRef.current) {
            setTimeout(() => {
              if (editorRef.current) editorRef.current.innerHTML = found.content || '';
            }, 50);
          }
        }
      }
    }
  }, [id]);

  const switchFormat = (format: 'TEXT' | 'PDF') => {
    if (contentItem.format === 'TEXT' && editorRef.current) {
      setContentItem(prev => ({ ...prev, format, content: editorRef.current?.innerHTML }));
    } else {
      setContentItem(prev => ({ ...prev, format }));
    }
  };

  const getEditorContent = () => {
    return editorRef.current ? editorRef.current.innerHTML : (contentItem.content || '');
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleAction = async (action: 'SAVE' | 'SUBMIT') => {
    if (!contentItem.title) {
      showToast("Title is required.", "error");
      return;
    }

    setIsProcessing(true);
    showToast(action === 'SAVE' ? "Saving draft..." : "Submitting for approval...", "loading");
    await new Promise(r => setTimeout(r, 1000));

    const saved = localStorage.getItem('system_content');
    let items: ContentItem[] = saved ? JSON.parse(saved) : [];

    const now = new Date().toISOString().split('T')[0];
    const finalItem: ContentItem = {
      ...(contentItem as ContentItem),
      id: contentItem.id || Date.now().toString(),
      content: getEditorContent(),
      status: action === 'SAVE' ? ContentStatus.DRAFT : ContentStatus.PENDING,
      submissionCount: action === 'SUBMIT' ? (contentItem.submissionCount || 0) + 1 : (contentItem.submissionCount || 0),
      lastUpdated: now,
      dateCreated: contentItem.dateCreated || now,
      authorId: user.id,
      authorName: user.name
    };

    if (id) {
      items = items.map(i => i.id === id ? finalItem : i);
    } else {
      items.push(finalItem);
    }

    localStorage.setItem('system_content', JSON.stringify(items));
    setIsProcessing(false);
    showToast(action === 'SAVE' ? "Draft saved successfully." : "Submitted to Admin for review.", "success");
    setTimeout(() => navigate('/content'), 1000);
  };

  return (
    <div className="space-y-6 w-full pb-20">
      <Breadcrumbs items={[
        { label: 'Content Management', path: '/content' },
        { label: id ? `Edit: ${contentItem.title}` : 'Create New Material' }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/content')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {id ? 'Refine Material' : 'Supply New Content'}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleAction('SAVE')} disabled={isProcessing}>
             <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={() => handleAction('SUBMIT')} disabled={isProcessing}>
             <Send className="mr-2 h-4 w-4" /> Submit for Approval
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="min-h-[600px] flex flex-col shadow-lg border-primary/10">
            <CardHeader className="border-b bg-muted/20 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Module Content
              </CardTitle>
              <div className="flex gap-2 p-1 bg-background rounded-md border shadow-inner">
                <button 
                  className={cn("px-4 py-1.5 rounded-sm text-xs font-bold transition-all", contentItem.format === 'TEXT' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
                  onClick={() => switchFormat('TEXT')}
                >
                  Rich Text
                </button>
                <button 
                  className={cn("px-4 py-1.5 rounded-sm text-xs font-bold transition-all", contentItem.format === 'PDF' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
                  onClick={() => switchFormat('PDF')}
                >
                  File Link
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col">
              {contentItem.format === 'TEXT' ? (
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-1 p-3 bg-muted/30 border-b flex-wrap sticky top-0 z-20 shadow-sm">
                    <Button variant="ghost" size="icon" onClick={() => execCommand('bold')}><Bold className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => execCommand('italic')}><Italic className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => execCommand('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                  </div>
                  <div 
                    ref={editorRef}
                    contentEditable
                    className="flex-1 p-10 text-base outline-none bg-background prose prose-slate max-w-none min-h-[400px]"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
                  <FileUp className="h-12 w-12 text-primary/40 mb-4" />
                  <Button variant="outline" className="border-dashed">Select PDF File</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">General Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Material Title</label>
                <Input 
                  value={contentItem.title}
                  onChange={e => setContentItem({...contentItem, title: e.target.value})}
                  placeholder="Enter title..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Format Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                  value={contentItem.type}
                  onChange={e => setContentItem({...contentItem, type: e.target.value as any})}
                >
                  <option value="MODULE">Comprehensive Module</option>
                  <option value="REVIEWER">Pocket Reviewer</option>
                  <option value="GUIDE">Study Guide</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {contentItem.revisionNotes && contentItem.revisionNotes.length > 0 && (
            <Card className="border-rose-200 bg-rose-50/50">
              <CardHeader className="bg-rose-100/50 py-3">
                <CardTitle className="text-xs font-bold uppercase text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" /> Revision Required
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {contentItem.revisionNotes.slice().reverse().map(rn => (
                    <div key={rn.id} className="p-3 bg-white rounded-xl border border-rose-100 shadow-sm text-xs">
                      <p className="text-rose-900 italic">"{rn.note}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default ContentEdit;
