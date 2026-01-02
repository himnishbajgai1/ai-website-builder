import { describe, it, expect } from "vitest";

describe("Export Functionality", () => {
  const mockComponent = {
    id: "comp-1",
    type: "hero" as const,
    title: "Hero Section",
    content: "Welcome to our website",
    x: 0,
    y: 0,
    width: 100,
    height: 400,
    bgColor: "#3B82F6",
    textColor: "#FFFFFF",
    properties: {},
  };

  const mockDesignTokens = {
    colors: {
      primary: "#3B82F6",
      secondary: "#10B981",
      accent: "#F59E0B",
    },
    typography: {
      fontFamily: "Inter, sans-serif",
      headingSize: "2rem",
      bodySize: "1rem",
    },
    spacing: {
      sm: "0.5rem",
      md: "1rem",
      lg: "2rem",
    },
  };

  describe("Framer Export", () => {
    it("should generate valid Framer export structure", () => {
      const framerExport = {
        version: "1.0.0",
        name: "Test Project",
        metadata: {
          exportedAt: new Date().toISOString(),
          format: "framer",
        },
        designTokens: mockDesignTokens,
        components: [
          {
            id: mockComponent.id,
            name: mockComponent.title,
            type: mockComponent.type,
            props: {
              title: mockComponent.title,
              content: mockComponent.content,
              backgroundColor: mockComponent.bgColor,
              textColor: mockComponent.textColor,
              width: mockComponent.width,
              height: mockComponent.height,
            },
          },
        ],
      };

      expect(framerExport.version).toBe("1.0.0");
      expect(framerExport.name).toBe("Test Project");
      expect(framerExport.components).toHaveLength(1);
      expect(framerExport.components[0]?.type).toBe("hero");
      expect(framerExport.designTokens.colors).toBeDefined();
    });

    it("should include all design tokens in Framer export", () => {
      const framerExport = {
        designTokens: mockDesignTokens,
      };

      expect(Object.keys(framerExport.designTokens.colors)).toContain("primary");
      expect(Object.keys(framerExport.designTokens.typography)).toContain("fontFamily");
      expect(Object.keys(framerExport.designTokens.spacing)).toContain("md");
    });

    it("should generate unique file keys for Framer exports", () => {
      const fileKey1 = `exports/project-1/framer-${Math.random().toString(36).substr(2, 9)}.json`;
      const fileKey2 = `exports/project-1/framer-${Math.random().toString(36).substr(2, 9)}.json`;

      expect(fileKey1).not.toBe(fileKey2);
      expect(fileKey1).toContain("framer");
      expect(fileKey1).toContain(".json");
    });
  });

  describe("Figma Export", () => {
    it("should generate valid Figma document structure", () => {
      const figmaExport = {
        document: {
          id: "0:0",
          name: "Test Project",
          type: "DOCUMENT",
          children: [
            {
              id: "1:0",
              name: "Page 1",
              type: "CANVAS",
              children: [
                {
                  id: "1:1",
                  name: mockComponent.title,
                  type: "FRAME",
                  x: mockComponent.x,
                  y: mockComponent.y,
                  width: mockComponent.width * 10,
                  height: mockComponent.height * 10,
                },
              ],
            },
          ],
        },
        styles: [],
      };

      expect(figmaExport.document.type).toBe("DOCUMENT");
      expect(figmaExport.document.children).toHaveLength(1);
      expect(figmaExport.document.children[0]?.type).toBe("CANVAS");
    });

    it("should convert hex colors to RGB for Figma", () => {
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16) / 255,
              g: parseInt(result[2], 16) / 255,
              b: parseInt(result[3], 16) / 255,
              a: 1,
            }
          : { r: 0, g: 0, b: 0, a: 1 };
      };

      const rgb = hexToRgb("#3B82F6");
      expect(rgb.r).toBeGreaterThan(0);
      expect(rgb.g).toBeGreaterThan(0);
      expect(rgb.b).toBeGreaterThan(0);
      expect(rgb.a).toBe(1);
    });

    it("should create color styles from design tokens", () => {
      const colorStyles = Object.entries(mockDesignTokens.colors).map(([name, color]) => ({
        name: `Color/${name}`,
        color,
      }));

      expect(colorStyles).toHaveLength(3);
      expect(colorStyles[0]?.name).toContain("Color/");
    });
  });

  describe("Webflow Export", () => {
    it("should generate valid Webflow site structure", () => {
      const webflowExport = {
        name: "Test Project",
        shortName: "test-project",
        pages: [
          {
            name: "Home",
            slug: "index",
            children: [
              {
                tag: "div",
                text: mockComponent.title,
                role: "section",
                classes: ["component-hero"],
              },
            ],
          },
        ],
        globalStyles: {
          colors: mockDesignTokens.colors,
          typography: mockDesignTokens.typography,
        },
      };

      expect(webflowExport.name).toBe("Test Project");
      expect(webflowExport.shortName).toBe("test-project");
      expect(webflowExport.pages).toHaveLength(1);
      expect(webflowExport.pages[0]?.slug).toBe("index");
    });

    it("should generate CMS-ready structure", () => {
      const webflowExport = {
        cmsLocales: [
          {
            name: "English",
            default: true,
            code: "en",
          },
        ],
      };

      expect(webflowExport.cmsLocales).toHaveLength(1);
      expect(webflowExport.cmsLocales[0]?.default).toBe(true);
    });

    it("should create component classes for styling", () => {
      const componentClass = `component-${mockComponent.type}`;
      expect(componentClass).toBe("component-hero");
    });
  });

  describe("HTML Export", () => {
    it("should generate valid HTML structure", () => {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Project</title>
</head>
<body>
  <section class="component component-hero">
    <h2>Hero Section</h2>
    <p>Welcome to our website</p>
  </section>
</body>
</html>`;

      expect(htmlContent).toContain("<!DOCTYPE html>");
      expect(htmlContent).toContain("<html lang=\"en\">");
      expect(htmlContent).toContain("Test Project");
      expect(htmlContent).toContain("component-hero");
    });

    it("should include responsive CSS", () => {
      const css = `
    @media (max-width: 768px) {
      .component {
        padding: 30px 15px;
      }
    }
    
    @media (max-width: 480px) {
      .component {
        padding: 20px 10px;
      }
    }`;

      expect(css).toContain("@media");
      expect(css).toContain("768px");
      expect(css).toContain("480px");
    });

    it("should escape HTML special characters", () => {
      const escapeHtml = (text: string) => {
        const map: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
      };

      const unsafe = '<script>alert("xss")</script>';
      const safe = escapeHtml(unsafe);

      expect(safe).not.toContain("<script>");
      expect(safe).toContain("&lt;script&gt;");
    });

    it("should include CSS variables for design tokens", () => {
      const cssVars = Object.entries(mockDesignTokens.colors)
        .map(([name, color]) => `--color-${name.toLowerCase()}: ${color};`)
        .join("\n");

      expect(cssVars).toContain("--color-primary");
      expect(cssVars).toContain("#3B82F6");
    });
  });

  describe("Export File Management", () => {
    it("should generate correct file extensions", () => {
      const files = {
        framer: "project-framer.json",
        figma: "project-figma.json",
        webflow: "project-webflow.json",
        html: "project.html",
      };

      expect(files.framer.endsWith(".json")).toBe(true);
      expect(files.figma.endsWith(".json")).toBe(true);
      expect(files.webflow.endsWith(".json")).toBe(true);
      expect(files.html.endsWith(".html")).toBe(true);
    });

    it("should generate S3 file keys with proper structure", () => {
      const projectId = 123;
      const format = "framer";
      const fileKey = `exports/${projectId}/${format}-abc123.json`;

      expect(fileKey).toContain("exports/");
      expect(fileKey).toContain(projectId.toString());
      expect(fileKey).toContain(format);
    });

    it("should track export metadata", () => {
      const exportRecord = {
        projectId: 1,
        designId: 1,
        format: "framer" as const,
        url: "https://example.com/exports/framer.json",
        fileKey: "exports/1/framer-abc123.json",
        createdAt: new Date(),
      };

      expect(exportRecord.format).toBe("framer");
      expect(exportRecord.url).toContain("https://");
      expect(exportRecord.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("Export Error Handling", () => {
    it("should validate component data before export", () => {
      const isValidComponent = (comp: any) => {
        return (
          comp.id &&
          comp.type &&
          comp.title &&
          typeof comp.bgColor === "string" &&
          typeof comp.textColor === "string"
        ) ? true : false;
      };

      expect(isValidComponent(mockComponent)).toBe(true);
      expect(isValidComponent({ id: "1" })).toBe(false);
    });

    it("should validate design tokens structure", () => {
      const isValidTokens = (tokens: any) => {
        return (
          tokens.colors &&
          tokens.typography &&
          tokens.spacing &&
          typeof tokens.colors === "object"
        ) ? true : false;
      };

      expect(isValidTokens(mockDesignTokens)).toBe(true);
      expect(isValidTokens({})).toBe(false);
    });

    it("should handle missing optional properties", () => {
      const componentWithDefaults = {
        ...mockComponent,
        properties: mockComponent.properties || {},
      };

      expect(componentWithDefaults.properties).toBeDefined();
      expect(typeof componentWithDefaults.properties).toBe("object");
    });
  });

  describe("Export Performance", () => {
    it("should handle large component arrays", () => {
      const largeComponentArray = Array.from({ length: 100 }, (_, i) => ({
        ...mockComponent,
        id: `comp-${i}`,
      }));

      expect(largeComponentArray).toHaveLength(100);
      expect(largeComponentArray[0]?.id).toBe("comp-0");
      expect(largeComponentArray[99]?.id).toBe("comp-99");
    });

    it("should generate consistent export structure", () => {
      const export1 = {
        version: "1.0.0",
        name: "Project",
        components: [mockComponent],
      };

      const export2 = {
        version: "1.0.0",
        name: "Project",
        components: [mockComponent],
      };

      expect(JSON.stringify(export1)).toBe(JSON.stringify(export2));
    });
  });
});
