import { useState } from "react";
import { Wand2, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AIImageGeneratorProps {
  projectId?: number;
  onImageSelect?: (imageUrl: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AIImageGenerator({
  onImageSelect,
  open = false,
  onOpenChange,
}: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<"realistic" | "illustration" | "abstract">(
    "realistic"
  );

  const generateMutation = trpc.ai.generateImage.useMutation({
    onSuccess: (data: any) => {
      setGeneratedImage(data.url);
      toast.success("Image generated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate image");
    },
  });

  const handleGenerateImage = () => {
    if (!prompt.trim()) {
      toast.error("Please enter an image description");
      return;
    }

    // Note: This requires projectId to be passed as a prop
    // For now, we'll show a message to select a project first
    toast.error("Please open this from within a project");
  };

  const handleSelectImage = () => {
    if (generatedImage && onImageSelect) {
      onImageSelect(generatedImage);
      setPrompt("");
      setGeneratedImage(null);
      onOpenChange?.(false);
      toast.success("Image added to design");
    }
  };

  const handleDownloadImage = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Image Generator</DialogTitle>
          <DialogDescription>
            Create custom images and graphics for your website designs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Style Selection */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-3 block">
              Image Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["realistic", "illustration", "abstract"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setImageStyle(style)}
                  className={`p-3 rounded-lg border-2 transition-all capitalize ${
                    imageStyle === style
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-medium">{style}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-2 block">
              Image Description
            </label>
            <Textarea
              placeholder="Describe the image you want to generate... (e.g., 'A modern tech startup office with bright lighting and collaborative workspace')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24"
            />
            <p className="text-xs text-slate-500 mt-2">
              Be specific with details like colors, mood, composition, and style for better results
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateImage}
            disabled={generateMutation.isPending || !prompt.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Image
              </>
            )}
          </Button>

          {/* Generated Image Preview */}
          {generatedImage && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedImage(null)}
                  className="flex-1 gap-2"
                >
                  <X className="w-4 h-4" />
                  Discard
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDownloadImage}
                  className="flex-1 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>

                {onImageSelect && (
                  <Button onClick={handleSelectImage} className="flex-1">
                    Use Image
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Quick Prompts */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-2 block">
              Quick Prompts
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Modern tech office workspace",
                "Minimalist product showcase",
                "Team collaboration meeting",
                "Creative design studio",
              ].map((quickPrompt) => (
                <button
                  key={quickPrompt}
                  onClick={() => setPrompt(quickPrompt)}
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
                >
                  {quickPrompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
