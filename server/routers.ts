import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut, storageGet } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ PROJECT PROCEDURES ============
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProjects(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Project name is required"),
        description: z.string().optional(),
        prompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createProject(ctx.user.id, input);
      }),

    get: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        return project;
      }),

    update: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        
        const { projectId, ...updateData } = input;
        return db.updateProject(projectId, ctx.user.id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        
        return db.deleteProject(input.projectId, ctx.user.id);
      }),
  }),

  // ============ DESIGN PROCEDURES ============
  designs: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        
        return db.getProjectDesigns(input.projectId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        designData: z.unknown(),
        designTokens: z.unknown(),
        metadata: z.unknown().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        
        return db.createDesign(input.projectId, {
          name: input.name,
          designData: input.designData,
          designTokens: input.designTokens,
          metadata: input.metadata,
        });
      }),

    get: protectedProcedure
      .input(z.object({ designId: z.number() }))
      .query(async ({ ctx, input }) => {
        const design = await db.getDesignById(input.designId);
        if (!design) throw new TRPCError({ code: "NOT_FOUND" });
        
        const project = await db.getProjectById(design.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "FORBIDDEN" });
        
        return design;
      }),

    update: protectedProcedure
      .input(z.object({
        designId: z.number(),
        name: z.string().optional(),
        designData: z.unknown().optional(),
        designTokens: z.unknown().optional(),
        metadata: z.unknown().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const design = await db.getDesignById(input.designId);
        if (!design) throw new TRPCError({ code: "NOT_FOUND" });
        
        const project = await db.getProjectById(design.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "FORBIDDEN" });
        
        const { designId, ...updateData } = input;
        return db.updateDesign(designId, updateData);
      }),
  }),

  // ============ AI GENERATION PROCEDURES ============
  ai: router({
    generateWebsite: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        prompt: z.string().min(10, "Prompt must be at least 10 characters"),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });

        try {
          // Generate website structure using LLM
          const systemPrompt = `You are an expert web designer and developer. Generate a complete website design structure based on the user's prompt. 
Return a JSON object with the following structure:
{
  "sections": [
    {
      "id": "section-1",
      "type": "hero|features|pricing|testimonials|cta|footer",
      "title": "Section Title",
      "content": "Section content",
      "components": [
        {
          "id": "component-1",
          "type": "heading|paragraph|button|image|card",
          "text": "Component text",
          "properties": {}
        }
      ]
    }
  ],
  "designTokens": {
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#10B981",
      "accent": "#F59E0B",
      "background": "#FFFFFF",
      "foreground": "#1F2937"
    },
    "typography": {
      "fontFamily": "Inter, sans-serif",
      "headingSize": "2rem",
      "bodySize": "1rem",
      "lineHeight": "1.5"
    },
    "spacing": {
      "xs": "0.5rem",
      "sm": "1rem",
      "md": "1.5rem",
      "lg": "2rem",
      "xl": "3rem"
    }
  }
}`;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: systemPrompt as string,
              },
              {
                role: "user",
                content: input.prompt as string,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "website_design",
                strict: false,
                schema: {
                  type: "object",
                  properties: {
                    sections: {
                      type: "array",
                      items: {
                        type: "object",
                      },
                    },
                    designTokens: {
                      type: "object",
                    },
                  },
                  required: ["sections", "designTokens"],
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (!content || typeof content !== 'string') throw new Error("No response from LLM");

          const designData = JSON.parse(content);

          // Create design record
          const design = await db.createDesign(input.projectId, {
            name: `Design - ${new Date().toLocaleDateString()}`,
            designData: designData.sections || [],
            designTokens: designData.designTokens || {},
          });

          return design;
        } catch (error) {
          console.error("AI generation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate website design",
          });
        }
      }),

    generateImage: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        prompt: z.string().min(10, "Image prompt must be at least 10 characters"),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });

        try {
          const { url: imageUrl } = await generateImage({
            prompt: input.prompt,
          });

          if (!imageUrl) throw new Error("No image URL returned");

          // Upload to S3
          const imageKey = `projects/${input.projectId}/generated-images/${nanoid()}.png`;
          const response = await fetch(imageUrl);
          const buffer = await response.arrayBuffer();
          
          const { url: s3Url } = await storagePut(imageKey, Buffer.from(buffer), "image/png");

          // Save to database
          return db.createGeneratedImage(
            input.projectId,
            input.prompt,
            s3Url,
            imageKey,
            { width: 1920, height: 1080 }
          );
        } catch (error) {
          console.error("Image generation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate image",
          });
        }
      }),
  }),

  // ============ TEMPLATE PROCEDURES ============
  templates: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getTemplates(input.category);
      }),

    get: publicProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => {
        const template = await db.getTemplateById(input.templateId);
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });
        return template;
      }),
  }),

  // ============ EXPORT PROCEDURES ============
  exports: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        
        return db.getProjectExports(input.projectId);
      }),

    exportToFramer: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        designId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });

        const design = await db.getDesignById(input.designId);
        if (!design) throw new TRPCError({ code: "NOT_FOUND" });

        try {
          const framerData = {
            version: "1.0",
            type: "framer",
            project: project.name,
            design: design.designData,
            tokens: design.designTokens,
          };

          const fileKey = `exports/${input.projectId}/framer-${nanoid()}.json`;
          const { url } = await storagePut(fileKey, JSON.stringify(framerData), "application/json");

          return db.createExport(input.projectId, input.designId, "framer", url, fileKey, framerData);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to export to Framer",
          });
        }
      }),

    exportToFigma: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        designId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });

        const design = await db.getDesignById(input.designId);
        if (!design) throw new TRPCError({ code: "NOT_FOUND" });

        try {
          const figmaData = {
            version: "1.0",
            type: "figma",
            project: project.name,
            design: design.designData,
            tokens: design.designTokens,
          };

          const fileKey = `exports/${input.projectId}/figma-${nanoid()}.json`;
          const { url } = await storagePut(fileKey, JSON.stringify(figmaData), "application/json");

          return db.createExport(input.projectId, input.designId, "figma", url, fileKey, figmaData);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to export to Figma",
          });
        }
      }),

    exportToWebflow: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        designId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });

        const design = await db.getDesignById(input.designId);
        if (!design) throw new TRPCError({ code: "NOT_FOUND" });

        try {
          const webflowData = {
            version: "1.0",
            type: "webflow",
            project: project.name,
            design: design.designData,
            tokens: design.designTokens,
            cms: {
              collections: [],
              fields: [],
            },
          };

          const fileKey = `exports/${input.projectId}/webflow-${nanoid()}.json`;
          const { url } = await storagePut(fileKey, JSON.stringify(webflowData), "application/json");

          return db.createExport(input.projectId, input.designId, "webflow", url, fileKey, webflowData);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to export to Webflow",
          });
        }
      }),

    exportToHTML: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        designId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });

        const design = await db.getDesignById(input.designId);
        if (!design) throw new TRPCError({ code: "NOT_FOUND" });

        try {
          // Generate HTML from design
          const htmlContent = generateHTMLFromDesign(design.designData, design.designTokens);

          const fileKey = `exports/${input.projectId}/html-${nanoid()}.html`;
          const { url } = await storagePut(fileKey, htmlContent, "text/html");

          return db.createExport(input.projectId, input.designId, "html", url, fileKey);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to export to HTML",
          });
        }
      }),
  }),

  // ============ ASSET PROCEDURES ============
  assets: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        
        return db.getProjectAssets(input.projectId);
      }),

    delete: protectedProcedure
      .input(z.object({ assetId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteProjectAsset(input.assetId);
      }),
  }),
});

// Helper function to generate HTML from design
function generateHTMLFromDesign(designData: any, designTokens: any): string {
  const tokens = designTokens || {};
  const colors = tokens.colors || {};
  const typography = tokens.typography || {};

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${typography.fontFamily || "Inter, sans-serif"};
      font-size: ${typography.bodySize || "1rem"};
      line-height: ${typography.lineHeight || "1.5"};
      color: ${colors.foreground || "#1F2937"};
      background-color: ${colors.background || "#FFFFFF"};
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-size: ${typography.headingSize || "2rem"};
      margin-bottom: 1rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .section {
      padding: 3rem 0;
    }
    
    .button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: ${colors.primary || "#3B82F6"};
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      text-decoration: none;
    }
    
    .button:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
`;

  // Add sections
  if (Array.isArray(designData)) {
    designData.forEach((section: any) => {
      html += `  <section class="section" id="${section.id || "section"}">
    <div class="container">
      <h2>${section.title || ""}</h2>
      <p>${section.content || ""}</p>
    </div>
  </section>\n`;
    });
  }

  html += `</body>
</html>`;

  return html;
}

export type AppRouter = typeof appRouter;
