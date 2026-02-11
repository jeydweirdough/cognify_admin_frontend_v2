
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Shield, 
  User as UserIcon, 
  Power, 
  Key,
  Filter,
  Settings,
  Edit,
  Loader2,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { UserRole, UserStatus } from '../types';
import type { User } from '../types';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Dialog } from '../components/ui/Dialog';
import { Toast } from '../components/ui/Toast';
import type { ToastType } from '../components/ui/Toast';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { logActivity } from '../services/logService';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  
  // New User Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.STUDENT as UserRole,
    studentNumber: '', // Reused for Faculty ID
    department: ''     // Reused for Program
  });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('registered_users');
    if (saved) {
      setUsers(JSON.parse(saved));
    }
  }, []);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const syncUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('registered_users', JSON.stringify(updatedUsers));
  };

  const toggleUserStatus = async (id: string) => {
    setIsProcessing(true);
    showToast("Updating user status...", "loading");
    await new Promise(resolve => setTimeout(resolve, 800));

    const updated = users.map(u => {
      if (u.id === id) {
        const newStatus = u.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
        showToast(`User ${u.name} is now ${newStatus.toLowerCase()}.`, "success");
        return { ...u, status: newStatus };
      }
      return u;
    });
    syncUsers(updated);
    setIsProcessing(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsProcessing(true);
    showToast("Permanently removing user account...", "loading");
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updated = users.filter(u => u.id !== userToDelete.id);
    syncUsers(updated);
    
    logActivity("Deleted User Account", userToDelete.name, userToDelete.id);
    
    setIsProcessing(false);
    setUserToDelete(null);
    showToast(`Account for ${userToDelete.name} has been removed.`, "success");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    setIsProcessing(true);
    showToast("Updating password...", "loading");
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updated = users.map(u => {
      if (u.id === selectedUser.id) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    syncUsers(updated);
    setIsProcessing(false);
    setIsPassModalOpen(false);
    setNewPassword('');
    showToast(`Password updated for ${selectedUser.name}.`, "success");
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    // Role specific validation
    if (formData.role === UserRole.STUDENT) {
      if (!formData.studentNumber || !formData.department) {
        showToast("Student Number and Program are required for students.", "error");
        return;
      }
    } else if (formData.role === UserRole.FACULTY) {
      if (!formData.studentNumber || !formData.department) {
        showToast("Faculty ID and Department are required for faculty.", "error");
        return;
      }
    }

    setIsProcessing(true);
    showToast("Registering user...", "loading");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: UserStatus.ACTIVE,
      password: formData.password,
      lastLogin: 'Never',
      studentNumber: formData.role !== UserRole.ADMIN ? formData.studentNumber : undefined,
      department: formData.role !== UserRole.ADMIN ? formData.department : undefined
    };

    const updatedList = [...users, newUser];
    syncUsers(updatedList);
    
    setIsProcessing(false);
    setIsAddModalOpen(false);
    setFormData({ name: '', email: '', password: '', role: UserRole.STUDENT, studentNumber: '', department: '' });
    showToast('User added successfully!', "success");
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getRoleBadge = (role: UserRole) => {
    switch(role) {
      case UserRole.ADMIN: return <Badge className="bg-rose-500 hover:bg-rose-600"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>;
      case UserRole.FACULTY: return <Badge variant="secondary"><UserIcon className="w-3 h-3 mr-1" /> Faculty</Badge>;
      default: return <Badge variant="outline">Student</Badge>;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch(status) {
      case UserStatus.ACTIVE: return <Badge className="bg-emerald-500">Active</Badge>;
      case UserStatus.INACTIVE: return <Badge variant="destructive">Inactive</Badge>;
      case UserStatus.PENDING: return <Badge className="bg-amber-500">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'User Management' }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage institutional users and account security. Double-click a row to edit.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/users/roles')}>
            <Settings className="mr-2 h-4 w-4" /> Role Access Control
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Registered Accounts</CardTitle>
              <CardDescription>View and manage {users.length} verified users.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search name or email..." 
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="cursor-pointer"
                  onDoubleClick={() => navigate(`/users/edit/${user.id}`)}
                  title="Double-click to edit"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{user.lastLogin || 'Never'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); toggleUserStatus(user.id); }}
                        disabled={isProcessing}
                        title={user.status === UserStatus.ACTIVE ? "Deactivate User" : "Activate User"}
                      >
                        <Power className={cn("h-4 w-4", user.status === UserStatus.ACTIVE ? "text-rose-500" : "text-emerald-500")} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setIsPassModalOpen(true); }}
                        title="Change Password"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={(e) => { e.stopPropagation(); navigate(`/users/edit/${user.id}`); }}
                        title="Edit Details"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); setUserToDelete(user); }}
                        disabled={isProcessing}
                        title="Remove User Account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No users found matching your search.
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
            totalItems={filteredUsers.length}
          />
        </CardContent>
      </Card>

      {/* Confirmation for Deletion */}
      <ConfirmationModal
        isOpen={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Permanently Delete User"
        message={`Are you sure you want to remove the account for ${userToDelete?.name}? This action cannot be undone and will revoke all access for this user.`}
        confirmText="Remove Account"
        variant="danger"
      />

      {/* Change Password Modal */}
      <Dialog
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        title="Admin: Change Password"
        description={`Set a new password for ${selectedUser?.name}`}
      >
        <form className="space-y-4" onSubmit={handleChangePassword}>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <Input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter secure password"
              required 
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsPassModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add User Modal */}
      <Dialog 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Register New User"
        description="Fill in the details below to add a new user to the system."
      >
        <form className="space-y-4" onSubmit={handleAddUser}>
          <div className="space-y-2">
            <label className="text-sm font-medium">System Role</label>
            <select 
              disabled={isProcessing} 
              className="flex h-10 w-full rounded-md border-2 border-primary/20 bg-background px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
            >
              <option value={UserRole.STUDENT}>Student</option>
              <option value={UserRole.FACULTY}>Faculty</option>
              <option value={UserRole.ADMIN}>Administrator</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                placeholder="John Doe" 
                required 
                disabled={isProcessing} 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Institutional Email</label>
              <Input 
                type="email" 
                placeholder="john.doe@cvsu.edu.ph" 
                required 
                disabled={isProcessing} 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input 
                type={showAddPassword ? "text" : "password"} 
                placeholder="Enter password" 
                required 
                disabled={isProcessing} 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAddPassword(!showAddPassword)}
              >
                {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role-Specific Fields */}
          {formData.role !== UserRole.ADMIN && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  {formData.role === UserRole.STUDENT ? <GraduationCap className="w-4 h-4 text-primary" /> : <Briefcase className="w-4 h-4 text-primary" />}
                  {formData.role === UserRole.STUDENT ? "Student Number" : "Faculty ID"}
                </label>
                <Input 
                  placeholder={formData.role === UserRole.STUDENT ? "202110123" : "F-2024-001"} 
                  required
                  disabled={isProcessing} 
                  value={formData.studentNumber}
                  onChange={(e) => setFormData({...formData, studentNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {formData.role === UserRole.STUDENT ? "Degree Program" : "Department"}
                </label>
                <Input 
                  placeholder={formData.role === UserRole.STUDENT ? "e.g. BS Psychology" : "e.g. Social Sciences"} 
                  required
                  disabled={isProcessing} 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button type="submit" disabled={isProcessing} className="min-w-[120px]">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Register User'}
            </Button>
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

export default Users;
