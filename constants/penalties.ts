/**
 * StatIQ Penalty System
 * Texas High School Football (UIL/NFHS Rules)
 *
 * Key Principles:
 * - Almost all penalties enforce from Previous Spot (LOS)
 * - Only 3 penalties give automatic first down (roughing penalties)
 * - Pass Interference is NOT automatic first down in high school
 */

export type PenaltyCategory =
  | 'pre-snap'
  | 'blocking'
  | 'passing'
  | 'personal'
  | 'kicking'
  | 'unsportsmanlike';

export type TeamType = 'offense' | 'defense' | 'either';

export type EnforcementType =
  | 'previous-spot'   // From LOS (most common)
  | 'spot-of-foul'    // Where foul occurred (rare)
  | 'succeeding-spot'; // Where ball would be spotted (dead ball fouls)

export type DownEffect =
  | 'replay'          // Repeat the down
  | 'loss-of-down'    // Lose a down (offense only)
  | 'auto-first';     // Automatic first down (defense only)

export interface PenaltyDefinition {
  id: string;
  name: string;
  shortName: string;
  yards: 5 | 10 | 15;
  team: TeamType;
  category: PenaltyCategory;
  enforcement: EnforcementType;
  downEffect: DownEffect;
  isAutoFirstDown: boolean;
  isLossOfDown: boolean;
  isSpotFoul: boolean;
  description: string;
}

/**
 * Complete penalty definitions for Texas high school football
 */
