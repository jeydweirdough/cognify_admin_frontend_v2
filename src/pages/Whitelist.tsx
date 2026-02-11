
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Filter, 
  Loader2, 
  FileSpreadsheet,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button, cn } from '../components/ui/Button';
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
import type { WhitelistEntry } from '../types';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Dialog } from '../components/ui/Dialog';
import { Toast } from '../components/ui/Toast';
import type { ToastType } from '../components/ui/Toast';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

const INITIAL_WHITELIST: WhitelistEntry[] = [
  { id: '1', name: 'Maria Santos', studentNumber: '202110123', email: 'maria.santos@cvsu.edu.ph', status: 'REGISTERED', dateAdded: '2024-03-01' },
  { id: '2', name: 'James Wilson', studentNumber: '202110456', email: 'james.wilson@cvsu.edu.ph', status: 'PENDING', dateAdded: '2024-03-05' },
  { id: '3', name: 'Liza Ramos', studentNumber: '202110789', email: 'liza.ramos@cvsu.edu.ph', status: 'REGISTERED', dateAdded: '2024-03-10' },
  { id: '4', name: 'Kevin Durant', studentNumber: '202110111', email: 'kevin.durant@cvsu.edu.ph', status: 'PENDING', dateAdded: '2024-03-12' },
];

type UploadStep = 'SELECT_FILE' | 'MAP_COLUMNS';

