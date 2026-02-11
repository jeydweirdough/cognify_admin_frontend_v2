
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, User, Bell, Settings, ChevronDown } from 'lucide-react';
import { NAVIGATION_ITEMS, PERMISSION_MODULES, THEMES } from '../constants';
import { UserRole } from '../types';
import { Button } from './ui/Button';
import { cn } from './ui/Button';
import { 
  DropdownMenu, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuLabel 
} from './ui/DropdownMenu';
import { Avatar } from './ui/Avatar';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string; role: UserRole; email: string; id: string };
  onLogout: () => void;
  activeTheme: typeof THEMES[0];
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  useEffect(() => {
    const savedRoles = localStorage.getItem('role_configs');
    if (savedRoles) {
      const configs = JSON.parse(savedRoles);
      const userRoleConfig = configs.find((c: any) => c.name.toUpperCase() === user.role.toUpperCase());
      if (userRoleConfig) {
        setRolePermissions(userRoleConfig.permissions);
      }
    } else {
      // Fallback defaults if no config exists in local storage
      if (user.role === UserRole.ADMIN) {
        // Admin gets everything
        setRolePermissions(PERMISSION_MODULES.flatMap(m => m.actions.map(a => a.id)));
      } else if (user.role === UserRole.FACULTY) {
        setRolePermissions([
          'view_dashboard', 
          'view_subjects', 'edit_subjects',
          'view_content', 'create_content', 'edit_content', 
          'view_assessments', 'create_assessments', 
          'view_analytics'
        ]);
      } else {
        // Student
        setRolePermissions(['view_dashboard', 'view_analytics']);
      }
    }
  }, [user.role, location.pathname]);

  const filteredNavItems = NAVIGATION_ITEMS.filter(item => 
    rolePermissions.includes(item.requiredPermission)
  );

  const handleLogoutClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsLogoutModalOpen(true);
  };

  const isItemActive = (itemId: string) => {
    const normalizedCurrent = currentPath === '/' || currentPath === '' ? '/dashboard' : currentPath;
    const itemPath = '/' + itemId;
    if (itemId === 'dashboard') {
      return normalizedCurrent === '/dashboard';
    }
    return normalizedCurrent.startsWith(itemPath);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className={cn(
        "z-30 h-full border-r bg-card transition-all duration-300 ease-in-out flex flex-col shadow-sm",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b shrink-0">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                 <span className="text-primary-foreground font-bold">C</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Mastery HUB</span>
            </div>
          ) : (
            <div className="h-8 w-8 mx-auto rounded bg-primary flex items-center justify-center">
               <span className="text-primary-foreground font-bold">C</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const active = isItemActive(item.id);
            return (
              <Button
                key={item.id}
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  active && "bg-accent/80 text-primary font-bold shadow-sm"
                )}
                onClick={() => navigate(`/${item.id}`)}
              >
                <span className={cn("mr-4", active ? "text-primary" : "text-muted-foreground")}>
                  {item.icon}
                </span>
                {isSidebarOpen && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-card shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
             <span className="hidden md:block text-sm font-medium text-muted-foreground capitalize">
              {currentPath === '/' ? 'Dashboard' : currentPath.split('/')[1].split('-').join(' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            <DropdownMenu
              trigger={
                <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded-lg transition-colors">
                  <Avatar fallback={user.name.charAt(0)} />
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold leading-none">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{user.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              }
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/users/edit/${user.id}`)}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogoutClick}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-6 bg-muted/20">
          {children}
        </main>
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of the CVSU-B Mastery Hub? Any unsaved changes may be lost."
        confirmText="Log Out"
        variant="logout"
      />
    </div>
  );
};

export default Layout;
