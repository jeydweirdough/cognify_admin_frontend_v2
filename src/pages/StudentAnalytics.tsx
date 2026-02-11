
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Activity,
  BookOpen,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

// Mock Data (Duplicated from Analytics for consistency in this view)
const STUDENT_PERFORMANCE_DATA = [
  { id: '2024-001', name: 'Dela Cruz, Juan', average: 82, probability: 'HIGH', weakSubject: 'Abnormal Psychology' },
  { id: '2024-002', name: 'Santos, Maria', average: 74, probability: 'MODERATE', weakSubject: 'Industrial Psychology' },
  { id: '2024-003', name: 'Reyes, Jose', average: 65, probability: 'LOW', weakSubject: 'Theories of Personality' },
  { id: '2024-004', name: 'Garcia, Ana', average: 88, probability: 'HIGH', weakSubject: 'Psychological Assessment' },
  { id: '2024-005', name: 'Torres, Mark', average: 71, probability: 'MODERATE', weakSubject: 'Abnormal Psychology' },
  { id: '2024-006', name: 'Lim, Sarah', average: 92, probability: 'HIGH', weakSubject: 'None' },
  { id: '2024-007', name: 'Tan, Kevin', average: 58, probability: 'LOW', weakSubject: 'Theories of Personality' },
  { id: '2024-008', name: 'Gonzales, Bea', average: 76, probability: 'MODERATE', weakSubject: 'Psychological Assessment' },
];

const StudentAnalytics: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const selectedStudent = useMemo(() => 
    STUDENT_PERFORMANCE_DATA.find(s => s.id === studentId)
  , [studentId]);

  const studentDetails = useMemo(() => {
    if (!selectedStudent) return null;

    const baseScore = selectedStudent.average;
    // Deterministic randomness based on ID for consistency
    const variance = (n: number) => {
        const seed = selectedStudent.id.charCodeAt(selectedStudent.id.length - 1);
        return ((seed % n) - (n/2));
    };

    const breakdown = [
      { subject: 'Theories of Personality', score: Math.min(100, Math.max(0, baseScore + variance(15))), fullMark: 100 },
      { subject: 'Abnormal Psychology', score: Math.min(100, Math.max(0, baseScore + variance(10))), fullMark: 100 },
      { subject: 'Industrial Psychology', score: Math.min(100, Math.max(0, baseScore + variance(20))), fullMark: 100 },
      { subject: 'Psychological Assessment', score: Math.min(100, Math.max(0, baseScore + variance(12))), fullMark: 100 },
    ];

    const sorted = [...breakdown].sort((a, b) => b.score - a.score);
    
    return {
      breakdown,
      strength: sorted[0],
      weakness: sorted[sorted.length - 1],
      percentile: Math.min(99, Math.floor(baseScore + 10)), 
      mockExamHistory: [
        { date: 'Feb 10', score: Math.max(0, Math.floor(baseScore - 8)) },
        { date: 'Feb 24', score: Math.max(0, Math.floor(baseScore - 5)) },
        { date: 'Mar 10', score: Math.max(0, Math.floor(baseScore - 2)) },
        { date: 'Mar 24', score: baseScore }
      ]
    };
  }, [selectedStudent]);

  if (!selectedStudent || !studentDetails) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground mb-4">Student record not found.</p>
        <Button variant="outline" onClick={() => navigate('/analytics')}>Return to Analytics</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-right-8 duration-500">
       <Breadcrumbs items={[
        { label: 'Analytics', path: '/analytics' },
        { label: selectedStudent.name }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{selectedStudent.name}</h2>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
               ID: {selectedStudent.id} • <span className="font-semibold text-primary">{studentDetails.percentile}th Percentile Rank</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border shadow-sm">
            <div className="text-right px-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Overall Average</p>
                <p className="text-2xl font-black text-slate-800">{selectedStudent.average}%</p>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <Badge className={selectedStudent.average >= 75 ? "bg-emerald-500 h-8 px-3 text-xs" : "bg-rose-500 h-8 px-3 text-xs"}>
                {selectedStudent.average >= 75 ? "Passing" : "Critical"}
            </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
            {/* Subject Performance Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Brain className="h-4 w-4 text-primary" /> Subject Proficiency Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={studentDetails.breakdown} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="subject" type="category" width={140} tick={{fontSize: 11}} />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}} 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                                />
                                <ReferenceLine x={75} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Passing (75)', fill: '#ef4444', fontSize: 10 }} />
                                <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]} barSize={24}>
                                    {studentDetails.breakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.score >= 75 ? '#10b981' : entry.score >= 60 ? '#f59e0b' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Progress Over Time Line Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="h-4 w-4 text-primary" /> Mock Exam Trajectory
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={studentDetails.mockExamHistory} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right Column: Insights & Recommendations */}
        <div className="space-y-6">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4">
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-emerald-800">Top Strength</p>
                                <p className="text-sm font-bold text-slate-800 line-clamp-1">{studentDetails.strength.subject}</p>
                                <p className="text-xs text-emerald-600 font-medium">{studentDetails.strength.score}% Mastery</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-rose-50 border-rose-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-rose-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-rose-800">Critical Weakness</p>
                                <p className="text-sm font-bold text-slate-800 line-clamp-1">{studentDetails.weakness.subject}</p>
                                <p className="text-xs text-rose-600 font-medium">{studentDetails.weakness.score}% Mastery</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Recommendation */}
            <Card className="border-blue-200 shadow-md">
                <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm text-blue-900">
                        <BookOpen className="h-4 w-4" /> AI Study Plan
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Immediate Intervention:</strong> Assign "Module 3: Advanced Concepts" in {studentDetails.weakness.subject}.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Schedule Consultation:</strong> Student performance has plateaued in the last 2 weeks.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Reinforcement:</strong> {studentDetails.strength.subject} is solid. Use this confidence to tackle weaker areas.
                            </p>
                        </div>
                    </div>
                    
                    <Button className="w-full mt-2" variant="outline">
                        Generate PDF Report
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Attendance & Engagement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Platform Logins</span>
                        <span className="font-bold">42</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Materials Read</span>
                        <span className="font-bold">18/24</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Avg. Session Time</span>
                        <span className="font-bold">45m</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
