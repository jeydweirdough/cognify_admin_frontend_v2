
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
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
import { AssessmentType, ContentStatus, UserRole } from '../types';
import type { Assessment, User } from '../types';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { logActivity } from '../services/logService';

const Assessments: React.FC<{ user: User }> = ({ user }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  // const [isProcessing, setIsProcessing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('system_assessments');
    if (saved) {
      setAssessments(JSON.parse(saved));
    }
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const syncAssessments = (updated: Assessment[]) => {
    setAssessments(updated);
    localStorage.setItem('system_assessments', JSON.stringify(updated));
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const item = assessments.find(a => a.id === itemToDelete);
    // setIsProcessing(true);
    showToast("Deleting assessment...", "loading");
    await new Promise(r => setTimeout(r, 500));
    
    if (item) logActivity("Deleted Assessment", item.title, item.id);
    
    syncAssessments(assessments.filter(a => a.id !== itemToDelete));
    // setIsProcessing(false);
    showToast("Assessment removed.", "success");
    setItemToDelete(null);
  };

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || a.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / pageSize));
  const paginatedItems = filteredAssessments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAdmin = user.role === UserRole.ADMIN;

  const getTypeBadge = (type: AssessmentType) => {
    switch(type) {
      case AssessmentType.PRE_ASSESSMENT: return <Badge className="bg-indigo-500">Pre-Assessment</Badge>;
      case AssessmentType.QUIZ: return <Badge className="bg-amber-500">Quiz</Badge>;
      case AssessmentType.POST_ASSESSMENT: return <Badge className="bg-rose-500">Post-Assessment</Badge>;
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    switch(status) {
      case ContentStatus.APPROVED: return <Badge className="bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case ContentStatus.PENDING: return <Badge className="bg-blue-500"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case ContentStatus.REVISION_REQUESTED: return <Badge variant="destructive">Revision</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Assessment Management' }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Assessments</h2>
          <p className="text-muted-foreground">Manage pre-assessments and quizzes.</p>
        </div>
        {user.role === UserRole.FACULTY && (
          <Button onClick={() => navigate('/assessments/create')}>
            <Plus className="mr-2 h-4 w-4" /> Create Assessment
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Assessment Repository</CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value={AssessmentType.PRE_ASSESSMENT}>Pre-Assessment</option>
                <option value={AssessmentType.QUIZ}>Quizzes</option>
                <option value={AssessmentType.POST_ASSESSMENT}>Post-Assessments</option>
              </select>
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search titles..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length > 0 ? paginatedItems.map((item) => (
                <TableRow key={item.id} className="cursor-pointer group">
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell>{item.items} Items</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/assessments/${isAdmin ? 'view' : 'edit'}/${item.id}`); }}>
                        {isAdmin ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">No assessments found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={setPageSize} totalItems={filteredAssessments.length} />
        </CardContent>
      </Card>
      <ConfirmationModal isOpen={itemToDelete !== null} onClose={() => setItemToDelete(null)} onConfirm={confirmDelete} title="Delete Assessment" message="Permanently remove this assessment?" />
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default Assessments;
