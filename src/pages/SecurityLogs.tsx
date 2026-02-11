
import React, { useState, useEffect } from 'react';
import { 

  Search, 
  Filter, 
  Clock, 
  User as UserIcon, 
  ArrowDownToLine,
  RefreshCw,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/Table';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Pagination } from '../components/ui/Pagination';
import type { ActivityLog } from '../types';
import { getLogs } from '../services/logService';

const SecurityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchLogs = () => {
    setLogs(getLogs());
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Security & Transaction Logs' }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Activity Audit Trail</h2>
          <p className="text-muted-foreground">Monitor system-wide administrative transactions and content updates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline">
            <ArrowDownToLine className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                System Transactions
              </CardTitle>
              <CardDescription>Real-time log of administrative and faculty actions.</CardDescription>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search actions or users..." 
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
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Timestamp</TableHead>
                  <TableHead>User Account</TableHead>
                  <TableHead>Action Description</TableHead>
                  <TableHead className="text-right">Origin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length > 0 ? paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-[11px] text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{log.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-slate-700">{log.action}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-slate-500">
                        System Event
                      </span>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                      No transactions recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={filteredLogs.length}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityLogs;
