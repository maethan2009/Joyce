export type UserRole =
  | 'super_admin'
  | 'student_free'
  | 'student_verified'
  | 'school_admin'
  | 'pro_recruiter'
  // legacy (migrated)
  | 'student'
  | 'candidate'
  | 'election_admin'
  | 'campus_admin';

export type AccountStatus = 'pending' | 'approved' | 'rejected';
export type ResourceType = 'course' | 'past_exam' | 'summary' | 'other';
export type SkillCategory = 'tutoring' | 'network_support' | 'graphic_design' | 'other';
export type OfferStatus = 'open' | 'in_progress' | 'closed';
export type ElectionStatus = 'draft' | 'open' | 'closed' | 'archived';
export type ScholarshipRegion = 'cameroun' | 'afrique' | 'international';
export type PostVisibility = 'public' | 'followers' | 'school';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CertificationStatus = 'pending' | 'validated' | 'rejected';

export interface EligibleStudent {
  matricule: string;
  official_email: string;
  full_name: string;
  filiere: string;
  niveau: string;
  school_id: string | null;
  is_activated: boolean;
  activated_at: string | null;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string | null;
  category: string;
  ranking_position: number | null;
  why_top: string | null;
  advantages: string[];
  disadvantages: string[];
  admission_info: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  elections_enabled: boolean;
  mentorship_enabled: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  matricule: string | null;
  full_name: string;
  role: UserRole;
  filiere: string | null;
  niveau: string | null;
  school_id: string | null;
  account_status: AccountStatus;
  company_name: string | null;
  bio: string | null;
  headline: string | null;
  skills: string[];
  website_url: string | null;
  avatar_url: string | null;
  totp_secret: string | null;
  totp_enrolled_at: string | null;
  interests: string[];
  is_mentor_opt_in: boolean;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  school?: School | null;
}

export interface Scholarship {
  id: string;
  title: string;
  region: ScholarshipRegion;
  country: string | null;
  description: string | null;
  eligibility: string | null;
  amount: string | null;
  deadline: string | null;
  application_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Career {
  id: string;
  name: string;
  slug: string;
  letter: string;
  missions: string | null;
  limits_notes: string | null;
  advantages: string[];
  disadvantages: string[];
  study_duration: string | null;
  professionalization: string | null;
  avg_retirement_age: number | null;
  is_published: boolean;
  created_at: string;
}

export interface SocialPost {
  id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  visibility: PostVisibility;
  achievement_type: string | null;
  created_at: string;
  author?: Profile;
  likes_count?: number;
  liked_by_me?: boolean;
}

export interface Conversation {
  id: string;
  subject: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: Profile[];
  last_message?: DirectMessage | null;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ProfessionalCourse {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  skills: string[];
  media_url: string | null;
  duration_hours: number | null;
  status: CourseStatus;
  created_at: string;
  author?: Profile;
}

export interface Certification {
  id: string;
  course_id: string | null;
  student_id: string;
  validator_id: string | null;
  title: string;
  skills: string[];
  status: CertificationStatus;
  issued_at: string | null;
  created_at: string;
}

export interface AcademicModule {
  id: string;
  school_id: string | null;
  code: string;
  title: string;
  filiere: string | null;
  niveau: string | null;
  ects: number;
  semester: string | null;
  academic_year: string | null;
  created_at: string;
}

export interface AcademicGrade {
  id: string;
  module_id: string;
  student_id: string;
  grade: number | null;
  ects_earned: number;
  created_at: string;
  module?: AcademicModule;
}

export interface AcademicAssignment {
  id: string;
  module_id: string | null;
  school_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  assignment_type: string;
  created_at: string;
}

export interface CampusEvent {
  id: string;
  school_id: string | null;
  title: string;
  category: string;
  organizer: string | null;
  date: string;
  time: string | null;
  location: string | null;
  image: string | null;
  description: string | null;
  program: string[];
  is_contest: boolean;
  requires_registration: boolean;
  created_at: string;
}

export interface Election {
  id: string;
  title: string;
  description: string | null;
  status: ElectionStatus;
  opens_at: string;
  closes_at: string;
  created_by: string | null;
  created_at: string;
}

export interface Candidate {
  id: string;
  election_id: string;
  profile_id: string | null;
  display_name: string;
  program_url: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface ElectionVoter {
  election_id: string;
  user_id: string;
  has_voted: boolean;
  voted_at: string | null;
}

export interface ElectionResult {
  election_id: string;
  candidate_id: string;
  vote_count: number;
}

export interface AcademicResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  filiere: string;
  niveau: string;
  matiere: string;
  academic_year: string | null;
  storage_path: string;
  file_size_kb: number | null;
  uploaded_by: string | null;
  download_count: number;
  created_at: string;
}

export interface SkillOffer {
  id: string;
  owner_id: string;
  category: SkillCategory;
  title: string;
  description: string;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface SkillConversation {
  id: string;
  offer_id: string;
  requester_id: string;
  owner_id: string;
  created_at: string;
}

export interface SkillMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface MentorshipMatch {
  id: string;
  mentor_id: string;
  mentee_id: string;
  match_score: number;
  matched_on: string[];
  status: 'proposed' | 'accepted' | 'declined';
  created_at: string;
  mentor?: Profile;
}

export interface EventPass {
  id: string;
  event_name: string;
  starts_at: string;
  ends_at: string;
  created_by: string | null;
  created_at: string;
}

export interface EventCheckin {
  id: string;
  event_id: string;
  profile_id: string;
  checked_in_at: string;
  scanned_by: string | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  category: string;
  type: string;
  description: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  created_at?: string;
}

/** Role capability helpers */
export const VERIFIED_ROLES: UserRole[] = ['student_verified', 'campus_admin', 'election_admin', 'student'];
export const FREE_OR_VERIFIED: UserRole[] = [
  'student_free',
  'student_verified',
  'student',
  'campus_admin',
  'election_admin',
  'candidate',
];

export function isVerifiedStudent(role?: UserRole | null): boolean {
  return !!role && VERIFIED_ROLES.includes(role);
}

export function canAccessOrientation(role?: UserRole | null): boolean {
  return !!role && [...FREE_OR_VERIFIED, 'super_admin', 'school_admin', 'pro_recruiter'].includes(role);
}

export function canAccessAcademicHub(role?: UserRole | null): boolean {
  return isVerifiedStudent(role) || role === 'super_admin' || role === 'school_admin';
}

export function canAccessStudentCard(role?: UserRole | null): boolean {
  return isVerifiedStudent(role) || role === 'super_admin';
}
