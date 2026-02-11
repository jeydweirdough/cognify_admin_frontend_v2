
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { 
  Target, 
  Brain, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Trophy,
  ArrowUpRight,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

// --- MOCK DATA SIMULATION ---
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

const SUBJECT_COMPETENCY_DATA = [
  { subject: 'Theories of Personality', cohortScore: 72, passingStandard: 75, fullMark: 100 },
  { subject: 'Abnormal Psychology', cohortScore: 68, passingStandard: 75, fullMark: 100 },
  { subject: 'Industrial Psychology', cohortScore: 85, passingStandard: 75, fullMark: 100 },
  { subject: 'Psychological Assessment', cohortScore: 78, passingStandard: 75, fullMark: 100 },
];

const PROBABILITY_DISTRIBUTION = [
  { name: 'High Probability (>80%)', value: 35, color: '#10b981' },
  { name: 'Moderate Probability (70-79%)', value: 45, color: '#f59e0b' },
  { name: 'Low Probability (<70%)', value: 20, color: '#ef4444' },
];

const Analytics: React.FC = () => {
  const [studentSearch, setStudentSearch] = useState('');
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalStudents = STUDENT_PERFORMANCE_DATA.length;
    const avgScore = Math.round(STUDENT_PERFORMANCE_DATA.reduce((acc, curr) => acc + curr.average, 0) / totalStudents);
    const passingCount = STUDENT_PERFORMANCE_DATA.filter(s => s.average >= 75).length;
    const passingRate = Math.round((passingCount / totalStudents) * 100);
    
    const sortedSubjects = [...SUBJECT_COMPETENCY_DATA].sort((a, b) => b.cohortScore - a.cohortScore);
    const strongestSubject = sortedSubjects[0];
    const weakestSubject = sortedSubjects[sortedSubjects.length - 1];

    return { totalStudents, avgScore, passingRate, strongestSubject, weakestSubject };
  }, []);

  const filteredStudents = STUDENT_PERFORMANCE_DATA.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.id.includes(studentSearch)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <Breadcrumbs items={[{ label: 'Licensure Readiness Analytics' }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Board Exam Readiness</h2>
          <p className="text-sm text-muted-foreground">Predictive analysis of student performance for the Licensure Examination for Psychologists/Psychometricians.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-white shadow-sm border-slate-200">
             <Users className="w-3 h-3 mr-2" /> Cohort 2024
          </Badge>
          <Badge className="px-3 py-1 bg-primary text-white">
             <TrendingUp className="w-3 h-3 mr-2" /> Live Data
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-100 flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Projected Pass Rate
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black">{stats.passingRate}%</span>
              <span className="text-sm font-medium text-blue-100">of students</span>
            </div>
            <div className="mt-2 text-xs text-blue-100 flex items-center">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Based on current trajectory
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Average Cohort Score
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-800">{stats.avgScore}</span>
              <span className="text-sm font-medium text-muted-foreground">/ 100</span>
            </div>
             <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +2.4% vs Last Month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Strongest Area
            </p>
            <div className="mt-4">
              <span className="text-lg font-bold text-slate-800 line-clamp-1">{stats.strongestSubject.subject}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
               <span className="text-2xl font-black text-emerald-600">{stats.strongestSubject.cohortScore}%</span>
               <span className="text-[10px] text-muted-foreground uppercase">Mastery Level</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Critical Weakness
            </p>
            <div className="mt-4">
              <span className="text-lg font-bold text-slate-800 line-clamp-1">{stats.weakestSubject.subject}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
               <span className="text-2xl font-black text-rose-600">{stats.weakestSubject.cohortScore}%</span>
               <span className="text-[10px] text-muted-foreground uppercase">Needs Intervention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competency Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Subject Competency Analysis
            </CardTitle>
            <CardDescription>Comparison of cohort performance against institutional passing standards (75%).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SUBJECT_COMPETENCY_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="cohortScore" name="Cohort Average" fill="#1e40af" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="passingStandard" name="Passing Standard (75%)" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Probability Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Pass Probability
            </CardTitle>
            <CardDescription>Risk distribution across the student population.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={PROBABILITY_DISTRIBUTION} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    {PROBABILITY_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-black text-slate-900">{STUDENT_PERFORMANCE_DATA.length}</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Students</span>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {PROBABILITY_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}} /> 
                    <span className="font-medium text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Student List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Student Risk Assessment</CardTitle>
              <CardDescription>Double-click a student row to view detailed performance analytics.</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search student..." 
                className="pl-9"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-center">Simulated Average</th>
                  <th className="px-4 py-3">Pass Probability</th>
                  <th className="px-4 py-3">Weakest Subject</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    onDoubleClick={() => navigate(`/analytics/${student.id}`)}
                    title="Double-click to view analytics"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 group-hover:text-primary transition-colors">
                      {student.name}
                      <div className="text-[10px] text-muted-foreground font-normal">{student.id}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {student.average}
                    </td>
                    <td className="px-4 py-3">
                      {student.probability === 'HIGH' && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">High Chance</Badge>}
                      {student.probability === 'MODERATE' && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Moderate</Badge>}
                      {student.probability === 'LOW' && <Badge className="bg-rose-100 text-rose-700 border-rose-200">At Risk</Badge>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {student.weakSubject !== 'None' ? student.weakSubject : <span className="text-emerald-600 font-medium">-- Consistent Performance --</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {student.average >= 75 ? (
                        <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3 h-3" /> On Track
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold text-xs flex items-center justify-end gap-1">
                          <AlertTriangle className="w-3 h-3" /> Intervention
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
