
import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Database, 
  Save, 
  Lock, 
  Unlock, 
  Download, 
  Building, 
  Target,
  Workflow,
  Monitor,
  Check,
  Palette,
  FileUp,
  AlertTriangle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import { Dialog } from '../components/ui/Dialog';
import type { User, GlobalSystemSettings } from '../types';
import { UserRole } from '../types';
import { THEMES } from '../constants';
import { logActivity } from '../services/logService';

const DEFAULT_GLOBAL_SETTINGS: GlobalSystemSettings = {
  institutionalPassingGrade: 75,
  requireContentApproval: true,
  maintenanceMode: false,
  allowPublicRegistration: false,
  institutionName: 'Cavite State University - Bacoor',
  academicYear: '2023-2024'
};

interface SettingsProps {
  user: User;
  activeTheme: typeof THEMES[0];
  onThemeChange: (theme: typeof THEMES[0]) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, activeTheme, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState<'preferences' | 'institutional'>('preferences');
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalSystemSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sync Modal State
  const [syncStatus, setSyncStatus] = useState<{
    isOpen: boolean;
    step: number;
    message: string;
    progress: number;
    complete: boolean;
  }>({
    isOpen: false,
    step: 0,
    message: '',
    progress: 0,
    complete: false
  });
  
  // Local User State
  const [userState, setUserState] = useState<User>(user);
  
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false
  });

  // Access checks based on permissions rather than just role
  const canManageInstitutional = userPermissions.includes('system_settings');
  const canManageBackup = userPermissions.includes('manage_backup');

  useEffect(() => {
    // Load permissions for current role
    const savedRoles = localStorage.getItem('role_configs');
    if (savedRoles) {
      const configs = JSON.parse(savedRoles);
      const config = configs.find((c: any) => c.name.toLowerCase() === user.role.toLowerCase());
      if (config) {
        setUserPermissions(config.permissions);
      }
    } else {
      // Fallback to basic Admin/Faculty permissions if no config found
      if (user.role === UserRole.ADMIN) {
        setUserPermissions(['view_dashboard', 'system_settings', 'manage_backup', 'manage_curriculum', 'view_users']);
      }
    }

    // Load global settings
    const savedGlobal = localStorage.getItem('global_system_settings');
    if (savedGlobal) {
      setGlobalSettings(JSON.parse(savedGlobal));
    }

    // Refresh user from local storage to get newest settings
    const savedUsers = localStorage.getItem('registered_users');
    if (savedUsers) {
      const users: User[] = JSON.parse(savedUsers);
      const current = users.find(u => u.id === user.id);
      if (current) setUserState(current);
    }
  }, [user.id, user.role]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const handleSavePreferences = async () => {
    setIsProcessing(true);
    showToast("Updating user workspace...", "loading");
    await new Promise(r => setTimeout(r, 800));

    const savedUsers = localStorage.getItem('registered_users');
    if (savedUsers) {
      let users: User[] = JSON.parse(savedUsers);
      users = users.map(u => u.id === userState.id ? userState : u);
      localStorage.setItem('registered_users', JSON.stringify(users));
      localStorage.setItem('mastery_user', JSON.stringify(userState));
    }

    logActivity("Updated Settings", "User Preferences", userState.id);
    setIsProcessing(false);
    showToast("Workspace preferences updated.", "success");
  };

  const handleSaveGlobal = async () => {
    if (!canManageInstitutional) return;
    setIsProcessing(true);
    showToast("Applying institutional overrides...", "loading");
    await new Promise(r => setTimeout(r, 1000));

    localStorage.setItem('global_system_settings', JSON.stringify(globalSettings));
    logActivity("Modified Global Settings", "System Controls", "GLOBAL");
    
    setIsProcessing(false);
    showToast("Institutional controls updated.", "success");
  };

  const exportData = () => {
    if (!canManageBackup) {
      showToast("Access Denied: Backup permission required.", "error");
      return;
    }

    const getParsed = (key: string) => {
      const data = localStorage.getItem(key);
      try {
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return data;
      }
    };

    const backup = {
      users: getParsed('registered_users'),
      content: getParsed('system_content'),
      assessments: getParsed('system_assessments'),
      subjects: getParsed('psychology_core_subjects'),
      whitelist: getParsed('whitelist_entries'),
      global_settings: getParsed('global_system_settings'),
      version: '1.2.1',
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CVSU_Mastery_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast("System data exported successfully.", "success");
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManageBackup) {
      showToast("Access Denied: Restore permission required.", "error");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content);
        
        // Start Sync Process
        setSyncStatus({ isOpen: true, step: 1, message: 'Validating backup integrity...', progress: 10, complete: false });
        await new Promise(r => setTimeout(r, 1000));

        // Validation
        const requiredKeys = ['users', 'content', 'assessments', 'subjects', 'whitelist'];
        const missingKeys = requiredKeys.filter(key => !(key in backup));
        
        if (missingKeys.length > 0) {
          throw new Error(`Invalid backup format. Missing keys: ${missingKeys.join(', ')}`);
        }

        setSyncStatus(prev => ({ ...prev, step: 2, message: 'Reconstructing institutional database...', progress: 40 }));
        await new Promise(r => setTimeout(r, 1200));

        // Helper to stringify data safely
        const saveToStorage = (key: string, data: any) => {
          if (data === null || data === undefined) return;
          const value = typeof data === 'string' ? data : JSON.stringify(data);
          localStorage.setItem(key, value);
        };

        // Apply backup to localStorage
        saveToStorage('registered_users', backup.users);
        saveToStorage('system_content', backup.content);
        saveToStorage('system_assessments', backup.assessments);
        saveToStorage('psychology_core_subjects', backup.subjects);
        saveToStorage('whitelist_entries', backup.whitelist);
        saveToStorage('global_system_settings', backup.global_settings);

        setSyncStatus(prev => ({ ...prev, step: 3, message: 'Synchronizing session context...', progress: 80 }));
        await new Promise(r => setTimeout(r, 1000));

        // Update Component State directly to avoid reload
        if (backup.global_settings) {
          const gs = typeof backup.global_settings === 'string' ? JSON.parse(backup.global_settings) : backup.global_settings;
          setGlobalSettings(gs);
        }

        // Try to maintain current session
        let newUsers: User[] = [];
        if (backup.users) {
          newUsers = typeof backup.users === 'string' ? JSON.parse(backup.users) : backup.users;
          const refreshedUser = newUsers.find(u => u.email === user.email);
          if (refreshedUser) {
            setUserState(refreshedUser);
            localStorage.setItem('mastery_user', JSON.stringify(refreshedUser));
          } else {
            showToast("Active user not found in imported backup. Profile might be inconsistent.", "info");
          }
        }

        logActivity("System Restore", "Institutional Data Import (Atomic)", "SYSTEM");
        
        setSyncStatus(prev => ({ ...prev, step: 4, message: 'Synchronization Complete.', progress: 100, complete: true }));
        await new Promise(r => setTimeout(r, 500));
        
      } catch (err) {
        console.error("Import Error:", err);
        setSyncStatus({ isOpen: false, step: 0, message: '', progress: 0, complete: false });
        showToast(err instanceof Error ? err.message : "Failed to parse backup file.", "error");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'System Controls' }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground text-primary flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            System Controls
          </h2>
          <p className="text-muted-foreground">Manage your personalized workspace and institutional configurations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('preferences')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'preferences' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-card hover:bg-muted text-muted-foreground border border-transparent"
            )}
          >
            <Monitor className="h-4 w-4" /> User Preferences
          </button>
          {canManageInstitutional && (
            <button 
              onClick={() => setActiveTab('institutional')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2",
                activeTab === 'institutional' ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-card border-slate-100 hover:border-slate-300 text-slate-600"
              )}
            >
              <Shield className="h-4 w-4" /> Institutional Controls
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader className="border-b bg-muted/10">
                  <CardTitle>Interface Preferences</CardTitle>
                  <CardDescription>Customize how you interact with the Mastery Hub.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Monitor className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Compact Sidebar</p>
                          <p className="text-[11px] text-muted-foreground">Minimize the navigation menu by default.</p>
                        </div>
                      </div>
                      <button 
                        className={cn("w-12 h-6 rounded-full transition-all relative", userState.settings?.compactSidebar ? "bg-primary" : "bg-muted")}
                        onClick={() => setUserState({...userState, settings: { ...userState.settings, compactSidebar: !userState.settings?.compactSidebar }})}
                      >
                        <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", userState.settings?.compactSidebar ? "right-1" : "left-1")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Bell className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">In-App Notifications</p>
                          <p className="text-[11px] text-muted-foreground">Receive real-time alerts for content status and exam releases.</p>
                        </div>
                      </div>
                      <button 
                        className={cn("w-12 h-6 rounded-full transition-all relative", userState.settings?.notificationsEnabled ? "bg-primary" : "bg-muted")}
                        onClick={() => setUserState({...userState, settings: { ...userState.settings, notificationsEnabled: !userState.settings?.notificationsEnabled }})}
                      >
                        <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", userState.settings?.notificationsEnabled ? "right-1" : "left-1")} />
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/5 border-t py-4 justify-end">
                  <Button onClick={handleSavePreferences} disabled={isProcessing}>
                    <Save className="h-4 w-4 mr-2" /> Save Workspace
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="border-b bg-muted/10">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Visual Experience
                  </CardTitle>
                  <CardDescription>Select an institutional color palette that fits your working style.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {THEMES.map((theme) => {
                      const isActive = activeTheme.name === theme.name;
                      return (
                        <button
                          key={theme.name}
                          onClick={() => onThemeChange(theme)}
                          className={cn(
                            "group flex flex-col p-4 rounded-2xl border-2 transition-all relative overflow-hidden",
                            isActive ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-primary/30 bg-card"
                          )}
                        >
                          <div className={cn("h-8 w-full rounded-lg mb-3 shadow-inner", theme.primary)} />
                          <div className="flex items-center justify-between w-full">
                            <span className={cn("text-xs font-bold", isActive ? "text-primary" : "text-muted-foreground")}>
                              {theme.name}
                            </span>
                            {isActive && (
                              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          {isActive && (
                            <div className="absolute top-0 right-0 p-1">
                               <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'institutional' && canManageInstitutional && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader className="bg-slate-900 text-white rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" /> Academic Thresholds
                  </CardTitle>
                  <CardDescription className="text-slate-400">Manage global institutional standards for the program.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Target className="h-3 w-3 text-primary" /> Passing Grade Base (%)
                      </label>
                      <Input 
                        type="number"
                        value={globalSettings.institutionalPassingGrade}
                        onChange={e => setGlobalSettings({...globalSettings, institutionalPassingGrade: parseInt(e.target.value)})}
                      />
                      <p className="text-[9px] text-muted-foreground">This grade affects all performance analytics and dashboard gauges.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Workflow className="h-3 w-3 text-primary" /> Workflow Rule
                      </label>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                        <span className="text-xs font-bold">Mandatory Admin Review</span>
                        <button 
                          className={cn("w-10 h-5 rounded-full transition-all relative", globalSettings.requireContentApproval ? "bg-emerald-500" : "bg-slate-300")}
                          onClick={() => setGlobalSettings({...globalSettings, requireContentApproval: !globalSettings.requireContentApproval})}
                        >
                          <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", globalSettings.requireContentApproval ? "right-0.5" : "left-0.5")} />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b bg-muted/10">
                  <CardTitle className="text-lg flex items-center gap-2 text-rose-600">
                    <Database className="h-5 w-5" /> Operations & Maintenance
                  </CardTitle>
                  <CardDescription>Critical system-wide tools for administrators.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-rose-50 border border-rose-100">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shadow-inner", globalSettings.maintenanceMode ? "bg-rose-500 text-white" : "bg-white text-rose-500 border border-rose-100")}>
                        {globalSettings.maintenanceMode ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="font-bold text-rose-900">Maintenance Mode</p>
                        <p className="text-xs text-rose-700">Prevent non-admin access while performing updates.</p>
                      </div>
                    </div>
                    <Button 
                      variant={globalSettings.maintenanceMode ? "default" : "outline"}
                      className={cn(globalSettings.maintenanceMode ? "bg-rose-600 hover:bg-rose-700" : "border-rose-300 text-rose-700")}
                      onClick={() => setGlobalSettings({...globalSettings, maintenanceMode: !globalSettings.maintenanceMode})}
                    >
                      {globalSettings.maintenanceMode ? "Deactivate Mode" : "Activate Mode"}
                    </Button>
                  </div>

                  {canManageBackup && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-blue-50 border border-blue-100 gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border border-blue-100 text-blue-600">
                            <Database className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-blue-900">System Synchronization</p>
                            <p className="text-xs text-blue-700">Backup your data or restore from a previous institutional snapshot.</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button 
                            onClick={exportData} 
                            variant="outline" 
                            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                            disabled={isProcessing}
                          >
                            <Download className="h-4 w-4 mr-2" /> Export JSON
                          </Button>
                          <div className="flex-1 relative">
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept=".json" 
                              onChange={importData} 
                            />
                            <Button 
                              variant="outline" 
                              className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isProcessing}
                            >
                              <FileUp className="h-4 w-4 mr-2" /> Import JSON
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                         <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                         <div className="space-y-1">
                          <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                            Caution: Atomic data synchronization will rewrite your local system state.
                          </p>
                          <p className="text-[10px] text-amber-700 leading-relaxed">
                            The system will update all components in real-time. No page reload is required, but current session validity will be verified.
                          </p>
                         </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/10 border-t py-4 justify-end">
                   <Button onClick={handleSaveGlobal} disabled={isProcessing}>
                      <Save className="h-4 w-4 mr-2" /> Apply Institutional Changes
                   </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Sync Progress Modal */}
      <Dialog
        isOpen={syncStatus.isOpen}
        onClose={() => syncStatus.complete && setSyncStatus({ ...syncStatus, isOpen: false })}
        title="System Synchronization"
      >
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500",
              syncStatus.complete ? "bg-emerald-100 text-emerald-600 scale-110" : "bg-primary/10 text-primary animate-pulse"
            )}>
              {syncStatus.complete ? <CheckCircle2 className="h-10 w-10" /> : <RefreshCw className="h-10 w-10 animate-spin" />}
            </div>
            <div>
              <h3 className="text-xl font-bold">{syncStatus.complete ? "Reconstruction Successful" : "Synchronizing Hub Data"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{syncStatus.message}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${syncStatus.progress}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
               <span>Step {syncStatus.step} of 4</span>
               <span>{syncStatus.progress}% Complete</span>
            </div>
          </div>

          <div className="space-y-3">
             {[
               { id: 1, label: "Validate backup headers" },
               { id: 2, label: "Overwrite local storage partitions" },
               { id: 3, label: "Synchronize reactive app state" },
               { id: 4, label: "Finalize atomic commit" }
             ].map(step => (
               <div key={step.id} className="flex items-center gap-3">
                 <div className={cn(
                   "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
                   syncStatus.step > step.id || syncStatus.complete ? "bg-emerald-500 border-emerald-500 text-white" : 
                   syncStatus.step === step.id ? "bg-primary border-primary text-white" : "bg-card border-muted text-muted-foreground"
                 )}>
                   {syncStatus.step > step.id || syncStatus.complete ? <Check className="h-3 w-3" /> : step.id}
                 </div>
                 <span className={cn(
                   "text-xs font-medium",
                   syncStatus.step >= step.id ? "text-foreground" : "text-muted-foreground"
                 )}>
                   {step.label}
                 </span>
               </div>
             ))}
          </div>

          {syncStatus.complete && (
            <Button className="w-full mt-4" onClick={() => setSyncStatus({ ...syncStatus, isOpen: false })}>
              Return to Hub
            </Button>
          )}
        </div>
      </Dialog>

      <Toast 
        message={toast.message} type={toast.type} isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default Settings;
