import { PenaltyDefinition } from '../constants/penalties';

export interface PenaltyEnforcementResult {
  newLOS: number;
  newDown: number;
  newDistance: number;
  isFirstDown: boolean;
  isTurnover: boolean;
  isSafety: boolean;
  description: string;
}

export interface PenaltyEnforcementInput {
  penalty: PenaltyDefinition;
  penaltyTeam: 'offense' | 'defense'; // Which team committed the penalty
  currentLOS: number; // 0-100 (own goal = 0, opp goal = 100)
  currentDown: number; // 1-4
  currentDistance: number; // Yards to first down
  spotOfFoul?: number; // Only needed for spot fouls
  driveDirection: 'left' | 'right';
}

/**
 * Enforce a penalty according to NFHS/UIL high school rules
 */
export function enforcePenalty(input: PenaltyEnforcementInput): PenaltyEnforcementResult {
  const {
    penalty,
    penaltyTeam,
    currentLOS,
    currentDown,
    currentDistance,
    spotOfFoul,
    driveDirection,
  } = input;

  // Determine enforcement spot
  let enforcementSpot = currentLOS;
  if (penalty.isSpotFoul && spotOfFoul !== undefined) {
    enforcementSpot = spotOfFoul;
  }

  // Calculate yards to apply (with direction)
  let yardsToApply: number = penalty.yards;

  // Calculate new LOS based on penalty team AND drive direction
  let newLOS: number;
  if (penaltyTeam === 'offense') {
    // Offensive penalty: move ball AWAY from their goal (backs them up)
    if (driveDirection === 'right') {
      // Driving toward 100 (goal at 99) → back up = decrease yard line
      newLOS = enforcementSpot - yardsToApply;
    } else {
      // Driving toward 0 (goal at 1) → back up = increase yard line
      newLOS = enforcementSpot + yardsToApply;
    }
  } else {
    // Defensive penalty: move ball TOWARD offense's goal (advances them)
    if (driveDirection === 'right') {
      // Driving toward 100 (goal at 99) → advance = increase yard line
      newLOS = enforcementSpot + yardsToApply;
    } else {
      // Driving toward 0 (goal at 1) → advance = decrease yard line
      newLOS = enforcementSpot - yardsToApply;
    }
  }

  // Apply half-the-distance rule (accounts for drive direction)
  if (penaltyTeam === 'offense') {
    // Offensive penalty: check if backing up into own end zone
    if (driveDirection === 'right' && newLOS < 1) {
      // Driving right, backed up past yard 0 (own end zone)
      // OWN 10 = yard 10, which is 10 yards from goal line at yard 0
      const distanceToOwnGoal = enforcementSpot;
      yardsToApply = Math.floor(distanceToOwnGoal / 2);
      newLOS = enforcementSpot - yardsToApply;
    } else if (driveDirection === 'left' && newLOS > 99) {
      // Driving left, backed up past yard 100 (own end zone)
      // At yard 90, distance to goal line at yard 100 is 10 yards
      const distanceToOwnGoal = 100 - enforcementSpot;
      yardsToApply = Math.floor(distanceToOwnGoal / 2);
      newLOS = enforcementSpot + yardsToApply;
    }
  } else if (penaltyTeam === 'defense') {
    // Defensive penalty: check if advancing into opponent's end zone
    if (driveDirection === 'right' && newLOS > 99) {
      // Driving right, advanced past yard 100 (opponent's goal line)
      // At yard 90, distance to goal line at yard 100 is 10 yards
      const distanceToGoal = 100 - enforcementSpot;
      yardsToApply = Math.floor(distanceToGoal / 2);
      newLOS = enforcementSpot + yardsToApply;
    } else if (driveDirection === 'left' && newLOS < 1) {
      // Driving left, advanced past yard 0 (opponent's goal line)
      // OPP 10 = yard 10, which is 10 yards from goal line at yard 0
      const distanceToGoal = enforcementSpot;
      yardsToApply = Math.floor(distanceToGoal / 2);
      newLOS = enforcementSpot - yardsToApply;
    }
  }

  // Check for safety on intentional grounding (direction-aware)
  let isSafety = false;
  if (penalty.id === 'intentional-grounding') {
    const foulSpot = spotOfFoul ?? currentLOS;
    if ((driveDirection === 'right' && foulSpot <= 1) ||
        (driveDirection === 'left' && foulSpot >= 99)) {
      isSafety = true;
    }
  }

  // Determine down effect
  let newDown = currentDown;
  let newDistance = currentDistance;
  let isFirstDown = false;
  let isTurnover = false;

  if (penalty.isAutoFirstDown && penaltyTeam === 'defense') {
    // Automatic first down (only roughing penalties)
    newDown = 1;
    // Calculate distance to goal based on drive direction
    // Driving right: goal at yard 100, driving left: goal at yard 0
    const distanceToGoal = driveDirection === 'right' ? (100 - newLOS) : newLOS;
    newDistance = Math.min(10, distanceToGoal);
    isFirstDown = true;
  } else if (penalty.isLossOfDown && penaltyTeam === 'offense') {
    // Loss of down
    newDown = currentDown + 1;

    // Check if this results in turnover on downs
    if (newDown > 4) {
      isTurnover = true;
    } else {
      // Recalculate distance to first down marker (direction-aware)
      // First down marker stays at same position
      const firstDownLine = driveDirection === 'right'
        ? currentLOS + currentDistance
        : currentLOS - currentDistance;
      newDistance = Math.abs(firstDownLine - newLOS);

      // If we're past the first down line, it's a first down
      if (newDistance <= 0) {
        newDown = 1;
        const distanceToGoal = driveDirection === 'right' ? (100 - newLOS) : newLOS;
        newDistance = Math.min(10, distanceToGoal);
        isFirstDown = true;
      }
    }
  } else {
    // Replay down - same down number
    newDown = currentDown;

    // Recalculate distance to first down marker (direction-aware)
    const firstDownLine = driveDirection === 'right'
      ? currentLOS + currentDistance
      : currentLOS - currentDistance;
    newDistance = Math.abs(firstDownLine - newLOS);

    // If defensive penalty moved us past the first down marker
    if (penaltyTeam === 'defense' && newDistance <= 0) {
      newDown = 1;
      const distanceToGoal = driveDirection === 'right' ? (100 - newLOS) : newLOS;
      newDistance = Math.min(10, distanceToGoal);
      isFirstDown = true;
    }
    // If we're too close to goal, adjust distance (direction-aware)
    else {
      const distanceToGoal = driveDirection === 'right' ? (100 - newLOS) : newLOS;
      if (newDistance > distanceToGoal) {
        newDistance = distanceToGoal;
      }
    }
  }

  // Generate description
  const description = generatePenaltyDescription({
    penalty,
    penaltyTeam,
    yardsApplied: yardsToApply,
    isHalfDistance: newLOS === Math.floor(enforcementSpot / 2) ||
                    newLOS === enforcementSpot + Math.floor((100 - enforcementSpot) / 2),
    newDown,
    newDistance,
    isFirstDown,
    isSafety,
    isTurnover,
  });

  return {
    newLOS,
    newDown,
    newDistance,
    isFirstDown,
    isTurnover,
    isSafety,
    description,
  };
}

