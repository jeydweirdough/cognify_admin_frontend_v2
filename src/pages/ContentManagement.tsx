
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  FileUp, 
  History,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/Table';
import type { ContentItem, User } from '../types';
import { ContentStatus, UserRole } from '../types';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { logActivity } from '../services/logService';

const ContentManagement: React.FC<{ user: User }> = ({ user }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // const [isProcessing, setIsProcessing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('system_content');
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const syncItems = (updated: ContentItem[]) => {
    setItems(updated);
    localStorage.setItem('system_content', JSON.stringify(updated));
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const item = items.find(i => i.id === itemToDelete);
    // setIsProcessing(true);
    showToast("Deleting material...", "loading");
    await new Promise(r => setTimeout(r, 500));
    
    if (item) logActivity("Deleted Content", item.title, item.id);
    
    syncItems(items.filter(i => i.id !== itemToDelete));
    // setIsProcessing(false);
    showToast("Content removed permanently.", "success");
    setItemToDelete(null);
  };

  const handleRowAction = (item: ContentItem) => {
    if (user.role === UserRole.ADMIN) {
      navigate(`/content/view/${item.id}`);
    } else {
      if (item.authorId === user.id) {
        navigate(`/content/edit/${item.id}`);
      } else {
        navigate(`/content/view/${item.id}`);
      }
    }
  };

  const searchedItems = items.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.authorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(searchedItems.length / pageSize));
  const paginatedItems = searchedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAdmin = user.role === UserRole.ADMIN;
  const filteredForStats = isAdmin ? items : items.filter(i => i.authorId === user.id);
  
  const stats = {
    total: filteredForStats.length,
    approved: filteredForStats.filter(i => i.status === ContentStatus.APPROVED).length,
    pending: filteredForStats.filter(i => i.status === ContentStatus.PENDING).length,
    revision: filteredForStats.filter(i => i.status === ContentStatus.REVISION_REQUESTED).length
  };

  const getStatusBadge = (status: ContentStatus) => {
    switch(status) {
      case ContentStatus.APPROVED: return <Badge className="bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case ContentStatus.PENDING: return <Badge className="bg-blue-500"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case ContentStatus.REVISION_REQUESTED: return <Badge variant="destructive"><MessageSquare className="w-3 h-3 mr-1" /> Revision</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Content Management' }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Content Repository</h2>
          <p className="text-muted-foreground">Manage educational modules and review materials.</p>
        </div>
        {user.role === UserRole.FACULTY && (
          <Button onClick={() => navigate('/content/create')}>
            <Plus className="mr-2 h-4 w-4" /> Create Material
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1 border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Repository Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-muted-foreground">Total Materials</span>
              <span className="font-bold">{stats.total}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2 text-emerald-600 font-medium">
              <span>Approved</span>
              <span className="font-bold">{stats.approved}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Material List</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search titles..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>History</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length > 0 ? paginatedItems.map((item) => {
                  const isAuthor = item.authorId === user.id;
                  return (
                    <TableRow key={item.id} className="cursor-pointer group" onDoubleClick={() => handleRowAction(item)}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{item.title}</span>
                          <span className="text-[9px] text-muted-foreground italic">by {item.authorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground text-[10px] font-bold uppercase">
                          {item.format === 'TEXT' ? <FileText className="w-3 h-3 mr-1" /> : <FileUp className="w-3 h-3 mr-1" />}
                          {item.format}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center"><History className="w-3 h-3 mr-1" /> {item.submissionCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={(e) => { e.stopPropagation(); handleRowAction(item); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAuthor && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No materials found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={searchedItems.length}
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmationModal isOpen={itemToDelete !== null} onClose={() => setItemToDelete(null)} onConfirm={confirmDelete} title="Delete Material" message="Permanently remove this educational material?" />
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default ContentManagement;
