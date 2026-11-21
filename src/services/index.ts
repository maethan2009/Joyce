import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  AcademicAssignment,
  AcademicGrade,
  AcademicModule,
  AcademicResource,
  AppNotification,
  AppUser,
  Candidate,
  Career,
  CampusEvent,
  Certification,
  Conversation,
  DirectMessage,
  Election,
  ElectionResult,
  EligibleStudent,
  MentorshipMatch,
  ProfessionalCourse,
  Profile,
  Scholarship,
  School,
  SkillConversation,
  SkillMessage,
  SkillOffer,
  SocialPost,
  UserRole,
} from '@/types';

function requireClient() {
  if (!isSupabaseConfigured) {
    throw new Error('Connexion Supabase non configurée (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }
  return supabase;
}

function translateAuthError(message?: string): string {
  if (!message) return 'Une erreur d’authentification est survenue.';
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('email not confirmed')) {
    return 'Votre adresse email n’est pas encore confirmée. Vérifiez votre boîte de réception.';
  }
  if (m.includes('user already registered') || m.includes('already registered')) {
    return 'Un compte existe déjà avec cette adresse email.';
  }
  if (m.includes('password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Impossible de joindre le serveur d’authentification. Vérifiez votre connexion.';
  }
  return message;
}

function mapError(err: { message?: string } | null, fallback: string): never {
  throw new Error(err?.message || fallback);
}

export const authService = {
  async verifyEligibility(matricule: string, email: string): Promise<boolean> {
    const client = requireClient();
    const { data, error } = await client.rpc('verify_eligibility', {
      p_matricule: matricule.trim(),
      p_email: email.trim().toLowerCase(),
    });
    if (error) mapError(error, 'Vérification d’éligibilité impossible');
    return Boolean(data);
  },

  async signUp(
    email: string,
    password: string,
    meta?: { full_name?: string; role?: UserRole; company_name?: string },
  ): Promise<AppUser> {
    const client = requireClient();
    const cleanEmail = email.trim();
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: meta?.full_name ?? '',
          role: meta?.role ?? 'student_free',
          company_name: meta?.company_name ?? null,
        },
      },
    });
    if (error || !data.user) {
      throw new Error(translateAuthError(error?.message));
    }
    return {
      id: data.user.id,
      email: data.user.email ?? cleanEmail,
      full_name: (data.user.user_metadata?.full_name as string | undefined) ?? meta?.full_name ?? null,
      role: (data.user.user_metadata?.role as UserRole | undefined) ?? meta?.role,
    };
  },

  async signIn(email: string, password: string): Promise<AppUser> {
    const client = requireClient();
    const cleanEmail = email.trim();
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error || !data.user) {
      throw new Error(translateAuthError(error?.message));
    }
    return {
      id: data.user.id,
      email: data.user.email ?? cleanEmail,
      full_name: (data.user.user_metadata?.full_name as string | undefined) ?? null,
      role: data.user.user_metadata?.role as UserRole | undefined,
    };
  },

  async signOut(): Promise<void> {
    const client = requireClient();
    await client.auth.signOut();
  },

  async updatePassword(newPassword: string): Promise<void> {
    const client = requireClient();
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(translateAuthError(error.message));
  },

  async activateStudent(userId: string, matricule: string, fullName: string): Promise<void> {
    const client = requireClient();
    void userId;
    const { error } = await client.rpc('activate_student', {
      p_matricule: matricule.trim(),
      p_full_name: fullName.trim(),
    });
    if (error) mapError(error, 'Activation du matricule impossible');
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const client = requireClient();
    const { data, error } = await client
      .from('profiles')
      .select('*, school:schools(*)')
      .eq('id', userId)
      .maybeSingle();

    if (!error) {
      return (data as Profile | null) ?? null;
    }

    // Fallback without school join if RLS or foreign relation prevents joining
    const { data: plainData, error: plainError } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (plainError) {
      console.warn('Profil Supabase indisponible:', plainError.message);
      return null;
    }
    return (plainData as Profile | null) ?? null;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const client = requireClient();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.headline !== undefined) payload.headline = updates.headline;
    if (updates.skills !== undefined) payload.skills = updates.skills;
    if (updates.website_url !== undefined) payload.website_url = updates.website_url;
    if (updates.interests !== undefined) payload.interests = updates.interests;
    if (updates.is_mentor_opt_in !== undefined) payload.is_mentor_opt_in = updates.is_mentor_opt_in;
    if (updates.company_name !== undefined) payload.company_name = updates.company_name;
    if (updates.filiere !== undefined) payload.filiere = updates.filiere;
    if (updates.niveau !== undefined) payload.niveau = updates.niveau;

    const { data, error } = await client
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*, school:schools(*)')
      .single();
    if (error) mapError(error, 'Mise à jour du profil impossible');
    return data as Profile;
  },

  async enrollTotp(userId: string, secret: string): Promise<void> {
    const client = requireClient();
    void userId;
    const { error } = await client.rpc('enroll_totp', { p_secret: secret });
    if (error) mapError(error, 'Enrôlement TOTP impossible');
  },

  async listApprovedProfiles(): Promise<Profile[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('account_status', 'approved')
      .order('full_name');
    if (error) mapError(error, 'Liste des membres indisponible');
    return (data as Profile[]) ?? [];
  },

  async getSessionUser(): Promise<AppUser | null> {
    const client = requireClient();
    const { data, error } = await client.auth.getSession();
    if (error) return null;
    const u = data.session?.user;
    if (!u) return null;
    return {
      id: u.id,
      email: u.email ?? '',
      full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
      role: u.user_metadata?.role as UserRole | undefined,
    };
  },
};

