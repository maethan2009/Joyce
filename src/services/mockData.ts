import type {
  AcademicResource,
  Candidate,
  Election,
  EligibleStudent,
  MentorshipMatch,
  Profile,
  SkillConversation,
  SkillMessage,
  SkillOffer,
} from '@/types';

// Fichier de données mockées vidé pour basculer sur Supabase
export const mockData = {
  eligible: [] as EligibleStudent[],
  profiles: [] as Profile[],
  elections: [] as Election[],
  candidates: [] as Candidate[],
  ballots: [] as { election_id: string; candidate_id: string; vote_batch_date: string }[],
  voterRegistry: [] as any[],
  academicResources: [] as AcademicResource[],
  skillOffers: [] as SkillOffer[],
  skillConversations: [] as SkillConversation[],
  skillMessages: [] as SkillMessage[],
  mentorshipMatches: [] as MentorshipMatch[],
};

export const DEMO_MATRICULES: string[] = [];
export const DEMO_EMAILS: string[] = [];