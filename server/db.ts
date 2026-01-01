import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, designs, exports, templates, generatedImages, projectAssets, Project, Design, Template, Export, GeneratedImage, ProjectAsset } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PROJECT QUERIES ============

export async function createProject(userId: number, data: { name: string; description?: string; prompt?: string }): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values({
    userId,
    name: data.name,
    description: data.description,
    prompt: data.prompt,
    status: "draft",
  });

  const projectId = result[0].insertId;
  const created = await db.select().from(projects).where(eq(projects.id, projectId as number)).limit(1);
  return created[0]!;
}

export async function getProjectById(projectId: number, userId: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserProjects(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function updateProject(projectId: number, userId: number, data: Partial<{ name: string; description: string; status: "draft" | "published" | "archived" }>): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(projects).set(data).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return getProjectById(projectId, userId);
}

export async function deleteProject(projectId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return true;
}

// ============ DESIGN QUERIES ============

export async function createDesign(projectId: number, data: { name: string; designData: unknown; designTokens: unknown; metadata?: unknown }): Promise<Design> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(designs).values({
    projectId,
    name: data.name,
    designData: data.designData,
    designTokens: data.designTokens,
    metadata: data.metadata,
    version: 1,
  });

  const designId = result[0].insertId;
  const created = await db.select().from(designs).where(eq(designs.id, designId as number)).limit(1);
  return created[0]!;
}

export async function getDesignById(designId: number): Promise<Design | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(designs).where(eq(designs.id, designId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProjectDesigns(projectId: number): Promise<Design[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(designs).where(eq(designs.projectId, projectId)).orderBy(desc(designs.updatedAt));
}

export async function updateDesign(designId: number, data: Partial<{ name: string; designData: unknown; designTokens: unknown; metadata: unknown }>): Promise<Design | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(designs).set(data).where(eq(designs.id, designId));
  return getDesignById(designId);
}

// ============ EXPORT QUERIES ============

export async function createExport(projectId: number, designId: number, exportType: string, fileUrl: string, fileKey: string, exportData?: unknown): Promise<Export> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(exports).values({
    projectId,
    designId,
    exportType: exportType as any,
    fileUrl,
    fileKey,
    exportData,
  });

  const exportId = result[0].insertId;
  const created = await db.select().from(exports).where(eq(exports.id, exportId as number)).limit(1);
  return created[0]!;
}

export async function getProjectExports(projectId: number): Promise<Export[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(exports).where(eq(exports.projectId, projectId)).orderBy(desc(exports.createdAt));
}

// ============ TEMPLATE QUERIES ============

export async function getTemplates(category?: string): Promise<Template[]> {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return db.select().from(templates).where(and(eq(templates.category, category), eq(templates.isPublic, 1))).orderBy(desc(templates.createdAt));
  }

  return db.select().from(templates).where(eq(templates.isPublic, 1)).orderBy(desc(templates.createdAt));
}

export async function getTemplateById(templateId: number): Promise<Template | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ GENERATED IMAGE QUERIES ============

export async function createGeneratedImage(projectId: number, prompt: string, imageUrl: string, imageKey: string, metadata?: unknown): Promise<GeneratedImage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generatedImages).values({
    projectId,
    prompt,
    imageUrl,
    imageKey,
    metadata,
  });

  const imageId = result[0].insertId;
  const created = await db.select().from(generatedImages).where(eq(generatedImages.id, imageId as number)).limit(1);
  return created[0]!;
}

export async function getProjectImages(projectId: number): Promise<GeneratedImage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(generatedImages).where(eq(generatedImages.projectId, projectId)).orderBy(desc(generatedImages.createdAt));
}

// ============ PROJECT ASSET QUERIES ============

export async function createProjectAsset(projectId: number, data: { assetType: string; fileName: string; fileUrl: string; fileKey: string; fileSize?: number; mimeType?: string; metadata?: unknown }): Promise<ProjectAsset> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectAssets).values({
    projectId,
    assetType: data.assetType as any,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    fileKey: data.fileKey,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    metadata: data.metadata,
  });

  const assetId = result[0].insertId;
  const created = await db.select().from(projectAssets).where(eq(projectAssets.id, assetId as number)).limit(1);
  return created[0]!;
}

export async function getProjectAssets(projectId: number): Promise<ProjectAsset[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projectAssets).where(eq(projectAssets.projectId, projectId)).orderBy(desc(projectAssets.createdAt));
}

export async function deleteProjectAsset(assetId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(projectAssets).where(eq(projectAssets.id, assetId));
  return true;
}
