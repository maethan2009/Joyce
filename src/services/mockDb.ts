import * as mock from './mockData';
import type {
  AcademicResource,
  Candidate,
  Election,
  ElectionResult,
  ElectionVoter,
  MentorshipMatch,
  Profile,
  SkillConversation,
  SkillMessage,
  SkillOffer,
} from '@/types';

type Ballot = { election_id: string; candidate_id: string; vote_batch_date: string };

class MockDB {
  ballots: Ballot[] = structuredClone(mock.mockData.ballots);
  voterRegistry: ElectionVoter[] = structuredClone(mock.mockData.voterRegistry);
  skillMessages: SkillMessage[] = structuredClone(mock.mockData.skillMessages);
  skillConversations: SkillConversation[] = structuredClone(mock.mockData.skillConversations);
  skillOffers: SkillOffer[] = structuredClone(mock.mockData.skillOffers);
  mentorshipMatches: MentorshipMatch[] = structuredClone(mock.mockData.mentorshipMatches);
  profiles: Profile[] = structuredClone(mock.mockData.profiles);
  academicResources: AcademicResource[] = structuredClone(mock.mockData.academicResources);
  elections: Election[] = structuredClone(mock.mockData.elections);
  candidates: Candidate[] = structuredClone(mock.mockData.candidates);

  uid() {
    return crypto.randomUUID();
  }
}

export const db = new MockDB();
