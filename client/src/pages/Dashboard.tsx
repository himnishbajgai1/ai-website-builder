import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Plus, Loader2, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      setProjectName("");
      setProjectDescription("");
      setIsCreateOpen(false);
      toast.success("Project created successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    createMutation.mutate({
      name: projectName,
      description: projectDescription,
    });
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate({ projectId });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
            <p className="text-slate-600 mt-2">Create and manage your website projects</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-5 h-5" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new website project. You can customize it later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-900">Project Name</label>
                  <Input
                    placeholder="My Awesome Website"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900">Description (Optional)</label>
                  <Textarea
                    placeholder="Describe your website idea..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleCreateProject}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/editor/${project.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/editor/${project.id}`);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-slate-500">
                  <span className="capitalize px-2 py-1 bg-blue-50 text-blue-700 rounded">
                    {project.status}
                  </span>
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-600 mb-4">No projects yet. Create one to get started!</p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-5 h-5" />
              Create First Project
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