interface DescriptionInput {
  penalty: PenaltyDefinition;
  penaltyTeam: 'offense' | 'defense';
  yardsApplied: number;
  isHalfDistance: boolean;
  newDown: number;
  newDistance: number;
  isFirstDown: boolean;
  isSafety: boolean;
  isTurnover: boolean;
}

function generatePenaltyDescription(input: DescriptionInput): string {
  const {
    penalty,
    penaltyTeam,
    yardsApplied,
    isHalfDistance,
    newDown,
    newDistance,
    isFirstDown,
    isSafety,
    isTurnover,
  } = input;

  let desc = `${penalty.name}, ${penaltyTeam}. `;

  if (isHalfDistance) {
    desc += `Half the distance to the goal. `;
  } else {
    desc += `${yardsApplied} yard penalty. `;
  }

  if (isSafety) {
    desc += `SAFETY - 2 points!`;
  } else if (isTurnover) {
    desc += `Turnover on downs.`;
  } else if (isFirstDown) {
    if (penalty.isAutoFirstDown) {
      desc += `Automatic first down.`;
    } else {
      desc += `First down!`;
    }
  } else if (penalty.isLossOfDown) {
    desc += `Loss of down. `;
  } else {
    desc += `Replay ${getDownOrdinal(newDown)} down.`;
  }

  return desc;
}

function getDownOrdinal(down: number): string {
  switch (down) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    case 4: return '4th';
    default: return `${down}th`;
  }
}

/**
 * Format yard line for display (direction-aware)
 * @param yardLine - Absolute yard line (1-99)
 * @param driveDirection - Which direction offense is driving ('right' = toward 99, 'left' = toward 1)
 */
export function formatYardLine(yardLine: number, driveDirection?: 'left' | 'right'): string {
  if (yardLine === 50) return '50';

  // If no drive direction provided, use legacy logic (assume driving right)
  if (!driveDirection || driveDirection === 'right') {
    // Driving toward yard 99 (right)
    if (yardLine < 50) return `OWN ${yardLine}`;
    return `OPP ${100 - yardLine}`;
  } else {
    // Driving toward yard 1 (left)
    if (yardLine > 50) return `OWN ${100 - yardLine}`;
    return `OPP ${yardLine}`;
  }
}

/**
 * Get down and distance display (direction-aware)
 */
export function formatDownAndDistance(down: number, distance: number, yardLine: number, driveDirection?: 'left' | 'right'): string {
  const downStr = getDownOrdinal(down);

  // Calculate distance to goal based on drive direction
  let distanceToGoal: number;
  if (!driveDirection || driveDirection === 'right') {
    distanceToGoal = 99 - yardLine;
  } else {
    distanceToGoal = yardLine - 1;
  }

  const distStr = distance >= distanceToGoal ? 'Goal' : distance.toString();
  const ylStr = formatYardLine(yardLine, driveDirection);
  return `${downStr} & ${distStr} at ${ylStr}`;
}
