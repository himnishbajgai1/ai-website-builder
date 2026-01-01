import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

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
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("Auth Procedures", () => {
  it("should return current user via auth.me", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toEqual(ctx.user);
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Test User 1");
  });

  it("should clear cookie on logout", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("Project Procedures", () => {
  it("should create a new project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      name: "Test Project",
      description: "A test project",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Project");
    expect(result.description).toBe("A test project");
    expect(result.userId).toBe(ctx.user.id);
    expect(result.status).toBe("draft");
  });

  it("should list user projects", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project first
    await caller.projects.create({
      name: "Project 1",
    });

    await caller.projects.create({
      name: "Project 2",
    });

    const projects = await caller.projects.list();

    expect(projects).toHaveLength(2);
    expect(projects[0]?.name).toBe("Project 2"); // Most recent first
    expect(projects[1]?.name).toBe("Project 1");
  });

  it("should get a specific project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.projects.create({
      name: "Test Project",
    });

    const retrieved = await caller.projects.get({
      projectId: created.id,
    });

    expect(retrieved.id).toBe(created.id);
    expect(retrieved.name).toBe("Test Project");
  });

  it("should update a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.projects.create({
      name: "Original Name",
    });

    const updated = await caller.projects.update({
      projectId: created.id,
      name: "Updated Name",
      status: "published",
    });

    expect(updated?.name).toBe("Updated Name");
    expect(updated?.status).toBe("published");
  });

  it("should delete a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.projects.create({
      name: "To Delete",
    });

    const deleted = await caller.projects.delete({
      projectId: created.id,
    });

    expect(deleted).toBe(true);

    // Verify it's deleted by trying to get it
    try {
      await caller.projects.get({ projectId: created.id });
      expect.fail("Should have thrown NOT_FOUND error");
    } catch (error: any) {
      expect(error.code).toBe("NOT_FOUND");
    }
  });

  it("should prevent access to other user's projects", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const { ctx: ctx2 } = createAuthContext(2);

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const project = await caller1.projects.create({
      name: "User 1 Project",
    });

    // User 2 should not be able to access User 1's project
    try {
      await caller2.projects.get({ projectId: project.id });
      expect.fail("Should have thrown NOT_FOUND error");
    } catch (error: any) {
      expect(error.code).toBe("NOT_FOUND");
    }
  });
});

describe("Design Procedures", () => {
  it("should create a design for a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Test Design",
      designData: { sections: [] },
      designTokens: { colors: { primary: "#3B82F6" } },
    });

    expect(design).toBeDefined();
    expect(design.name).toBe("Test Design");
    expect(design.projectId).toBe(project.id);
    expect(design.version).toBe(1);
  });

  it("should list designs for a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
    });

    await caller.designs.create({
      projectId: project.id,
      name: "Design 1",
      designData: {},
      designTokens: {},
    });

    await caller.designs.create({
      projectId: project.id,
      name: "Design 2",
      designData: {},
      designTokens: {},
    });

    const designs = await caller.designs.list({
      projectId: project.id,
    });

    expect(designs).toHaveLength(2);
  });

  it("should update a design", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Original Design",
      designData: {},
      designTokens: {},
    });

    const updated = await caller.designs.update({
      designId: design.id,
      name: "Updated Design",
      designTokens: { colors: { primary: "#FF0000" } },
    });

    expect(updated?.name).toBe("Updated Design");
    expect((updated?.designTokens as any)?.colors?.primary).toBe("#FF0000");
  });
});

describe("Template Procedures", () => {
  it("should list public templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.templates.list({});

    expect(Array.isArray(templates)).toBe(true);
  });

  it("should filter templates by category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.templates.list({
      category: "hero",
    });

    expect(Array.isArray(templates)).toBe(true);
  });
});

describe("Export Procedures", () => {
  it("should export design to Framer format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Test Design",
      designData: { sections: [] },
      designTokens: { colors: { primary: "#3B82F6" } },
    });

    const exportResult = await caller.exports.exportToFramer({
      projectId: project.id,
      designId: design.id,
    });

    expect(exportResult).toBeDefined();
    expect(exportResult.exportType).toBe("framer");
    expect(exportResult.fileUrl).toBeDefined();
    expect(exportResult.fileKey).toBeDefined();
  });

  it("should export design to Figma format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Test Design",
      designData: {},
      designTokens: {},
    });

    const exportResult = await caller.exports.exportToFigma({
      projectId: project.id,
      designId: design.id,
    });

    expect(exportResult.exportType).toBe("figma");
  });

  it("should export design to Webflow format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Test Design",
      designData: {},
      designTokens: {},
    });

    const exportResult = await caller.exports.exportToWebflow({
      projectId: project.id,
      designId: design.id,
    });

    expect(exportResult.exportType).toBe("webflow");
  });

  it("should export design to HTML format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Test Design",
      designData: [{ title: "Hero", content: "Welcome" }],
      designTokens: { colors: { primary: "#3B82F6" } },
    });

    const exportResult = await caller.exports.exportToHTML({
      projectId: project.id,
      designId: design.id,
    });

    expect(exportResult.exportType).toBe("html");
    expect(exportResult.fileUrl).toBeDefined();
  });

  it("should list exports for a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
    });

    const design = await caller.designs.create({
      projectId: project.id,
      name: "Test Design",
      designData: {},
      designTokens: {},
    });

    await caller.exports.exportToFramer({
      projectId: project.id,
      designId: design.id,
    });

    const exports = await caller.exports.list({
      projectId: project.id,
    });

    expect(exports.length).toBeGreaterThan(0);
    expect(exports[0]?.exportType).toBe("framer");
  });
});

describe("Asset Procedures", () => {
  it("should list project assets", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
    });

    const assets = await caller.assets.list({
      projectId: project.id,
    });

    expect(Array.isArray(assets)).toBe(true);
  });
});
