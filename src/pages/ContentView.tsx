
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  RotateCcw, 
  MessageSquare, 
  FileUp, 
  Eye, 
  AlertCircle,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import type { ContentItem, User } from '../types';
import { ContentStatus, UserRole } from '../types';

const ContentView: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contentItem, setContentItem] = useState<ContentItem | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = user.role === UserRole.ADMIN;

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
        }
      }
    }
  }, [id]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const handleAdminReview = async (action: 'APPROVE' | 'REVISION') => {
    if (!contentItem) return;
    setIsProcessing(true);
    showToast(action === 'APPROVE' ? "Approving content..." : "Requesting revision...", "loading");
    await new Promise(r => setTimeout(r, 1200));

    const saved = localStorage.getItem('system_content');
    let items: ContentItem[] = saved ? JSON.parse(saved) : [];

    const updatedItem: ContentItem = {
      ...contentItem,
      status: action === 'APPROVE' ? ContentStatus.APPROVED : ContentStatus.REVISION_REQUESTED,
      revisionCount: action === 'REVISION' ? contentItem.revisionCount + 1 : contentItem.revisionCount,
      revisionNotes: adminNote 
        ? [...contentItem.revisionNotes, { 
            id: Date.now().toString(), 
            adminId: user.id, 
            adminName: user.name, 
            note: adminNote, 
            timestamp: new Date().toISOString().split('T')[0] 
          }] 
        : contentItem.revisionNotes
    };

    items = items.map(i => i.id === contentItem.id ? updatedItem : i);
    localStorage.setItem('system_content', JSON.stringify(items));
    
    setIsProcessing(false);
    showToast(action === 'APPROVE' ? "Content approved and published." : "Revision request sent.", "success");
    setTimeout(() => navigate('/content'), 1000);
  };

  if (!contentItem) return <div className="p-12 text-center text-muted-foreground animate-pulse">Scanning material database...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <Breadcrumbs items={[
        { label: 'Content Management', path: '/content' },
        { label: `View: ${contentItem.title}` }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/content')} className="hover:bg-primary/10 hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Content Review
              {!isAdmin && <Badge variant="outline" className="text-[10px] bg-muted/50"><Lock className="w-3 h-3 mr-1" /> View Only</Badge>}
            </h2>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "Examine and validate faculty submissions for board preparation." 
                : "You are viewing a shared material from the faculty repository."}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="text-rose-600 hover:bg-rose-50 border-rose-200" 
              onClick={() => handleAdminReview('REVISION')} 
              disabled={isProcessing}
            >
               <RotateCcw className="mr-2 h-4 w-4" /> Request Revision
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20" 
              onClick={() => handleAdminReview('APPROVE')} 
              disabled={isProcessing}
            >
               <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content View */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="min-h-[700px] border-primary/10 shadow-lg overflow-hidden bg-white">
            <CardHeader className="border-b bg-muted/20 py-6 px-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-slate-900">{contentItem.title}</CardTitle>
                  <div className="flex items-center gap-5 mt-3">
                    <span className="text-xs font-semibold text-slate-500 flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-primary" /> 
                      <span className="uppercase tracking-wide">Author: {contentItem.authorName}</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-primary" /> 
                      <span className="uppercase tracking-wide">Last Updated: {contentItem.lastUpdated}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-primary px-3 py-1 font-bold tracking-widest uppercase text-[10px]">{contentItem.format}</Badge>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold">{contentItem.subject}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              {contentItem.format === 'TEXT' ? (
                <div 
                  className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{ __html: contentItem.content || '<p class="text-muted-foreground italic">No content provided.</p>' }}
                />
              ) : (
                <div className="bg-muted/10 rounded-3xl border-2 border-dashed border-primary/20 p-24 flex flex-col items-center justify-center text-center">
                  <FileUp className="h-24 w-24 text-primary/40 mb-6" />
                  <h3 className="text-2xl font-bold text-slate-800">Linked Institutional File</h3>
                  <p className="text-muted-foreground text-base mt-3 mb-10 max-w-md mx-auto">
                    This material is hosted as an external document ({contentItem.fileUrl}). Download or preview below.
                  </p>
                  <Button variant="outline" className="px-10 py-6 rounded-2xl border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all">
                    <Eye className="mr-3 h-5 w-5" /> Download & Preview Reference
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel: Metadata & Feedback */}
        <div className="space-y-6">
          {isAdmin ? (
            <Card className="shadow-md border-primary/10">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Admin Feedback Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Revision Directives</label>
                  <textarea 
                    className="w-full min-h-[220px] p-4 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-muted/10 resize-none font-medium text-slate-700"
                    placeholder="Provide specific notes for the faculty member. Identify gaps, errors, or formatting issues..."
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                  />
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-800 leading-normal font-medium">
                    Notes are logged in the history and sent to the faculty member's portal upon revision request.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
             <Card className="shadow-md border-emerald-100 bg-emerald-50/20">
              <CardHeader className="bg-emerald-50 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Material Quality
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <p className="text-xs text-emerald-900 leading-relaxed italic">
                  "This material has been vetted by the board preparation committee for accuracy and compliance with current curriculum standards."
                </p>
                <div className="text-[10px] flex justify-between text-emerald-600 font-bold border-t border-emerald-100 pt-3">
                   <span>VERIFIED ACCURACY</span>
                   <span>CVSU-B CERTIFIED</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Material Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Submission Cycle</span>
                <span className="font-bold bg-muted px-2 py-0.5 rounded">v{contentItem.submissionCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Feedback Loop</span>
                <span className="font-bold text-rose-600">{contentItem.revisionCount} Rounds</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-3 border-t">
                <span className="text-muted-foreground">Current State</span>
                <Badge variant="secondary" className="text-[9px] uppercase font-bold px-2 py-0 border-primary/20">{contentItem.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {contentItem.revisionNotes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                Discussion History
              </h4>
              <div className="space-y-3">
                {contentItem.revisionNotes.slice().reverse().map(rn => (
                  <div key={rn.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-xs space-y-2">
                    <div className="flex justify-between font-bold border-b pb-1">
                      <span className="text-primary uppercase text-[9px]">{rn.adminName}</span>
                      <span className="text-muted-foreground font-normal text-[9px]">{rn.timestamp}</span>
                    </div>
                    <p className="text-slate-600 italic leading-relaxed">"{rn.note}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast 
        message={toast.message} type={toast.type} isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default ContentView;
