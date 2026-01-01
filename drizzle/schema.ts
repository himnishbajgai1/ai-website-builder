import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Website projects created by users.
 * Each project represents a complete website design.
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  prompt: text("prompt"), // Original AI prompt used to generate the website
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  thumbnail: varchar("thumbnail", { length: 512 }), // S3 URL to project thumbnail
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Website designs - the actual design data for each project.
 * Stores the complete design structure, components, and styling.
 */
export const designs = mysqlTable("designs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  version: int("version").default(1).notNull(), // Version tracking for design history
  name: varchar("name", { length: 255 }).notNull(),
  designData: json("designData").notNull(), // Complete design structure (sections, components, layout)
  designTokens: json("designTokens").notNull(), // Colors, typography, spacing, shadows
  metadata: json("metadata"), // Additional metadata like viewport settings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Design = typeof designs.$inferSelect;
export type InsertDesign = typeof designs.$inferInsert;

/**
 * Export records - tracks exports to different platforms.
 * Stores export history and file references.
 */
export const exports = mysqlTable("exports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  designId: int("designId").notNull(),
  exportType: mysqlEnum("exportType", ["framer", "figma", "webflow", "html"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(), // S3 URL to exported file
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 file key for retrieval
  exportData: json("exportData"), // Export-specific metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Export = typeof exports.$inferSelect;
export type InsertExport = typeof exports.$inferInsert;

/**
 * Template library - pre-built website sections and layouts.
 * Provides users with starting points for website generation.
 */
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // hero, features, pricing, testimonials, etc.
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 512 }), // S3 URL to template thumbnail
  templateData: json("templateData").notNull(), // Design structure for this template
  designTokens: json("designTokens").notNull(), // Default design tokens
  isPublic: int("isPublic").default(1).notNull(), // 1 for public, 0 for private
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Generated images - AI-generated graphics for website designs.
 * Tracks images created through AI image generation service.
 */
export const generatedImages = mysqlTable("generatedImages", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  prompt: text("prompt").notNull(), // Original image generation prompt
  imageUrl: varchar("imageUrl", { length: 512 }).notNull(), // S3 URL to generated image
  imageKey: varchar("imageKey", { length: 512 }).notNull(), // S3 file key
  metadata: json("metadata"), // Image metadata (dimensions, format, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = typeof generatedImages.$inferInsert;

/**
 * Project assets - files and resources associated with projects.
 * Stores user-uploaded files, generated assets, and project resources.
 */
export const projectAssets = mysqlTable("projectAssets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  assetType: mysqlEnum("assetType", ["image", "font", "icon", "video", "document"]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 file key
  fileSize: int("fileSize"), // File size in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  metadata: json("metadata"), // Additional asset metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectAsset = typeof projectAssets.$inferSelect;
export type InsertProjectAsset = typeof projectAssets.$inferInsert;
