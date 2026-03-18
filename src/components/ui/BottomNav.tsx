import { Home, FileText, Search, MessageSquare, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { name: '首页', icon: Home, path: '/' },
    { name: '病历', icon: FileText, path: '/records' },
  ];

  const navItemsRight = [
    { name: '报告', icon: MessageSquare, path: '/report' },
    { name: '我的', icon: User, path: '/profile' },
  ];

  return (
    <footer className="bg-white border-t border-slate-100 fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 group w-16",
                isActive ? "text-blue-600" : "text-slate-400"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive ? "fill-blue-600/20" : "")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* Center Search Button */}
        <div className="-mt-8 relative z-10 w-16 flex justify-center">
          <Link
            to="/search"
            className="bg-blue-600 w-12 h-12 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center text-white ring-4 ring-slate-50 active:scale-90 transition-transform"
          >
            <Search className="h-6 w-6" />
          </Link>
        </div>

        {navItemsRight.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 group w-16",
                isActive ? "text-blue-600" : "text-slate-400"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive ? "fill-blue-600/20" : "")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
