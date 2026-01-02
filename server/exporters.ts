import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export interface ExportComponent {
  id: string;
  type: string;
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

export interface DesignTokens {
  colors?: Record<string, string>;
  typography?: Record<string, string>;
  spacing?: Record<string, string>;
}

// ============ FRAMER EXPORT ============
export async function exportToFramer(
  components: ExportComponent[],
  designTokens: DesignTokens,
  projectName: string
) {
  const framerConfig = {
    version: "1.0.0",
    name: projectName,
    metadata: {
      exportedAt: new Date().toISOString(),
      format: "framer",
    },
    designTokens,
    components: components.map((comp) => ({
      id: comp.id,
      name: comp.title,
      type: comp.type,
      props: {
        title: comp.title,
        content: comp.content,
        backgroundColor: comp.bgColor,
        textColor: comp.textColor,
        width: comp.width,
        height: comp.height,
        x: comp.x,
        y: comp.y,
        ...comp.properties,
      },
      children: [],
    })),
    frames: [
      {
        id: "frame-1",
        name: "Main Frame",
        width: 1440,
        height: components.length * 400,
        children: components.map((c) => c.id),
      },
    ],
  };

  const jsonContent = JSON.stringify(framerConfig, null, 2);
  const fileKey = `exports/${projectName}/framer-${nanoid()}.json`;
  const buffer = Buffer.from(jsonContent, "utf-8");

  const { url } = await storagePut(fileKey, buffer, "application/json");

  return {
    url,
    fileKey,
    format: "framer",
    fileName: `${projectName}-framer.json`,
  };
}

// ============ FIGMA EXPORT ============
export async function exportToFigma(
  components: ExportComponent[],
  designTokens: DesignTokens,
  projectName: string
) {
  const figmaDocument = {
    document: {
      id: "0:0",
      name: projectName,
      type: "DOCUMENT",
      children: [
        {
          id: "1:0",
          name: "Page 1",
          type: "CANVAS",
          children: components.map((comp, idx) => ({
            id: `${idx}:0`,
            name: comp.title,
            type: "FRAME",
            x: comp.x,
            y: comp.y,
            width: comp.width * 10,
            height: comp.height * 10,
            fills: [
              {
                blendMode: "NORMAL",
                type: "SOLID",
                color: {
                  r: hexToRgb(comp.bgColor).r / 255,
                  g: hexToRgb(comp.bgColor).g / 255,
                  b: hexToRgb(comp.bgColor).b / 255,
                  a: 1,
                },
              },
            ],
            children: [
              {
                id: `${idx}:1`,
                name: "Text",
                type: "TEXT",
                characters: comp.content,
                fills: [
                  {
                    blendMode: "NORMAL",
                    type: "SOLID",
                    color: {
                      r: hexToRgb(comp.textColor).r / 255,
                      g: hexToRgb(comp.textColor).g / 255,
                      b: hexToRgb(comp.textColor).b / 255,
                      a: 1,
                    },
                  },
                ],
              },
            ],
          })),
        },
      ],
    },
    assets: [],
    styles: Object.entries(designTokens.colors || {}).map(([name, color]) => ({
      key: nanoid(),
      name: `Color/${name}`,
      description: `Color token: ${name}`,
      remote: false,
      paints: [
        {
          blendMode: "NORMAL",
          type: "SOLID",
          color: {
            r: hexToRgb(color).r / 255,
            g: hexToRgb(color).g / 255,
            b: hexToRgb(color).b / 255,
            a: 1,
          },
        },
      ],
    })),
  };

  const jsonContent = JSON.stringify(figmaDocument, null, 2);
  const fileKey = `exports/${projectName}/figma-${nanoid()}.json`;
  const buffer = Buffer.from(jsonContent, "utf-8");

  const { url } = await storagePut(fileKey, buffer, "application/json");

  return {
    url,
    fileKey,
    format: "figma",
    fileName: `${projectName}-figma.json`,
  };
}

// ============ WEBFLOW EXPORT ============
export async function exportToWebflow(
  components: ExportComponent[],
  designTokens: DesignTokens,
  projectName: string
) {
  const webflowSite = {
    _id: nanoid(),
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    publishedOn: new Date().toISOString(),
    name: projectName,
    shortName: projectName.toLowerCase().replace(/\s+/g, "-"),
    lastPublishedOn: new Date().toISOString(),
    createdBy: "ai-builder",
    updatedBy: "ai-builder",
    pages: [
      {
        _id: nanoid(),
        createdOn: new Date().toISOString(),
        updatedOn: new Date().toISOString(),
        publishedOn: new Date().toISOString(),
        name: "Home",
        slug: "index",
        title: `${projectName} - Home`,
        rootElementId: nanoid(),
        children: components.map((comp) => ({
          _id: comp.id,
          tag: "div",
          text: comp.title,
          role: "section",
          classes: [`component-${comp.type}`],
          customAttributes: {
            "data-component-type": comp.type,
          },
          style: {
            backgroundColor: comp.bgColor,
            color: comp.textColor,
            width: `${comp.width}%`,
            height: `${comp.height}px`,
            position: "relative",
            left: `${comp.x}%`,
            top: `${comp.y}px`,
          },
          children: [
            {
              _id: nanoid(),
              tag: "p",
              text: comp.content,
            },
          ],
        })),
      },
    ],
    globalStyles: {
      colors: designTokens.colors || {},
      typography: designTokens.typography || {},
      spacing: designTokens.spacing || {},
    },
    cmsLocales: [
      {
        _id: nanoid(),
        name: "English",
        default: true,
        code: "en",
      },
    ],
  };

  const jsonContent = JSON.stringify(webflowSite, null, 2);
  const fileKey = `exports/${projectName}/webflow-${nanoid()}.json`;
  const buffer = Buffer.from(jsonContent, "utf-8");

  const { url } = await storagePut(fileKey, buffer, "application/json");

  return {
    url,
    fileKey,
    format: "webflow",
    fileName: `${projectName}-webflow.json`,
  };
}

// ============ HTML/CSS EXPORT ============
export async function exportToHTML(
  components: ExportComponent[],
  designTokens: DesignTokens,
  projectName: string
) {
  const cssVariables = Object.entries(designTokens.colors || {})
    .map(([name, color]) => `  --color-${name.toLowerCase()}: ${color};`)
    .join("\n");

  const componentsHTML = components
    .map(
      (comp) => `
  <section class="component component-${comp.type}" style="background-color: ${comp.bgColor}; color: ${comp.textColor}; width: ${comp.width}%; height: ${comp.height}px;">
    <div class="component-content">
      <h2>${escapeHtml(comp.title)}</h2>
      <p>${escapeHtml(comp.content)}</p>
    </div>
  </section>
`
    )
    .join("\n");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectName)}</title>
  <style>
    :root {
${cssVariables}
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
    }

    .container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .component {
      padding: 40px 20px;
      margin: 20px 0;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .component-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .component-content h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .component-content p {
      font-size: 1rem;
      line-height: 1.8;
      opacity: 0.9;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .component {
        padding: 30px 15px;
      }

      .component-content h2 {
        font-size: 1.5rem;
      }

      .component-content p {
        font-size: 0.95rem;
      }
    }

    @media (max-width: 480px) {
      .component {
        padding: 20px 10px;
      }

      .component-content h2 {
        font-size: 1.25rem;
      }

      .component-content p {
        font-size: 0.9rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
${componentsHTML}
  </div>
</body>
</html>`;

  const fileKey = `exports/${projectName}/html-${nanoid()}.html`;
  const buffer = Buffer.from(htmlContent, "utf-8");

  const { url } = await storagePut(fileKey, buffer, "text/html");

  return {
    url,
    fileKey,
    format: "html",
    fileName: `${projectName}.html`,
  };
}

// ============ HELPER FUNCTIONS ============
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function escapeHtml(text: string) {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