export const PENALTIES: Record<string, PenaltyDefinition> = {
  // ===== PRE-SNAP / DEAD BALL FOULS (5 yards) =====
  'false-start': {
    id: 'false-start',
    name: 'False Start',
    shortName: 'False Start',
    yards: 5,
    team: 'offense',
    category: 'pre-snap',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Offensive player moves before snap (dead ball)'
  },

  'delay-of-game': {
    id: 'delay-of-game',
    name: 'Delay of Game',
    shortName: 'Delay of Game',
    yards: 5,
    team: 'offense',
    category: 'pre-snap',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Play clock violation'
  },

  'illegal-formation': {
    id: 'illegal-formation',
    name: 'Illegal Formation',
    shortName: 'Illegal Formation',
    yards: 5,
    team: 'offense',
    category: 'pre-snap',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Less than 7 on line, illegal splits, etc.'
  },

  'illegal-motion': {
    id: 'illegal-motion',
    name: 'Illegal Motion',
    shortName: 'Illegal Motion',
    yards: 5,
    team: 'offense',
    category: 'pre-snap',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Player in motion toward LOS at snap'
  },

  'illegal-shift': {
    id: 'illegal-shift',
    name: 'Illegal Shift',
    shortName: 'Illegal Shift',
    yards: 5,
    team: 'offense',
    category: 'pre-snap',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Not set for 1 second before snap'
  },

  'illegal-substitution': {
    id: 'illegal-substitution',
    name: 'Illegal Substitution',
    shortName: 'Illegal Sub',
    yards: 5,
    team: 'either',
    category: 'pre-snap',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: '12 men on field or sub not set'
  },

  'encroachment': {
    id: 'encroachment',
    name: 'Encroachment',
    shortName: 'Encroachment',
    yards: 5,
    team: 'defense',
    category: 'pre-snap',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Contact with offense before snap'
  },

  'offside': {
    id: 'offside',
    name: 'Offsides',
    shortName: 'Offsides',
    yards: 5,
    team: 'defense',
    category: 'pre-snap',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'In neutral zone at snap'
  },

  'neutral-zone-infraction': {
    id: 'neutral-zone-infraction',
    name: 'Neutral Zone Infraction',
    shortName: 'Neutral Zone',
    yards: 5,
    team: 'defense',
    category: 'pre-snap',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Causes offense to false start'
  },

  // ===== BLOCKING FOULS =====
  'holding-offense': {
    id: 'holding-offense',
    name: 'Holding',
    shortName: 'Holding',
    yards: 10,
    team: 'offense',
    category: 'blocking',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Most common penalty - restraining defender'
  },

  'holding-defense': {
    id: 'holding-defense',
    name: 'Holding',
    shortName: 'Holding',
    yards: 5,
    team: 'defense',
    category: 'blocking',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Defensive holding (5 yards, not 10)'
  },

  'illegal-block-back': {
    id: 'illegal-block-back',
    name: 'Illegal Block in the Back',
    shortName: 'Block in Back',
    yards: 10,
    team: 'either',
    category: 'blocking',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Block in back (not clipping)'
  },

  'clipping': {
    id: 'clipping',
    name: 'Clipping',
    shortName: 'Clipping',
    yards: 15,
    team: 'either',
    category: 'blocking',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Block from behind below waist'
  },

  'chop-block': {
    id: 'chop-block',
    name: 'Chop Block',
    shortName: 'Chop Block',
    yards: 15,
    team: 'offense',
    category: 'blocking',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'High-low combination block'
  },

  'cut-block': {
    id: 'cut-block',
    name: 'Illegal Cut Block',
    shortName: 'Cut Block',
    yards: 15,
    team: 'offense',
    category: 'blocking',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Illegal low block'
  },

  // ===== PASSING FOULS =====
  'pass-interference-offense': {
    id: 'pass-interference-offense',
    name: 'Offensive Pass Interference',
    shortName: 'OPI',
    yards: 15,
    team: 'offense',
    category: 'passing',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Offensive player interferes with defender'
  },

  'pass-interference-defense': {
    id: 'pass-interference-defense',
    name: 'Defensive Pass Interference',
    shortName: 'DPI',
    yards: 15,
    team: 'defense',
    category: 'passing',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false, // NOT automatic first down in high school!
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'NOT auto first down in HS (unlike NFL)'
  },

  'intentional-grounding': {
    id: 'intentional-grounding',
    name: 'Intentional Grounding',
    shortName: 'Grounding',
    yards: 5,
    team: 'offense',
    category: 'passing',
    enforcement: 'spot-of-foul',
    downEffect: 'loss-of-down',
    isAutoFirstDown: false,
    isLossOfDown: true,
    isSpotFoul: true,
    description: 'QB throws ball away (spot foul + loss of down)'
  },

  'illegal-forward-pass': {
    id: 'illegal-forward-pass',
    name: 'Illegal Forward Pass',
    shortName: 'Illegal Pass',
    yards: 5,
    team: 'offense',
    category: 'passing',
    enforcement: 'previous-spot',
    downEffect: 'loss-of-down',
    isAutoFirstDown: false,
    isLossOfDown: true,
    isSpotFoul: false,
    description: '2nd forward pass or pass from beyond LOS'
  },

  'ineligible-downfield': {
    id: 'ineligible-downfield',
    name: 'Ineligible Receiver Downfield',
    shortName: 'Ineligible Downfield',
    yards: 5,
    team: 'offense',
    category: 'passing',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Lineman past LOS on pass play'
  },

  'illegal-touching': {
    id: 'illegal-touching',
    name: 'Illegal Touching',
    shortName: 'Illegal Touching',
    yards: 5,
    team: 'offense',
    category: 'passing',
    enforcement: 'previous-spot',
    downEffect: 'loss-of-down',
    isAutoFirstDown: false,
    isLossOfDown: true,
    isSpotFoul: false,
    description: 'Ineligible receiver touches forward pass'
  },

  // ===== PERSONAL FOULS (15 yards) =====
  'roughing-passer': {
    id: 'roughing-passer',
    name: 'Roughing the Passer',
    shortName: 'Roughing Passer',
    yards: 15,
    team: 'defense',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'auto-first',
    isAutoFirstDown: true, // One of only 3 auto first downs!
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'One of only 3 automatic first down penalties'
  },

  'roughing-kicker': {
    id: 'roughing-kicker',
    name: 'Roughing the Kicker',
    shortName: 'Roughing Kicker',
    yards: 15,
    team: 'defense',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'auto-first',
    isAutoFirstDown: true, // One of only 3 auto first downs!
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'One of only 3 automatic first down penalties'
  },

  'roughing-snapper': {
    id: 'roughing-snapper',
    name: 'Roughing the Snapper',
    shortName: 'Roughing Snapper',
    yards: 15,
    team: 'defense',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'auto-first',
    isAutoFirstDown: true, // One of only 3 auto first downs!
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'One of only 3 automatic first down penalties'
  },

  'running-into-kicker': {
    id: 'running-into-kicker',
    name: 'Running Into the Kicker',
    shortName: 'Running Into Kicker',
    yards: 5,
    team: 'defense',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Lesser version of roughing'
  },

  'facemask-15': {
    id: 'facemask-15',
    name: 'Facemask',
    shortName: 'Facemask',
    yards: 15,
    team: 'either',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false, // Can be auto-first if by defense (handled in logic)
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Grab and twist facemask'
  },

  'facemask-5': {
    id: 'facemask-5',
    name: 'Facemask (Incidental)',
    shortName: 'Facemask',
    yards: 5,
    team: 'either',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Incidental grasp of facemask'
  },

  'targeting': {
    id: 'targeting',
    name: 'Targeting',
    shortName: 'Targeting',
    yards: 15,
    team: 'either',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Leading with helmet (possible ejection)'
  },

  'horse-collar': {
    id: 'horse-collar',
    name: 'Horse Collar Tackle',
    shortName: 'Horse Collar',
    yards: 15,
    team: 'defense',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Grab inside collar or nameplate'
  },

  'late-hit': {
    id: 'late-hit',
    name: 'Late Hit / Unnecessary Roughness',
    shortName: 'Late Hit',
    yards: 15,
    team: 'either',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Hit after play is over'
  },

  'personal-foul': {
    id: 'personal-foul',
    name: 'Personal Foul',
    shortName: 'Personal Foul',
    yards: 15,
    team: 'either',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'General rough play'
  },

  'spearing': {
    id: 'spearing',
    name: 'Spearing',
    shortName: 'Spearing',
    yards: 15,
    team: 'either',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Leading with helmet crown'
  },

  'tripping': {
    id: 'tripping',
    name: 'Tripping',
    shortName: 'Tripping',
    yards: 15,
    team: 'either',
    category: 'personal',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Intentionally tripping opponent'
  },

  // ===== KICKING FOULS =====
  'kick-catch-interference': {
    id: 'kick-catch-interference',
    name: 'Kick Catch Interference',
    shortName: 'KCI',
    yards: 15,
    team: 'defense',
    category: 'kicking',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Interference with fair catch'
  },

  'illegal-kick': {
    id: 'illegal-kick',
    name: 'Illegal Kick',
    shortName: 'Illegal Kick',
    yards: 5,
    team: 'either',
    category: 'kicking',
    enforcement: 'spot-of-foul',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: true,
    description: 'Kicking ball illegally'
  },

  'illegal-batting': {
    id: 'illegal-batting',
    name: 'Illegal Batting',
    shortName: 'Illegal Batting',
    yards: 10,
    team: 'either',
    category: 'kicking',
    enforcement: 'spot-of-foul',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: true,
    description: 'Batting ball illegally'
  },

  // ===== UNSPORTSMANLIKE CONDUCT (15 yards) =====
  'unsportsmanlike-conduct': {
    id: 'unsportsmanlike-conduct',
    name: 'Unsportsmanlike Conduct',
    shortName: 'Unsportsmanlike',
    yards: 15,
    team: 'either',
    category: 'unsportsmanlike',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Poor sportsmanship (2nd = ejection)'
  },

  'taunting': {
    id: 'taunting',
    name: 'Taunting',
    shortName: 'Taunting',
    yards: 15,
    team: 'either',
    category: 'unsportsmanlike',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Taunting opponent'
  },

  'sideline-interference': {
    id: 'sideline-interference',
    name: 'Sideline Interference',
    shortName: 'Sideline Interference',
    yards: 15,
    team: 'either',
    category: 'unsportsmanlike',
    enforcement: 'previous-spot',
    downEffect: 'replay',
    isAutoFirstDown: false,
    isLossOfDown: false,
    isSpotFoul: false,
    description: 'Sideline personnel interfering'
  },
};

