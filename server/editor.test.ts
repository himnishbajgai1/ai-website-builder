import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Visual Editor Functionality", () => {
  it("should create a project and design for editing", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create project
    const project = await caller.projects.create({
      name: "Editor Test Project",
      description: "Testing visual editor",
    });

    expect(project).toBeDefined();
    expect(project.id).toBeGreaterThan(0);

    // Create design for the project
    const design = await caller.designs.create({
      projectId: project.id,
      name: "Test Design",
      designData: [
        {
          id: "hero-1",
          type: "hero",
          title: "Hero Section",
          content: "Welcome to our site",
        },
        {
          id: "features-1",
          type: "features",
          title: "Features",
          content: "Our amazing features",
        },
      ],
      designTokens: {
        colors: {
          primary: "#3B82F6",
          secondary: "#10B981",
        },
        typography: {
          fontFamily: "Inter, sans-serif",
          headingSize: "2rem",
        },
        spacing: {
          sm: "1rem",
          md: "1.5rem",
        },
      },
    });

    expect(design).toBeDefined();
    expect(design.name).toBe("Test Design");
    expect(design.version).toBe(1);
    expect(Array.isArray(design.designData)).toBe(true);
  });

  it("should update design with new components", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Update Test",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Initial Design",
      designData: [],
      designTokens: {
        colors: { primary: "#3B82F6" },
        typography: { fontFamily: "Inter" },
        spacing: { sm: "1rem" },
      },
    });

    // Update design with new components
    const updated = await caller.designs.update({
      designId: design.id,
      designData: [
        { id: "cta-1", type: "cta", title: "CTA Section", content: "Call to action" },
      ],
    });

    expect(updated).toBeDefined();
    expect(Array.isArray(updated?.designData)).toBe(true);
  });

  it("should generate design from AI prompt", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "AI Generation Test",
    });

    const design = await caller.ai.generateWebsite.mutate({
      projectId: project.id,
      prompt: "Create a modern SaaS landing page with hero section, features, pricing, and CTA",
    });

    expect(design).toBeDefined();
    expect(design.designData).toBeDefined();
    expect(Array.isArray(design.designData)).toBe(true);
    expect(design.designTokens).toBeDefined();
  });

  it("should export design to multiple formats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Export Test",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Export Design",
      designData: [{ type: "hero", title: "Hero", content: "Welcome" }],
      designTokens: {
        colors: { primary: "#3B82F6" },
        typography: { fontFamily: "Inter" },
        spacing: { sm: "1rem" },
      },
    });

    // Test Framer export
    const framerExport = await caller.exports.exportToFramer({
      projectId: project.id,
      designId: design.id,
    });

    expect(framerExport).toBeDefined();
    expect(framerExport.exportType).toBe("framer");
    expect(framerExport.fileUrl).toBeDefined();

    // Test Figma export
    const figmaExport = await caller.exports.exportToFigma({
      projectId: project.id,
      designId: design.id,
    });

    expect(figmaExport).toBeDefined();
    expect(figmaExport.exportType).toBe("figma");

    // Test Webflow export
    const webflowExport = await caller.exports.exportToWebflow({
      projectId: project.id,
      designId: design.id,
    });

    expect(webflowExport).toBeDefined();
    expect(webflowExport.exportType).toBe("webflow");

    // Test HTML export
    const htmlExport = await caller.exports.exportToHTML({
      projectId: project.id,
      designId: design.id,
    });

    expect(htmlExport).toBeDefined();
    expect(htmlExport.exportType).toBe("html");
  });

  it("should list all exports for a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "List Exports Test",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Test Design",
      designData: [],
      designTokens: {
        colors: { primary: "#3B82F6" },
        typography: { fontFamily: "Inter" },
        spacing: { sm: "1rem" },
      },
    });

    // Create multiple exports
    await caller.exports.exportToFramer({
      projectId: project.id,
      designId: design.id,
    });

    await caller.exports.exportToHTML({
      projectId: project.id,
      designId: design.id,
    });

    // List exports
    const exports = await caller.exports.list({
      projectId: project.id,
    });

    expect(exports.length).toBeGreaterThanOrEqual(2);
    expect(exports.some((e) => e.exportType === "framer")).toBe(true);
    expect(exports.some((e) => e.exportType === "html")).toBe(true);
  });

  it("should handle design customization", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Customization Test",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Customizable Design",
      designData: [
        {
          id: "hero-1",
          type: "hero",
          title: "Hero",
          content: "Welcome",
          properties: {
            backgroundColor: "#3B82F6",
            textColor: "#FFFFFF",
            padding: "2rem",
          },
        },
      ],
      designTokens: {
        colors: { primary: "#3B82F6" },
        typography: { fontFamily: "Inter" },
        spacing: { sm: "1rem" },
      },
    });

    // Update with new customization
    const customized = await caller.designs.update({
      designId: design.id,
      designTokens: {
        colors: { primary: "#EF4444", secondary: "#10B981" },
        typography: { fontFamily: "Poppins, sans-serif", headingSize: "2.5rem" },
        spacing: { sm: "1.2rem", md: "2rem" },
      },
    });

    expect(customized).toBeDefined();
    expect((customized?.designTokens as any)?.colors?.primary).toBe("#EF4444");
  });
});
