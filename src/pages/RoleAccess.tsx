
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Check, 
  Save, 
  Loader2, 
  Trash2,
  Edit2,
  LayoutGrid,
  Users,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Dialog } from '../components/ui/Dialog';
import { Toast } from '../components/ui/Toast';
import type { ToastType } from '../components/ui/Toast';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { PERMISSION_MODULES } from '../constants';
import { cn } from '../components/ui/Button';

const INITIAL_ROLES = [
  { 
    name: 'Admin', 
    permissions: PERMISSION_MODULES.flatMap(m => m.actions.map(a => a.id)),
    isSystem: true 
  },
  { 
    name: 'Faculty', 
    permissions: [
      'view_dashboard', 
      'view_subjects', 'edit_subjects',
      'view_content', 'create_content', 'edit_content',
      'view_assessments', 'create_assessments', 'edit_assessments',
      'view_analytics', 'view_student_analytics'
    ],
    isSystem: true
  },
  { 
    name: 'Student', 
    permissions: [
      'view_dashboard', 
      'view_analytics'
    ],
    isSystem: true 
  },
];

const RoleAccess: React.FC = () => {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  
  const [newRoleName, setNewRoleName] = useState('');
  const [renameRoleName, setRenameRoleName] = useState('');
  const [saving, setSaving] = useState(false);
  
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

  const toggleModulePermissions = (moduleActions: string[], shouldEnable: boolean) => {
    const updatedRoles = [...roles];
    const role = { ...updatedRoles[selectedRoleIndex] };
    
    if (shouldEnable) {
      // Add all missing permissions
      const toAdd = moduleActions.filter(p => !role.permissions.includes(p));
      role.permissions = [...role.permissions, ...toAdd];
    } else {
      // Remove all permissions
      role.permissions = role.permissions.filter(p => !moduleActions.includes(p));
    }
    
    updatedRoles[selectedRoleIndex] = role;
    setRoles(updatedRoles);
  };

  const handleSave = async () => {
    setSaving(true);
    showToast(`Saving ${roles[selectedRoleIndex].name} configuration...`, 'loading');

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      localStorage.setItem('role_configs', JSON.stringify(roles));
      showToast('Role configuration saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    
    const newRole = { name: newRoleName.trim(), permissions: [], isSystem: false };
    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    localStorage.setItem('role_configs', JSON.stringify(updatedRoles));
    
    setNewRoleName('');
    setIsAddRoleModalOpen(false);
    setSelectedRoleIndex(updatedRoles.length - 1);
    showToast(`Role "${newRoleName}" created.`, 'success');
  };

  const handleRenameRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameRoleName.trim()) return;

    const updatedRoles = [...roles];
    updatedRoles[selectedRoleIndex] = { ...updatedRoles[selectedRoleIndex], name: renameRoleName.trim() };
    setRoles(updatedRoles);
    localStorage.setItem('role_configs', JSON.stringify(updatedRoles));

    setIsRenameModalOpen(false);
    showToast('Role renamed successfully.', 'success');
  };

  const handleDeleteRole = () => {
    if (roleToDelete === null) return;
    
    const updatedRoles = roles.filter((_, idx) => idx !== roleToDelete);
    setRoles(updatedRoles);
    localStorage.setItem('role_configs', JSON.stringify(updatedRoles));
    
    // If we deleted the selected role, reset selection
    if (selectedRoleIndex === roleToDelete) {
      setSelectedRoleIndex(0);
    } else if (selectedRoleIndex > roleToDelete) {
      setSelectedRoleIndex(selectedRoleIndex - 1);
    }
    
    setRoleToDelete(null);
    showToast('Role deleted.', 'success');
  };

  const selectedRole = roles[selectedRoleIndex];

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      <Breadcrumbs items={[
        { label: 'User Management', path: '/users' },
        { label: 'Role Access Control' }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Role Access Control</h2>
          <p className="text-muted-foreground">Define granular permissions and CRUD access for system roles.</p>
        </div>
        <Button onClick={() => setIsAddRoleModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Role
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)]">
        {/* Roles Sidebar */}
        <Card className="lg:w-64 flex-shrink-0 flex flex-col overflow-hidden h-full shadow-md border-primary/10">
          <CardHeader className="bg-muted/30 border-b py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> System Roles
            </CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {roles.map((role, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedRoleIndex(idx)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all text-left",
                  selectedRoleIndex === idx 
                    ? "bg-primary text-white shadow-md" 
                    : "hover:bg-muted text-slate-600"
                )}
              >
                <div className="flex items-center gap-2">
                  {role.isSystem && <Lock className="h-3 w-3 opacity-70" />}
                  <span className="truncate">{role.name}</span>
                </div>
                {selectedRoleIndex === idx && <div className="h-2 w-2 bg-white rounded-full" />}
              </button>
            ))}
          </div>
        </Card>

        {/* Permissions Matrix */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Card className="flex-1 flex flex-col shadow-md border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/10 border-b py-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{selectedRole.name} Permissions</CardTitle>
                    {!selectedRole.isSystem && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRenameRoleName(selectedRole.name); setIsRenameModalOpen(true); }}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setRoleToDelete(selectedRoleIndex)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    {selectedRole.isSystem && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase font-bold">System Protected</span>}
                  </div>
                  <CardDescription>Configure module access levels.</CardDescription>
                </div>
                <Button onClick={handleSave} disabled={saving} className="shadow-sm">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              <div className="grid grid-cols-1 gap-6">
                {PERMISSION_MODULES.map((module) => {
                  const allActions = module.actions.map(a => a.id);
                  // const activeCount = module.actions.filter(a => selectedRole.permissions.includes(a.id)).length;
                  // const isAllChecked = activeCount === module.actions.length;
                  // const isIndeterminate = activeCount > 0 && !isAllChecked;

                  return (
                    <div key={module.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-muted/20 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="h-4 w-4 text-slate-500" />
                          <h4 className="font-bold text-slate-800 text-sm">{module.name}</h4>
                          <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">- {module.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-xs font-bold text-primary hover:underline px-2"
                            onClick={() => toggleModulePermissions(allActions, true)}
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button 
                            className="text-xs font-bold text-muted-foreground hover:text-foreground px-2"
                            onClick={() => toggleModulePermissions(allActions, false)}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {module.actions.map((action) => {
                          const isActive = selectedRole.permissions.includes(action.id);
                          return (
                            <div 
                              key={action.id}
                              onClick={() => togglePermission(action.id)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                                isActive 
                                  ? "bg-primary/5 border-primary/30" 
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              )}
                            >
                              <div className={cn(
                                "h-5 w-5 rounded border flex items-center justify-center transition-colors shrink-0",
                                isActive ? "bg-primary border-primary" : "bg-white border-slate-300"
                              )}>
                                {isActive && <Check className="h-3.5 w-3.5 text-white" />}
                              </div>
                              <span className={cn("text-xs font-medium select-none", isActive ? "text-primary" : "text-slate-600")}>
                                {action.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Role Modal */}
      <Dialog 
        isOpen={isAddRoleModalOpen} 
        onClose={() => setIsAddRoleModalOpen(false)} 
        title="Create Custom Role"
        description="Define a new role identifier. You can configure permissions after creation."
      >
        <form onSubmit={handleAddRole} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role Name</label>
            <Input 
              placeholder="e.g. Registrar, Department Head" 
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

      {/* Rename Role Modal */}
      <Dialog 
        isOpen={isRenameModalOpen} 
        onClose={() => setIsRenameModalOpen(false)} 
        title="Rename Role"
      >
        <form onSubmit={handleRenameRole} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Role Name</label>
            <Input 
              value={renameRoleName}
              onChange={(e) => setRenameRoleName(e.target.value)}
              required 
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Name</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmationModal
        isOpen={roleToDelete !== null}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message="Are you sure you want to delete this role? Users assigned to this role may lose access."
        confirmText="Delete Role"
        variant="danger"
      />

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