/**
 * Get penalties by category and team
 */
export function getPenaltiesByCategory(category: PenaltyCategory, team: 'offense' | 'defense'): PenaltyDefinition[] {
  return Object.values(PENALTIES).filter(p =>
    p.category === category && (p.team === team || p.team === 'either')
  );
}

/**
 * Get all penalties for a team
 */
export function getPenaltiesForTeam(team: 'offense' | 'defense'): PenaltyDefinition[] {
  return Object.values(PENALTIES).filter(p => p.team === team || p.team === 'either');
}

/**
 * Get most common penalties for quick select
 */
export const QUICK_PENALTIES_OFFENSE = [
  PENALTIES['false-start'],
  PENALTIES['holding-offense'],
  PENALTIES['illegal-motion'],
];

export const QUICK_PENALTIES_DEFENSE = [
  PENALTIES['offside'],
  PENALTIES['pass-interference-defense'],
  PENALTIES['personal-foul'],
];

/**
 * Category display information
 */
export const PENALTY_CATEGORIES: Record<PenaltyCategory, { name: string; icon: string }> = {
  'pre-snap': { name: 'Pre-Snap', icon: '🚫' },
  'blocking': { name: 'Blocking', icon: '🛡️' },
  'passing': { name: 'Passing', icon: '🏈' },
  'personal': { name: 'Personal Foul', icon: '⚠️' },
  'kicking': { name: 'Kicking', icon: '🦶' },
  'unsportsmanlike': { name: 'Unsportsmanlike', icon: '🟥' },
};