export const notificationsService = {
  async listMine(userId: string): Promise<AppNotification[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return [];
    return (data as AppNotification[]) ?? [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const client = requireClient();
    await client.from('notifications').update({ is_read: true }).eq('id', notificationId);
  },

  async markAllAsRead(userId: string): Promise<void> {
    const client = requireClient();
    await client.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  },
};

export const electionService = {
  async listElections(): Promise<Election[]> {
    const client = requireClient();
    const { data, error } = await client.from('elections').select('*').order('opens_at', { ascending: false });
    if (error) mapError(error, 'Chargement des élections impossible');
    return (data as Election[]) ?? [];
  },

  async getElection(id: string): Promise<Election | null> {
    const client = requireClient();
    const { data, error } = await client.from('elections').select('*').eq('id', id).maybeSingle();
    if (error) mapError(error, 'Élection introuvable');
    return (data as Election | null) ?? null;
  },

  async listCandidates(electionId: string): Promise<Candidate[]> {
    const client = requireClient();
    const { data, error } = await client.from('candidates').select('*').eq('election_id', electionId);
    if (error) mapError(error, 'Candidats introuvables');
    return (data as Candidate[]) ?? [];
  },

  async getVoterStatus(electionId: string, userId: string): Promise<boolean> {
    const client = requireClient();
    const { data } = await client
      .from('election_voters')
      .select('has_voted')
      .eq('election_id', electionId)
      .eq('user_id', userId)
      .maybeSingle();
    return Boolean(data?.has_voted);
  },

  async castBallot(electionId: string, candidateId: string, _userId?: string): Promise<{ success: true }> {
    const client = requireClient();
    void _userId;
    const { error } = await client.rpc('cast_ballot', {
      p_election_id: electionId,
      p_candidate_id: candidateId,
    });
    if (error) mapError(error, 'Vote impossible');
    return { success: true };
  },

  async getResults(electionId: string): Promise<ElectionResult[]> {
    const client = requireClient();
    const { data, error } = await client.from('election_results').select('*').eq('election_id', electionId);
    if (error) mapError(error, 'Résultats indisponibles');
    return (data as ElectionResult[]) ?? [];
  },

  async getTurnout(electionId: string): Promise<{ voted: number; total: number }> {
    const client = requireClient();
    const { data, error } = await client.from('election_voters').select('has_voted').eq('election_id', electionId);
    if (error) mapError(error, 'Participation indisponible');
    const rows = data ?? [];
    return { voted: rows.filter((r) => r.has_voted).length, total: rows.length };
  },

  subscribeToResults(electionId: string, cb: (results: ElectionResult[]) => void): () => void {
    const client = requireClient();
    const channel = client
      .channel(`election-results-${electionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'election_ballots', filter: `election_id=eq.${electionId}` },
        async () => {
          const results = await this.getResults(electionId);
          cb(results);
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  },
};

export const academicService = {
  async listResources(filters?: {
    search?: string;
    filiere?: string;
    niveau?: string;
    matiere?: string;
    resource_type?: string;
    academic_year?: string;
  }): Promise<AcademicResource[]> {
    const client = requireClient();
    let q = client.from('academic_resources').select('*').order('created_at', { ascending: false });
    if (filters?.filiere) q = q.eq('filiere', filters.filiere);
    if (filters?.niveau) q = q.eq('niveau', filters.niveau);
    if (filters?.matiere) q = q.eq('matiere', filters.matiere);
    if (filters?.resource_type) q = q.eq('resource_type', filters.resource_type);
    if (filters?.academic_year) q = q.eq('academic_year', filters.academic_year);
    if (filters?.search) q = q.ilike('title', `%${filters.search}%`);
    const { data, error } = await q;
    if (error) mapError(error, 'Ressources indisponibles');
    return (data as AcademicResource[]) ?? [];
  },

  async getSignedUrl(path: string): Promise<string> {
    const client = requireClient();
    const { data, error } = await client.storage.from('academic-resources').createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) mapError(error, 'URL signée indisponible');
    return data.signedUrl;
  },

  async createResource(
    input: Omit<AcademicResource, 'id' | 'created_at' | 'download_count'>,
  ): Promise<AcademicResource> {
    const client = requireClient();
    const { data, error } = await client.from('academic_resources').insert(input).select('*').single();
    if (error) mapError(error, 'Création de ressource impossible');
    return data as AcademicResource;
  },

  async incrementDownload(id: string): Promise<void> {
    const client = requireClient();
    const { data } = await client.from('academic_resources').select('download_count').eq('id', id).maybeSingle();
    if (!data) return;
    await client.from('academic_resources').update({ download_count: (data.download_count ?? 0) + 1 }).eq('id', id);
  },

  async listModules(): Promise<AcademicModule[]> {
    const client = requireClient();
    const { data, error } = await client.from('academic_modules').select('*').order('code');
    if (error) mapError(error, 'Modules indisponibles');
    return (data as AcademicModule[]) ?? [];
  },

  async listGrades(studentId: string): Promise<AcademicGrade[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('academic_grades')
      .select('*, module:academic_modules(*)')
      .eq('student_id', studentId);
    if (error) mapError(error, 'Notes indisponibles');
    return (data as AcademicGrade[]) ?? [];
  },

  async listAssignments(): Promise<AcademicAssignment[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('academic_assignments')
      .select('*')
      .order('due_at', { ascending: true });
    if (error) mapError(error, 'Devoirs indisponibles');
    return (data as AcademicAssignment[]) ?? [];
  },

  async listCourses(): Promise<ProfessionalCourse[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('professional_courses')
      .select('*, author:profiles!professional_courses_author_id_fkey(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (error) mapError(error, 'Formations indisponibles');
    return (data as ProfessionalCourse[]) ?? [];
  },

  async listCertifications(studentId: string): Promise<Certification[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('certifications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) mapError(error, 'Certifications indisponibles');
    return (data as Certification[]) ?? [];
  },

  async requestCertification(input: {
    student_id: string;
    course_id?: string | null;
    title: string;
    skills: string[];
  }): Promise<Certification> {
    const client = requireClient();
    const { data, error } = await client
      .from('certifications')
      .insert({
        student_id: input.student_id,
        course_id: input.course_id ?? null,
        title: input.title,
        skills: input.skills,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) mapError(error, 'Demande de certification impossible');
    return data as Certification;
  },
};

export const skillService = {
  async listOffers(category?: string): Promise<SkillOffer[]> {
    const client = requireClient();
    let q = client
      .from('skill_offers')
      .select('*, owner:profiles!skill_offers_owner_id_fkey(*)')
      .order('created_at', { ascending: false });
    if (category && category !== 'all') q = q.eq('category', category);
    const { data, error } = await q;
    if (error) mapError(error, 'Offres SkillLink indisponibles');
    return (data as SkillOffer[]) ?? [];
  },

  async listTalentProfiles(): Promise<Profile[]> {
    return authService.listApprovedProfiles();
  },

  async createOffer(
    ownerId: string,
    input: { category: SkillOffer['category']; title: string; description: string },
  ): Promise<SkillOffer> {
    const client = requireClient();
    const { data, error } = await client
      .from('skill_offers')
      .insert({ owner_id: ownerId, ...input })
      .select('*, owner:profiles!skill_offers_owner_id_fkey(*)')
      .single();
    if (error) mapError(error, 'Création d’offre impossible');
    return data as SkillOffer;
  },

  async getOrCreateConversation(offerId: string, requesterId: string): Promise<SkillConversation> {
    const client = requireClient();
    const { data: offer } = await client.from('skill_offers').select('*').eq('id', offerId).maybeSingle();
    if (!offer) throw new Error('Offre introuvable');
    const { data: existing } = await client
      .from('skill_conversations')
      .select('*')
      .eq('offer_id', offerId)
      .eq('requester_id', requesterId)
      .maybeSingle();
    if (existing) return existing as SkillConversation;
    const { data, error } = await client
      .from('skill_conversations')
      .insert({ offer_id: offerId, requester_id: requesterId, owner_id: offer.owner_id })
      .select('*')
      .single();
    if (error) mapError(error, 'Conversation impossible');
    return data as SkillConversation;
  },

  async listConversations(userId: string): Promise<SkillConversation[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('skill_conversations')
      .select('*')
      .or(`requester_id.eq.${userId},owner_id.eq.${userId}`);
    if (error) mapError(error, 'Conversations indisponibles');
    return (data as SkillConversation[]) ?? [];
  },

  async getConversation(id: string): Promise<SkillConversation | null> {
    const client = requireClient();
    const { data, error } = await client.from('skill_conversations').select('*').eq('id', id).maybeSingle();
    if (error) mapError(error, 'Conversation introuvable');
    return (data as SkillConversation | null) ?? null;
  },

  async listMessages(conversationId: string): Promise<SkillMessage[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('skill_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');
    if (error) mapError(error, 'Messages indisponibles');
    return (data as SkillMessage[]) ?? [];
  },

  async sendMessage(conversationId: string, senderId: string, body: string): Promise<SkillMessage> {
    const client = requireClient();
    const { data, error } = await client
      .from('skill_messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select('*')
      .single();
    if (error) mapError(error, 'Envoi impossible');
    return data as SkillMessage;
  },

  subscribeToMessages(conversationId: string, cb: (msg: SkillMessage) => void): () => void {
    const client = requireClient();
    const channel = client
      .channel(`skill-msg-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'skill_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => cb(payload.new as SkillMessage),
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  },
};

export const mentorshipService = {
  async setMentorOptIn(userId: string, optIn: boolean): Promise<void> {
    const client = requireClient();
    const { error } = await client.from('profiles').update({ is_mentor_opt_in: optIn }).eq('id', userId);
    if (error) mapError(error, 'Mise à jour mentorat impossible');
  },

  async setInterests(userId: string, interests: string[]): Promise<void> {
    const client = requireClient();
    const { error } = await client.from('profiles').update({ interests }).eq('id', userId);
    if (error) mapError(error, 'Mise à jour des centres d’intérêt impossible');
  },

  async generateMatches(menteeId: string): Promise<MentorshipMatch[]> {
    const client = requireClient();
    const { data, error } = await client.rpc('generate_mentor_matches', { p_mentee_id: menteeId });
    if (error) mapError(error, 'Génération de matches impossible');
    return (data as MentorshipMatch[]) ?? [];
  },

  async listMatches(userId: string): Promise<MentorshipMatch[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('mentorship_matches')
      .select('*, mentor:profiles!mentorship_matches_mentor_id_fkey(*)')
      .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`);
    if (error) mapError(error, 'Matches indisponibles');
    return (data as MentorshipMatch[]) ?? [];
  },

  async updateMatchStatus(matchId: string, status: 'accepted' | 'declined'): Promise<void> {
    const client = requireClient();
    const { error } = await client.from('mentorship_matches').update({ status }).eq('id', matchId);
    if (error) mapError(error, 'Mise à jour du match impossible');
  },

  async isMentorshipEnabled(): Promise<boolean> {
    const client = requireClient();
    const { data, error } = await client.rpc('school_module_enabled', { p_module: 'mentorship' });
    if (error) return false;
    return Boolean(data);
  },

  async isElectionsEnabled(): Promise<boolean> {
    const client = requireClient();
    const { data, error } = await client.rpc('school_module_enabled', { p_module: 'elections' });
    if (error) return false;
    return Boolean(data);
  },
};

export const orientationService = {
  async listSchools(): Promise<School[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('schools')
      .select('*')
      .eq('is_published', true)
      .order('ranking_position', { ascending: true, nullsFirst: false });
    if (error) mapError(error, 'Écoles indisponibles');
    return (data as School[]) ?? [];
  },

  async getSchool(slug: string): Promise<School | null> {
    const client = requireClient();
    const { data, error } = await client.from('schools').select('*').eq('slug', slug).maybeSingle();
    if (error) mapError(error, 'École introuvable');
    return (data as School | null) ?? null;
  },

  async listScholarships(region?: string): Promise<Scholarship[]> {
    const client = requireClient();
    let q = client.from('scholarships').select('*').eq('is_published', true).order('deadline', { ascending: true });
    if (region && region !== 'all') q = q.eq('region', region);
    const { data, error } = await q;
    if (error) mapError(error, 'Bourses indisponibles');
    return (data as Scholarship[]) ?? [];
  },

  async listCareers(letter?: string): Promise<Career[]> {
    const client = requireClient();
    let q = client.from('careers').select('*').eq('is_published', true).order('name');
    if (letter && letter !== 'all') q = q.eq('letter', letter.toUpperCase());
    const { data, error } = await q;
    if (error) mapError(error, 'Métiers indisponibles');
    return (data as Career[]) ?? [];
  },
};

export const socialService = {
  async listFeed(): Promise<SocialPost[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('social_posts')
      .select('*, author:profiles!social_posts_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) mapError(error, 'Fil EduAmis indisponible');
    return (data as SocialPost[]) ?? [];
  },

  async createPost(authorId: string, body: string, imageUrl?: string | null): Promise<SocialPost> {
    const client = requireClient();
    const ok = await client.rpc('check_rate_limit', { p_form_key: 'social_post', p_max_per_minute: 5 });
    if (ok.error || ok.data === false) throw new Error('Trop de publications. Réessayez dans une minute.');
    const { data, error } = await client
      .from('social_posts')
      .insert({ author_id: authorId, body, image_url: imageUrl ?? null })
      .select('*, author:profiles!social_posts_author_id_fkey(*)')
      .single();
    if (error) mapError(error, 'Publication impossible');
    return data as SocialPost;
  },

  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    const client = requireClient();
    const { data: existing } = await client
      .from('social_follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();
    if (existing) {
      await client.from('social_follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
      return false;
    }
    const { error } = await client.from('social_follows').insert({ follower_id: followerId, following_id: followingId });
    if (error) mapError(error, 'Abonnement impossible');
    return true;
  },

  async listFollowers(userId: string): Promise<Profile[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('social_follows')
      .select('follower:profiles!social_follows_follower_id_fkey(*)')
      .eq('following_id', userId);
    if (error) mapError(error, 'Abonnés indisponibles');
    const rows = (data ?? []) as Array<{ follower: Profile | Profile[] | null }>;
    return rows.flatMap((r) => (Array.isArray(r.follower) ? r.follower : r.follower ? [r.follower] : []));
  },

  async listFollowing(userId: string): Promise<Profile[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('social_follows')
      .select('following:profiles!social_follows_following_id_fkey(*)')
      .eq('follower_id', userId);
    if (error) mapError(error, 'Abonnements indisponibles');
    const rows = (data ?? []) as Array<{ following: Profile | Profile[] | null }>;
    return rows.flatMap((r) => (Array.isArray(r.following) ? r.following : r.following ? [r.following] : []));
  },
};

export const messagingService = {
  async listConversations(userId: string): Promise<Conversation[]> {
    const client = requireClient();
    const { data: parts, error } = await client
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', userId);
    if (error) mapError(error, 'Messagerie indisponible');
    const ids = (parts ?? []).map((p) => p.conversation_id);
    if (!ids.length) return [];
    const { data, error: e2 } = await client
      .from('conversations')
      .select('*')
      .in('id', ids)
      .order('updated_at', { ascending: false });
    if (e2) mapError(e2, 'Messagerie indisponible');
    return (data as Conversation[]) ?? [];
  },

  async listMessages(conversationId: string): Promise<DirectMessage[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');
    if (error) mapError(error, 'Messages indisponibles');
    return (data as DirectMessage[]) ?? [];
  },

  async sendMessage(conversationId: string, senderId: string, body: string): Promise<DirectMessage> {
    const client = requireClient();
    const ok = await client.rpc('check_rate_limit', { p_form_key: 'direct_message', p_max_per_minute: 30 });
    if (ok.error || ok.data === false) throw new Error('Trop de messages. Patientez un instant.');
    const { data, error } = await client
      .from('direct_messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select('*')
      .single();
    if (error) mapError(error, 'Envoi impossible');
    await client.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
    return data as DirectMessage;
  },

  async startConversation(otherUserId: string, subject?: string, body?: string): Promise<string> {
    const client = requireClient();
    const { data, error } = await client.rpc('start_direct_conversation', {
      p_other_user: otherUserId,
      p_subject: subject ?? null,
      p_body: body ?? null,
    });
    if (error) mapError(error, 'Démarrage de conversation impossible');
    return data as string;
  },

  subscribe(conversationId: string, cb: (msg: DirectMessage) => void): () => void {
    const client = requireClient();
    const channel = client
      .channel(`dm-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => cb(payload.new as DirectMessage),
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  },
};

export const eventsService = {
  async listEvents(): Promise<CampusEvent[]> {
    const client = requireClient();
    const { data, error } = await client.from('events').select('*').order('date', { ascending: true });
    if (error) mapError(error, 'Événements indisponibles');
    return (data as CampusEvent[]) ?? [];
  },

  async register(eventId: string, profileId: string, kind: string, payload: Record<string, unknown> = {}) {
    const client = requireClient();
    const { error } = await client.from('event_registrations').insert({
      event_id: eventId,
      profile_id: profileId,
      kind,
      payload,
    });
    if (error) mapError(error, 'Inscription impossible');
  },
};

export const schoolAdminService = {
  async listEligible(): Promise<EligibleStudent[]> {
    const client = requireClient();
    const { data, error } = await client.rpc('list_school_eligible');
    if (error) mapError(error, 'Liste des matricules indisponible');
    return (data as EligibleStudent[]) ?? [];
  },

  async upsertEligible(input: {
    matricule: string;
    email: string;
    full_name: string;
    filiere: string;
    niveau: string;
  }): Promise<void> {
    const client = requireClient();
    const { error } = await client.rpc('upsert_eligible_student', {
      p_matricule: input.matricule,
      p_email: input.email,
      p_full_name: input.full_name,
      p_filiere: input.filiere,
      p_niveau: input.niveau,
    });
    if (error) mapError(error, 'Enregistrement du matricule impossible');
  },

  async setModules(elections: boolean, mentorship: boolean): Promise<void> {
    const client = requireClient();
    const { error } = await client.rpc('set_school_modules', {
      p_elections: elections,
      p_mentorship: mentorship,
    });
    if (error) mapError(error, 'Mise à jour des modules impossible');
  },

  async updateSchool(schoolId: string, updates: Partial<School>): Promise<void> {
    const client = requireClient();
    const { error } = await client.from('schools').update(updates).eq('id', schoolId);
    if (error) mapError(error, 'Mise à jour de la fiche école impossible');
  },
};

export const adminService = {
  async listPendingAccounts(): Promise<Profile[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('account_status', 'pending')
      .in('role', ['school_admin', 'pro_recruiter'])
      .order('created_at', { ascending: false });
    if (error) mapError(error, 'Comptes en attente indisponibles');
    return (data as Profile[]) ?? [];
  },

  async validateAccount(userId: string, approve: boolean, schoolId?: string | null): Promise<void> {
    const client = requireClient();
    const { error } = await client.rpc('validate_account', {
      p_user_id: userId,
      p_approve: approve,
      p_school_id: schoolId ?? null,
    });
    if (error) mapError(error, 'Validation impossible');
  },

  async upsertSchool(input: Partial<School> & { name: string; slug: string }): Promise<School> {
    const client = requireClient();
    const { data, error } = await client.from('schools').upsert(input).select('*').single();
    if (error) mapError(error, 'Enregistrement école impossible');
    return data as School;
  },

  async upsertScholarship(input: Partial<Scholarship> & { title: string; region: Scholarship['region'] }): Promise<void> {
    const client = requireClient();
    const { error } = await client.from('scholarships').upsert(input);
    if (error) mapError(error, 'Enregistrement bourse impossible');
  },

  async upsertCareer(input: Partial<Career> & { name: string; slug: string; letter: string }): Promise<void> {
    const client = requireClient();
    const { error } = await client.from('careers').upsert(input);
    if (error) mapError(error, 'Enregistrement métier impossible');
  },
};

export const proService = {
  async listTalentProjects(skillFilter?: string): Promise<SkillOffer[]> {
    const offers = await skillService.listOffers();
    if (!skillFilter) return offers;
    const q = skillFilter.toLowerCase();
    return offers.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.owner?.skills?.some((s) => s.toLowerCase().includes(q)),
    );
  },

  async listMyCourses(authorId: string): Promise<ProfessionalCourse[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('professional_courses')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });
    if (error) mapError(error, 'Cours indisponibles');
    return (data as ProfessionalCourse[]) ?? [];
  },

  async publishCourse(
    authorId: string,
    input: { title: string; description?: string; skills?: string[]; media_url?: string },
  ): Promise<ProfessionalCourse> {
    const client = requireClient();
    const { data, error } = await client
      .from('professional_courses')
      .insert({
        author_id: authorId,
        title: input.title,
        description: input.description ?? null,
        skills: input.skills ?? [],
        media_url: input.media_url ?? null,
        status: 'published',
      })
      .select('*')
      .single();
    if (error) mapError(error, 'Publication du cours impossible');
    return data as ProfessionalCourse;
  },

  async validateCertification(certId: string, validatorId: string): Promise<void> {
    const client = requireClient();
    const { error } = await client
      .from('certifications')
      .update({
        status: 'validated',
        validator_id: validatorId,
        issued_at: new Date().toISOString(),
      })
      .eq('id', certId);
    if (error) mapError(error, 'Validation de certification impossible');
  },

  async listPendingCertifications(): Promise<Certification[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('certifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) mapError(error, 'Certifications en attente indisponibles');
    return (data as Certification[]) ?? [];
  },
};

export const eligibleService = {
  async listEligible(): Promise<EligibleStudent[]> {
    return schoolAdminService.listEligible();
  },
};

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    return authService.getProfile(userId);
  },
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    return authService.updateProfile(userId, updates);
  },
};
