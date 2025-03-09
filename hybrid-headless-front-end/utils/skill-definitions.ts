/**
 * Skill definitions for caving skills
 * Maps skill values to human-readable labels, descriptions, and info URLs
 */

export interface SkillDefinition {
  label: string;
  description: string;
  infoUrl?: string;
}

export type SkillCategory = 
  | 'horizontalSkills'
  | 'srtSkills'
  | 'leadingHorizontalSkills'
  | 'leadingSrtSkills'
  | 'leadingCoachingSkills';

export type SkillMap = Record<SkillCategory, Record<string, SkillDefinition>>;

/**
 * Comprehensive mapping of all skill values to their definitions
 */
export const SKILL_DEFINITIONS: SkillMap = {
  // Horizontal caving skills
  horizontalSkills: {
    'New to caving': {
      label: 'New to caving',
      description: 'Little or no previous caving experience'
    },
    'Horizontal Basic': {
      label: 'Horizontal Basic',
      description: 'Comfortable moving through horizontal cave passages, climbing small obstacles, and navigating simple cave systems',
      infoUrl: 'https://www.cavingcrew.com/training-levels/horizontal-caving-levels/horizontal-basic/'
    },
    'Horizontal Intermediate': {
      label: 'Horizontal Intermediate',
      description: 'Experienced in horizontal caving with good movement skills, able to handle more challenging terrain and longer trips',
      infoUrl: 'https://www.cavingcrew.com/training-levels/horizontal-caving-levels/horizontal-intermediate/'
    }
  },
  
  // SRT (Single Rope Technique) skills
  srtSkills: {
    'No-SRT': {
      label: 'None',
      description: 'No SRT skills so far'
    },
    'Pre-SRT Basic': {
      label: 'Pre-SRT Basic',
      description: 'Familiar with SRT equipment but not yet proficient in techniques'
    },
    'SRT Basic': {
      label: 'SRT Basic',
      description: 'Can safely ascend and descend a single rope with supervision',
      infoUrl: 'https://www.cavingcrew.com/training-levels/srt-levels/srt-basic/'
    },
    'Pre-SRT Intermediate': {
      label: 'Pre-SRT Intermediate',
      description: 'Developing skills beyond basic SRT but not yet fully independent'
    },
    'SRT Intermediate': {
      label: 'SRT Intermediate',
      description: 'Competent in SRT techniques including rebelays and deviations',
      infoUrl: 'https://www.cavingcrew.com/training-levels/srt-levels/srt-intermediate/'
    },
    'SRT Advanced': {
      label: 'SRT Advanced',
      description: 'Highly proficient in all SRT techniques including complex maneuvers and problem-solving',
      infoUrl: 'https://www.cavingcrew.com/training-levels/srt-levels/srt-advanced/'
    }
  },
  
  // Leading horizontal caving skills
  leadingHorizontalSkills: {
    'no skills': {
      label: 'None',
      description: 'No experience leading horizontal caves'
    },
    'seconder': {
      label: 'Seconder',
      description: 'Can assist a leader but not yet ready to lead independently'
    },
    'learner leader': {
      label: 'Learner Leader',
      description: 'Developing leadership skills under supervision'
    },
    'Horizontal Leader': {
      label: 'Horizontal Leader',
      description: 'Qualified to lead horizontal caving trips independently',
      infoUrl: 'https://www.cavingcrew.com/training-levels/leading-horizontal-levels/horizontal-leader/'
    }
  },
  
  // Leading SRT skills
  leadingSrtSkills: {
    'Nothing yet': {
      label: 'None',
      description: 'No experience leading SRT caves'
    },
    'I can help derig': {
      label: 'Helper',
      description: 'Can assist with derigging but not yet ready to lead'
    },
    'I\'m learning to rig': {
      label: 'Learning to Rig',
      description: 'Developing rigging skills under supervision'
    },
    'srt leader basic': {
      label: 'SRT Leader Basic',
      description: 'Qualified to lead basic SRT trips with simple rigging requirements',
      infoUrl: 'https://www.cavingcrew.com/training-levels/leading-srt-levels/srt-leader-basic/'
    },
    'srt leader advanced': {
      label: 'SRT Leader Advanced',
      description: 'Advanced SRT Leader who can lead caves with rebelays and deviations and problem solve most problems',
      infoUrl: 'https://www.cavingcrew.com/training-levels/leading-srt-levels/srt-leader-advanced/'
    }
  },
  
  // Coaching skills
  leadingCoachingSkills: {
    'no-skills': {
      label: 'None',
      description: 'No experience coaching caving skills'
    },
    'I\'ve helped out a bit and I\'m learning': {
      label: 'Helper',
      description: 'Some experience assisting with coaching but still developing skills'
    },
    'I can use ground anchors and talk people through common manouveres': {
      label: 'Basic Coach',
      description: 'Can coach basic techniques and help beginners develop skills'
    },
    'I have significant personal skills and am good at teaching': {
      label: 'Advanced Coach',
      description: 'Experienced coach with strong teaching abilities and extensive personal skills',
      infoUrl: 'https://www.cavingcrew.com/training-levels/coaching-levels/advanced-coach/'
    }
  }
};

/**
 * Get a skill definition by category and value
 * @param category The skill category
 * @param value The skill value
 * @returns The skill definition or undefined if not found
 */
export function getSkillDefinition(
  category: SkillCategory,
  value?: string | null
): SkillDefinition | undefined {
  if (!value) return undefined;
  return SKILL_DEFINITIONS[category]?.[value];
}

/**
 * Get a formatted label for a skill value
 * @param category The skill category
 * @param value The skill value
 * @returns A formatted label or the original value if not found
 */
export function getSkillLabel(
  category: SkillCategory,
  value?: string | null
): string {
  if (!value) return 'Not specified';
  return getSkillDefinition(category, value)?.label || value;
}

/**
 * Get a description for a skill value
 * @param category The skill category
 * @param value The skill value
 * @returns A description or undefined if not found
 */
export function getSkillDescription(
  category: SkillCategory,
  value?: string | null
): string | undefined {
  if (!value) return undefined;
  return getSkillDefinition(category, value)?.description;
}

/**
 * Get an info URL for a skill value
 * @param category The skill category
 * @param value The skill value
 * @returns An info URL or undefined if not found
 */
export function getSkillInfoUrl(
  category: SkillCategory,
  value?: string | null
): string | undefined {
  if (!value) return undefined;
  return getSkillDefinition(category, value)?.infoUrl;
}
