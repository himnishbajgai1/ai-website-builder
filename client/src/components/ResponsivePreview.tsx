import { useState } from "react";
import { Monitor, Tablet, Smartphone, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewportType = "desktop" | "tablet" | "mobile";

interface ResponsivePreviewProps {
  children: React.ReactNode;
  selectedViewport: ViewportType;
  onViewportChange: (viewport: ViewportType) => void;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

const VIEWPORT_SIZES: Record<ViewportType, { width: number; height: number; label: string }> = {
  desktop: { width: 1440, height: 900, label: "Desktop (1440px)" },
  tablet: { width: 768, height: 1024, label: "Tablet (768px)" },
  mobile: { width: 375, height: 812, label: "Mobile (375px)" },
};

export function ResponsivePreview({
  children,
  selectedViewport,
  onViewportChange,
  isFullscreen = false,
  onFullscreenToggle,
}: ResponsivePreviewProps) {
  const [showGrid, setShowGrid] = useState(false);
  const viewport = VIEWPORT_SIZES[selectedViewport];

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Viewport:</span>
          <div className="flex gap-2">
            <Button
              variant={selectedViewport === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewportChange("desktop")}
              className="gap-2"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Desktop</span>
            </Button>
            <Button
              variant={selectedViewport === "tablet" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewportChange("tablet")}
              className="gap-2"
            >
              <Tablet className="w-4 h-4" />
              <span className="hidden sm:inline">Tablet</span>
            </Button>
            <Button
              variant={selectedViewport === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewportChange("mobile")}
              className="gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Mobile</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{viewport.label}</span>
          <div className="h-6 w-px bg-slate-200" />

          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className="text-xs"
          >
            {showGrid ? "Hide Grid" : "Show Grid"}
          </Button>

          {onFullscreenToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFullscreenToggle}
              className="gap-2"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Exit</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <div
          className={cn(
            "relative bg-white rounded-lg shadow-lg transition-all duration-300",
            showGrid && "bg-grid-pattern"
          )}
          style={{
            width: `${viewport.width}px`,
            height: `${viewport.height}px`,
            backgroundImage: showGrid
              ? `
                linear-gradient(0deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent)
              `
              : "none",
            backgroundSize: showGrid ? "50px 50px" : "auto",
          }}
        >
          {/* Device Frame */}
          <div className="w-full h-full overflow-hidden rounded-lg">
            {children}
          </div>

          {/* Viewport Label */}
          <div className="absolute bottom-2 right-2 text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
            {selectedViewport.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 text-xs text-slate-600">
        <p>
          Tip: Use the viewport toggles to preview your design across different devices. The grid helps with alignment and spacing.
        </p>
      </div>
    </div>
  );
}

export function ResponsivePreviewFrame({
  content,
  viewport,
}: {
  content: React.ReactNode;
  viewport: ViewportType;
}) {
  const size = VIEWPORT_SIZES[viewport];

  return (
    <div
      className="w-full h-full overflow-auto bg-white"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      {content}
    </div>
  );
}
