import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Download, Eye, Copy, Trash2, Plus, Move, Code } from "lucide-react";
import { toast } from "sonner";
import { ResponsivePreview, type ViewportType } from "@/components/ResponsivePreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditorComponent {
  id: string;
  type: "hero" | "features" | "cta" | "pricing" | "testimonials" | "footer" | "text" | "button" | "image";
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor: string;
  textColor: string;
  properties: Record<string, any>;
}

interface DesignState {
  components: EditorComponent[];
  designTokens: {
    colors: Record<string, string>;
    typography: Record<string, string>;
    spacing: Record<string, string>;
  };
}

const COMPONENT_TEMPLATES: Record<string, Partial<EditorComponent>> = {
  hero: {
    type: "hero",
    title: "Hero Section",
    content: "Welcome to your website",
    width: 100,
    height: 40,
    bgColor: "#3B82F6",
    textColor: "#FFFFFF",
  },
  features: {
    type: "features",
    title: "Features",
    content: "Key features of your product",
    width: 100,
    height: 30,
    bgColor: "#FFFFFF",
    textColor: "#1F2937",
  },
  cta: {
    type: "cta",
    title: "Call to Action",
    content: "Get started today",
    width: 100,
    height: 20,
    bgColor: "#10B981",
    textColor: "#FFFFFF",
  },
  pricing: {
    type: "pricing",
    title: "Pricing",
    content: "Choose your plan",
    width: 100,
    height: 35,
    bgColor: "#FFFFFF",
    textColor: "#1F2937",
  },
  testimonials: {
    type: "testimonials",
    title: "Testimonials",
    content: "What our customers say",
    width: 100,
    height: 30,
    bgColor: "#F3F4F6",
    textColor: "#1F2937",
  },
  footer: {
    type: "footer",
    title: "Footer",
    content: "© 2024 Your Company",
    width: 100,
    height: 15,
    bgColor: "#1F2937",
    textColor: "#FFFFFF",
  },
};

