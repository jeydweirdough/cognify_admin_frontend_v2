
// 1. Define it as a regular JavaScript object
export const UserRole = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT'
} as const;

// 2. Export the type so you can still use it like an enum
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// 1. Define it as a regular JavaScript object
export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING'
} as const;

// 2. Export the type so you can still use it like an enum
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RoleConfig {
  role: string;
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  studentNumber?: string;
  lastLogin?: string;
  phoneNumber?: string;
  department?: string;
  settings?: {
    compactSidebar?: boolean;
    notificationsEnabled?: boolean;
    emailAlerts?: boolean;
  };
}

export interface GlobalSystemSettings {
  institutionalPassingGrade: number;
  requireContentApproval: boolean;
  maintenanceMode: boolean;
  allowPublicRegistration: boolean;
  institutionName: string;
  academicYear: string;
}

export interface WhitelistEntry {
  id: string;
  email: string;
  studentNumber: string;
  name: string;
  status: 'REGISTERED' | 'PENDING';
  approvedBy?: string;
  dateAdded: string;
}

// 1. Define it as a regular JavaScript object
export const ContentStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  APPROVED: 'APPROVED',
  REMOVAL_PENDING: 'REMOVAL_PENDING'
} as const;

// 2. Export the type so you can still use it like an enum
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

export interface RevisionNote {
  id: string;
  adminId: string;
  adminName: string;
  note: string;
  timestamp: string;
}

export interface ContentItem {
  id: string;
  title: string;
  subject: string;
  topicId: string;
  type: 'MODULE' | 'REVIEWER' | 'GUIDE';
  format: 'TEXT' | 'PDF';
  content?: string;
  fileUrl?: string;
  status: ContentStatus;
  authorId: string;
  authorName: string;
  submissionCount: number;
  revisionCount: number;
  dateCreated: string;
  lastUpdated: string;
  revisionNotes: RevisionNote[];
}

export interface PsychologyTopic {
  id: string;
  title: string; 
  description?: string; 
  format?: 'TEXT' | 'PDF';
  fileUrl?: string;
  fileName?: string;
  status?: ContentStatus;
  authorId?: string;
  authorName?: string;
  revisionNotes?: RevisionNote[];
  lastUpdated?: string;
  
  // Nested Hierarchy
  subTopics?: PsychologyTopic[];
  
  // PROPOSED CHANGES (Staging area)
  proposedTitle?: string;
  proposedDescription?: string;
  proposedFormat?: 'TEXT' | 'PDF';
  proposedFileUrl?: string;
  proposedFileName?: string;
}

export interface PsychologySubject {
  id: string;
  name: string;
  description: string;
  color: string;
  topics: PsychologyTopic[];
  
  // Workflow fields
  status?: ContentStatus;
  authorName?: string;
  lastUpdated?: string;
  revisionNotes?: RevisionNote[];
  
  orderPendingApproval?: boolean;
  metadataPendingApproval?: boolean;
  proposedMetadata?: {
    name: string;
    description: string;
    color: string;
  };
}

export interface MCQQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

// 1. Define it as a regular JavaScript object
export const AssessmentType = {
  PRE_ASSESSMENT: 'PRE_ASSESSMENT',
  QUIZ: 'QUIZ',
  POST_ASSESSMENT: 'POST_ASSESSMENT'
} as const;

// 2. Export the type so you can still use it like an enum
export type AssessmentType = (typeof AssessmentType)[keyof typeof AssessmentType];

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  subject: string;
  subjectId?: string;
  topicId?: string;
  contentId?: string;
  items: number;
  timeLimit: number;
  status: ContentStatus;
  scheduleType: 'FLEXIBLE' | 'SYNCED';
  scheduleDate?: string;
  authorId: string;
  authorName: string;
  questions: MCQQuestion[];
  dateCreated: string;
  lastUpdated: string;
  revisionNotes: RevisionNote[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface AnalyticsData {
  subject: string;
  readiness: number;
  difficulty: number;
  performance: number;
}
