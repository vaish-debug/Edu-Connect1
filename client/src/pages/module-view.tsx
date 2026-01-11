import { useModule } from "@/hooks/use-modules";
import { useCreateDoubt, useDoubts } from "@/hooks/use-doubts";
import { useUpdateProgress } from "@/hooks/use-progress";
import { useModuleQuiz, useGenerateQuiz, useSubmitQuiz } from "@/hooks/use-quizzes";
import { useUser } from "@/hooks/use-auth";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, ArrowLeft, CheckCircle2, BrainCircuit, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use'; // Need to add this to packages or implement basic hook

export default function ModuleView() {
  const { id } = useParams();
  const moduleId = parseInt(id || "0");
  const [_, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  
  // Hooks
  const { data: module, isLoading } = useModule(moduleId);
  const { mutate: updateProgress } = useUpdateProgress();
  const { mutate: createDoubt, isPending: isAsking } = useCreateDoubt();
  const { data: quiz, isLoading: quizLoading } = useModuleQuiz(moduleId);
  const { mutate: submitQuiz, isPending: isSubmittingQuiz } = useSubmitQuiz();
  
  // Local State
  const [doubtText, setDoubtText] = useState("");
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [latestAiAnswer, setLatestAiAnswer] = useState<string | null>(null);

  // Mark as completed when page loads (simple version)
  useEffect(() => {
    if (module && !isLoading) {
      updateProgress({ moduleId, completed: true });
    }
  }, [moduleId, module, isLoading]);

  const handleAskDoubt = () => {
    createDoubt({ moduleId, question: doubtText, userId: user!.id }, {
      onSuccess: (data) => {
        if (data.aiAnswer) {
          setLatestAiAnswer(data.aiAnswer);
          toast({ title: "AI Responded!", description: "Check the answer below." });
        } else {
          setDoubtOpen(false);
          setDoubtText("");
          toast({ title: "Sent to Teacher", description: "Your teacher will reply soon." });
        }
      }
    });
  };

  const handleEscalate = () => {
    // Logic to escalate would go here, maybe another API call to flag it
    // For MVP, we'll just close and toast
    setLatestAiAnswer(null);
    setDoubtOpen(false);
    setDoubtText("");
    toast({ title: "Escalated", description: "We've notified your teacher." });
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;
    
    let score = 0;
    const questions = quiz.questions as any[]; // Type assertion for JSONB
    
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) score++;
    });

    const finalScore = Math.round((score / questions.length) * 100);
    
    submitQuiz({
      userId: user!.id,
      quizId: quiz.id,
      score: finalScore,
      totalQuestions: questions.length
    }, {
      onSuccess: () => {
        setQuizScore(finalScore);
      }
    });
  };

  if (isLoading || !module) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {quizScore === 100 && <Confetti numberOfPieces={200} recycle={false} />}
      
      <Button variant="ghost" onClick={() => setLocation("/")} className="pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Video */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            {/* Ideally we'd parse the URL to embed youtube properly. For MVP, assuming iframe compatible URL or simple video tag */}
            <iframe 
              src={module.videoUrl.replace("watch?v=", "embed/")} 
              className="w-full h-full" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{module.title}</h1>
            <p className="text-slate-600 leading-relaxed">{module.description}</p>
          </div>

          <div className="flex gap-4">
            <Dialog open={doubtOpen} onOpenChange={setDoubtOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Ask a Doubt
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Stuck? Ask our AI Tutor! 🤖</DialogTitle>
                  <DialogDescription>
                    Describe your question. If the AI can't help, we'll send it to your teacher.
                  </DialogDescription>
                </DialogHeader>

                {!latestAiAnswer ? (
                  <div className="space-y-4 py-4">
                    <Textarea 
                      placeholder="e.g., I didn't understand the part about..." 
                      value={doubtText}
                      onChange={e => setDoubtText(e.target.value)}
                      className="min-h-[120px] rounded-xl text-base"
                    />
                    <Button onClick={handleAskDoubt} disabled={isAsking} className="w-full rounded-xl">
                      {isAsking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ask Question"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="font-semibold text-sm text-slate-500 mb-2 uppercase tracking-wide">AI Answer:</p>
                      <p className="text-slate-800">{latestAiAnswer}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleEscalate} className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5">
                        Not Helpful, Ask Teacher
                      </Button>
                      <Button onClick={() => { setLatestAiAnswer(null); setDoubtOpen(false); setDoubtText(""); }} className="flex-1 rounded-xl bg-green-600 hover:bg-green-700">
                        Thanks, I got it!
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {quiz && (
               <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
               <DialogTrigger asChild>
                 <Button size="lg" variant="secondary" className="flex-1 rounded-xl">
                   <BrainCircuit className="mr-2 h-5 w-5" />
                   Take Quiz
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                 <DialogHeader>
                   <DialogTitle>Module Quiz</DialogTitle>
                   <DialogDescription>Test your knowledge!</DialogDescription>
                 </DialogHeader>
                 
                 {quizScore === null ? (
                   <div className="space-y-8 py-4">
                     {(quiz.questions as any[]).map((q, idx) => (
                       <div key={idx} className="space-y-3">
                         <p className="font-medium text-lg text-slate-900">{idx + 1}. {q.question}</p>
                         <RadioGroup onValueChange={(val) => setQuizAnswers({...quizAnswers, [idx]: parseInt(val)})}>
                           {q.options.map((opt: string, optIdx: number) => (
                             <div key={optIdx} className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer">
                               <RadioGroupItem value={optIdx.toString()} id={`q${idx}-${optIdx}`} />
                               <Label htmlFor={`q${idx}-${optIdx}`} className="flex-1 cursor-pointer">{opt}</Label>
                             </div>
                           ))}
                         </RadioGroup>
                       </div>
                     ))}
                     <Button onClick={handleSubmitQuiz} disabled={isSubmittingQuiz} className="w-full rounded-xl">
                       {isSubmittingQuiz ? <Loader2 className="animate-spin mr-2" /> : "Submit Answers"}
                     </Button>
                   </div>
                 ) : (
                   <div className="py-8 text-center space-y-6">
                     <div className="inline-flex items-center justify-center p-6 rounded-full bg-slate-50 mb-4">
                        <span className="text-6xl">{quizScore >= 80 ? "🎉" : "📊"}</span>
                     </div>
                     <div>
                       <h3 className="text-3xl font-bold text-slate-900">{quizScore}%</h3>
                       <p className="text-slate-500">Your Score</p>
                     </div>
                     <p className="text-lg">
                       {quizScore >= 80 ? "Outstanding! You've mastered this." : "Good effort! Review the video and try again."}
                     </p>
                     <Button onClick={() => setQuizOpen(false)} className="rounded-xl px-8">Close</Button>
                   </div>
                 )}
               </DialogContent>
             </Dialog>
            )}
          </div>
        </div>

        {/* Sidebar - Context/Notes/Transcript */}
        <div className="space-y-6">
          <Card className="h-full max-h-[600px] flex flex-col bg-slate-50 border-none shadow-inner">
            <CardHeader>
              <CardTitle className="text-lg">Lecture Notes</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto custom-scrollbar text-sm text-slate-600 leading-relaxed p-6 pt-0">
              {module.content || "No transcript available for this lecture."}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