export default function EnhancedEditor(props: any) {
  const projectId = props.params?.projectId || props.projectId;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [designState, setDesignState] = useState<DesignState>({
    components: [],
    designTokens: {
      colors: {
        primary: "#3B82F6",
        secondary: "#10B981",
        accent: "#F59E0B",
        background: "#FFFFFF",
        foreground: "#1F2937",
      },
      typography: {
        fontFamily: "Inter, sans-serif",
        headingSize: "2rem",
        bodySize: "1rem",
        lineHeight: "1.5",
      },
      spacing: {
        xs: "0.5rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
      },
    },
  });

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState<ViewportType>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreviewOnly, setShowPreviewOnly] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const projectId_num = parseInt(projectId || "");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (!projectId || isNaN(projectId_num)) {
    return null;
  }

  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
    { projectId: projectId_num },
    { enabled: !!projectId_num }
  );

  const generateMutation = trpc.ai.generateWebsite.useMutation({
    onSuccess: (design) => {
      const components: EditorComponent[] = [];
      let yPosition = 0;

      if (Array.isArray(design.designData)) {
        design.designData.forEach((section: any, idx: number) => {
          components.push({
            id: `component-${idx}`,
            type: section.type || "hero",
            title: section.title || `Section ${idx + 1}`,
            content: section.content || "",
            x: 0,
            y: yPosition,
            width: 100,
            height: 25,
            bgColor: "#3B82F6",
            textColor: "#FFFFFF",
            properties: section.properties || {},
          });
          yPosition += 30;
        });
      }

      setDesignState((prev: DesignState): DesignState => ({
        ...prev,
        components,
        designTokens: (design.designTokens || prev.designTokens) as DesignState['designTokens'],
      }));

      setPrompt("");
      toast.success("Design generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate design");
    },
  });

  const handleAddComponent = (type: keyof typeof COMPONENT_TEMPLATES) => {
    const template = COMPONENT_TEMPLATES[type];
    const newComponent: EditorComponent = {
      id: `component-${Date.now()}`,
      type: template.type as any,
      title: template.title || type,
      content: template.content || "",
      x: 0,
      y: designState.components.length * 30,
      width: template.width || 100,
      height: template.height || 25,
      bgColor: template.bgColor || "#FFFFFF",
      textColor: template.textColor || "#000000",
      properties: {},
    };

    setDesignState((prev: DesignState): DesignState => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));
    setSelectedComponent(newComponent.id);
    toast.success(`${type} component added`);
  };

  const handleDeleteComponent = (id: string) => {
    setDesignState((prev: DesignState): DesignState => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== id),
    }));
    if (selectedComponent === id) {
      setSelectedComponent(null);
    }
    toast.success("Component deleted");
  };

  const handleComponentChange = (id: string, updates: Partial<EditorComponent>) => {
    setDesignState((prev: DesignState): DesignState => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent, componentId: string) => {
    if (e.button !== 0) return;
    setSelectedComponent(componentId);
    setIsDragging(true);

    const component = designState.components.find((c) => c.id === componentId);
    if (component && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - component.x * (rect.width / 100),
        y: e.clientY - rect.top - component.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedComponent || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(100, ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100));
    const newY = Math.max(0, e.clientY - rect.top - dragOffset.y);

    handleComponentChange(selectedComponent, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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

  const renderPreview = () => {
    return (
      <div className="w-full h-full bg-white p-8 overflow-auto">
        {designState.components.map((component) => (
          <div
            key={component.id}
            className="mb-4 p-6 rounded-lg"
            style={{
              backgroundColor: component.bgColor,
              color: component.textColor,
            }}
          >
            <h3 className="font-bold text-lg mb-2">{component.title}</h3>
            <p className="text-sm opacity-90">{component.content}</p>
          </div>
        ))}
      </div>
    );
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

  const selectedComp = designState.components.find((c) => c.id === selectedComponent);

  // Fullscreen Preview Mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{project.name} - Preview</h2>
          <Button
            variant="outline"
            onClick={() => setIsFullscreen(false)}
          >
            Exit Fullscreen
          </Button>
        </div>
        <div className="flex-1">
          <ResponsivePreview
            selectedViewport={viewport}
            onViewportChange={setViewport}
            isFullscreen={isFullscreen}
            onFullscreenToggle={() => setIsFullscreen(false)}
          >
            {renderPreview()}
          </ResponsivePreview>
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-slate-600">{designState.components.length} components</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsFullscreen(true)}
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Export to Framer</DropdownMenuItem>
                  <DropdownMenuItem>Export to Figma</DropdownMenuItem>
                  <DropdownMenuItem>Export to Webflow</DropdownMenuItem>
                  <DropdownMenuItem>Export to HTML</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Tools & Components */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Generation */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                AI Generate
              </h2>

              <div className="space-y-4">
                <Textarea
                  placeholder="Describe your website design..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-20"
                />

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

            {/* Component Library */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Components</h3>

              <div className="space-y-2">
                {Object.keys(COMPONENT_TEMPLATES).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleAddComponent(type as any)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Canvas & Preview Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="editor">
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div
                    ref={canvasRef}
                    className="relative w-full bg-white"
                    style={{ minHeight: "600px", position: "relative" }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {designState.components.length === 0 ? (
                      <div className="flex items-center justify-center h-96 text-slate-500">
                        <div className="text-center">
                          <p className="text-lg font-medium mb-2">No components yet</p>
                          <p className="text-sm">Add components or generate with AI</p>
                        </div>
                      </div>
                    ) : (
                      designState.components.map((component) => (
                        <div
                          key={component.id}
                          onMouseDown={(e) => handleMouseDown(e, component.id)}
                          className={`absolute cursor-move transition-all ${
                            selectedComponent === component.id
                              ? "ring-2 ring-blue-500 ring-offset-2"
                              : "hover:ring-2 hover:ring-slate-300"
                          }`}
                          style={{
                            left: `${component.x}%`,
                            top: `${component.y}px`,
                            width: `${component.width}%`,
                            height: `${component.height}px`,
                            backgroundColor: component.bgColor,
                            color: component.textColor,
                            padding: "1rem",
                            borderRadius: "0.5rem",
                          }}
                        >
                          <div className="h-full flex flex-col justify-center">
                            <h4 className="font-semibold text-sm truncate">{component.title}</h4>
                            <p className="text-xs opacity-75 truncate">{component.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview">
                <ResponsivePreview
                  selectedViewport={viewport}
                  onViewportChange={setViewport}
                  isFullscreen={isFullscreen}
                  onFullscreenToggle={() => setIsFullscreen(true)}
                >
                  {renderPreview()}
                </ResponsivePreview>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="lg:col-span-1">
            {selectedComp ? (
              <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">Properties</h3>
                  <button
                    onClick={() => handleDeleteComponent(selectedComp.id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-900">Title</label>
                      <Input
                        value={selectedComp.title}
                        onChange={(e) =>
                          handleComponentChange(selectedComp.id, { title: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-900">Content</label>
                      <Textarea
                        value={selectedComp.content}
                        onChange={(e) =>
                          handleComponentChange(selectedComp.id, { content: e.target.value })
                        }
                        className="mt-1 min-h-20"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="style" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-900">Background</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="color"
                          value={selectedComp.bgColor}
                          onChange={(e) =>
                            handleComponentChange(selectedComp.id, { bgColor: e.target.value })
                          }
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={selectedComp.bgColor}
                          onChange={(e) =>
                            handleComponentChange(selectedComp.id, { bgColor: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-900">Text Color</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="color"
                          value={selectedComp.textColor}
                          onChange={(e) =>
                            handleComponentChange(selectedComp.id, { textColor: e.target.value })
                          }
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={selectedComp.textColor}
                          onChange={(e) =>
                            handleComponentChange(selectedComp.id, { textColor: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-900">Width (%)</label>
                      <Input
                        type="number"
                        min="10"
                        max="100"
                        value={selectedComp.width}
                        onChange={(e) =>
                          handleComponentChange(selectedComp.id, {
                            width: parseInt(e.target.value),
                          })
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-900">Height (px)</label>
                      <Input
                        type="number"
                        min="20"
                        value={selectedComp.height}
                        onChange={(e) =>
                          handleComponentChange(selectedComp.id, {
                            height: parseInt(e.target.value),
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-500">
                <p>Select a component to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
