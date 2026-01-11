import { useState } from "react";
import { useLogin, useRegister, useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, BookOpen, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const { user } = useUser();
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: register, isPending: isRegisterPending } = useRegister();
  
  if (user) {
    setLocation("/");
    return null;
  }

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", password: "", name: "", role: "student" as "student" | "teacher" });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register(registerData);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8f9fc]">
      {/* Left side - Hero */}
      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-indigo-600 opacity-90" />
        <div className="relative z-10 text-white max-w-lg">
          <div className="mb-8 p-4 bg-white/10 w-fit rounded-2xl backdrop-blur-sm">
            <GraduationCap className="h-16 w-16" />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight font-display">
            Learn, Grow, and Succeed Together.
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed font-light">
            An interactive learning platform where students can master concepts and teachers can track progress in real-time. Join the future of education.
          </p>
          
          <div className="mt-12 flex gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-primary bg-white/20 flex items-center justify-center text-xs backdrop-blur-md">
                  🎓
                </div>
              ))}
            </div>
            <p className="flex items-center text-sm font-medium">Join 2,000+ students today</p>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      </div>

      {/* Right side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-4 text-primary">
              <GraduationCap className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Welcome back!</h2>
            <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-none shadow-none bg-transparent">
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4 p-0">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        placeholder="Enter your username" 
                        value={loginData.username}
                        onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                        className="h-12 rounded-xl bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        className="h-12 rounded-xl bg-white"
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="p-0 mt-6">
                    <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={isLoginPending}>
                      {isLoginPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-none shadow-none bg-transparent">
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4 p-0">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input 
                        id="reg-name" 
                        placeholder="John Doe" 
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        className="h-12 rounded-xl bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input 
                        id="reg-username" 
                        placeholder="johndoe" 
                        value={registerData.username}
                        onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                        className="h-12 rounded-xl bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input 
                        id="reg-password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        className="h-12 rounded-xl bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-3 pt-2">
                      <Label>I am a...</Label>
                      <RadioGroup 
                        defaultValue="student" 
                        onValueChange={(val: "student" | "teacher") => setRegisterData({...registerData, role: val})}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="student" id="student" className="peer sr-only" />
                          <Label
                            htmlFor="student"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                          >
                            <span className="text-2xl mb-2">🎓</span>
                            Student
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="teacher" id="teacher" className="peer sr-only" />
                          <Label
                            htmlFor="teacher"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                          >
                            <span className="text-2xl mb-2">👨‍🏫</span>
                            Teacher
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                  <CardFooter className="p-0 mt-6">
                    <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={isRegisterPending}>
                      {isRegisterPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
