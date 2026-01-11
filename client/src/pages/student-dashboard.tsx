import { useModules } from "@/hooks/use-modules";
import { useUser } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard() {
  const { user } = useUser();
  const { data: modules, isLoading } = useModules();

  if (!user || user.role !== "student") return null;

  const completedCount = modules?.filter(m => m.completed).length || 0;
  const totalCount = modules?.length || 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 md:p-12 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold font-display mb-2">Hello, {user.name}! 👋</h1>
          <p className="text-indigo-100 text-lg max-w-xl">
            You've completed {completedCount} out of {totalCount} lectures. Keep up the great momentum!
          </p>
          <div className="mt-8 max-w-md">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-white/20" />
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-1/3 translate-y-1/3 rounded-full bg-accent/20 blur-2xl" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          Your Lectures <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{totalCount}</span>
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules?.map((module, index) => (
              <Link href={`/module/${module.id}`} key={module.id} className="block group h-full">
                <Card className={`h-full border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${module.completed ? 'border-green-100 bg-green-50/30' : 'border-transparent hover:border-primary/20'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">
                        Module {index + 1}
                      </span>
                      {module.completed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{module.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-video rounded-xl bg-slate-900/5 overflow-hidden flex items-center justify-center group-hover:shadow-inner transition-all">
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <PlayCircle className="h-6 w-6 text-primary ml-1" />
                        </div>
                      </div>
                      {/* Thumbnail Placeholder */}
                      <img 
                        src={`https://source.unsplash.com/random/800x600?education,tech&sig=${module.id}`} 
                        alt={module.title}
                        className="w-full h-full object-cover mix-blend-overlay opacity-50"
                      />
                      {/* Using Unsplash source for dynamic thumbnails */}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-6">
                    <div className="w-full flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> 15 min
                      </span>
                      <span className="text-primary font-semibold group-hover:underline">Start Learning →</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
