import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Download, Eye, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Editor(props: any) {
  const projectId = props.params?.projectId || props.projectId;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const projectId_num = parseInt(projectId || "");

  if (!projectId || isNaN(projectId_num)) {
    return null;
  }

  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
    { projectId: projectId_num },
    { enabled: !!projectId_num }
  );

  const { data: designs, refetch: refetchDesigns } = trpc.designs.list.useQuery(
    { projectId: projectId_num },
    { enabled: !!projectId_num }
  );

  const generateMutation = trpc.ai.generateWebsite.useMutation({
    onSuccess: (design) => {
      setSelectedDesign(design.id);
      setPrompt("");
      toast.success("Website design generated successfully!");
      refetchDesigns();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate design");
    },
  });

  const exportFramerMutation = trpc.exports.exportToFramer.useMutation({
    onSuccess: (exportData) => {
      toast.success("Exported to Framer successfully!");
      // Trigger download
      const link = document.createElement("a");
      link.href = exportData.fileUrl;
      link.download = `framer-export.json`;
      link.click();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export to Framer");
    },
  });

  const exportFigmaMutation = trpc.exports.exportToFigma.useMutation({
    onSuccess: (exportData) => {
      toast.success("Exported to Figma successfully!");
      const link = document.createElement("a");
      link.href = exportData.fileUrl;
      link.download = `figma-export.json`;
      link.click();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export to Figma");
    },
  });

  const exportWebflowMutation = trpc.exports.exportToWebflow.useMutation({
    onSuccess: (exportData) => {
      toast.success("Exported to Webflow successfully!");
      const link = document.createElement("a");
      link.href = exportData.fileUrl;
      link.download = `webflow-export.json`;
      link.click();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export to Webflow");
    },
  });

  const exportHTMLMutation = trpc.exports.exportToHTML.useMutation({
    onSuccess: (exportData) => {
      toast.success("Exported to HTML successfully!");
      const link = document.createElement("a");
      link.href = exportData.fileUrl;
      link.download = `website.html`;
      link.click();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export to HTML");
    },
  });

  const handleGenerateDesign = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a design prompt");
      return;
    }

    generateMutation.mutate({
      projectId: projectId_num,
      prompt,
    });
  };

  const handleExport = (type: "framer" | "figma" | "webflow" | "html") => {
    if (!selectedDesign) {
      toast.error("Please select a design to export");
      return;
    }

    switch (type) {
      case "framer":
        exportFramerMutation.mutate({ projectId: projectId_num, designId: selectedDesign });
        break;
      case "figma":
        exportFigmaMutation.mutate({ projectId: projectId_num, designId: selectedDesign });
        break;
      case "webflow":
        exportWebflowMutation.mutate({ projectId: projectId_num, designId: selectedDesign });
        break;
      case "html":
        exportHTMLMutation.mutate({ projectId: projectId_num, designId: selectedDesign });
        break;
    }
  };

  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !project) {
    return null;
  }

  const currentDesign = designs?.find((d) => d.id === selectedDesign);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-slate-600 hover:text-slate-900"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
                <p className="text-sm text-slate-600">
                  {designs?.length || 0} design{designs?.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>

              <DropdownMenu open={showExportMenu} onOpenChange={setShowExportMenu}>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleExport("framer")}
                    disabled={!selectedDesign || exportFramerMutation.isPending}
                  >
                    Export to Framer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("figma")}
                    disabled={!selectedDesign || exportFigmaMutation.isPending}
                  >
                    Export to Figma
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("webflow")}
                    disabled={!selectedDesign || exportWebflowMutation.isPending}
                  >
                    Export to Webflow
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("html")}
                    disabled={!selectedDesign || exportHTMLMutation.isPending}
                  >
                    Export to HTML
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Generation & Design List */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Generation */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Generate Design
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-900">Design Prompt</label>
                  <Textarea
                    placeholder="Describe the website you want to create..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-2 min-h-24"
                  />
                </div>

                <Button
                  onClick={handleGenerateDesign}
                  disabled={generateMutation.isPending}
                  className="w-full gap-2"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Design List */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Designs</h3>

              {designs && designs.length > 0 ? (
                <div className="space-y-2">
                  {designs.map((design) => (
                    <button
                      key={design.id}
                      onClick={() => setSelectedDesign(design.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedDesign === design.id
                          ? "bg-blue-50 border-blue-300"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <p className="font-medium text-sm text-slate-900">{design.name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        v{design.version}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 text-center py-4">
                  No designs yet. Generate one to get started!
                </p>
              )}
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-3">
            {selectedDesign && currentDesign ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {currentDesign.name}
                    </h2>
                    <p className="text-slate-600">
                      Created on {new Date(currentDesign.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Design Preview */}
                  <div className="bg-slate-50 rounded-lg p-8 min-h-96 border border-slate-200">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">
                        Design Preview
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Visual editor coming soon. This is a preview of your generated design.
                      </p>

                      {/* Display design sections */}
                      {Array.isArray(currentDesign.designData) ? (
                        (currentDesign.designData as any[]).map((section: any, idx: number) => (
                          <div key={idx} className="mb-6 p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold text-slate-900">
                              {(section as any)?.title || `Section ${idx + 1}`}
                            </h4>
                            <p className="text-sm text-slate-600 mt-2">
                              {(section as any)?.content || "No content"}
                            </p>
                          </div>
                        ))
                      ) : null}
                    </div>
                  </div>

                  {/* Design Tokens */}
                  {currentDesign.designTokens ? (
                    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                      <h3 className="font-semibold text-slate-900 mb-4">Design Tokens</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {(currentDesign.designTokens as any)?.colors ? (
                          <div>
                            <p className="text-sm font-medium text-slate-900 mb-2">Colors</p>
                            <div className="space-y-2">
                              {Object.entries(
                                (currentDesign.designTokens as any).colors
                              ).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded border border-slate-300"
                                    style={{ backgroundColor: value as string }}
                                  />
                                  <span className="text-xs text-slate-600">{key}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Design Selected
                </h3>
                <p className="text-slate-600">
                  Generate a design using AI or select an existing one from the list
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
