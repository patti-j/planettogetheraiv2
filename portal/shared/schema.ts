import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// External Companies (Suppliers, Customers, OEMs)
export const externalCompanies = pgTable('external_companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'supplier' | 'customer' | 'oem'
  erpLinkId: text('erp_link_id'), // Link to main ERP system
  industry: text('industry'),
  size: text('size'), // 'small' | 'medium' | 'large' | 'enterprise'
  country: text('country'),
  city: text('city'),
  address: text('address'),
  taxId: text('tax_id'),
  
  // AI Configuration
  aiOnboardingComplete: boolean('ai_onboarding_complete').default(false),
  aiPreferences: jsonb('ai_preferences'),
  aiUsageLevel: text('ai_usage_level').default('basic'), // 'basic' | 'intermediate' | 'advanced'
  
  // Permissions & Features
  enabledFeatures: jsonb('enabled_features'),
  customSettings: jsonb('custom_settings'),
  
  // Status
  status: text('status').default('pending'), // 'pending' | 'active' | 'suspended'
  verificationStatus: text('verification_status').default('unverified'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  activatedAt: timestamp('activated_at'),
  lastActivityAt: timestamp('last_activity_at'),
});

// External Users
export const externalUsers = pgTable('external_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  companyId: uuid('company_id').references(() => externalCompanies.id),
  
  // Profile
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  jobTitle: text('job_title'),
  department: text('department'),
  avatar: text('avatar'),
  
  // Role & Permissions
  role: text('role').notNull(), // 'admin' | 'manager' | 'user' | 'viewer'
  permissions: jsonb('permissions'),
  accessLevel: text('access_level').default('standard'),
  
  // AI Interaction
  aiConversationHistory: jsonb('ai_conversation_history'),
  aiPersonalization: jsonb('ai_personalization'),
  preferredLanguage: text('preferred_language').default('en'),
  aiAssistanceLevel: text('ai_assistance_level').default('proactive'),
  
  // Authentication
  emailVerified: boolean('email_verified').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  
  // Status
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Portal Sessions
export const portalSessions = pgTable('portal_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').notNull().unique(),
  userId: uuid('user_id').references(() => externalUsers.id),
  companyId: uuid('company_id').references(() => externalCompanies.id),
  
  // Session Data
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceType: text('device_type'),
  
  // AI Context
  aiSessionContext: jsonb('ai_session_context'),
  currentWorkflow: text('current_workflow'),
  
  // Expiry
  expiresAt: timestamp('expires_at').notNull(),
  lastActivityAt: timestamp('last_activity_at'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
});

// Portal Permissions
export const portalPermissions = pgTable('portal_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => externalUsers.id),
  companyId: uuid('company_id').references(() => externalCompanies.id),
  
  // Permission Details
  resourceType: text('resource_type').notNull(), // 'order' | 'delivery' | 'document' | 'analytics'
  resourceId: text('resource_id'),
  actions: jsonb('actions').notNull(), // ['view', 'create', 'update', 'delete']
  
  // Conditions
  conditions: jsonb('conditions'), // Additional access conditions
  expiresAt: timestamp('expires_at'),
  
  // Metadata
  grantedBy: uuid('granted_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// AI Onboarding Progress
export const aiOnboardingProgress = pgTable('ai_onboarding_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => externalUsers.id),
  companyId: uuid('company_id').references(() => externalCompanies.id),
  
  // Progress Tracking
  currentStep: text('current_step'),
  completedSteps: jsonb('completed_steps'),
  skippedSteps: jsonb('skipped_steps'),
  
  // AI Interaction
  conversationHistory: jsonb('conversation_history'),
  extractedData: jsonb('extracted_data'),
  suggestedConfiguration: jsonb('suggested_configuration'),
  
  // Status
  status: text('status').default('in_progress'), // 'in_progress' | 'completed' | 'abandoned'
  completionPercentage: integer('completion_percentage').default(0),
  
  // Metadata
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  lastInteractionAt: timestamp('last_interaction_at'),
});

// Portal Activity Log
export const portalActivityLog = pgTable('portal_activity_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => externalUsers.id),
  companyId: uuid('company_id').references(() => externalCompanies.id),
  sessionId: uuid('session_id').references(() => portalSessions.id),
  
  // Activity Details
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  details: jsonb('details'),
  
  // AI Tracking
  aiAssisted: boolean('ai_assisted').default(false),
  aiSuggestion: text('ai_suggestion'),
  aiAccepted: boolean('ai_accepted'),
  
  // Metadata
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Create Zod schemas for validation
export const insertExternalCompanySchema = createInsertSchema(externalCompanies);

export const insertExternalUserSchema = createInsertSchema(externalUsers).extend({
  password: z.string().min(8).max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertPortalSessionSchema = createInsertSchema(portalSessions);
export const insertPortalPermissionSchema = createInsertSchema(portalPermissions);
export const insertAiOnboardingProgressSchema = createInsertSchema(aiOnboardingProgress);
export const insertPortalActivityLogSchema = createInsertSchema(portalActivityLog);

// Type exports
export type ExternalCompany = typeof externalCompanies.$inferSelect;
export type InsertExternalCompany = z.infer<typeof insertExternalCompanySchema>;
export type ExternalUser = typeof externalUsers.$inferSelect;
export type InsertExternalUser = z.infer<typeof insertExternalUserSchema>;
export type PortalSession = typeof portalSessions.$inferSelect;
export type InsertPortalSession = z.infer<typeof insertPortalSessionSchema>;
export type PortalPermission = typeof portalPermissions.$inferSelect;
export type InsertPortalPermission = z.infer<typeof insertPortalPermissionSchema>;
export type AiOnboardingProgress = typeof aiOnboardingProgress.$inferSelect;
export type InsertAiOnboardingProgress = z.infer<typeof insertAiOnboardingProgressSchema>;
export type PortalActivityLog = typeof portalActivityLog.$inferSelect;
export type InsertPortalActivityLog = z.infer<typeof insertPortalActivityLogSchema>;

// Company types enum
export const CompanyType = {
  SUPPLIER: 'supplier',
  CUSTOMER: 'customer',
  OEM: 'oem',
  PARTNER: 'partner',
} as const;

// User roles enum
export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

// AI assistance levels
export const AIAssistanceLevel = {
  MINIMAL: 'minimal',
  STANDARD: 'standard',
  PROACTIVE: 'proactive',
  MAXIMUM: 'maximum',
} as const;