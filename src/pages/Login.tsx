
import React, { useState, useEffect } from 'react';
import { Lock, Mail, ChevronRight, ShieldCheck } from 'lucide-react';
import { UserRole, UserStatus } from '../types';
import type { User } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import type { ToastType } from '../components/ui/Toast';
import { Toast } from '../components/ui/Toast';

interface LoginProps {
  onLogin: (user: any) => void;
}

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'ADMIN', email: 'admin@cvsu.edu.ph', password: 'password123', role: UserRole.ADMIN, status: UserStatus.ACTIVE, lastLogin: 'Never' },
  { id: '2', name: 'PROFESSOR', email: 'faculty@cvsu.edu.ph', password: 'password123', role: UserRole.FACULTY, status: UserStatus.ACTIVE, lastLogin: 'Never' },
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('registered_users');
    if (!saved) {
      localStorage.setItem('registered_users', JSON.stringify(DEFAULT_USERS));
    }
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const savedUsers: User[] = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const userIndex = savedUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

      if (userIndex !== -1) {
        const foundUser = savedUsers[userIndex];
        if (foundUser.status !== UserStatus.ACTIVE) {
          showToast("Account is inactive. Please contact your administrator.", "error");
        } else {
          // Record Last Login timestamp
          const now = new Date().toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          const updatedUser = { ...foundUser, lastLogin: now };
          savedUsers[userIndex] = updatedUser;
          
          // Update both lists
          localStorage.setItem('registered_users', JSON.stringify(savedUsers));
          onLogin(updatedUser);
        }
      } else {
        showToast("Invalid credentials or account not registered.", "error");
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <ShieldCheck className="mr-2 h-6 w-6" />
          CVSU-B Mastery Admin
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Mastery is not a destination, but a continuous journey of learning and assessment."
            </p>
            <footer className="text-sm">Board Preparation Division</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Login to your account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your institutional credentials below
            </p>
          </div>
          
          <Card className="shadow-xl">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-lg">Secure Access</CardTitle>
                <CardDescription>Only registered and active accounts can enter.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="name@cvsu.edu.ph"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In'}
                  {!loading && <ChevronRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <p className="px-8 text-center text-sm text-muted-foreground">
            Locked out? Please reach out to the <span className="font-semibold text-primary">Administration</span>.
          </p>
        </div>
      </div>
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default Login;
