import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { LogOut, GraduationCap, LayoutDashboard, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const NavContent = () => (
    <div className="flex flex-col gap-2">
      <div className="px-2 mb-6 flex items-center gap-2 text-primary font-bold text-xl">
        <GraduationCap className="h-8 w-8" />
        <span>LearnLoop</span>
      </div>
      
      <Link href="/">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${location === "/" ? "bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25" : "text-slate-600 hover:bg-slate-100"}`}>
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </div>
      </Link>

      {/* Add more nav items here if needed */}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-100 bg-white p-6 fixed h-full z-10">
        <NavContent />
        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium truncate text-sm">{user.username}</span>
              <span className="text-xs text-slate-400 capitalize">{user.role}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-100 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-bold">
          <GraduationCap className="h-6 w-6" />
          <span>LearnLoop</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-6">
            <NavContent />
            <div className="mt-auto pt-6 border-t border-slate-100 absolute bottom-6 w-[calc(100%-3rem)]">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-[100vw] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
