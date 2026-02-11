
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, User as UserIcon, Mail, Building, ArrowLeft, Key, GraduationCap, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
// Fix: Added missing 'cn' import from Button component to resolve type error on line 178
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { UserRole } from '../types';
import type { User } from '../types';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';

const EditUser: React.FC<{ loggedInUser: User }> = ({ loggedInUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  const isAdmin = loggedInUser.role === UserRole.ADMIN;
  const isSelf = loggedInUser.id === id;

  useEffect(() => {
    const saved = localStorage.getItem('registered_users');
    if (saved) {
      const users: User[] = JSON.parse(saved);
      const found = users.find(u => u.id === id);
      if (found) {
        setUserData(found);
      }
    }
  }, [id]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    const saved = localStorage.getItem('registered_users');
    if (saved) {
      let users: User[] = JSON.parse(saved);
      const updatedUser = { ...userData, password: newPassword || userData.password };
      users = users.map(u => u.id === userData.id ? updatedUser : u);
      localStorage.setItem('registered_users', JSON.stringify(users));
      
      // If editing self, update mastery_user too
      if (isSelf) {
        localStorage.setItem('mastery_user', JSON.stringify(updatedUser));
      }

      showToast('Profile updated successfully!', 'success');
      
      // FIXED: Role-based redirection logic
      const targetPath = isAdmin ? '/users' : '/dashboard';
      setTimeout(() => navigate(targetPath), 1500);
    }
  };

  const goBack = () => {
    const targetPath = isAdmin ? '/users' : '/dashboard';
    navigate(targetPath);
  };

  if (!userData) return <div className="p-8 text-center">Loading user profile...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        isAdmin ? { label: 'User Management', path: '/users' } : { label: 'My Dashboard', path: '/dashboard' },
        { label: isSelf ? 'My Profile' : `Edit ${userData.name}` }
      ]} />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {isSelf ? 'My Account Settings' : 'Institutional Profile Edit'}
          </h2>
          <p className="text-muted-foreground">
            {isSelf ? 'Manage your personal credentials and system profile.' : `Modify details for faculty member ${userData.name}.`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <UserIcon className="h-5 w-5" /> Institutional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input 
                  value={userData.name} 
                  onChange={e => setUserData({...userData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Institutional Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9 bg-muted cursor-not-allowed"
                    value={userData.email} 
                    readOnly
                    title="Email is managed by the institution"
                  />
                </div>
              </div>

              {/* Conditional Fields for Faculty/Student */}
              {userData.role !== UserRole.ADMIN && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      {userData.role === UserRole.STUDENT ? <GraduationCap className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                      {userData.role === UserRole.STUDENT ? 'Student Number' : 'Faculty ID'}
                    </label>
                    <Input 
                      value={userData.studentNumber || ''} 
                      onChange={e => setUserData({...userData, studentNumber: e.target.value})}
                      placeholder={userData.role === UserRole.STUDENT ? "202110xxx" : "F-2024-xxx"}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {userData.role === UserRole.STUDENT ? 'Degree Program' : 'Department/Academic Area'}
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9"
                        value={userData.department || ''} 
                        onChange={e => setUserData({...userData, department: e.target.value})}
                        placeholder="e.g. BS Psychology"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-md">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" /> Security & Access
              </CardTitle>
              <CardDescription>Keep your account secure by updating your password regularly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Password</label>
                <Input 
                  type="password"
                  placeholder="Enter new password (leave blank to keep current)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">System Role</label>
                <select 
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all",
                    !isAdmin && "bg-muted cursor-not-allowed opacity-70"
                  )}
                  value={userData.role}
                  onChange={e => setUserData({...userData, role: e.target.value as UserRole})}
                  disabled={!isAdmin} // SECURITY: Non-admins cannot promote themselves
                >
                  <option value={UserRole.STUDENT}>Student</option>
                  <option value={UserRole.FACULTY}>Faculty</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
                {!isAdmin && <p className="text-[10px] text-muted-foreground italic">Only System Administrators can modify roles.</p>}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t py-3 text-xs text-muted-foreground">
              Last System Login activity recorded: <span className="font-bold text-foreground">{userData.lastLogin || 'No record'}</span>
            </CardFooter>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" type="button" onClick={goBack}>Discard Changes</Button>
          <Button type="submit" className="min-w-[140px]">
            <Save className="mr-2 h-4 w-4" /> Update Profile
          </Button>
        </div>
      </form>
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default EditUser;
