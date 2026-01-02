import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileJson, Code, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ExportPanelProps {
  projectId: number;
  designId: number;
  projectName: string;
}

export function ExportPanel({ projectId, designId, projectName }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportFramer = trpc.exports.exportToFramer.useMutation({
    onSuccess: (data) => {
      toast.success("Framer export ready!");
      downloadFile(data.url, data.fileName);
      setIsExporting(null);
    },
    onError: () => {
      toast.error("Failed to export to Framer");
      setIsExporting(null);
    },
  });

  const exportFigma = trpc.exports.exportToFigma.useMutation({
    onSuccess: (data) => {
      toast.success("Figma export ready!");
      downloadFile(data.url, data.fileName);
      setIsExporting(null);
    },
    onError: () => {
      toast.error("Failed to export to Figma");
      setIsExporting(null);
    },
  });

  const exportWebflow = trpc.exports.exportToWebflow.useMutation({
    onSuccess: (data) => {
      toast.success("Webflow export ready!");
      downloadFile(data.url, data.fileName);
      setIsExporting(null);
    },
    onError: () => {
      toast.error("Failed to export to Webflow");
      setIsExporting(null);
    },
  });

  const exportHTML = trpc.exports.exportToHTML.useMutation({
    onSuccess: (data) => {
      toast.success("HTML export ready!");
      downloadFile(data.url, data.fileName);
      setIsExporting(null);
    },
    onError: () => {
      toast.error("Failed to export to HTML");
      setIsExporting(null);
    },
  });

  function downloadFile(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleExport(format: string) {
    setIsExporting(format);

    switch (format) {
      case "framer":
        exportFramer.mutate({ projectId, designId });
        break;
      case "figma":
        exportFigma.mutate({ projectId, designId });
        break;
      case "webflow":
        exportWebflow.mutate({ projectId, designId });
        break;
      case "html":
        exportHTML.mutate({ projectId, designId });
        break;
    }
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Export Your Design</CardTitle>
          <CardDescription>
            Download your design in multiple formats for use in your favorite tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="framer" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="framer">Framer</TabsTrigger>
              <TabsTrigger value="figma">Figma</TabsTrigger>
              <TabsTrigger value="webflow">Webflow</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="framer" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Export to Framer</h3>
                <p className="text-sm text-muted-foreground">
                  Export your design as a Framer-compatible JSON file with all components and design tokens included.
                </p>
              </div>
              <Button
                onClick={() => handleExport("framer")}
                disabled={isExporting !== null}
                className="w-full"
              >
                {isExporting === "framer" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Framer File
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="figma" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Export to Figma</h3>
                <p className="text-sm text-muted-foreground">
                  Export your design with design tokens, layers, and styles ready for Figma import.
                </p>
              </div>
              <Button
                onClick={() => handleExport("figma")}
                disabled={isExporting !== null}
                className="w-full"
              >
                {isExporting === "figma" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Figma File
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="webflow" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Export to Webflow</h3>
                <p className="text-sm text-muted-foreground">
                  Export your design with CMS-ready structure and components for Webflow.
                </p>
              </div>
              <Button
                onClick={() => handleExport("webflow")}
                disabled={isExporting !== null}
                className="w-full"
              >
                {isExporting === "webflow" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Webflow File
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Export to HTML</h3>
                <p className="text-sm text-muted-foreground">
                  Export your design as a responsive HTML file with embedded CSS and ready to deploy.
                </p>
              </div>
              <Button
                onClick={() => handleExport("html")}
                disabled={isExporting !== null}
                className="w-full"
              >
                {isExporting === "html" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Code className="mr-2 h-4 w-4" />
                    Download HTML File
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Project:</span>
            <span className="font-medium">{projectName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Format:</span>
            <span className="font-medium">Multi-platform</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium text-green-600">Ready to export</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