const Whitelist: React.FC = () => {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WhitelistEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [uploadStep, setUploadStep] = useState<UploadStep>('SELECT_FILE');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [fileDataRows, setFileDataRows] = useState<any[]>([]); 
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: '',
    studentNumber: '',
    email: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  // const navigate = useNavigate();

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('whitelist_entries');
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      setEntries(INITIAL_WHITELIST);
      localStorage.setItem('whitelist_entries', JSON.stringify(INITIAL_WHITELIST));
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const syncEntries = (updated: WhitelistEntry[]) => {
    setEntries(updated);
    localStorage.setItem('whitelist_entries', JSON.stringify(updated));
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    
    setIsProcessing(true);
    showToast("Removing entry...", "loading");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    syncEntries(entries.filter(e => e.id !== entryToDelete));
    setIsProcessing(false);
    showToast("Entry removed successfully.", "success");
    setEntryToDelete(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      showToast("Please upload a valid Excel or CSV file.", "error");
    }
  };

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          const headers = jsonData[0].map((h: any) => h?.toString().trim() || 'Column');
          setParsedHeaders(headers);
          const rows = XLSX.utils.sheet_to_json(worksheet);
          setFileDataRows(rows);
          setUploadStep('MAP_COLUMNS');
        } else {
          showToast("The file appears to be empty.", "error");
        }
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("File processing error:", err);
      showToast("Failed to process file. Ensure it is not corrupted.", "error");
      setIsProcessing(false);
    }
  };

  const handleFinalUpload = async () => {
    if (!mapping.name || !mapping.studentNumber || !mapping.email) {
      showToast("Please map all required fields.", "error");
      return;
    }

    setIsProcessing(true);
    showToast("Importing data using defined mappings...", "loading");
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newEntries: WhitelistEntry[] = fileDataRows.map((row, i) => ({
      id: (Date.now() + i).toString(),
      name: row[mapping.name]?.toString() || 'Unknown Student',
      studentNumber: row[mapping.studentNumber]?.toString() || '0000000',
      email: row[mapping.email]?.toString() || 'no-email@cvsu.edu.ph',
      status: 'PENDING',
      dateAdded: new Date().toISOString().split('T')[0]
    }));

    const existingIds = new Set(entries.map(e => e.studentNumber));
    const uniqueNewEntries = newEntries.filter(e => !existingIds.has(e.studentNumber));
    const combinedEntries = [...entries, ...uniqueNewEntries];
    syncEntries(combinedEntries);
    
    setIsProcessing(false);
    setIsBulkModalOpen(false);
    setUploadStep('SELECT_FILE');
    setUploadedFile(null);
    setMapping({ name: '', studentNumber: '', email: '' });
    showToast(`Import finished. Successfully added ${uniqueNewEntries.length} students.`, "success");
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    setIsProcessing(true);
    showToast("Saving changes...", "loading");
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updated = entries.map(e => e.id === selectedEntry.id ? selectedEntry : e);
    syncEntries(updated);
    
    setIsProcessing(false);
    setIsEditModalOpen(false);
    showToast("Entry updated successfully.", "success");
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    showToast("Whitelisting student...", "loading");
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newEntry: WhitelistEntry = {
      id: Date.now().toString(),
      name: "Manual Entry Student",
      studentNumber: "2024" + Math.floor(Math.random() * 10000),
      email: "new.whitelisted@cvsu.edu.ph",
      status: 'PENDING',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    syncEntries([...entries, newEntry]);
    setIsProcessing(false);
    setIsAddModalOpen(false);
    showToast("Student whitelisted manually.", "success");
  };

  const filteredEntries = entries.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.studentNumber.includes(searchTerm) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Institutional Whitelist' }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Pre-Registration Whitelist</h2>
          <p className="text-muted-foreground">Approve students for system registration using institutional credentials.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
             <Upload className="mr-2 h-4 w-4" /> Bulk Upload
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Manual Entry
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Whitelisted Students</CardTitle>
              <CardDescription>Only these students can register accounts. Double-click to edit.</CardDescription>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search number, name or email..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Number</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Institutional Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.length > 0 ? paginatedEntries.map((entry) => (
                <TableRow 
                  key={entry.id} 
                  className="cursor-pointer"
                  onDoubleClick={() => { setSelectedEntry(entry); setIsEditModalOpen(true); }}
                  title="Double-click to edit entry"
                >
                  <TableCell className="font-mono text-xs font-semibold">{entry.studentNumber}</TableCell>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.email}</TableCell>
                  <TableCell>
                    <Badge variant={entry.status === 'REGISTERED' ? 'secondary' : 'outline'} className={cn(entry.status === 'REGISTERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={(e) => { e.stopPropagation(); setSelectedEntry(entry); setIsEditModalOpen(true); }}
                        title="Edit Entry"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); setEntryToDelete(entry.id); }}
                        title="Delete Entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No whitelisted students found matching your search.
                  </TableCell>
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
            totalItems={filteredEntries.length}
          />
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={entryToDelete !== null}
        onClose={() => setEntryToDelete(null)}
        onConfirm={confirmDelete}
        title="Remove Student Entry"
        message="Are you sure you want to remove this student from the institutional whitelist? This will prevent them from registering a new account."
        confirmText="Remove Entry"
      />

      {/* Manual Entry Dialog */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Student to Whitelist"
        description="Verify CVSU-B institutional details before whitelisting."
      >
        <form className="space-y-4" onSubmit={handleAddManual}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input placeholder="e.g. Maria Santos" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Student Number</label>
            <Input placeholder="e.g. 202110123" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Institutional Email</label>
            <Input type="email" placeholder="maria.santos@cvsu.edu.ph" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isProcessing}>Whitelist Student</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Whitelist Entry"
        description="Modify student verification details or status."
      >
        {selectedEntry && (
          <form className="space-y-4" onSubmit={handleSaveEntry}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Student Number</label>
              <Input 
                value={selectedEntry.studentNumber}
                onChange={e => setSelectedEntry({...selectedEntry, studentNumber: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Institutional Email</label>
              <Input 
                type="email"
                value={selectedEntry.email}
                onChange={e => setSelectedEntry({...selectedEntry, email: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Status</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedEntry.status}
                onChange={e => setSelectedEntry({...selectedEntry, status: e.target.value as 'REGISTERED' | 'PENDING'})}
              >
                <option value="PENDING">Pending (Awaiting Registration)</option>
                <option value="REGISTERED">Registered (Account Active)</option>
              </select>
            </div>
            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="destructive" 
                type="button" 
                onClick={() => { setIsEditModalOpen(false); setEntryToDelete(selectedEntry.id); }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Entry
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isProcessing}>Save Changes</Button>
              </div>
            </div>
          </form>
        )}
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false);
          setUploadStep('SELECT_FILE');
          setUploadedFile(null);
          setMapping({ name: '', studentNumber: '', email: '' });
        }}
        title="Bulk Whitelist Upload"
        description={
          uploadStep === 'SELECT_FILE' 
            ? "Upload an Excel or CSV file containing student list." 
            : "Map the columns from your uploaded file to system fields."
        }
      >
        <div className="space-y-6">
          {uploadStep === 'SELECT_FILE' ? (
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-10 transition-colors flex flex-col items-center justify-center text-center cursor-pointer",
                "hover:border-primary hover:bg-primary/5",
                uploadedFile ? "border-primary bg-primary/5" : "border-muted"
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-lg">
                {uploadedFile ? uploadedFile.name : "Click or drag file to upload"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Supports .xlsx, .xls, and .csv formats
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.xlsx,.xls" 
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              {isProcessing && (
                <div className="mt-4 flex items-center text-primary font-medium text-sm">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing file structure...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>We've extracted the headers from your file. Map them to the system fields below.</p>
              </div>
              
              <div className="grid gap-4">
                {[
                  { key: 'name', label: 'Student Full Name' },
                  { key: 'studentNumber', label: 'Student Number' },
                  { key: 'email', label: 'Institutional Email' }
                ].map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      {field.label}
                    </label>
                    <div className="relative">
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={mapping[field.key]}
                        onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                      >
                        <option value="">-- Select Header from File --</option>
                        {parsedHeaders.map((h, i) => (
                          <option key={`${h}-${i}`} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setUploadStep('SELECT_FILE')}
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleFinalUpload} 
                  disabled={isProcessing || !mapping.name || !mapping.studentNumber || !mapping.email}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Start Import"}
                  {!isProcessing && <ChevronRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default Whitelist;
