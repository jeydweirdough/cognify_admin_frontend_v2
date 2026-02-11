
import React, { useState, useEffect } from 'react';
import { Plus, Check, Save, Loader2, ChevronDown, ShieldAlert, Key, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Dialog } from '../components/ui/Dialog';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';
import { DEFAULT_PERMISSIONS } from '../constants';
import { cn } from '../components/ui/Button';

const INITIAL_ROLES = [
  { name: 'Admin', permissions: DEFAULT_PERMISSIONS.map(p => p.id) },
  { name: 'Faculty', permissions: ['view_dashboard', 'manage_curriculum', 'manage_content', 'create_exams', 'view_analytics'] },
  { name: 'Student', permissions: ['view_dashboard', 'view_analytics'] },
];

const RoleAccess: React.FC = () => {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  useEffect(() => {
    const savedRoles = localStorage.getItem('role_configs');
    if (savedRoles) {
      setRoles(JSON.parse(savedRoles));
    }
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const togglePermission = (permId: string) => {
    const updatedRoles = [...roles];
    const role = { ...updatedRoles[selectedRoleIndex] };
    if (role.permissions.includes(permId)) {
      role.permissions = role.permissions.filter(p => p !== permId);
    } else {
      role.permissions = [...role.permissions, permId];
    }
    updatedRoles[selectedRoleIndex] = role;
    setRoles(updatedRoles);
  };

  const handleSave = async () => {
    setSavingIndex(selectedRoleIndex);
    showToast(`Updating ${roles[selectedRoleIndex].name} permissions...`, 'loading');

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      localStorage.setItem('role_configs', JSON.stringify(roles));
      showToast(`${roles[selectedRoleIndex].name} permissions updated successfully!`, 'success');
    } catch (error) {
      showToast(`Failed to update ${roles[selectedRoleIndex].name} permissions.`, 'error');
    } finally {
      setSavingIndex(null);
    }
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    const newRole = { name: newRoleName, permissions: [] };
    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    localStorage.setItem('role_configs', JSON.stringify(updatedRoles));
    setNewRoleName('');
    setIsAddRoleModalOpen(false);
    setSelectedRoleIndex(updatedRoles.length - 1);
    showToast(`Custom role "${newRoleName}" created.`, 'success');
  };

  const getPermissionIcon = (id: string) => {
    if (id === 'manage_backup') return <Database className="h-4 w-4 text-rose-500" />;
    if (id === 'system_settings') return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    return <Key className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: 'User Management', path: '/users' },
        { label: 'Role Access Control' }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Role Access Control</h2>
          <p className="text-muted-foreground">Manage permissions for institutional roles. Ensure sensitive tasks are restricted.</p>
        </div>
        <Button onClick={() => setIsAddRoleModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Role
        </Button>
      </div>

      <Card className="border-primary/20 shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Select Role to Configure</CardTitle>
              <CardDescription>Changes apply only to the selected role.</CardDescription>
            </div>
            <div className="relative">
              <select 
                className="appearance-none h-10 w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                value={selectedRoleIndex}
                onChange={(e) => setSelectedRoleIndex(parseInt(e.target.value))}
              >
                {roles.map((role, idx) => (
                  <option key={role.name} value={idx}>{role.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {DEFAULT_PERMISSIONS.map((perm) => {
              const isActive = roles[selectedRoleIndex].permissions.includes(perm.id);
              const isHighSecurity = ['manage_backup', 'system_settings', 'view_users', 'edit_users'].includes(perm.id);
              
              return (
                <div 
                  key={perm.id} 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                    isActive ? (isHighSecurity ? "bg-rose-50 border-rose-200" : "bg-primary/5 border-primary/30") : "bg-card hover:bg-muted/50 border-border"
                  )}
                  onClick={() => togglePermission(perm.id)}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {getPermissionIcon(perm.id)}
                      <p className={cn("text-sm font-semibold", isHighSecurity && isActive && "text-rose-900")}>{perm.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{perm.description}</p>
                  </div>
                  <div className={cn(
                    "h-6 w-6 rounded-full border flex items-center justify-center transition-all",
                    isActive ? (isHighSecurity ? "bg-rose-600 border-rose-600" : "bg-primary border-primary") : "border-slate-300 group-hover:border-primary"
                  )}>
                    {isActive && <Check className="h-4 w-4 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <div className="p-6 pt-0 border-t mt-6 flex justify-end">
          <Button 
            className="w-full md:w-auto min-w-[150px]" 
            onClick={handleSave}
            disabled={savingIndex !== null}
          >
            {savingIndex !== null ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Configuration</>
            )}
          </Button>
        </div>
      </Card>

      <Dialog 
        isOpen={isAddRoleModalOpen} 
        onClose={() => setIsAddRoleModalOpen(false)} 
        title="Create New Custom Role"
        description="A new role will be added to the dropdown for configuration."
      >
        <form onSubmit={handleAddRole} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role Name</label>
            <Input 
              placeholder="e.g. Department Head, Registrar" 
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              required 
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsAddRoleModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Role</Button>
          </div>
        </form>
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

export default RoleAccess;
