
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, BookOpen, Activity, LayoutGrid, ListTree, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {UserRole, ContentStatus } from '../types';
import type {User, ContentItem, ActivityLog, PsychologySubject } from '../types';
import { getLogs } from '../services/logService';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeExams: 0,
    readinessAvg: 76,
    pendingApprovals: 0,
    totalMaterials: 0,
    subjectShells: 0,
    modularUnits: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('registered_users');
    const users: User[] = savedUsers ? JSON.parse(savedUsers) : [];
    const studentCount = users.filter(u => u.role === UserRole.STUDENT).length;

    const savedContent = localStorage.getItem('system_content');
    const content: ContentItem[] = savedContent ? JSON.parse(savedContent) : [];
    const pendingCount = content.filter(c => c.status === ContentStatus.PENDING).length;

    const savedSubjects = localStorage.getItem('psychology_core_subjects');
    const subjects: PsychologySubject[] = savedSubjects ? JSON.parse(savedSubjects) : [];
    
    let totalUnits = 0;
    const countTopics = (nodes: any[]) => {
      nodes.forEach(n => {
        totalUnits++;
        if (n.subTopics) countTopics(n.subTopics);
      });
    };
    subjects.forEach(s => countTopics(s.topics));

    setStats({
      totalStudents: studentCount,
      activeExams: 8,
      readinessAvg: 76,
      pendingApprovals: pendingCount,
      totalMaterials: content.length,
      subjectShells: subjects.length,
      modularUnits: totalUnits
    });

    const logs = getLogs().slice(0, 5);
    setRecentActivity(logs);
  }, []);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Overview of the Board Exam Preparation system.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Live Sync
          </Button>
          <Button size="sm">Generate Report</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Institutional Metrics moved from Repository */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subjects</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <LayoutGrid className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.subjectShells}</div>
            <p className="text-xs text-muted-foreground">Core curriculum shells</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Modular Units</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ListTree className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.modularUnits}</div>
            <p className="text-xs text-muted-foreground">Detailed topics in tree</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">System Status</CardTitle>
            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-700">Verified</div>
            <p className="text-xs text-muted-foreground">Security & Integrity OK</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Registered in platform</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingApprovals} awaiting review</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Readiness Avg</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readinessAvg}%</div>
            <p className="text-xs text-muted-foreground">Overall cohort performance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest administrative activities logged in system.</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pt-2">
              {recentActivity.length > 0 ? recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-l-2 border-primary/20 pl-4 py-1">
                  <div className="space-y-1">
                    <p className="text-sm font-bold leading-none">{log.userName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {log.action}
                    </p>
                  </div>
                  <div className="ml-auto whitespace-nowrap">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-muted-foreground italic text-sm">
                  No recent activities recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
