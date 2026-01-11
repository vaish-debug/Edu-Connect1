import { useModules, useCreateModule } from "@/hooks/use-modules";
import { useStudentStats } from "@/hooks/use-progress";
import { useDoubts, useAnswerDoubt } from "@/hooks/use-doubts";
import { useUser } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, Users, PlaySquare, MessageCircle, CheckCircle2, Loader2, Link as LinkIcon, AlertCircle } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function TeacherDashboard() {
  const { user } = useUser();
  const { data: stats } = useStudentStats();
  const { data: modules, isLoading: modulesLoading } = useModules();
  const { data: doubts, isLoading: doubtsLoading } = useDoubts();
  const { mutate: createModule, isPending: isCreating } = useCreateModule();
  const { mutate: answerDoubt, isPending: isAnswering } = useAnswerDoubt();
  const { toast } = useToast();

  const [newModule, setNewModule] = useState({ title: "", description: "", videoUrl: "", content: "" });
  const [open, setOpen] = useState(false);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");

  const handleCreateModule = () => {
    createModule(newModule, {
      onSuccess: () => {
        setOpen(false);
        setNewModule({ title: "", description: "", videoUrl: "", content: "" });
        toast({ title: "Success", description: "Module created successfully! 🎉" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleAnswerDoubt = (doubtId: number) => {
    answerDoubt({ id: doubtId, answer: answerText }, {
      onSuccess: () => {
        setAnsweringId(null);
        setAnswerText("");
        toast({ title: "Replied", description: "Answer sent to student! 📤" });
      }
    });
  };

  if (!user || user.role !== "teacher") return null;

  const pendingDoubts = doubts?.filter(d => !d.isResolved && d.isEscalated) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Teacher Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your classroom, track progress, and help students succeed.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Plus className="mr-2 h-5 w-5" />
              New Lecture
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Lecture</DialogTitle>
              <DialogDescription>
                Add a video lecture for your students. The AI will generate a quiz automatically! 🪄
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Input 
                  placeholder="Module Title" 
                  value={newModule.title}
                  onChange={e => setNewModule({...newModule, title: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Textarea 
                  placeholder="Short Description" 
                  value={newModule.description}
                  onChange={e => setNewModule({...newModule, description: e.target.value})}
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="space-y-2 relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Video URL (YouTube or MP4)" 
                  value={newModule.videoUrl}
                  onChange={e => setNewModule({...newModule, videoUrl: e.target.value})}
                  className="rounded-xl pl-9"
                />
              </div>
              <div className="space-y-2">
                <Textarea 
                  placeholder="Content / Transcript (for AI Context)" 
                  value={newModule.content}
                  onChange={e => setNewModule({...newModule, content: e.target.value})}
                  className="rounded-xl h-32"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateModule} disabled={isCreating} className="rounded-xl w-full">
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publish Module"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Active learners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Modules Published</CardTitle>
            <PlaySquare className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules?.length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Video lectures</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Doubts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDoubts.length}</div>
            <p className="text-xs text-slate-500 mt-1">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="mb-6 h-12 bg-white rounded-xl border border-slate-200 p-1 w-full max-w-md">
          <TabsTrigger value="stats" className="flex-1 rounded-lg">Student Progress</TabsTrigger>
          <TabsTrigger value="doubts" className="flex-1 rounded-lg">Doubts & QnA</TabsTrigger>
          <TabsTrigger value="modules" className="flex-1 rounded-lg">Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>Overview of student completion rates and quiz scores.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="studentName" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f8f9fc'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="averageQuizScore" name="Avg Score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completedModules" name="Completed Modules" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8">
                <h4 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">Detailed List</h4>
                <div className="space-y-3">
                  {stats?.map((student, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg">
                          {student.averageQuizScore > 80 ? "🎉" : student.averageQuizScore > 50 ? "👍" : "📚"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{student.studentName}</p>
                          <p className="text-xs text-slate-500">{student.completedModules} / {student.totalModules} modules</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{student.averageQuizScore}%</p>
                          <p className="text-xs text-slate-500">Avg. Score</p>
                        </div>
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${(student.completedModules / (student.totalModules || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doubts">
          <div className="grid gap-4">
            {pendingDoubts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4 opacity-50" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-slate-500">No pending doubts from students.</p>
              </div>
            ) : (
              pendingDoubts.map((doubt) => (
                <Card key={doubt.id} className="overflow-hidden">
                  <div className="bg-destructive/5 border-l-4 border-destructive p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-white text-destructive border-destructive/20">Needs Help</Badge>
                          <span className="text-xs text-slate-500">
                            from {doubt.studentName} on {doubt.moduleTitle}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg">{doubt.question}</h3>
                        {doubt.aiAnswer && (
                          <div className="mt-2 text-sm text-slate-500 bg-white/50 p-2 rounded-lg">
                            <span className="font-medium">AI Attempt:</span> {doubt.aiAnswer}
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setAnsweringId(answeringId === doubt.id ? null : doubt.id)}
                      >
                        {answeringId === doubt.id ? "Cancel" : "Reply"}
                      </Button>
                    </div>
                    
                    {answeringId === doubt.id && (
                      <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                        <Textarea
                          placeholder="Type your explanation here..."
                          className="min-h-[100px] mb-2 rounded-lg"
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => handleAnswerDoubt(doubt.id)} 
                            disabled={isAnswering}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            {isAnswering ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Answer"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules?.map((module) => (
              <Card key={module.id} className="group hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{module.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform duration-300">
                     <PlaySquare className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{new Date(module.createdAt!).toLocaleDateString()}</span>
                    <span>{module.content ? "Has Transcript" : "No Transcript"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
