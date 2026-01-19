import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import MorePlaysModal from '../../components/MorePlaysModal';
import { API_BASE } from '@/src/lib/api';
import {
  PENALTIES,
  PenaltyDefinition,
  PenaltyCategory,
  PENALTY_CATEGORIES,
  getPenaltiesByCategory,
  QUICK_PENALTIES_OFFENSE,
  QUICK_PENALTIES_DEFENSE,
} from '../../constants/penalties';
import {
  enforcePenalty,
  PenaltyEnforcementResult,
  formatDownAndDistance,
  formatYardLine as formatYardLineWithDirection,
} from '../../utils/penaltyEnforcement';

interface Team {
  name: string;
  score: number;
  timeouts: number;
}

interface Player {
  number: string;
  name: string;
  position: string;
  isStarter: boolean;
}

interface Play {
  id?: string; // Unique identifier for the play
  category: string;
  player: string;
  player2?: string; // Receiver for passes
  startYard: number;
  endYard: number;
  yards: string;
  timestamp: string;
  gameClock?: string; // Optional game clock when play occurred
  quarter?: string; // Quarter when play occurred (Q1, Q2, Q3, Q4, OT)
  penaltyName?: string; // For penalties
  down?: number; // Down when play occurred
  distance?: number; // Distance for first down
  fumble?: boolean; // Was there a fumble on this play?
  fumbleRecoveredBy?: 'offense' | 'defense'; // Who recovered the fumble?
  possession?: 'offense' | 'defense'; // Which team had the ball
}

// Offensive stats - tracks the ball and who moved it
interface OffensivePlayStat {
  playId: string; // Links to Play.id
  playerId: string; // Player number
  playerName: string; // Player name
  statType: 'rush' | 'pass' | 'reception'; // Type of offensive stat
  yards: number;
  touchdown: boolean;
  firstDown: boolean;
  fumble: boolean;
  fumbleLost: boolean;
  // Passing specific
  passAttempts?: number;
  passCompletions?: number;
  interceptionThrown?: boolean;
}

// Defensive stats - tracks who made stops and created havoc
interface DefensivePlayStat {
  playId: string; // Links to Play.id
  playerId: string; // Player number
  playerName: string; // Player name
  soloTackle: boolean;
  assistedTackle: boolean;
  tackleForLoss: boolean;
  tflYards: number; // Yards lost on TFL
  sack: boolean;
  halfSack: boolean;
  sackYards: number;
  qbHit: boolean;
  passBreakup: boolean;
  interception: boolean;
  intReturnYards: number;
  forcedFumble: boolean;
  fumbleRecovery: boolean;
  fumbleReturnYards: number;
  touchdown: boolean; // Defensive TD (pick-six, scoop-and-score)
}

interface Penalty {
  name: string;
  yards: number;
  lossOfDown: boolean;
  autoFirstDown?: boolean;
  deadBall?: boolean;
}

export default function GameTimeScreen() {
  const router = useRouter();
  const playClockInputRef = useRef<TextInput>(null);
  const clockEditInputRef = useRef<TextInput>(null);

  const [homeTeam, setHomeTeam] = useState<Team>({ name: 'JOSHUA', score: 0, timeouts: 3 });
  const [awayTeam, setAwayTeam] = useState<Team>({ name: 'CEDAR PARK', score: 0, timeouts: 3 });
  const [clock, setClock] = useState('12:00');
  const [quarter, setQuarter] = useState('Q1');
  
  // Team colors
  // Joshua: Blue (#0066cc) - dark background, white text
  // Cedar Park: Green (#006847) - light background (HALO), dark green text (inverted away styling)
  const homeTeamColor = '#0066cc'; // Joshua blue (home = dark background)
  const awayTeamColor = '#F3F3F7'; // HALO light background for Cedar Park (away = light background)
  const awayTeamTextColor = '#006847'; // Cedar Park dark green for text/accents
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null); // For receiver
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const [currentYard, setCurrentYard] = useState(25);
  const [endYard, setEndYard] = useState(35);
  const [searchQuery, setSearchQuery] = useState('');
  const [passerSearch, setPasserSearch] = useState('');
  const [receiverSearch, setReceiverSearch] = useState('');
  const [addFumble, setAddFumble] = useState(false);
  const [fumbleRecoveredBy, setFumbleRecoveredBy] = useState<'offense' | 'defense' | null>(null);
  const [fumbleTurnoverYardLine, setFumbleTurnoverYardLine] = useState<number | null>(null);
  const [showFumbleModal, setShowFumbleModal] = useState(false);
  const [showFumbleYardLineInput, setShowFumbleYardLineInput] = useState(false);
  const [fumbleYardLineInput, setFumbleYardLineInput] = useState('');
  const [fumbleYardSide, setFumbleYardSide] = useState<'left' | 'right'>('left');
  const [fumbleRecoverySearch, setFumbleRecoverySearch] = useState('');
  const [fumbleRecoveryPlayer, setFumbleRecoveryPlayer] = useState<string | null>(null);
  const [recentPlays, setRecentPlays] = useState<Play[]>([]);
  const [offensiveStats, setOffensiveStats] = useState<OffensivePlayStat[]>([]);
  const [defensiveStats, setDefensiveStats] = useState<DefensivePlayStat[]>([]);
  const [showDefensiveStatsModal, setShowDefensiveStatsModal] = useState(false);
  const [currentPlayForDefStats, setCurrentPlayForDefStats] = useState<Play | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [possession, setPossession] = useState<'offense' | 'defense'>('offense'); // Track who has the ball
  
  // Edit modals
  const [showClockEdit, setShowClockEdit] = useState(false);
  const [showDownEdit, setShowDownEdit] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [showKickoffModal, setShowKickoffModal] = useState(false);
  const [showTouchdownModal, setShowTouchdownModal] = useState(false);
  const [showEndQuarterModal, setShowEndQuarterModal] = useState(false);
  const [showHalftime, setShowHalftime] = useState(false);
  const [showTouchdownConfirm, setShowTouchdownConfirm] = useState(false);
  const [showPregameSetup, setShowPregameSetup] = useState(true);
  const [showGameInit, setShowGameInit] = useState(false);
  const [initStep, setInitStep] = useState(1); // 1: Coin flip, 2: Winner choice, 3: Field direction, 4: Kickoff return
  const [coinFlipWinner, setCoinFlipWinner] = useState<'home' | 'away' | null>(null);
  const [winnerChoice, setWinnerChoice] = useState<'receive' | 'defer' | null>(null);
  const [kickoffReturnYard, setKickoffReturnYard] = useState(25);
  const [showKickoffReturnSelector, setShowKickoffReturnSelector] = useState(false);
  const [deadBallPersonalFouls, setDeadBallPersonalFouls] = useState({ home: 0, away: 0 });
  const [clockInput, setClockInput] = useState('');
  const [showPlayClockInput, setShowPlayClockInput] = useState(false);
  const [playClockInput, setPlayClockInput] = useState('');
  const [shouldSelectPlayClockText, setShouldSelectPlayClockText] = useState(false);
  const [showMorePlaysModal, setShowMorePlaysModal] = useState(false);
  const [showScoringMenu, setShowScoringMenu] = useState(false);
  const [showFieldGoalModal, setShowFieldGoalModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showOpponentScoreModal, setShowOpponentScoreModal] = useState(false);

  // Penalty flow state
  const [penaltyStep, setPenaltyStep] = useState<'team' | 'select' | 'player' | null>(null);
  const [penaltyTeam, setPenaltyTeam] = useState<'offense' | 'defense' | null>(null);
  const [penaltyCategory, setPenaltyCategory] = useState<PenaltyCategory | null>(null);
  const [penaltySelected, setPenaltySelected] = useState<PenaltyDefinition | null>(null);
  const [penaltyResult, setPenaltyResult] = useState<PenaltyEnforcementResult | null>(null);
  const [showPenaltyConfirm, setShowPenaltyConfirm] = useState(false);
  const [isPendingPenalty, setIsPendingPenalty] = useState(false);
  const [penaltyPlayerNumber, setPenaltyPlayerNumber] = useState<number | 'unknown' | null>(null);
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');

  // Down & Distance state
  const [down, setDown] = useState(1);
  const [distance, setDistance] = useState(10);
  
  // Field direction: 'left' = driving toward 0 yard line, 'right' = driving toward 100 yard line
  const [fieldDirection, setFieldDirection] = useState<'left' | 'right'>('right');

  // Track if possession changed during the current quarter (prevents double-flip at quarter transitions)
  const [possessionChangedThisQuarter, setPossessionChangedThisQuarter] = useState(false);

  // Penalty presets with yards (High School Rules) - Organized by category
  const penaltyCategories: Record<string, Penalty[]> = {
    'Pre-Snap (5 yards)': [
      { name: 'False Start', yards: 5, lossOfDown: false },
      { name: 'Offside', yards: 5, lossOfDown: false },
      { name: 'Encroachment', yards: 5, lossOfDown: false },
      { name: 'Delay of Game', yards: 5, lossOfDown: false },
      { name: 'Illegal Formation', yards: 5, lossOfDown: false },
      { name: 'Illegal Shift', yards: 5, lossOfDown: false },
      { name: 'Illegal Motion', yards: 5, lossOfDown: false },
    ],
    'During Play (5 yards)': [
      { name: 'Holding (Defense)', yards: 5, lossOfDown: false, autoFirstDown: true },
      { name: 'Illegal Contact', yards: 5, lossOfDown: false, autoFirstDown: true },
      { name: 'Illegal Use of Hands', yards: 5, lossOfDown: false },
      { name: 'Ineligible Receiver Downfield', yards: 5, lossOfDown: false },
    ],
    'Major Fouls (10 yards)': [
      { name: 'Holding (Offense)', yards: 10, lossOfDown: false },
      { name: 'Illegal Block in the Back', yards: 10, lossOfDown: false },
      { name: 'Intentional Grounding', yards: 10, lossOfDown: true },
    ],
    'Personal Fouls (15 yards)': [
      { name: 'Block in the Back', yards: 15, lossOfDown: false },
      { name: 'Chop Block', yards: 15, lossOfDown: false },
      { name: 'Face Mask', yards: 15, lossOfDown: false, autoFirstDown: true },
      { name: 'Unnecessary Roughness', yards: 15, lossOfDown: false, autoFirstDown: true },
      { name: 'Unsportsmanlike Conduct', yards: 15, lossOfDown: false },
      { name: 'Personal Foul', yards: 15, lossOfDown: false, autoFirstDown: true },
      { name: 'Personal Foul (Dead Ball)', yards: 15, lossOfDown: false, autoFirstDown: true, deadBall: true },
      { name: 'Roughing the Passer', yards: 15, lossOfDown: false, autoFirstDown: true },
      { name: 'Roughing the Kicker', yards: 15, lossOfDown: false, autoFirstDown: true },
    ],
    'Pass Interference (15 yards)': [
      { name: 'Pass Interference (Offense)', yards: 15, lossOfDown: false },
      { name: 'Pass Interference (Defense)', yards: 15, lossOfDown: false, autoFirstDown: true },
    ],
  };

  // Roster from backend
  const [roster, setRoster] = useState<Player[]>([]);
  const [loadingGame, setLoadingGame] = useState(true);

  // Load Joshua's roster - using static roster for demo
  useEffect(() => {
    // Set loading complete immediately
    setLoadingGame(false);
    
    // Use Joshua's roster directly for the demo vs Cleburne game
    // This bypasses the backend API which may not have Joshua's roster configured
    setRoster([
      // Offense
      { number: '7', name: 'J. Miller', position: 'QB', isStarter: true },
      { number: '12', name: 'Blake Turner', position: 'QB', isStarter: false },
      { number: '22', name: 'Marcus Thompson', position: 'RB', isStarter: true },
      { number: '5', name: 'Derek Williams', position: 'RB', isStarter: false },
      { number: '33', name: 'Jayden Carter', position: 'RB', isStarter: false },
      { number: '11', name: 'Tyler Jackson', position: 'WR', isStarter: true },
      { number: '81', name: 'Chris Davis', position: 'WR', isStarter: true },
      { number: '17', name: 'Jaylen Brown', position: 'WR', isStarter: false },
      { number: '3', name: 'Andre Mitchell', position: 'WR', isStarter: false },
      { number: '84', name: 'Kevin Moore', position: 'Slot', isStarter: true },
      { number: '88', name: 'Mike Torres', position: 'TE', isStarter: true },
      { number: '85', name: 'Brandon Lee', position: 'TE', isStarter: false },
      { number: '54', name: 'Jake Martinez', position: 'OL', isStarter: true },
      { number: '72', name: 'David Wilson', position: 'OL', isStarter: true },
      { number: '65', name: 'Omar Rodriguez', position: 'OL', isStarter: true },
      { number: '78', name: 'Tyler Smith', position: 'OL', isStarter: true },
      { number: '68', name: 'Marcus Green', position: 'OL', isStarter: true },
      // Defense
      { number: '55', name: 'Chris Anderson', position: 'LB', isStarter: true },
      { number: '52', name: 'Jordan Hayes', position: 'LB', isStarter: true },
      { number: '45', name: 'Dylan Parker', position: 'LB', isStarter: false },
      { number: '24', name: 'Sergio Mata', position: 'DB', isStarter: true },
      { number: '21', name: 'Damon Lewis', position: 'DB', isStarter: true },
      { number: '6', name: 'Isaiah Thompson', position: 'DB', isStarter: true },
      { number: '14', name: 'Marcus White', position: 'DB', isStarter: false },
      { number: '44', name: 'Ryan Garcia', position: 'DL', isStarter: true },
      { number: '91', name: 'James Collins', position: 'DL', isStarter: true },
      { number: '97', name: 'DeShawn Brown', position: 'DL', isStarter: true },
      { number: '93', name: 'Ethan Clark', position: 'DL', isStarter: false },
      // Special Teams
      { number: '9', name: 'Brian Foster', position: 'K', isStarter: true },
      { number: '19', name: 'Alex Rivera', position: 'P', isStarter: true },
    ]);
    
    console.log('Loaded Joshua roster for gametime vs Cleburne');
  }, []);

  const formatYardLine = (yard: number): string => {
    if (yard === 50) return '50';
    if (yard > 50) return `${100 - yard}`;
    return `${yard}`;
  };

  const getYardDisplay = (index: number): number => {
    const yard = index * 10;
    if (yard <= 50) return yard;
    return 100 - yard;
  };

  const getArrowDirection = (index: number): string => {
    const yard = index * 10;
    // Arrows always point away from 50 (toward goal lines)
    if (yard < 50) return '◄';  // Left goal line
    if (yard > 50) return '►';  // Right goal line
    return '';  // No arrow at 50 yard line
  };

  /**
   * Calculate distance with goal-to-go logic.
   * Ensures distance never exceeds distance to goal line.
   * @param currentYard - Current yard line position (1-99)
   * @param fieldDirection - Which direction team is driving ('left' = toward 0, 'right' = toward 100)
   * @param requestedDistance - The desired distance (e.g., 10 for first down)
   * @returns Distance capped at goal line distance, minimum 1
   */
  const calculateDistance = (currentYard: number, fieldDirection: 'left' | 'right', requestedDistance: number): number => {
    // Calculate distance to goal line
    // Right = driving toward 100 (goal at yard 99, end zone at 100)
    // Left = driving toward 0 (goal at yard 1, end zone at 0)
    const distanceToGoal = fieldDirection === 'right'
      ? Math.max(0, 99 - currentYard)
      : Math.max(0, currentYard - 1);

    // Return minimum of requested distance or distance to goal
    const finalDistance = Math.min(requestedDistance, distanceToGoal);

    // Distance should never be 0 (that would be a touchdown/safety)
    // Minimum distance is 1 yard
    return Math.max(1, finalDistance);
  };

  const handleTouchdown = () => {
    setShowTouchdownConfirm(true);
  };

  const confirmTouchdown = () => {
    const scoringTeam = possession === 'offense' ? 'home' : 'away';
    
    if (scoringTeam === 'home') {
      setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
    } else {
      setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
    }
    
    setShowTouchdownConfirm(false);
    setShowTouchdownModal(true);
  };

  const handleEndQuarter = () => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'];
    const currentIndex = quarters.indexOf(quarter);

    // BUG FIX #4: Check if Q4 is ending
    if (quarter === 'Q4') {
      // Check if game is tied (needs OT)
      if (homeTeam.score === awayTeam.score) {
        Alert.alert(
          'Game Tied',
          'The game is tied. Do you want to go to Overtime?',
          [
            {
              text: 'End Game',
              style: 'destructive',
              onPress: () => {
                Alert.alert('Game Ended', `Final Score: ${homeTeam.name} ${homeTeam.score} - ${awayTeam.name} ${awayTeam.score}`);
                setShowEndQuarterModal(false);
              }
            },
            {
              text: 'Overtime',
              onPress: () => {
                // BUG FIX #2: OT needs special initialization (like game start)
                Alert.alert(
                  'Overtime Setup',
                  'Overtime will begin with a coin flip. For now, the current possession and field direction will continue.',
                  [
                    {
                      text: 'Begin OT',
                      onPress: () => {
                        setQuarter('OT');
                        // Don't auto-flip for OT - keep current direction
                        // In future: add proper OT coin flip setup
                        setPossessionChangedThisQuarter(false);
                        setShowEndQuarterModal(false);
                      }
                    }
                  ]
                );
              }
            }
          ]
        );
      } else {
        // Game is decided - show final score
        const winner = homeTeam.score > awayTeam.score ? homeTeam.name : awayTeam.name;
        Alert.alert(
          'Game Over',
          `${winner} wins!\n\nFinal Score:\n${homeTeam.name}: ${homeTeam.score}\n${awayTeam.name}: ${awayTeam.score}`,
          [
            {
              text: 'End Game',
              onPress: () => setShowEndQuarterModal(false)
            }
          ]
        );
      }
      return;
    }

    if (currentIndex < quarters.length - 1) {
      const nextQuarter = quarters[currentIndex + 1];

      // Check if going into halftime
      if (quarter === 'Q2') {
        setShowHalftime(true);
      } else {
        setQuarter(nextQuarter);

        // BUG FIX #1: Only flip field direction if possession didn't already change
        // Teams switch ends after each quarter, but if possession changed on the
        // final play (e.g., TD scored), we already flipped, so don't flip again
        if (!possessionChangedThisQuarter) {
          setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
        }

        // Reset the flag for the new quarter
        setPossessionChangedThisQuarter(false);
      }

      setShowEndQuarterModal(false);
    }
  };

  const handleEndHalftime = () => {
    setQuarter('Q3');
    setShowHalftime(false);
    // Reset timeouts for both teams
    setHomeTeam({ ...homeTeam, timeouts: 3 });
    setAwayTeam({ ...awayTeam, timeouts: 3 });

    // BUG FIX #5: Only flip field direction if possession didn't already change
    // Same logic as regular quarter transitions - teams switch ends at halftime
    if (!possessionChangedThisQuarter) {
      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
    }

    // Reset the flag for Q3
    setPossessionChangedThisQuarter(false);
  };

  const handleCoinFlipWinner = (winner: 'home' | 'away') => {
    setCoinFlipWinner(winner);
    setInitStep(2);
  };

  const handleWinnerChoice = (choice: 'receive' | 'defer') => {
    setWinnerChoice(choice);
    setInitStep(3);
  };

  const handleStartGame = (direction: 'left' | 'right') => {
    setFieldDirection(direction);

    // Set possession based on choice
    if (winnerChoice === 'receive') {
      setPossession(coinFlipWinner === 'home' ? 'offense' : 'defense');
    } else {
      // Defer means other team receives
      setPossession(coinFlipWinner === 'home' ? 'defense' : 'offense');
    }

    setInitStep(4);
  };

  // CENTRALIZED: Possession switching logic - handles all possession changes and field direction flips
  const switchPossession = (options?: {
    yardLine?: number;        // Optional: Set field position after possession change
    resetDown?: boolean;      // Default true: Reset to 1st & 10
  }) => {
    const { yardLine, resetDown = true } = options || {};

    // Flip possession
    setPossession(possession === 'offense' ? 'defense' : 'offense');

    // Flip field direction (teams switch which end zone they're attacking)
    setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');

    // Set flag so quarter transitions don't double-flip
    setPossessionChangedThisQuarter(true);

    // Reset down & distance to 1st & 10 (unless disabled)
    if (resetDown) {
      setDown(1);
      setDistance(10);
    }

    // Set field position if provided
    if (yardLine !== undefined) {
      setCurrentYard(yardLine);
      setEndYard(yardLine);
    } else {
      // Default: Keep current position (for turnovers on downs, fumbles, etc.)
      setCurrentYard(endYard);
      setEndYard(endYard);
    }
  };

  const handleSafetyFreeKick = (kickType: 'punt' | 'kickoff', startYard: number) => {
    // Set up for free kick
    setCurrentYard(startYard);
    setEndYard(startYard);

    Alert.alert(
      'FREE KICK RESULT',
      'Where did the ball end up?',
      [
        {
          text: 'Touchback',
          onPress: () => {
            // Touchback on free kick - receiving team gets ball at their 25
            const touchbackYard = fieldDirection === 'right' ? 75 : 25;

            const play: Play = {
              category: 'safety-free-kick-touchback',
              player: 'Team',
              startYard: startYard,
              endYard: touchbackYard,
              yards: Math.abs(touchbackYard - startYard).toString(),
              timestamp: new Date().toLocaleTimeString(),
            };
            setRecentPlays([play, ...recentPlays]);

            // Flip possession - receiving team now has ball at the 25
            switchPossession({ yardLine: touchbackYard });

            setSelectedCategory(null);
          }
        },
        {
          text: 'Returned',
          onPress: () => {
            // Show input for return position
            Alert.prompt(
              'Return Yardage',
              'Enter the yard line where the return ended (0-100):',
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'Submit',
                  onPress: (yardText?: string) => {
                    const returnYard = parseInt(yardText || '25');

                    // Check for touchdown
                    const isTouchdown = (fieldDirection === 'right' && returnYard === 0) ||
                                       (fieldDirection === 'left' && returnYard === 100);

                    if (isTouchdown) {
                      Alert.alert(
                        'FREE KICK RETURN TOUCHDOWN!',
                        'The receiving team scored on the free kick return!',
                        [
                          {
                            text: 'Continue',
                            onPress: () => {
                              const tdScoringTeam = possession === 'defense' ? 'home' : 'away';

                              if (tdScoringTeam === 'home') {
                                setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
                              } else {
                                setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
                              }

                              const play: Play = {
                                category: 'safety-free-kick-return-td',
                                player: 'Team',
                                startYard: startYard,
                                endYard: returnYard,
                                yards: Math.abs(returnYard - startYard).toString(),
                                timestamp: new Date().toLocaleTimeString(),
                              };
                              setRecentPlays([play, ...recentPlays]);

                              // Extra point flow (same as other TDs)
                              Alert.alert(
                                'EXTRA POINT',
                                'Select extra point attempt:',
                                [
                                  {
                                    text: 'PAT (1pt)',
                                    onPress: () => {
                                      Alert.alert('Did it go through?', '', [
                                        { text: 'Missed', onPress: () => {
                                          setPossession(possession === 'offense' ? 'defense' : 'offense');
                                          setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                                          setCurrentYard(35);
                                          setEndYard(35);
                                          setDown(1);
                                          setDistance(10);
                                          setSelectedCategory(null);
                                        }},
                                        { text: 'Good (+1)', onPress: () => {
                                          if (tdScoringTeam === 'home') {
                                            setHomeTeam({ ...homeTeam, score: homeTeam.score + 1 });
                                          } else {
                                            setAwayTeam({ ...awayTeam, score: awayTeam.score + 1 });
                                          }
                                          setPossession(possession === 'offense' ? 'defense' : 'offense');
                                          setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                                          setCurrentYard(35);
                                          setEndYard(35);
                                          setDown(1);
                                          setDistance(10);
                                          setSelectedCategory(null);
                                        }}
                                      ]);
                                    }
                                  },
                                  {
                                    text: '2-PT Conversion',
                                    onPress: () => {
                                      Alert.alert('Successful?', '', [
                                        { text: 'Failed', onPress: () => {
                                          setPossession(possession === 'offense' ? 'defense' : 'offense');
                                          setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                                          setCurrentYard(35);
                                          setEndYard(35);
                                          setDown(1);
                                          setDistance(10);
                                          setSelectedCategory(null);
                                        }},
                                        { text: 'Success (+2)', onPress: () => {
                                          if (tdScoringTeam === 'home') {
                                            setHomeTeam({ ...homeTeam, score: homeTeam.score + 2 });
                                          } else {
                                            setAwayTeam({ ...awayTeam, score: awayTeam.score + 2 });
                                          }
                                          setPossession(possession === 'offense' ? 'defense' : 'offense');
                                          setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                                          setCurrentYard(35);
                                          setEndYard(35);
                                          setDown(1);
                                          setDistance(10);
                                          setSelectedCategory(null);
                                        }}
                                      ]);
                                    }
                                  }
                                ]
                              );
                            }
                          }
                        ]
                      );
                    } else {
                      // Regular return
                      const play: Play = {
                        category: 'safety-free-kick-return',
                        player: 'Team',
                        startYard: startYard,
                        endYard: returnYard,
                        yards: Math.abs(returnYard - startYard).toString(),
                        timestamp: new Date().toLocaleTimeString(),
                      };
                      setRecentPlays([play, ...recentPlays]);

                      // Flip possession - receiving team now has ball
                      setPossession(possession === 'offense' ? 'defense' : 'offense');
                      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                      setCurrentYard(returnYard);
                      setEndYard(returnYard);
                      setDown(1);
                      setDistance(10);

                      setSelectedCategory(null);
                    }
                  }
                }
              ],
              'plain-text',
              '25'
            );
          }
        }
      ]
    );
  };

  // Custom Possession Football Icon Component
  const PossessionIcon = () => (
    <Svg width="32" height="32" viewBox="0 0 160.616 160.616" style={{ transform: [{ rotate: '45deg' }] }}>
      <Path d="M18.163,49.589L0,65.114v30.387l18.163,15.525v-61.438Z" fill="#b4d836"/>
      <Path d="M142.453,49.589v61.438l18.163-15.525v-30.387l-18.163-15.525Z" fill="#b4d836"/>
      <Path d="M128.413,37.588l-9.577-8.186H41.78l-9.577,8.186v85.44l9.577,8.186h77.057l9.577-8.186V37.588ZM60.251,94.883h-9.25v-29.151h9.25v29.151ZM76.706,94.883h-9.25v-29.151h9.25v29.151ZM93.161,94.883h-9.25v-29.151h9.25v29.151ZM109.615,94.883h-9.25v-29.151h9.25v29.151Z" fill="#b4d836"/>
    </Svg>
  );

  // Export game data function
  const exportGameData = () => {
    const gameData = {
      gameInfo: {
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        finalScore: `${homeTeam.score} - ${awayTeam.score}`,
        winner: homeTeam.score > awayTeam.score ? homeTeam.name : 
                awayTeam.score > homeTeam.score ? awayTeam.name : 'TIE',
        quarter: quarter,
        clock: clock,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
      plays: recentPlays.map(play => ({
        category: play.category,
        player: play.player,
        player2: play.player2 || null,
        startYard: play.startYard,
        endYard: play.endYard,
        yards: play.yards,
        timestamp: play.timestamp,
        penaltyName: play.penaltyName || null,
      })),
      statistics: {
        totalPlays: recentPlays.length,
        touchdowns: recentPlays.filter(p => 
          p.category.includes('-td') || p.category === 'touchdown'
        ).length,
        fieldGoals: recentPlays.filter(p => p.category === 'fieldgoal').length,
        fieldGoalsMade: recentPlays.filter(p => p.category === 'fieldgoal').length,
        fieldGoalsMissed: recentPlays.filter(p => p.category === 'fieldgoal-missed').length,
        safeties: recentPlays.filter(p => p.category === 'safety').length,
        interceptions: recentPlays.filter(p => 
          p.category === 'interception' || p.category === 'interception-td'
        ).length,
        fumbles: recentPlays.filter(p => 
          p.category === 'fumble' || p.category === 'fumble-td'
        ).length,
        penalties: recentPlays.filter(p => p.category === 'penalty').length,
        sacks: recentPlays.filter(p => p.category === 'sack').length,
        timeoutsUsed: {
          home: 3 - homeTeam.timeouts,
          away: 3 - awayTeam.timeouts,
        }
      }
    };

    // Log to console (will be sent to backend in production)
    console.log('=== GAME DATA EXPORT ===');
    console.log(JSON.stringify(gameData, null, 2));
    console.log('========================');
    
    // In production, this would send to your backend API
    // fetch('https://api.statiq.com/games', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(gameData)
    // });
    
    return gameData;
  };

  const promptForClock = () => {
  setPlayClockInput(clock.replace(':', ''));
  setShouldSelectPlayClockText(true);
  setShowPlayClockInput(true);
};

const renderPenaltyButton = (penalty: PenaltyDefinition, isQuickSelect: boolean = false) => {
  if (!penaltyTeam) return null;

  // Determine yard number color
  // Green if penalty is on opposing team (good for you), red if on your own team (bad for you)
  const isOpposingPenalty = (possession === 'offense' && penaltyTeam === 'defense') ||
                            (possession === 'defense' && penaltyTeam === 'offense');
  const accentColor = isOpposingPenalty ? '#B4D836' : '#FF3636';

  return (
    <Pressable
      key={penalty.id}
      style={({ pressed }) => [
        styles.penaltyNewBtn,
        isQuickSelect && styles.penaltyQuickSelectBtn,
        isQuickSelect && { borderLeftColor: accentColor },
        pressed && styles.penaltyBtnPressed
      ]}
      onPress={() => {
        setPenaltySelected(penalty);
        const result = enforcePenalty({
          penalty,
          penaltyTeam,
          currentLOS: currentYard,
          currentDown: down,
          currentDistance: distance,
          driveDirection: fieldDirection,
        });
        setPenaltyResult(result);

        // Only ask for player if it's OUR team's penalty
        if (penaltyTeam === possession) {
          setPenaltyStep('player');
        } else {
          // Opponent's penalty - skip player selection, go straight to confirmation
          setPenaltyPlayerNumber(null);
          setShowPenaltyConfirm(true);
          setPenaltyStep(null);
        }
      }}
    >
      <Text style={styles.penaltyNewBtnName}>{penalty.name}</Text>
      <Text style={[styles.penaltyNewBtnYards, { color: accentColor }]}>{penalty.yards} YDS</Text>
      {penalty.isAutoFirstDown && (
        <Text style={styles.penaltyNewBtnTagGreen}>AUTO 1ST</Text>
      )}
      {penalty.isLossOfDown && (
        <Text style={styles.penaltyNewBtnTagYellow}>LOSS OF DOWN</Text>
      )}
    </Pressable>
  );
};

const handleSubmitPlay = () => {
  // For punt, player is optional
  if (selectedCategory !== 'punt' && !selectedPlayer) return;
  // For passes, require receiver too
  if ((selectedCategory === 'pass' || selectedCategory === 'incomplete') && !selectedPlayer2) return;

  // Show clock input modal before submitting
  promptForClock();
};

const finalizePlaySubmission = () => {
  // Parse clock input
  let input = playClockInput.replace(/[^0-9:]/g, '');
  let minutes = 0;
  let seconds = 0;
  
  if (input.includes(':')) {
    const parts = input.split(':');
    minutes = parseInt(parts[0]) || 0;
    seconds = parseInt(parts[1]) || 0;
  } else {
    if (input.length <= 2) {
      seconds = parseInt(input) || 0;
    } else if (input.length === 3) {
      minutes = parseInt(input[0]) || 0;
      seconds = parseInt(input.substring(1)) || 0;
    } else {
      minutes = parseInt(input.substring(0, input.length - 2)) || 0;
      seconds = parseInt(input.substring(input.length - 2)) || 0;
    }
  }
  
  if (seconds > 59) {
    Alert.alert('Invalid Time', 'Seconds must be between 0 and 59.');
    return;
  }
  
  if (minutes > 15) {
    Alert.alert('Invalid Time', 'Minutes cannot exceed 15.');
    return;
  }
  
  const formattedClock = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  setClock(formattedClock);

  // Handle punt
  if (selectedCategory === 'punt') {
    // Check if punt return reached end zone (TD) - goal line is at yard 99 or yard 1
    const inEndZone = endYard >= 99 || endYard <= 1;

    if (inEndZone) {
      setShowPlayClockInput(false);
      setPlayClockInput('');
      Alert.alert(
        'PUNT RETURN TOUCHDOWN?',
        `The return reached the end zone. Did the returner score a touchdown?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Yes, Touchdown',
            onPress: () => {
              // Punt return TD - defense scores
              const scoringTeam = possession === 'defense' ? 'home' : 'away';

              if (scoringTeam === 'home') {
                setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
              } else {
                setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
              }

              const play: Play = {
                category: 'punt-return-td',
                player: selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Team',
                startYard: currentYard,
                endYard: endYard,
                yards: Math.abs(endYard - currentYard).toString(),
                timestamp: new Date().toLocaleTimeString(),
                gameClock: formattedClock,
              };

              setRecentPlays([play, ...recentPlays]);

              // Show touchdown modal for PAT/2PT selection
              setShowTouchdownModal(true);
            }
          }
        ]
      );
      return;
    }

    // Regular punt (no TD)
    const play: Play = {
      category: 'punt',
      player: selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Team',
      startYard: currentYard,
      endYard: endYard,
      yards: Math.abs(endYard - currentYard).toString(),
      timestamp: new Date().toLocaleTimeString(),
      gameClock: formattedClock,
      down: down,
      distance: distance,
    };

    setRecentPlays([play, ...recentPlays]);

    // Use centralized possession switching
    switchPossession();

    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedPlayer(null);
    setSearchQuery('');
    setShowPlayClockInput(false);
    setPlayClockInput('');
    return;
  }

  // Handle Interception with TD check
  if (selectedCategory === 'interception') {
    if (!selectedPlayer) return;

    // Check if interception return reached end zone (TD) - goal line is at yard 99 or yard 1
    const inEndZone = endYard >= 99 || endYard <= 1;

    if (inEndZone) {
      setShowPlayClockInput(false);
      setPlayClockInput('');
      Alert.alert(
        'TOUCHDOWN SCORED?',
        `The interception return reached the end zone. Did the defense score a touchdown?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Yes, Touchdown',
            onPress: () => {
              // Interception TD - defense scores
              const scoringTeam = possession === 'defense' ? 'home' : 'away';

              if (scoringTeam === 'home') {
                setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
              } else {
                setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
              }

              const play: Play = {
                category: 'interception-td',
                player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
                startYard: currentYard,
                endYard: endYard,
                yards: Math.abs(endYard - currentYard).toString(),
                timestamp: new Date().toLocaleTimeString(),
                gameClock: formattedClock,
                possession: possession,
              };

              setRecentPlays([play, ...recentPlays]);

              // Show touchdown modal for PAT/2PT selection
              setShowTouchdownModal(true);
            }
          }
        ]
      );
      return;
    }
    
    // Regular interception
    const play: Play = {
      category: 'interception',
      player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
      startYard: currentYard,
      endYard: endYard,
      yards: Math.abs(endYard - currentYard).toString(),
      timestamp: new Date().toLocaleTimeString(),
      gameClock: formattedClock, // NEW
      possession: possession,
    };
    
    setRecentPlays([play, ...recentPlays]);
    setPossession(possession === 'offense' ? 'defense' : 'offense');
    setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
    setCurrentYard(endYard);
    setEndYard(endYard);
    setDown(1);
    setDistance(10);
    
    setSelectedCategory(null);
    setSelectedPlayer(null);
    setSearchQuery('');
    setShowPlayClockInput(false);
    setPlayClockInput('');
    return;
  }

  // Handle Fumble Recovery with TD check
  if (selectedCategory === 'fumble') {
    if (!selectedPlayer) return;

    // Check if fumble return reached end zone (TD) - goal line is at yard 99 or yard 1
    const inEndZone = endYard >= 99 || endYard <= 1;

    if (inEndZone) {
      setShowPlayClockInput(false);
      setPlayClockInput('');
      Alert.alert(
        'TOUCHDOWN SCORED?',
        `The fumble return reached the end zone. Did the defense score a touchdown?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Yes, Touchdown',
            onPress: () => {
              // Fumble TD - defense scores
              const scoringTeam = possession === 'defense' ? 'home' : 'away';

              if (scoringTeam === 'home') {
                setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
              } else {
                setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
              }

              const play: Play = {
                category: 'fumble-td',
                player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
                startYard: currentYard,
                endYard: endYard,
                yards: Math.abs(endYard - currentYard).toString(),
                timestamp: new Date().toLocaleTimeString(),
                gameClock: formattedClock,
              };

              setRecentPlays([play, ...recentPlays]);

              // Show touchdown modal for PAT/2PT selection
              setShowTouchdownModal(true);
            }
          }
        ]
      );
      return;
    }
    
    // Regular fumble recovery
    const play: Play = {
      category: 'fumble',
      player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
      startYard: currentYard,
      endYard: endYard,
      yards: Math.abs(endYard - currentYard).toString(),
      timestamp: new Date().toLocaleTimeString(),
      gameClock: formattedClock, // NEW
    };
    
    setRecentPlays([play, ...recentPlays]);
    setPossession(possession === 'offense' ? 'defense' : 'offense');
    setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
    setCurrentYard(endYard);
    setEndYard(endYard);
    setDown(1);
    setDistance(10);
    
    setSelectedCategory(null);
    setSelectedPlayer(null);
    setSearchQuery('');
    setShowPlayClockInput(false);
    setPlayClockInput('');
    return;
  }

  // Calculate yards gained
  let yardsGained;
  if (selectedCategory === 'incomplete') {
    yardsGained = 0;
  } else if (fieldDirection === 'right') {
    yardsGained = endYard - currentYard;
  } else {
    yardsGained = currentYard - endYard;
  }
  
  const playType = selectedSubcategory || selectedCategory;
  
  if (!selectedPlayer) return;
  
  // Check for offensive touchdown - goal line is at yard 99 (driving right) or yard 1 (driving left)
  const reachedEndZone = (fieldDirection === 'right' && endYard >= 99) ||
                        (fieldDirection === 'left' && endYard <= 1);
  
  if (reachedEndZone && (selectedCategory === 'run' || selectedCategory === 'pass')) {
    // Offensive touchdown - add 6 points and record play
    const scoringTeam = possession === 'offense' ? 'home' : 'away';

    if (scoringTeam === 'home') {
      setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
    } else {
      setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
    }

    const play: Play = {
      category: `${selectedCategory}-td`,
      player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
      player2: selectedPlayer2 ? `#${selectedPlayer2.number} ${selectedPlayer2.name}` : undefined,
      startYard: currentYard,
      endYard: endYard,
      yards: yardsGained.toString(),
      timestamp: new Date().toLocaleTimeString(),
      gameClock: formattedClock,
    };
    setRecentPlays([play, ...recentPlays]);

    // Close clock input and show touchdown modal for PAT/2PT selection
    setShowPlayClockInput(false);
    setPlayClockInput('');
    setShowTouchdownModal(true);

    return;
  }
  
  // Handle fumble on pass
  let playCategory = selectedCategory!;
  let finalYardLine = selectedCategory === 'incomplete' ? currentYard : endYard;

  if (selectedCategory === 'pass' && addFumble) {
    if (fumbleRecoveredBy === 'defense') {
      // Turnover - use fumble turnover yard line
      finalYardLine = fumbleTurnoverYardLine !== null ? fumbleTurnoverYardLine : endYard;
    }
    // Keep playCategory as 'pass' - fumble info will be in description
  }

  const play: Play = {
    category: playCategory,
    player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
    player2: selectedPlayer2 ? `#${selectedPlayer2.number} ${selectedPlayer2.name}` : undefined,
    startYard: currentYard,
    endYard: finalYardLine,
    yards: yardsGained.toString(),
    timestamp: new Date().toLocaleTimeString(),
    gameClock: formattedClock,
    down: down,
    distance: distance,
    fumble: selectedCategory === 'pass' && addFumble ? true : undefined,
    fumbleRecoveredBy: selectedCategory === 'pass' && addFumble ? fumbleRecoveredBy || undefined : undefined,
  };

  setRecentPlays([play, ...recentPlays]);

  // Handle possession change on fumble turnover
  if (selectedCategory === 'pass' && addFumble && fumbleRecoveredBy === 'defense') {
    setPossession(possession === 'offense' ? 'defense' : 'offense');
    setCurrentYard(finalYardLine);
    setEndYard(finalYardLine);
    setDown(1);
    setDistance(10);
  }

  setSelectedCategory(null);
  setSelectedSubcategory(null);
  setSelectedPlayer(null);
  setSelectedPlayer2(null);
  setSearchQuery('');
  setPasserSearch('');
  setReceiverSearch('');
  setAddFumble(false);
  setFumbleRecoveredBy(null);
  setFumbleTurnoverYardLine(null);
  setShowPlayClockInput(false);
  setPlayClockInput('');
  setShouldSelectPlayClockText(false);

  // Update field position and reset slider
  if (selectedCategory !== 'incomplete') {
    setCurrentYard(endYard);
    setEndYard(endYard);
  } else {
    setEndYard(currentYard);
  }
  
  const possessionChangePlays: string[] = [
    'punt', 'kickoff', 'interception', 'fumble', 'fumble_recovery',
    'muffed_punt', 'kickoff_fumble', 'onside_recovery',
    'fieldgoal', 'safety', 'blocked_punt', 'blocked_fg',
  ];
  
  if (possessionChangePlays.includes(playType as string) || 
      playType === 'fieldgoal' ||
      down === 4 && yardsGained < distance) {
    switchPossession();
  } else if (playType === 'fieldgoal' && yardsGained >= 0) {
    switchPossession();
  } else if (selectedCategory === 'incomplete') {
    if (down < 4) {
      setDown(down + 1);
    } else {
      switchPossession();
    }
  } else {
    if (yardsGained >= distance) {
      // First down achieved!
      setDown(1);
      // FIX BUG #1: Use calculateDistance helper to handle goal-to-go
      setDistance(calculateDistance(endYard, fieldDirection, 10));
    } else {
      if (down < 4) {
        setDown(down + 1);
        // FIX BUG #2: Cap distance at goal line after yardage changes
        const newDistance = distance - yardsGained;
        setDistance(calculateDistance(endYard, fieldDirection, newDistance));
      } else {
        switchPossession();
      }
    }
  }
};

const finalizePenaltySubmission = () => {
  if (!penaltyResult || !penaltySelected || !penaltyTeam) return;

  // Parse clock input
  let input = playClockInput.replace(/[^0-9:]/g, '');
  let minutes = 0;
  let seconds = 0;

  if (input.includes(':')) {
    const parts = input.split(':');
    minutes = parseInt(parts[0]) || 0;
    seconds = parseInt(parts[1]) || 0;
  } else {
    if (input.length <= 2) {
      seconds = parseInt(input) || 0;
    } else if (input.length === 3) {
      minutes = parseInt(input[0]) || 0;
      seconds = parseInt(input.substring(1)) || 0;
    } else {
      minutes = parseInt(input.substring(0, input.length - 2)) || 0;
      seconds = parseInt(input.substring(input.length - 2)) || 0;
    }
  }

  if (seconds > 59) {
    Alert.alert('Invalid Time', 'Seconds must be between 0 and 59.');
    return;
  }

  if (minutes > 15) {
    Alert.alert('Invalid Time', 'Minutes cannot exceed 15.');
    return;
  }

  const formattedClock = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  setClock(formattedClock);

  // Apply penalty to game state
  setCurrentYard(penaltyResult.newLOS);
  setEndYard(penaltyResult.newLOS);
  setDown(penaltyResult.newDown);
  setDistance(penaltyResult.newDistance);

  // Handle safety scoring
  if (penaltyResult.isSafety) {
    if (possession === 'offense') {
      // Defense scores on offensive safety
      setAwayTeam({ ...awayTeam, score: awayTeam.score + 2 });
    } else {
      setHomeTeam({ ...homeTeam, score: homeTeam.score + 2 });
    }
  }

  // Handle turnover on downs
  if (penaltyResult.isTurnover) {
    setPossession(possession === 'offense' ? 'defense' : 'offense');
    setDown(1);
    setDistance(10);
  }

  // Format player info for play log
  let playerInfo = '';
  if (penaltyPlayerNumber === 'unknown') {
    playerInfo = 'Player Unknown';
  } else if (penaltyPlayerNumber === null) {
    playerInfo = 'Team';
  } else {
    playerInfo = `#${penaltyPlayerNumber}`;
  }

  // Add to play log
  const play: Play = {
    category: 'penalty',
    player: `${playerInfo} (${penaltyTeam})`,
    startYard: currentYard,
    endYard: penaltyResult.newLOS,
    yards: (penaltyResult.newLOS - currentYard).toString(),
    timestamp: new Date().toLocaleTimeString(),
    gameClock: formattedClock,
    penaltyName: penaltySelected.name,
    down,
    distance,
  };
  setRecentPlays([play, ...recentPlays]);

  // Reset penalty state
  setShowPenaltyConfirm(false);
  setSelectedCategory(null);
  setPenaltyTeam(null);
  setPenaltyCategory(null);
  setPenaltySelected(null);
  setPenaltyResult(null);
  setPenaltyPlayerNumber(null);
  setIsPendingPenalty(false);
  setShowPlayClockInput(false);
  setPlayClockInput('');
  setShouldSelectPlayClockText(false);
};

  // Position categories
  const offensivePositions = ['QB', 'RB', 'WR', 'TE', 'Slot', 'OL'];
  const defensivePositions = ['DL', 'LB', 'DB'];
  const specialTeamsPositions = ['K', 'P'];

  // Filter roster based on possession and play type
  const getFilteredRoster = () => {
    const playType = selectedSubcategory || selectedCategory;
    
    // Special teams plays - show kickers/punters
    if (playType === 'fieldgoal' || playType === 'extra-point') {
      return roster.filter(p => p.position === 'K' || offensivePositions.includes(p.position));
    }
    if (playType === 'punt') {
      return roster.filter(p => p.position === 'P' || p.position === 'K' || offensivePositions.includes(p.position));
    }
    if (playType === 'kickoff') {
      return roster.filter(p => p.position === 'K' || offensivePositions.includes(p.position));
    }
    
    // Defensive plays - show defensive players
    if (playType === 'sack' || playType === 'fumble') {
      return roster.filter(p => defensivePositions.includes(p.position));
    }

    // Interception - context-aware based on possession
    if (playType === 'interception') {
      if (possession === 'offense') {
        // User's team threw the INT - show offensive players (QBs)
        return roster.filter(p => offensivePositions.includes(p.position));
      } else {
        // User's team caught the INT - show defensive players (DBs, LBs, DL)
        return roster.filter(p => defensivePositions.includes(p.position));
      }
    }
    
    // Offensive plays - filter by possession
    if (possession === 'offense') {
      return roster.filter(p => offensivePositions.includes(p.position));
    } else {
      return roster.filter(p => defensivePositions.includes(p.position));
    }
  };

  const filteredRoster = getFilteredRoster().filter(player => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true; // Show all if no search query

    return (
      player.name.toLowerCase().includes(query) ||
      player.number.toString().includes(query) ||
      player.position.toLowerCase().includes(query)
    );
  });

  const groupedRoster: Record<string, Player[]> = {};
  filteredRoster.forEach(player => {
    if (!groupedRoster[player.position]) {
      groupedRoster[player.position] = [];
    }
    groupedRoster[player.position].push(player);
  });

  // Position priority for passer (QB first)
  const passerPositionOrder = ['QB', 'RB', 'WR', 'Slot', 'TE', 'OL'];
  const sortedPasserPositions = Object.keys(groupedRoster).sort((a, b) => {
    const aIndex = passerPositionOrder.indexOf(a);
    const bIndex = passerPositionOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Position priority for receiver (WR, TE, RB first)
  const receiverPositionOrder = ['WR', 'Slot', 'TE', 'RB', 'QB'];
  const sortedReceiverPositions = Object.keys(groupedRoster).sort((a, b) => {
    const aIndex = receiverPositionOrder.indexOf(a);
    const bIndex = receiverPositionOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Position priority for rusher (RB, QB, WR)
  const rusherPositionOrder = ['RB', 'QB', 'WR', 'Slot', 'TE'];
  const sortedRusherPositions = Object.keys(groupedRoster).sort((a, b) => {
    const aIndex = rusherPositionOrder.indexOf(a);
    const bIndex = rusherPositionOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Position priority for defense (DL, LB, DB)
  const defensePositionOrder = ['DL', 'LB', 'DB'];
  const sortedDefensePositions = Object.keys(groupedRoster).sort((a, b) => {
    const aIndex = defensePositionOrder.indexOf(a);
    const bIndex = defensePositionOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Get appropriate position sorting based on play type
  const getPositionOrder = () => {
    const playType = selectedSubcategory || selectedCategory;

    if (playType === 'sack') {
      // Sack: show QB first (they're the one who got sacked)
      return ['QB'].filter(pos => groupedRoster[pos]);
    }
    if (playType === 'interception') {
      if (possession === 'offense') {
        // User's team threw the INT - show QB first (they're the one who threw it)
        return ['QB', 'RB', 'WR', 'Slot', 'TE'].filter(pos => groupedRoster[pos]);
      } else {
        // User's team caught the INT - show defensive players (DB first, then LB, then DL)
        return sortedDefensePositions;
      }
    }
    if (playType === 'fumble') {
      return sortedDefensePositions;
    }
    if (selectedCategory === 'run') {
      return sortedRusherPositions;
    }
    return Object.keys(groupedRoster).sort(); // Default alphabetical
  };

  const renderYardLineSelector = () => {
    // When driving left, gains mean yard number decreases (going from 50 toward 0)
    // When driving right, gains mean yard number increases (going from 50 toward 100)
    const drivingRight = fieldDirection === 'right';

    // Calculate actual yards gained based on direction
    let actualYards;
    if (drivingRight) {
      actualYards = endYard - currentYard; // Moving to higher yard = gain
    } else {
      actualYards = currentYard - endYard; // Moving to lower yard = gain
    }

    const isNegative = actualYards < 0;
    const isPositive = actualYards > 0;

    // Touchdown detection - goal line is at yard 99 (driving right) or yard 1 (driving left)
    const isTouchdown = (drivingRight && endYard >= 99) || (!drivingRight && endYard <= 1);

    // Red zone - inside opponent's 20-yard line
    const approachingTD = (drivingRight && endYard >= 80 && endYard < 99) ||
                          (!drivingRight && endYard <= 20 && endYard > 1);

    return (
      <View style={styles.yardLineContainer}>
        {/* Down & Distance Display */}
        <View style={styles.downDistanceBox}>
          <Text style={styles.downDistanceLabel}>
            {down === 1 ? '1st' : down === 2 ? '2nd' : down === 3 ? '3rd' : '4th'} & {distance}
          </Text>
        </View>

        <View style={styles.yardLineBoxes}>
          {/* START Box */}
          <View style={styles.yardLineBox}>
            <Text style={styles.yardLineLabel} numberOfLines={1}>START</Text>
            <Text style={styles.yardLineValue} numberOfLines={1} adjustsFontSizeToFit>
              {currentYard < 50 ? '◄ ' : currentYard > 50 ? '► ' : ''}{formatYardLine(currentYard)}
            </Text>
          </View>

          {/* END Box */}
          <View style={styles.yardLineBox}>
            <Text style={styles.yardLineLabel} numberOfLines={1}>END</Text>
            <Text style={styles.yardLineValue} numberOfLines={1} adjustsFontSizeToFit>
              {endYard < 50 ? '◄ ' : endYard > 50 ? '► ' : ''}{formatYardLine(endYard)}
            </Text>
          </View>

          {/* YARDS Box with dynamic background */}
          <View style={[
            styles.yardLineBox,
            isPositive && styles.yardLineBoxPositive,
            isNegative && styles.yardLineBoxNegative,
          ]}>
            <Text
              style={[
                styles.yardLineLabel,
                (isPositive || isNegative) && styles.yardLineLabelDark
              ]}
              numberOfLines={1}
            >
              YARDS
            </Text>
            <Text
              style={[
                styles.yardLineValue,
                (isPositive || isNegative) && styles.yardLineValueDark
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {actualYards > 0 ? '+' : ''}{actualYards}
            </Text>
          </View>
        </View>

        {/* Controls Container - groups field strip, slider, buttons, and submit together */}
        <View style={styles.controlsContainer}>
          {/* Visual Football Field */}
          <View style={styles.footballField}>
          <View style={{ height: 40, marginTop: 8, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[
              styles.fieldTitle,
              isTouchdown && { color: '#b4d836', fontSize: 20, fontWeight: 'bold' },
              approachingTD && { color: '#FF3636', fontSize: 20, fontWeight: 'bold' }
            ]}>
              {isTouchdown
                ? 'TOUCHDOWN!'
                : approachingTD
                  ? `RED ZONE ${drivingRight ? '(DRIVING →)' : '(DRIVING ←)'}`
                  : `DRAG TO SET ENDING YARD LINE ${drivingRight ? '(DRIVING →)' : '(DRIVING ←)'}`}
            </Text>
          </View>
          
          {/* Field visualization with integrated labels and markers */}
          <View style={styles.fieldVisualization}>
            {/* Progress bar with yard lines */}
            <View style={styles.playProgressBar}>
              {/* Shaded progress region */}
              <View
                style={[
                  styles.playProgress,
                  {
                    left: `${Math.min(currentYard, endYard)}%`,
                    width: `${Math.abs(endYard - currentYard)}%`,
                    backgroundColor: isPositive ? '#b4d83640' : '#ff363640',
                  }
                ]}
              />

              {/* Yard line markers integrated on the bar */}
              <View style={styles.yardLineMarkersOnBar}>
                {Array.from({ length: 21 }, (_, i) => i * 5).map((yard, i) => {
                  const is10YardMark = yard % 10 === 0;
                  const index10 = yard / 10;

                  return (
                    <View key={yard} style={[styles.yardMarkerOnBar, { left: `${yard}%` }]}>
                      {/* Tick mark */}
                      <View style={[
                        styles.yardTickMarkOnBar,
                        is10YardMark ? styles.yardTickMark10OnBar : styles.yardTickMark5OnBar
                      ]} />
                      {/* Label at 10-yard intervals only */}
                      {is10YardMark && (
                        <Text style={styles.yardNumberLabelOnBar}>
                          {yard === 0 || yard === 100 ? '0' : yard === 50 ? '50' : `${getArrowDirection(index10)} ${getYardDisplay(index10)}`}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* START marker - vertical green line */}
              <View style={[styles.verticalLineMarker, styles.startLineMarker, {
                left: `${currentYard}%`
              }]}>
                <View style={styles.startLine} />
                <Text style={[styles.lineMarkerLabel, styles.startLabel]}>S</Text>
              </View>

              {/* END marker - vertical red line */}
              <View style={[styles.verticalLineMarker, styles.endLineMarker, {
                left: `${endYard}%`
              }]}>
                <View style={styles.endLine} />
                <Text style={[styles.lineMarkerLabel, styles.endLabel]}>E</Text>
              </View>
            </View>
          </View>

          {/* Full-width slider */}
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.fieldSlider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={endYard}
              onValueChange={setEndYard}
              minimumTrackTintColor={
                drivingRight
                  ? (isPositive ? '#b4d836' : isNegative ? '#ff3636' : '#666')
                  : '#3a3a3a'
              }
              maximumTrackTintColor={
                drivingRight
                  ? '#3a3a3a'
                  : (isPositive ? '#b4d836' : isNegative ? '#ff3636' : '#666')
              }
              thumbTintColor="#f3f3f7"
            />
          </View>

          {/* Adjustment buttons below slider */}
          <View style={styles.adjustButtonsRow}>
            {/* Left group */}
            <View style={styles.adjustButtonsGroup}>
              {drivingRight ? (
                // Driving RIGHT: LOSS buttons on left
                <>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard - 10)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>-10</Text>
                  </Pressable>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard - 5)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>-5</Text>
                  </Pressable>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard - 1)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>-1</Text>
                  </Pressable>
                </>
              ) : (
                // Driving LEFT: GAIN buttons on left
                <>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard - 10)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>+10</Text>
                  </Pressable>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard - 5)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>+5</Text>
                  </Pressable>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard - 1)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>+1</Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* Right group */}
            <View style={styles.adjustButtonsGroup}>
              {drivingRight ? (
                // Driving RIGHT: GAIN buttons on right
                <>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard + 1)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>+1</Text>
                  </Pressable>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard + 5)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>+5</Text>
                  </Pressable>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard + 10)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>+10</Text>
                  </Pressable>
                </>
              ) : (
                // Driving LEFT: LOSS buttons on right
                <>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard + 1)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>-1</Text>
                  </Pressable>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard + 5)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>-5</Text>
                  </Pressable>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      setEndYard(Math.max(0, Math.min(100, endYard + 10)));
                    }}
                  >
                    <Text style={styles.adjustButtonText}>-10</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>

          {/* Fumble Section - only for complete passes */}
          {selectedCategory === 'pass' && (
            <View style={styles.fumbleSection}>
              {!addFumble ? (
                <Pressable
                  style={styles.addFumbleButton}
                  onPress={() => setShowFumbleModal(true)}
                >
                  <Text style={styles.addFumbleButtonText}>+ ADD FUMBLE</Text>
                </Pressable>
              ) : (
                <View style={styles.fumbleSummary}>
                  <Text style={styles.fumbleSummaryText}>
                    {fumbleRecoveredBy === 'offense' ? (
                      (() => {
                        const player = roster.find(p => p.number === fumbleRecoveryPlayer);
                        const playerName = player ? `#${player.number} ${player.name.split(' ').pop()?.toUpperCase()}` : 'OFFENSE';
                        return `FUMBLE: RECOVERED BY ${playerName} AT ${(fumbleTurnoverYardLine || endYard) < 50 ? '◄ ' : (fumbleTurnoverYardLine || endYard) > 50 ? '► ' : ''}${formatYardLine(fumbleTurnoverYardLine || endYard)} ✓`;
                      })()
                    ) : (
                      `FUMBLE: LOST AT ${(fumbleTurnoverYardLine || endYard) < 50 ? '◄ ' : (fumbleTurnoverYardLine || endYard) > 50 ? '► ' : ''}${formatYardLine(fumbleTurnoverYardLine || endYard)} ✓`
                    )}
                  </Text>
                  <Pressable
                    style={styles.fumbleEditBtn}
                    onPress={() => {
                      setAddFumble(false);
                      setFumbleRecoveredBy(null);
                      setFumbleTurnoverYardLine(null);
                    }}
                  >
                    <Text style={styles.fumbleEditBtnText}>✕</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <Pressable
            style={[
              styles.submitButton,
              isPositive && styles.submitButtonPositive,
              isNegative && styles.submitButtonNegative,
              (addFumble && !fumbleRecoveredBy) && { opacity: 0.5 },
              (addFumble && fumbleRecoveredBy === 'defense' && fumbleTurnoverYardLine === null) && { opacity: 0.5 }
            ]}
            onPress={handleSubmitPlay}
            disabled={(addFumble && !fumbleRecoveredBy) || (addFumble && fumbleRecoveredBy === 'defense' && fumbleTurnoverYardLine === null)}
          >
            <Text style={styles.submitButtonText}>SUBMIT PLAY</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // Simplified yard selector for interception returns
  const renderInterceptionYardSelector = () => {
    const drivingRight = fieldDirection === 'right';

    return (
      <View style={styles.yardLineContainer}>
        {/* Large yard line display */}
        <View style={{
          backgroundColor: '#2a2a2a',
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 48,
            fontFamily: 'NeueHaas-Bold',
            color: '#f3f3f7',
            letterSpacing: 2
          }}>
            {endYard < 50 ? '◄ ' : endYard > 50 ? '► ' : ''}{formatYardLine(endYard)}
          </Text>
        </View>

        {/* Visual Football Field */}
        <View style={styles.footballField}>
          <View style={styles.fieldVisualization}>
            <View style={styles.playProgressBar}>
              {/* Yard line markers integrated on the bar */}
              <View style={styles.yardLineMarkersOnBar}>
                {Array.from({ length: 21 }, (_, i) => i * 5).map((yard, i) => {
                  const is10YardMark = yard % 10 === 0;
                  const index10 = yard / 10;

                  return (
                    <View key={yard} style={[styles.yardMarkerOnBar, { left: `${yard}%` }]}>
                      {/* Tick mark */}
                      <View style={[
                        styles.yardTickMarkOnBar,
                        is10YardMark ? styles.yardTickMark10OnBar : styles.yardTickMark5OnBar
                      ]} />
                      {/* Label at 10-yard intervals only */}
                      {is10YardMark && (
                        <Text style={styles.yardNumberLabelOnBar}>
                          {yard === 0 || yard === 100 ? '0' : yard === 50 ? '50' : `${getArrowDirection(index10)} ${getYardDisplay(index10)}`}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Current position marker */}
              <View style={[styles.verticalLineMarker, {
                left: `${endYard}%`
              }]}>
                <View style={[styles.endLine, { backgroundColor: '#b4d836' }]} />
                <Text style={[styles.lineMarkerLabel, { color: '#b4d836', borderColor: '#b4d836' }]}>●</Text>
              </View>
            </View>
          </View>

          {/* Full-width slider */}
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.fieldSlider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={endYard}
              onValueChange={setEndYard}
              minimumTrackTintColor="#b4d836"
              maximumTrackTintColor="#3a3a3a"
              thumbTintColor="#f3f3f7"
            />
          </View>
        </View>

        {/* Submit button */}
        <Pressable
          style={[styles.submitButton, { backgroundColor: '#b4d836' }]}
          onPress={handleSubmitPlay}
        >
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </Pressable>
      </View>
    );
  };

  // Handler for MORE plays modal selection
  const handleMorePlaySelect = (playType: string) => {
    console.log('Selected play type from MORE modal:', playType);
    // Map the play type to the appropriate category
    switch (playType) {
      case 'field_goal':
        setShowFieldGoalModal(true);
        break;
      case 'extra_point':
      case 'two_point':
        // These will need special handling - for now just log
        console.log('TODO: Handle', playType);
        Alert.alert('Coming Soon', `${playType} handling will be implemented soon`);
        break;
      case 'interception':
        setSelectedCategory('interception');
        break;
      case 'fumble':
      case 'fumble_recovery':
        setSelectedCategory('fumble');
        break;
      case 'safety':
        setShowSafetyModal(true);
        break;
      case 'touchback':
      case 'onside_kick':
      case 'blocked_kick':
      case 'muffed_punt':
      case 'fair_catch':
      case 'kneel':
      case 'spike':
      case 'no_play':
        // These will need special handling
        console.log('TODO: Handle', playType);
        Alert.alert('Coming Soon', `${playType} handling will be implemented soon`);
        break;
      default:
        console.log('Unknown play type:', playType);
    }
  };

  return (
    <View style={[styles.screenBorder, { backgroundColor: homeTeamColor }]}>

{/* Pregame Setup Modal */}
{showPregameSetup && (
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, { maxWidth: 500 }]}>
      <Text style={styles.modalTitle}>CONFIRM GAME</Text>
      
      {loadingGame ? (
        <Text style={styles.modalMessage}>Loading game details...</Text>
      ) : (
        <>
          <Text style={styles.modalMessage}>Is this today's matchup?</Text>
          
          <View style={styles.gameConfirmContainer}>
            <View style={[styles.teamConfirmCard, { backgroundColor: homeTeamColor, borderColor: homeTeamColor }]}>
              <Text style={styles.teamConfirmLabel}>HOME</Text>
              <Text style={styles.teamConfirmName}>{homeTeam.name}</Text>
            </View>
            
            <Text style={styles.vsText}>VS</Text>
            
            <View style={[styles.teamConfirmCard, { backgroundColor: awayTeamColor, borderColor: awayTeamColor }]}>
              <Text style={[styles.teamConfirmLabel, styles.teamConfirmLabelAway]}>AWAY</Text>
              <Text style={[styles.teamConfirmName, { color: awayTeamTextColor }]}>{awayTeam.name}</Text>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <Pressable
              style={styles.modalButtonConfirm}
              onPress={() => {
                setShowPregameSetup(false);
                setShowGameInit(true);
              }}
            >
              <Text style={styles.modalButtonTextConfirm}>Continue</Text>
            </Pressable>

            <Pressable
              style={styles.modalButtonCancel}
              onPress={() => {
                Alert.alert(
                  'Exit Setup?',
                  'Are you sure you want to exit? You can return to set up the game later.',
                  [
                    { text: 'Stay', style: 'cancel' },
                    {
                      text: 'Exit',
                      onPress: () => {
                        setShowPregameSetup(false);
                        router.back();
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.modalButtonTextCancel}>Exit</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.editTeamsButton}
            onPress={() => {
              Alert.prompt(
                'Edit Home Team',
                'Enter home team name',
                (text) => {
                  if (text) {
                    setHomeTeam({ ...homeTeam, name: text.toUpperCase() });
                    Alert.prompt(
                      'Edit Away Team',
                      'Enter away team name',
                      (awayText) => {
                        if (awayText) {
                          setAwayTeam({ ...awayTeam, name: awayText.toUpperCase() });
                        }
                      },
                      'plain-text',
                      awayTeam.name
                    );
                  }
                },
                'plain-text',
                homeTeam.name
              );
            }}
          >
            <Text style={styles.editTeamsText}>Wrong matchup? Edit teams</Text>
          </Pressable>
        </>
      )}
    </View>
  </View>
)}

{/* Play Clock Input Modal */}
{showPlayClockInput && (
  <View style={styles.modalOverlay}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>GAME CLOCK</Text>
        <Text style={styles.modalMessage}>Enter 4 digits (e.g., 1053 for 10:53)</Text>
        <TextInput
          ref={playClockInputRef}
          style={styles.modalInput}
          value={playClockInput}
          onChangeText={(text) => {
            // Disable auto-selection after first input
            if (shouldSelectPlayClockText) {
              setShouldSelectPlayClockText(false);
            }

            // Only allow numeric input
            const numericText = text.replace(/[^0-9]/g, '');
            setPlayClockInput(numericText);

            // Auto-dismiss keyboard after 4 characters (but don't submit)
            if (numericText.length === 4) {
              Keyboard.dismiss();
            }
          }}
          keyboardType="number-pad"
          maxLength={4}
          placeholder={clock.replace(':', '')}
          placeholderTextColor="#666"
          autoFocus={true}
          selectTextOnFocus={true}
          selection={shouldSelectPlayClockText ? { start: 0, end: playClockInput.length } : undefined}
        />
        <View style={styles.modalButtons}>
          <Pressable style={styles.modalButtonCancel} onPress={() => {
            setShowPlayClockInput(false);
            setPlayClockInput('');
            setShouldSelectPlayClockText(false);
            if (isPendingPenalty) {
              setIsPendingPenalty(false);
            }
          }}>
            <Text style={styles.modalButtonTextCancel}>Cancel</Text>
          </Pressable>
          <Pressable
            style={styles.modalButtonConfirm}
            onPress={isPendingPenalty ? finalizePenaltySubmission : finalizePlaySubmission}
          >
            <Text style={styles.modalButtonTextConfirm}>Submit</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </View>
)}

      {/* Game Initialization Flow */}
      {showGameInit && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <View style={[styles.modalContent, { maxWidth: 500, maxHeight: initStep === 4 ? '70%' : '90%', flex: initStep === 4 ? 1 : undefined }]}>
            {/* Step 1: Coin Flip Winner */}
            {initStep === 1 && (
              <>
                <Text style={styles.modalTitle}>COIN FLIP</Text>
                <Text style={styles.modalMessage}>Who won the coin flip?</Text>
                
                <View style={styles.gameConfirmContainer}>
                  <Pressable
                    style={[styles.teamConfirmCard, { backgroundColor: homeTeamColor, borderColor: homeTeamColor }]}
                    onPress={() => handleCoinFlipWinner('home')}
                  >
                    <Text style={styles.teamConfirmLabel}>HOME</Text>
                    <Text style={styles.teamConfirmName}>{homeTeam.name}</Text>
                  </Pressable>
                  
                  <Text style={styles.vsText}>OR</Text>
                  
                  <Pressable
                    style={[styles.teamConfirmCard, { backgroundColor: awayTeamColor, borderColor: awayTeamColor }]}
                    onPress={() => handleCoinFlipWinner('away')}
                  >
                    <Text style={[styles.teamConfirmLabel, styles.teamConfirmLabelAway]}>AWAY</Text>
                    <Text style={[styles.teamConfirmName, { color: awayTeamTextColor }]}>{awayTeam.name}</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* Step 2: Winner's Choice */}
            {initStep === 2 && (
              <>
                <Text style={styles.modalTitle}>{coinFlipWinner === 'home' ? homeTeam.name : awayTeam.name}</Text>
                <Text style={styles.modalMessage}>Won the coin flip. What did they choose?</Text>
                
                <View style={styles.gameConfirmContainer}>
                  <Pressable
                    style={styles.teamConfirmCard}
                    onPress={() => handleWinnerChoice('receive')}
                  >
                    <Text style={styles.teamConfirmName}>RECEIVE</Text>
                    <Text style={styles.gameInitBtnSubtext}>Get the ball first</Text>
                  </Pressable>
                  
                  <Text style={styles.vsText}>OR</Text>
                  
                  <Pressable
                    style={styles.teamConfirmCard}
                    onPress={() => handleWinnerChoice('defer')}
                  >
                    <Text style={styles.teamConfirmName}>DEFER</Text>
                    <Text style={styles.gameInitBtnSubtext}>Other team gets ball</Text>
                  </Pressable>
                </View>
                
                <Pressable
                style={styles.modalButtonCancel}
                onPress={() => {
                setInitStep(1);
                setCoinFlipWinner(null);
                }}
                >
                <Text style={styles.modalButtonTextCancel}>← Back</Text>
                </Pressable>
              </>
            )}

            {/* Step 3: Field Direction */}
            {initStep === 3 && (
              <>
                <Text style={styles.modalTitle}>FIELD DIRECTION</Text>
                <Text style={styles.modalMessage}>
                  {winnerChoice === 'receive' 
                    ? `${coinFlipWinner === 'home' ? homeTeam.name : awayTeam.name} will receive. Which direction are they driving?`
                    : `${coinFlipWinner === 'home' ? awayTeam.name : homeTeam.name} will receive. Which direction are they driving?`}
                </Text>
                
                <View style={styles.gameConfirmContainer}>
                  <Pressable
                    style={styles.teamConfirmCard}
                    onPress={() => handleStartGame('left')}
                  >
                    <Text style={styles.teamConfirmName}>◄ DRIVING LEFT</Text>
                  </Pressable>

                  <Text style={styles.vsText}>OR</Text>

                  <Pressable
                    style={styles.teamConfirmCard}
                    onPress={() => handleStartGame('right')}
                  >
                    <Text style={styles.teamConfirmName}>DRIVING RIGHT ►</Text>
                  </Pressable>
                </View>
                
                <Pressable
                style={styles.modalButtonCancel}
                onPress={() => {
                setInitStep(2);
                setWinnerChoice(null);
                }}
                >
                <Text style={styles.modalButtonTextCancel}>← Back</Text>
                </Pressable>
              </>
            )}

            {/* Step 4: Kickoff Return - COMPLETE SELF-CONTAINED VERSION */}
            {initStep === 4 && (
              <>
                {/* Simple Header */}
                <View style={styles.kickoffHeaderRow}>
                  <Text style={styles.kickoffHeaderText}>
                    {winnerChoice === 'receive'
                      ? `${coinFlipWinner === 'home' ? homeTeam.name : awayTeam.name} RECEIVING`
                      : `${coinFlipWinner === 'home' ? awayTeam.name : homeTeam.name} RECEIVING`}
                  </Text>
                </View>

                {!selectedPlayer ? (
                  <>
                    {/* Simple Touchback Button */}
                    <TouchableOpacity
                      style={styles.kickoffTouchbackButton}
                      onPress={() => {
                        const touchbackYard = fieldDirection === 'left' ? 75 : 25;
                        setCurrentYard(touchbackYard);
                        setEndYard(touchbackYard);

                        const play: Play = {
                          category: 'kickoff-touchback',
                          player: 'Team',
                          startYard: 0,
                          endYard: touchbackYard,
                          yards: '0',
                          timestamp: new Date().toLocaleTimeString(),
                        };
                        setRecentPlays([play, ...recentPlays]);

                        setShowGameInit(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.kickoffTouchbackTitle}>TOUCHBACK</Text>
                      <Text style={styles.kickoffTouchbackSubtitle}>Ball starts at 25</Text>
                    </TouchableOpacity>

                    {/* Simple Divider */}
                    <View style={styles.kickoffDividerContainer}>
                      <View style={styles.kickoffDividerLine} />
                      <Text style={styles.kickoffDividerText}>or select returner</Text>
                      <View style={styles.kickoffDividerLine} />
                    </View>

                    {/* Search Input */}
                    <TextInput
                      style={styles.kickoffSearchInput}
                      placeholder="Search player by name or number..."
                      placeholderTextColor="#8E8E93"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                    />

                    {/* Player List */}
                    {(() => {
                      const filtered = roster.filter(player => {
                        const query = searchQuery.toLowerCase();
                        const numberStr = String(player.number);
                        return (
                          player.name.toLowerCase().includes(query) ||
                          numberStr.includes(query) ||
                          player.position.toLowerCase().includes(query)
                        );
                      });

                      const grouped: Record<string, Player[]> = {};
                      filtered.forEach(player => {
                        if (!grouped[player.position]) {
                          grouped[player.position] = [];
                        }
                        grouped[player.position].push(player);
                      });

                      return (
                        <ScrollView
                          key={`player-list-${searchQuery}`}
                          style={styles.kickoffPlayerList}
                          showsVerticalScrollIndicator={false}
                          keyboardShouldPersistTaps="handled"
                        >
                          {filtered.length === 0 ? (
                            <Text style={{ color: '#8E8E93', fontFamily: 'NeueHaas-Roman', textAlign: 'center', marginTop: 20 }}>
                              No players found
                            </Text>
                          ) : (
                            Object.entries(grouped).map(([position, players]) => (
                              <View key={position} style={{ marginBottom: 16 }}>
                                <Text style={styles.kickoffPositionLabel}>{position}</Text>
                                {players.map((player) => (
                                  <TouchableOpacity
                                    key={`${player.number}-${player.name}`}
                                    style={styles.kickoffPlayerItem}
                                    onPress={() => setSelectedPlayer(player)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={styles.kickoffJerseyNumber}>#{player.number}</Text>
                                    <Text style={styles.kickoffPlayerName}>{player.name}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            ))
                          )}
                        </ScrollView>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {/* Player Selected - Show Slider */}
                    <Text style={styles.step4SelectedText}>
                      #{selectedPlayer.number} {selectedPlayer.name}
                    </Text>

                    <Text style={styles.step4YardLabel}>
                      {kickoffReturnYard}-yard return → {fieldDirection === 'left' ? formatYardLine(100 - kickoffReturnYard) : formatYardLine(kickoffReturnYard)} yard line
                    </Text>

                    <Slider
                      style={styles.step4Slider}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      // BUG FIX #3: Invert slider visually to match kickoff direction
                      // - Driving RIGHT (kickoff from left): slider goes left→right (natural)
                      // - Driving LEFT (kickoff from right): slider goes right→left (inverted)
                      value={fieldDirection === 'left' ? (100 - kickoffReturnYard) : kickoffReturnYard}
                      onValueChange={(val) => setKickoffReturnYard(fieldDirection === 'left' ? (100 - val) : val)}
                      minimumTrackTintColor="#b4d836"
                      maximumTrackTintColor="#666"
                      thumbTintColor="#b4d836"
                    />

                    <View style={styles.step4SliderLabels}>
                      <Text style={styles.step4SliderLabel}>{fieldDirection === 'left' ? 'TD (100)' : '0'}</Text>
                      <Text style={styles.step4SliderLabel}>50</Text>
                      <Text style={styles.step4SliderLabel}>{fieldDirection === 'left' ? '0' : 'TD (100)'}</Text>
                    </View>

                    <View style={{ marginTop: 24 }} pointerEvents="box-none">
                      <TouchableOpacity
                        style={styles.modalButtonConfirm}
                        onPress={() => {
                          console.log('=== SUBMIT BUTTON PRESSED ===');
                          console.log('Selected Player:', selectedPlayer);
                          console.log('Return Yards:', kickoffReturnYard);
                          console.log('Field Direction:', fieldDirection);

                          const isTouchdown = (fieldDirection === 'left' && kickoffReturnYard === 0) ||
                                           (fieldDirection === 'right' && kickoffReturnYard === 100);

                          if (isTouchdown) {
                          Alert.alert(
                            'KICKOFF RETURN TOUCHDOWN!',
                            `${selectedPlayer.name} scored on the opening kickoff!`,
                            [
                              {
                                text: 'Continue',
                                onPress: () => {
                                  const scoringTeam = possession === 'offense' ? 'home' : 'away';
                                  if (scoringTeam === 'home') {
                                    setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
                                  } else {
                                    setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
                                  }

                                  const play: Play = {
                                    category: 'kickoff-return-td',
                                    player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
                                    startYard: fieldDirection === 'left' ? 100 : 0,
                                    endYard: fieldDirection === 'left' ? 0 : 100,
                                    yards: '100',
                                    timestamp: new Date().toLocaleTimeString(),
                                  };
                                  setRecentPlays([play, ...recentPlays]);

                                  Alert.alert(
                                    'EXTRA POINT',
                                    'Select extra point attempt:',
                                    [
                                      {
                                        text: 'PAT (1pt)',
                                        onPress: () => {
                                          Alert.alert('Did it go through?', '', [
                                            { text: 'Missed', onPress: () => {
                                              setPossession(possession === 'offense' ? 'defense' : 'offense');
                                              setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                                              setCurrentYard(35);
                                              setEndYard(35);
                                              setSelectedPlayer(null);
                                              setSearchQuery('');
                                              setShowGameInit(false);
                                            }},
                                            { text: 'Good (+1)', onPress: () => {
                                              if (scoringTeam === 'home') {
                                                setHomeTeam({ ...homeTeam, score: homeTeam.score + 1 });
                                              } else {
                                                setAwayTeam({ ...awayTeam, score: awayTeam.score + 1 });
                                              }
                                              setPossession(possession === 'offense' ? 'defense' : 'offense');
                                              setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                                              setCurrentYard(35);
                                              setEndYard(35);
                                              setSelectedPlayer(null);
                                              setSearchQuery('');
                                              setShowGameInit(false);
                                            }}
                                          ]);
                                        }
                                      },
                                      {
                                        text: '2-PT Conversion',
                                        onPress: () => {
                                          Alert.alert('Successful?', '', [
                                            { text: 'Failed', onPress: () => {
                                              setPossession(possession === 'offense' ? 'defense' : 'offense');
                                              setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                                              setCurrentYard(35);
                                              setEndYard(35);
                                              setSelectedPlayer(null);
                                              setSearchQuery('');
                                              setShowGameInit(false);
                                            }},
                                            { text: 'Success (+2)', onPress: () => {
                                              if (scoringTeam === 'home') {
                                                setHomeTeam({ ...homeTeam, score: homeTeam.score + 2 });
                                              } else {
                                                setAwayTeam({ ...awayTeam, score: awayTeam.score + 2 });
                                              }
                                              setPossession(possession === 'offense' ? 'defense' : 'offense');
                                              setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                                              setCurrentYard(35);
                                              setEndYard(35);
                                              setSelectedPlayer(null);
                                              setSearchQuery('');
                                              setShowGameInit(false);
                                            }}
                                          ]);
                                        }
                                      }
                                    ]
                                  );
                                }
                              }
                            ]
                          );
                        } else {
                          // The slider shows yards from their own goal line (0-100)
                          // If driving left (defending right), need to convert: 100 - sliderValue
                          // If driving right (defending left), use slider value as-is
                          const actualYard = fieldDirection === 'left' ? (100 - kickoffReturnYard) : kickoffReturnYard;

                          setCurrentYard(actualYard);
                          setEndYard(actualYard);

                          const play: Play = {
                            category: 'kickoff-return',
                            player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
                            startYard: fieldDirection === 'left' ? 100 : 0,
                            endYard: actualYard,
                            yards: kickoffReturnYard.toString(),
                            timestamp: new Date().toLocaleTimeString(),
                          };
                          setRecentPlays([play, ...recentPlays]);

                          setSelectedPlayer(null);
                          setSearchQuery('');
                          setShowGameInit(false);
                        }
                      }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.modalButtonTextConfirm}>START GAME</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.modalButtonCancel, { marginTop: 16 }]}
                  onPress={() => {
                    console.log('=== CHANGE PLAYER / BACK BUTTON PRESSED ===');
                    if (selectedPlayer) {
                      // If player is selected, go back to player selection
                      setSelectedPlayer(null);
                      setSearchQuery('');
                    } else {
                      // If no player selected, go back to field direction
                      setInitStep(3);
                      setSelectedPlayer(null);
                      setSearchQuery('');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextCancel}>
                    {selectedPlayer ? 'Change Player' : '← Back'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Exit Game Time?</Text>
            <Text style={styles.modalMessage}>Are you sure you want to leave? Game data will be saved.</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setShowExitConfirm(false)}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonConfirm} onPress={() => router.back()}>
                <Text style={styles.modalButtonTextConfirm}>Exit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Clock Edit Modal */}
      {showClockEdit && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Clock</Text>
              <Text style={styles.modalMessage}>Enter 4 digits (e.g., 1053 for 10:53)</Text>
              <TextInput
                ref={clockEditInputRef}
                style={styles.modalInput}
                value={clockInput}
                onChangeText={(text) => {
                  // Only allow numeric input
                  const numericText = text.replace(/[^0-9]/g, '');
                  setClockInput(numericText);
                  if (numericText.length === 4) {
                    Keyboard.dismiss();
                  }
                }}
                keyboardType="number-pad"
                maxLength={4}
                placeholder={clock.replace(':', '')}
                placeholderTextColor="#666"
                autoFocus={true}
                selectTextOnFocus={true}
              />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => {
                setShowClockEdit(false);
                setClockInput('');
              }}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonConfirm} onPress={() => {
                let input = clockInput.replace(/[^0-9:]/g, '');
                let minutes = 0;
                let seconds = 0;
                
                if (input.includes(':')) {
                  const parts = input.split(':');
                  minutes = parseInt(parts[0]) || 0;
                  seconds = parseInt(parts[1]) || 0;
                } else {
                  if (input.length <= 2) {
                    seconds = parseInt(input) || 0;
                  } else if (input.length === 3) {
                    minutes = parseInt(input[0]) || 0;
                    seconds = parseInt(input.substring(1)) || 0;
                  } else {
                    minutes = parseInt(input.substring(0, input.length - 2)) || 0;
                    seconds = parseInt(input.substring(input.length - 2)) || 0;
                  }
                }
                
                if (seconds > 59) {
                  Alert.alert('Invalid Time', 'Seconds must be between 0 and 59.');
                  return;
                }
                
                if (minutes > 15) {
                  Alert.alert('Invalid Time', 'Minutes cannot exceed 15.');
                  return;
                }
                
                const formattedClock = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                setClock(formattedClock);
                setShowClockEdit(false);
                setClockInput('');
              }}>
                <Text style={styles.modalButtonTextConfirm}>Save</Text>
              </Pressable>
            </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Down & Distance Edit Modal */}
      {showDownEdit && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Down & Distance</Text>
            
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Down:</Text>
              <View style={styles.pickerButtons}>
                <Pressable 
                  style={[styles.pickerBtn, down === 1 && styles.pickerBtnSelected]} 
                  onPress={() => setDown(1)}
                >
                  <Text style={styles.pickerBtnText}>1ST</Text>
                </Pressable>
                <Pressable 
                  style={[styles.pickerBtn, down === 2 && styles.pickerBtnSelected]} 
                  onPress={() => setDown(2)}
                >
                  <Text style={styles.pickerBtnText}>2ND</Text>
                </Pressable>
                <Pressable 
                  style={[styles.pickerBtn, down === 3 && styles.pickerBtnSelected]} 
                  onPress={() => setDown(3)}
                >
                  <Text style={styles.pickerBtnText}>3RD</Text>
                </Pressable>
                <Pressable 
                  style={[styles.pickerBtn, down === 4 && styles.pickerBtnSelected]} 
                  onPress={() => setDown(4)}
                >
                  <Text style={styles.pickerBtnText}>4TH</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Distance:</Text>
              <View style={styles.distancePicker}>
                <Pressable 
                  style={styles.arrowBtn} 
                  onPress={() => distance > 1 && setDistance(distance - 1)}
                >
                  <Text style={styles.arrowBtnText}>◄</Text>
                </Pressable>
                <Text style={styles.distanceValue}>{distance}</Text>
                <Pressable 
                  style={styles.arrowBtn} 
                  onPress={() => distance < 99 && setDistance(distance + 1)}
                >
                  <Text style={styles.arrowBtnText}>►</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setShowDownEdit(false)}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonConfirm} onPress={() => setShowDownEdit(false)}>
                <Text style={styles.modalButtonTextConfirm}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Timeout Modal */}
      {showTimeoutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Timeout</Text>
              <Pressable 
                style={styles.modalCloseBtn}
                onPress={() => setShowTimeoutModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMessage}>Which team called timeout?</Text>
            
            <View style={styles.kickoffOptions}>
              <Pressable 
                style={styles.kickoffBtn}
                onPress={() => {
                  if (homeTeam.timeouts > 0) {
                    setHomeTeam({ ...homeTeam, timeouts: homeTeam.timeouts - 1 });
                  }
                  setShowTimeoutModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>{homeTeam.name}</Text>
                <Text style={styles.kickoffBtnSubtext}>{homeTeam.timeouts} timeout{homeTeam.timeouts !== 1 ? 's' : ''} left</Text>
              </Pressable>
              
              <Pressable 
                style={styles.kickoffBtn}
                onPress={() => {
                  if (awayTeam.timeouts > 0) {
                    setAwayTeam({ ...awayTeam, timeouts: awayTeam.timeouts - 1 });
                  }
                  setShowTimeoutModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>{awayTeam.name}</Text>
                <Text style={styles.kickoffBtnSubtext}>{awayTeam.timeouts} timeout{awayTeam.timeouts !== 1 ? 's' : ''} left</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Kickoff Modal */}
      {showKickoffModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kickoff Result</Text>
              <Pressable 
                style={styles.modalCloseBtn}
                onPress={() => setShowKickoffModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMessage}>Where did the return end?</Text>
            
            <View style={styles.kickoffOptions}>
              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  // Set ball at 25-yard line
                  setCurrentYard(25);
                  setEndYard(25);

                  // Switch possession and field direction (receiving team gets the ball)
                  setPossession(possession === 'offense' ? 'defense' : 'offense');
                  setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');

                  // Reset to 1st & 10
                  setDown(1);
                  setDistance(10);

                  // Log the touchback play
                  const play: Play = {
                    category: 'kickoff-touchback',
                    player: 'Team',
                    startYard: fieldDirection === 'left' ? 0 : 100,
                    endYard: 25,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                    gameClock: clock,
                  };
                  setRecentPlays([play, ...recentPlays]);

                  // Clear selected players
                  setSelectedCategory(null);
                  setSelectedPlayer(null);
                  setSelectedPlayer2(null);
                  setSearchQuery('');

                  setShowKickoffModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>TOUCHBACK</Text>
                <Text style={styles.kickoffBtnSubtext}>Ball at 25</Text>
              </Pressable>

              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  setShowKickoffModal(false);
                  setShowKickoffReturnSelector(true);
                }}
              >
                <Text style={styles.kickoffBtnText}>RETURN</Text>
                <Text style={styles.kickoffBtnSubtext}>Select yard line</Text>
              </Pressable>
            </View>

            <View style={styles.kickoffOptions}>
              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  Alert.alert(
                    'Onside Kick',
                    'Who recovered the onside kick?',
                    [
                      {
                        text: 'Kicking Team',
                        onPress: () => {
                          // Kicking team retains possession - no possession change
                          setCurrentYard(50);
                          setEndYard(50);
                          setDown(1);
                          setDistance(10);

                          const play: Play = {
                            category: 'kickoff-onside-recovered',
                            player: 'Onside Kick - Kicking Team Recovered',
                            startYard: fieldDirection === 'left' ? 0 : 100,
                            endYard: 50,
                            yards: '0',
                            timestamp: new Date().toLocaleTimeString(),
                            gameClock: clock,
                          };
                          setRecentPlays([play, ...recentPlays]);

                          setSelectedCategory(null);
                          setSelectedPlayer(null);
                          setSelectedPlayer2(null);
                          setSearchQuery('');
                          setShowKickoffModal(false);
                        }
                      },
                      {
                        text: 'Receiving Team',
                        onPress: () => {
                          // Normal possession change to receiving team
                          setCurrentYard(50);
                          setEndYard(50);
                          setPossession(possession === 'offense' ? 'defense' : 'offense');
                          setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                          setDown(1);
                          setDistance(10);

                          const play: Play = {
                            category: 'kickoff-onside-failed',
                            player: 'Onside Kick - Receiving Team Recovered',
                            startYard: fieldDirection === 'left' ? 0 : 100,
                            endYard: 50,
                            yards: '0',
                            timestamp: new Date().toLocaleTimeString(),
                            gameClock: clock,
                          };
                          setRecentPlays([play, ...recentPlays]);

                          setSelectedCategory(null);
                          setSelectedPlayer(null);
                          setSelectedPlayer2(null);
                          setSearchQuery('');
                          setShowKickoffModal(false);
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.kickoffBtnText}>ONSIDE KICK</Text>
                <Text style={styles.kickoffBtnSubtext}>Who recovered?</Text>
              </Pressable>

              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  // Kickoff out of bounds - receiving team at 40
                  setCurrentYard(40);
                  setEndYard(40);
                  setPossession(possession === 'offense' ? 'defense' : 'offense');
                  setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                  setDown(1);
                  setDistance(10);

                  const play: Play = {
                    category: 'kickoff-oob',
                    player: 'Kickoff Out of Bounds',
                    startYard: fieldDirection === 'left' ? 0 : 100,
                    endYard: 40,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                    gameClock: clock,
                  };
                  setRecentPlays([play, ...recentPlays]);

                  setSelectedCategory(null);
                  setSelectedPlayer(null);
                  setSelectedPlayer2(null);
                  setSearchQuery('');
                  setShowKickoffModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>OUT OF BOUNDS</Text>
                <Text style={styles.kickoffBtnSubtext}>Ball at 40</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Kickoff Return Yard Line Selector */}
      {showKickoffReturnSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kickoff Return</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  setShowKickoffReturnSelector(false);
                  setShowKickoffModal(true);
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalMessage}>
              Where did the return end?
            </Text>

            <View style={styles.kickoffSliderContainer}>
              <Text style={styles.kickoffYardText}>
                {formatYardLineWithDirection(kickoffReturnYard, fieldDirection)}
              </Text>

              <Slider
                style={styles.kickoffSlider}
                minimumValue={1}
                maximumValue={99}
                step={1}
                value={kickoffReturnYard}
                onValueChange={(value) => setKickoffReturnYard(value)}
                minimumTrackTintColor="#b4d836"
                maximumTrackTintColor="#333"
                thumbTintColor="#b4d836"
              />

              <View style={styles.kickoffSliderLabels}>
                <Text style={styles.kickoffSliderLabel}>
                  {fieldDirection === 'left' ? 'OPP GOAL' : 'OWN GOAL'}
                </Text>
                <Text style={styles.kickoffSliderLabel}>50</Text>
                <Text style={styles.kickoffSliderLabel}>
                  {fieldDirection === 'left' ? 'OWN GOAL' : 'OPP GOAL'}
                </Text>
              </View>
            </View>

            <Pressable
              style={{
                backgroundColor: '#B4D836',
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center',
                width: '100%',
                marginTop: 16,
              }}
              onPress={() => {
                // Check for touchdown on return
                const isTouchdown = kickoffReturnYard === 0 || kickoffReturnYard === 100;

                if (isTouchdown) {
                  Alert.alert(
                    'KICKOFF RETURN TOUCHDOWN!',
                    'Did the receiving team score on the kickoff return?',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                          setShowKickoffReturnSelector(true);
                        }
                      },
                      {
                        text: 'Yes, Touchdown',
                        onPress: () => {
                          // Receiving team scores on kickoff return
                          const scoringTeam = possession === 'defense' ? 'home' : 'away';
                          if (scoringTeam === 'home') {
                            setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
                          } else {
                            setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
                          }

                          // Log kickoff return TD
                          const play: Play = {
                            category: 'kickoff-return-td',
                            player: 'Team',
                            startYard: fieldDirection === 'left' ? 0 : 100,
                            endYard: kickoffReturnYard,
                            yards: '100',
                            timestamp: new Date().toLocaleTimeString(),
                            gameClock: clock,
                          };
                          setRecentPlays([play, ...recentPlays]);

                          // Close kickoff modals and show touchdown modal for PAT
                          setShowKickoffReturnSelector(false);
                          setShowKickoffModal(false);
                          setShowTouchdownModal(true);
                        }
                      }
                    ]
                  );
                  return;
                }

                // Set return yard
                setCurrentYard(kickoffReturnYard);
                setEndYard(kickoffReturnYard);

                // Switch possession and field direction (receiving team gets the ball)
                setPossession(possession === 'offense' ? 'defense' : 'offense');
                setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');

                // Reset to 1st & 10
                setDown(1);
                setDistance(10);

                // Log the kickoff return play
                const play: Play = {
                  category: 'kickoff-return',
                  player: 'Team',
                  startYard: fieldDirection === 'left' ? 0 : 100,
                  endYard: kickoffReturnYard,
                  yards: Math.abs(kickoffReturnYard - (fieldDirection === 'left' ? 0 : 100)).toString(),
                  timestamp: new Date().toLocaleTimeString(),
                  gameClock: clock,
                };
                setRecentPlays([play, ...recentPlays]);

                // Clear selected players
                setSelectedCategory(null);
                setSelectedPlayer(null);
                setSelectedPlayer2(null);
                setSearchQuery('');

                // Close modals
                setShowKickoffReturnSelector(false);
                setShowKickoffModal(false);
              }}
            >
              <Text style={{
                color: '#262626',
                fontSize: 18,
                fontFamily: 'NeueHaas-Bold',
                fontWeight: 'bold',
              }}>SUBMIT</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Touchdown Confirmation Modal */}
      {showTouchdownConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>TOUCHDOWN?</Text>
              <Pressable 
                style={styles.modalCloseBtn}
                onPress={() => setShowTouchdownConfirm(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            
            <Text style={styles.modalMessage}>
              Which team scored a touchdown?
            </Text>
            
            <View style={styles.kickoffOptions}>
              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  if (possession === 'offense') {
                    setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
                  } else {
                    setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
                  }
                  setShowTouchdownConfirm(false);
                  setShowTouchdownModal(true);
                }}
              >
                <Text style={styles.kickoffBtnText}>{homeTeam.name}</Text>
                <Text style={styles.kickoffBtnSubtext}>+6 Points</Text>
              </Pressable>
              
              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  if (possession === 'defense') {
                    setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
                  } else {
                    setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
                  }
                  setShowTouchdownConfirm(false);
                  setShowTouchdownModal(true);
                }}
              >
                <Text style={styles.kickoffBtnText}>{awayTeam.name}</Text>
                <Text style={styles.kickoffBtnSubtext}>+6 Points</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Touchdown Modal */}
      {showTouchdownModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#B4D836' }]}>TOUCHDOWN!</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowTouchdownModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalMessage}>Select extra point result</Text>

            {/* First row: PAT GOOD / PAT MISSED */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <Pressable
                style={({ pressed }) => [
                  styles.extraPointBtn,
                  {
                    flex: 1,
                    backgroundColor: pressed ? '#B4D836' : '#262626',
                    borderWidth: 2,
                    borderColor: '#3A3A3A'
                  }
                ]}
                onPress={() => {
                  const scoringTeam = possession === 'offense' ? 'home' : 'away';
                  if (scoringTeam === 'home') {
                    setHomeTeam({ ...homeTeam, score: homeTeam.score + 1 });
                  } else {
                    setAwayTeam({ ...awayTeam, score: awayTeam.score + 1 });
                  }
                  setShowTouchdownModal(false);
                  setShowKickoffModal(true);
                }}
              >
                <Text style={styles.kickoffBtnText}>PAT GOOD</Text>
                <Text style={styles.kickoffBtnSubtext}>+1 Point</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.extraPointBtn,
                  {
                    flex: 1,
                    backgroundColor: pressed ? '#FF3636' : '#262626',
                    borderWidth: 2,
                    borderColor: '#3A3A3A'
                  }
                ]}
                onPress={() => {
                  // No additional points for missed PAT
                  setShowTouchdownModal(false);
                  setShowKickoffModal(true);
                }}
              >
                <Text style={styles.kickoffBtnText}>PAT MISSED</Text>
                <Text style={styles.kickoffBtnSubtext}>No Points</Text>
              </Pressable>
            </View>

            {/* Second row: 2-PT SUCCESS / 2-PT FAILED */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <Pressable
                style={({ pressed }) => [
                  styles.extraPointBtn,
                  {
                    flex: 1,
                    backgroundColor: pressed ? '#B4D836' : '#262626',
                    borderWidth: 2,
                    borderColor: '#3A3A3A'
                  }
                ]}
                onPress={() => {
                  const scoringTeam = possession === 'offense' ? 'home' : 'away';
                  if (scoringTeam === 'home') {
                    setHomeTeam({ ...homeTeam, score: homeTeam.score + 2 });
                  } else {
                    setAwayTeam({ ...awayTeam, score: awayTeam.score + 2 });
                  }
                  setShowTouchdownModal(false);
                  setShowKickoffModal(true);
                }}
              >
                <Text style={styles.kickoffBtnText}>2-PT SUCCESS</Text>
                <Text style={styles.kickoffBtnSubtext}>+2 Points</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.extraPointBtn,
                  {
                    flex: 1,
                    backgroundColor: pressed ? '#FF3636' : '#262626',
                    borderWidth: 2,
                    borderColor: '#3A3A3A'
                  }
                ]}
                onPress={() => {
                  // No additional points for failed 2-PT
                  setShowTouchdownModal(false);
                  setShowKickoffModal(true);
                }}
              >
                <Text style={styles.kickoffBtnText}>2-PT FAILED</Text>
                <Text style={styles.kickoffBtnSubtext}>No Points</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.modalButtonCancel, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3A3A3A' }]}
              onPress={() => setShowTouchdownModal(false)}
            >
              <Text style={[styles.modalButtonTextCancel, { color: '#888888' }]}>CANCEL</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Penalty Team Selection Modal - Step 1 */}
      {penaltyStep === 'team' && (
        <View style={styles.modalOverlay}>
          <View style={styles.penaltyTeamSelectionModal}>
            <Text style={styles.penaltyModalTitle}>PENALTY ON</Text>

            <View style={styles.penaltyTeamButtons}>
              <Pressable
                style={[
                  styles.penaltyTeamBtn,
                  {
                    backgroundColor: possession === 'offense' ? homeTeamColor : awayTeamColor,
                    borderLeftWidth: possession === 'offense' ? 0 : 4,
                    borderLeftColor: possession === 'offense' ? 'transparent' : awayTeamTextColor
                  }
                ]}
                onPress={() => {
                  setPenaltyTeam('offense');
                  setPenaltyStep('select');
                }}
              >
                <Text style={[
                  styles.penaltyTeamBtnText,
                  { color: possession === 'offense' ? '#fff' : awayTeamTextColor }
                ]}>OFFENSE</Text>
                <Text style={[
                  styles.penaltyTeamBtnSubtext,
                  { color: possession === 'offense' ? '#fff' : awayTeamTextColor }
                ]}>
                  {possession === 'offense' ? homeTeam.name : awayTeam.name}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.penaltyTeamBtn,
                  {
                    backgroundColor: possession === 'offense' ? awayTeamColor : homeTeamColor,
                    borderLeftWidth: possession === 'offense' ? 4 : 0,
                    borderLeftColor: possession === 'offense' ? awayTeamTextColor : 'transparent'
                  }
                ]}
                onPress={() => {
                  setPenaltyTeam('defense');
                  setPenaltyStep('select');
                }}
              >
                <Text style={[
                  styles.penaltyTeamBtnText,
                  { color: possession === 'offense' ? awayTeamTextColor : '#fff' }
                ]}>DEFENSE</Text>
                <Text style={[
                  styles.penaltyTeamBtnSubtext,
                  { color: possession === 'offense' ? awayTeamTextColor : '#fff' }
                ]}>
                  {possession === 'offense' ? awayTeam.name : homeTeam.name}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.penaltyTeamCancelBtn}
              onPress={() => {
                setPenaltyStep(null);
                setPenaltyTeam(null);
              }}
            >
              <Text style={styles.penaltyTeamCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Penalty Selection Screen - Step 2 */}
      {penaltyStep === 'select' && penaltyTeam && (
        <View style={styles.modalOverlay}>
          <View style={styles.penaltySelectionContainer}>
            {/* Header with Back button */}
            <View style={[
              styles.penaltySelectionHeader,
              {
                backgroundColor: penaltyTeam === 'offense'
                  ? (possession === 'offense' ? homeTeamColor : awayTeamTextColor)
                  : (possession === 'offense' ? awayTeamTextColor : homeTeamColor)
              }
            ]}>
              <Pressable
                style={styles.penaltyBackBtn}
                onPress={() => {
                  setPenaltyStep('team');
                  setPenaltyTeam(null);
                }}
              >
                <Text style={styles.penaltyBackText}>← Back</Text>
              </Pressable>
              <Text style={styles.penaltySelectionTitle}>
                {penaltyTeam.toUpperCase()} PENALTY
              </Text>
            </View>

            <ScrollView
              style={styles.penaltyScroll}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Quick Select Section */}
              <View style={styles.quickSelectCard}>
                <Text style={styles.quickSelectHeader}>QUICK SELECT</Text>
                <View style={[styles.penaltyButtonRow, { paddingHorizontal: 0 }]}>
                  {penaltyTeam === 'offense' ? (
                    <>
                      {renderPenaltyButton(PENALTIES['false-start'], true)}
                      {renderPenaltyButton(PENALTIES['holding-offense'], true)}
                      {renderPenaltyButton(PENALTIES['delay-of-game'], true)}
                    </>
                  ) : (
                    <>
                      {renderPenaltyButton(PENALTIES['offside'], true)}
                      {renderPenaltyButton(PENALTIES['encroachment'], true)}
                      {renderPenaltyButton(PENALTIES['pass-interference-defense'], true)}
                    </>
                  )}
                </View>
              </View>

              {/* Pre-Snap Penalties */}
              {Object.values(PENALTIES).filter(p =>
                p.category === 'pre-snap' &&
                (p.team === penaltyTeam || p.team === 'either')
              ).length > 0 && (
                <>
                  <Text style={styles.penaltySectionHeader}>
                    PRE-SNAP ({penaltyTeam === 'offense' ? '5 yards' : '5 yards'})
                  </Text>
                  <View style={styles.penaltySectionDivider} />
                  <View style={styles.penaltyButtonRow}>
                    {Object.values(PENALTIES)
                      .filter(p => p.category === 'pre-snap' && (p.team === penaltyTeam || p.team === 'either'))
                      .map(penalty => renderPenaltyButton(penalty))}
                  </View>
                </>
              )}

              {/* Blocking Penalties */}
              {Object.values(PENALTIES).filter(p =>
                p.category === 'blocking' &&
                (p.team === penaltyTeam || p.team === 'either')
              ).length > 0 && (
                <>
                  <Text style={styles.penaltySectionHeader}>
                    BLOCKING ({penaltyTeam === 'offense' ? '10-15 yards' : '5-10 yards'})
                  </Text>
                  <View style={styles.penaltySectionDivider} />
                  <View style={styles.penaltyButtonRow}>
                    {Object.values(PENALTIES)
                      .filter(p => p.category === 'blocking' && (p.team === penaltyTeam || p.team === 'either'))
                      .map(penalty => renderPenaltyButton(penalty))}
                  </View>
                </>
              )}

              {/* Passing Penalties */}
              {Object.values(PENALTIES).filter(p =>
                p.category === 'passing' &&
                (p.team === penaltyTeam || p.team === 'either')
              ).length > 0 && (
                <>
                  <Text style={styles.penaltySectionHeader}>
                    PASSING ({penaltyTeam === 'offense' ? '5-15 yards' : '15 yards'})
                  </Text>
                  <View style={styles.penaltySectionDivider} />
                  <View style={styles.penaltyButtonRow}>
                    {Object.values(PENALTIES)
                      .filter(p => p.category === 'passing' && (p.team === penaltyTeam || p.team === 'either'))
                      .map(penalty => renderPenaltyButton(penalty))}
                  </View>
                </>
              )}

              {/* Personal Fouls */}
              {Object.values(PENALTIES).filter(p =>
                p.category === 'personal' &&
                (p.team === penaltyTeam || p.team === 'either')
              ).length > 0 && (
                <>
                  <Text style={styles.penaltySectionHeader}>
                    PERSONAL FOULS ({penaltyTeam === 'offense' ? '15 yards' : '5-15 yards'})
                  </Text>
                  <View style={styles.penaltySectionDivider} />
                  <View style={styles.penaltyButtonRow}>
                    {Object.values(PENALTIES)
                      .filter(p => p.category === 'personal' && (p.team === penaltyTeam || p.team === 'either'))
                      .map(penalty => renderPenaltyButton(penalty))}
                  </View>
                </>
              )}

              {/* Kicking Fouls */}
              {Object.values(PENALTIES).filter(p =>
                p.category === 'kicking' &&
                (p.team === penaltyTeam || p.team === 'either')
              ).length > 0 && (
                <>
                  <Text style={styles.penaltySectionHeader}>
                    KICKING FOULS (5-15 yards)
                  </Text>
                  <View style={styles.penaltySectionDivider} />
                  <View style={styles.penaltyButtonRow}>
                    {Object.values(PENALTIES)
                      .filter(p => p.category === 'kicking' && (p.team === penaltyTeam || p.team === 'either'))
                      .map(penalty => renderPenaltyButton(penalty))}
                  </View>
                </>
              )}

              {/* Unsportsmanlike Conduct */}
              {Object.values(PENALTIES).filter(p =>
                p.category === 'unsportsmanlike' &&
                (p.team === penaltyTeam || p.team === 'either')
              ).length > 0 && (
                <>
                  <Text style={styles.penaltySectionHeader}>
                    UNSPORTSMANLIKE (15 yards)
                  </Text>
                  <View style={styles.penaltySectionDivider} />
                  <View style={styles.penaltyButtonRow}>
                    {Object.values(PENALTIES)
                      .filter(p => p.category === 'unsportsmanlike' && (p.team === penaltyTeam || p.team === 'either'))
                      .map(penalty => renderPenaltyButton(penalty))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Player Selection Screen - Step 3 */}
      {penaltyStep === 'player' && penaltySelected && penaltyResult && penaltyTeam && (
        <View style={styles.modalOverlay}>
          <View style={styles.penaltySelectionContainer}>
            {/* Header with Back button */}
            <View style={[
              styles.penaltySelectionHeader,
              {
                backgroundColor: penaltyTeam === 'offense'
                  ? (possession === 'offense' ? homeTeamColor : awayTeamTextColor)
                  : (possession === 'offense' ? awayTeamTextColor : homeTeamColor)
              }
            ]}>
              <Pressable
                style={styles.penaltyBackBtn}
                onPress={() => {
                  setPenaltyStep('select');
                  setPenaltyPlayerNumber(null);
                  setPlayerSearchQuery('');
                }}
              >
                <Text style={styles.penaltyBackText}>← Back</Text>
              </Pressable>
              <Text style={styles.penaltySelectionTitle}>
                PENALTY ON PLAYER
              </Text>
            </View>

            <ScrollView
              style={styles.penaltyScroll}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Penalty Summary Box */}
              <View style={styles.penaltySummaryBox}>
                <View style={styles.penaltySummaryLeft}>
                  <Text style={styles.penaltySummaryName}>
                    {penaltySelected.name} ({penaltyTeam.toUpperCase()})
                  </Text>
                  {penaltySelected.isAutoFirstDown && (
                    <Text style={styles.penaltySummaryTag}>AUTO 1ST</Text>
                  )}
                  {penaltySelected.isLossOfDown && (
                    <Text style={styles.penaltySummaryTag}>LOSS OF DOWN</Text>
                  )}
                </View>
                <Text style={styles.penaltySummaryYards}>{penaltySelected.yards} YDS</Text>
              </View>

              <Text style={styles.playerSelectLabel}>SELECT PLAYER</Text>

              {/* Search Bar */}
              <View style={styles.playerSearchContainer}>
                <Text style={styles.playerSearchIcon}>🔍</Text>
                <TextInput
                  style={styles.playerSearchInput}
                  value={playerSearchQuery}
                  onChangeText={setPlayerSearchQuery}
                  placeholder="Search by number..."
                  placeholderTextColor="#666666"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              {/* UNKNOWN and SKIP Buttons */}
              <View style={styles.playerQuickActions}>
                <Pressable
                  style={styles.playerQuickActionBtn}
                  onPress={() => {
                    setPenaltyPlayerNumber('unknown');
                    setPlayerSearchQuery('');
                    setShowPenaltyConfirm(true);
                    setPenaltyStep(null);
                  }}
                >
                  <Text style={styles.playerQuickActionSymbol}>?</Text>
                  <Text style={styles.playerQuickActionLabel}>UNKNOWN</Text>
                </Pressable>

                <Pressable
                  style={styles.playerQuickActionBtn}
                  onPress={() => {
                    setPenaltyPlayerNumber(null);
                    setPlayerSearchQuery('');
                    setShowPenaltyConfirm(true);
                    setPenaltyStep(null);
                  }}
                >
                  <Text style={[styles.playerQuickActionSymbol, { color: '#666666' }]}>—</Text>
                  <Text style={[styles.playerQuickActionLabel, { color: '#666666' }]}>SKIP</Text>
                </Pressable>
              </View>

              {/* Player Roster Grid */}
              <View style={styles.playerRosterGrid}>
                {(() => {
                  // Determine which roster to show
                  const showHomeRoster = (penaltyTeam === 'offense' && possession === 'offense') ||
                                         (penaltyTeam === 'defense' && possession === 'defense');

                  // Filter by search query AND by side of ball
                  const filteredRoster = roster.filter(player => {
                    // First filter by position based on penalty type
                    if (penaltyTeam === 'offense') {
                      if (!offensivePositions.includes(player.position)) return false;
                    } else if (penaltyTeam === 'defense') {
                      if (!defensivePositions.includes(player.position)) return false;
                    }

                    // Then filter by search query
                    if (!playerSearchQuery) return true;
                    return player.number.includes(playerSearchQuery);
                  });

                  // Sort players by jersey number (ascending)
                  const sortedRoster = [...filteredRoster].sort((a, b) => {
                    return parseInt(a.number) - parseInt(b.number);
                  });

                  // If search doesn't match any player, show "use anyway" option
                  if (playerSearchQuery && sortedRoster.length === 0) {
                    return (
                      <View style={styles.playerNoMatch}>
                        <Text style={styles.playerNoMatchText}>
                          No player #{playerSearchQuery} on roster
                        </Text>
                        <Pressable
                          style={styles.playerUseAnywayBtn}
                          onPress={() => {
                            setPenaltyPlayerNumber(parseInt(playerSearchQuery));
                            setPlayerSearchQuery('');
                            setShowPenaltyConfirm(true);
                            setPenaltyStep(null);
                          }}
                        >
                          <Text style={styles.playerUseAnywayText}>USE #{playerSearchQuery} ANYWAY</Text>
                        </Pressable>
                      </View>
                    );
                  }

                  // Show roster or empty state
                  if (sortedRoster.length === 0) {
                    return (
                      <Text style={styles.playerNoRosterText}>
                        No roster loaded. Type a number or tap UNKNOWN.
                      </Text>
                    );
                  }

                  return sortedRoster.map(player => (
                    <Pressable
                      key={player.number}
                      style={({ pressed }) => [
                        styles.playerRosterBtn,
                        pressed && styles.playerRosterBtnPressed,
                        playerSearchQuery && player.number === playerSearchQuery && styles.playerRosterBtnHighlight
                      ]}
                      onPress={() => {
                        setPenaltyPlayerNumber(parseInt(player.number));
                        setPlayerSearchQuery('');
                        setShowPenaltyConfirm(true);
                        setPenaltyStep(null);
                      }}
                    >
                      <Text style={styles.playerRosterNumber}>{player.number}</Text>
                      <Text style={styles.playerRosterPosition}>{player.position}</Text>
                    </Pressable>
                  ));
                })()}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Scoring Menu Modal */}
      {showScoringMenu && (
        <View style={styles.modalOverlay}>
          <View style={styles.penaltyTeamSelectionModal}>
            <Text style={styles.penaltyModalTitle}>SCORING PLAY</Text>

            <View style={styles.scoringOptionsContainer}>
              <Pressable
                style={[styles.scoringOptionBtn, { backgroundColor: '#B4D836' }]}
                onPress={() => {
                  setShowScoringMenu(false);
                  setShowFieldGoalModal(true);
                }}
              >
                <Text style={[styles.scoringOptionText, { color: '#000' }]}>FIELD GOAL</Text>
                <Text style={[styles.scoringOptionSubtext, { color: '#000' }]}>+3 PTS</Text>
              </Pressable>

              <Pressable
                style={[styles.scoringOptionBtn, { backgroundColor: '#FF3636' }]}
                onPress={() => {
                  setShowScoringMenu(false);
                  setShowSafetyModal(true);
                }}
              >
                <Text style={styles.scoringOptionText}>SAFETY</Text>
                <Text style={styles.scoringOptionSubtext}>+2 PTS</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.penaltyTeamCancelBtn}
              onPress={() => setShowScoringMenu(false)}
            >
              <Text style={styles.penaltyTeamCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Field Goal Modal */}
      {showFieldGoalModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FIELD GOAL</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowFieldGoalModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalMessage}>Which team made the field goal?</Text>

            <View style={styles.kickoffOptions}>
              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  // Home team scored field goal - +3 points
                  setHomeTeam({ ...homeTeam, score: homeTeam.score + 3 });

                  const play: Play = {
                    category: 'fieldgoal',
                    player: 'Team',
                    startYard: currentYard,
                    endYard: currentYard,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                  };

                  setRecentPlays([play, ...recentPlays]);

                  // Switch possession for kickoff from 35
                  setPossession(possession === 'offense' ? 'defense' : 'offense');
                  setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                  setCurrentYard(35);
                  setEndYard(35);
                  setDown(1);
                  setDistance(10);

                  setShowFieldGoalModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>{homeTeam.name}</Text>
                <Text style={styles.kickoffBtnSubtext}>+3 Points</Text>
              </Pressable>

              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  // Away team scored field goal - +3 points
                  setAwayTeam({ ...awayTeam, score: awayTeam.score + 3 });

                  const play: Play = {
                    category: 'fieldgoal',
                    player: 'Team',
                    startYard: currentYard,
                    endYard: currentYard,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                  };

                  setRecentPlays([play, ...recentPlays]);

                  // Switch possession for kickoff from 35
                  setPossession(possession === 'offense' ? 'defense' : 'offense');
                  setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                  setCurrentYard(35);
                  setEndYard(35);
                  setDown(1);
                  setDistance(10);

                  setShowFieldGoalModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>{awayTeam.name}</Text>
                <Text style={styles.kickoffBtnSubtext}>+3 Points</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Fumble Modal */}
      {showFumbleModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  setShowFumbleModal(false);
                  setFumbleRecoveredBy(null);
                  setFumbleTurnoverYardLine(null);
                  setFumbleRecoverySearch('');
                  setFumbleRecoveryPlayer(null);
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
              <Text style={styles.modalTitle}>FUMBLE</Text>
            </View>

            <Text style={styles.modalMessage}>Who recovered the fumble?</Text>

            <View style={styles.kickoffOptions}>
              <Pressable
                style={[
                  styles.kickoffBtn,
                  { borderColor: '#B4D836', borderWidth: 2 },
                  fumbleRecoveredBy === 'offense' && {
                    backgroundColor: 'rgba(180, 216, 54, 0.2)',
                    borderWidth: 3
                  }
                ]}
                onPress={() => {
                  setFumbleRecoveredBy('offense');
                  setFumbleTurnoverYardLine(null);
                  setFumbleRecoverySearch('');
                  setFumbleRecoveryPlayer(null);
                }}
              >
                <Text style={styles.kickoffBtnText}>OFFENSE</Text>
                {fumbleRecoveredBy === 'offense' && (
                  <Text style={styles.kickoffBtnSubtext}>✓ Selected</Text>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.kickoffBtn,
                  { borderColor: '#FF3636', borderWidth: 2 },
                  fumbleRecoveredBy === 'defense' && {
                    backgroundColor: 'rgba(255, 54, 54, 0.2)',
                    borderWidth: 3
                  }
                ]}
                onPress={() => {
                  setFumbleRecoveredBy('defense');
                  // Initialize to current end yard line if not set
                  if (fumbleTurnoverYardLine === null) {
                    setFumbleTurnoverYardLine(endYard);
                  }
                  setFumbleRecoverySearch('');
                  setFumbleRecoveryPlayer(null);
                }}
              >
                <Text style={styles.kickoffBtnText}>DEFENSE</Text>
                {fumbleRecoveredBy === 'defense' && (
                  <Text style={styles.kickoffBtnSubtext}>✓ Selected</Text>
                )}
              </Pressable>
            </View>

            {fumbleRecoveredBy === 'offense' && (
              <View style={styles.fumblePlayerSection}>
                <Text style={styles.modalMessage}>Who recovered?</Text>
                <TextInput
                  style={styles.searchInput}
                  value={fumbleRecoverySearch}
                  onChangeText={setFumbleRecoverySearch}
                  placeholder="Search..."
                  placeholderTextColor="#666"
                />
                <ScrollView style={styles.fumblePlayerList}>
                  {(() => {
                    // Get offensive players only
                    const offensivePlayers = roster.filter(p =>
                      offensivePositions.includes(p.position)
                    );

                    // Filter by search
                    const filteredPlayers = offensivePlayers.filter(p =>
                      fumbleRecoverySearch === '' ||
                      p.name.toLowerCase().includes(fumbleRecoverySearch.toLowerCase()) ||
                      p.number.includes(fumbleRecoverySearch)
                    );

                    // Group by position
                    const grouped: { [key: string]: Player[] } = {};
                    filteredPlayers.forEach(player => {
                      if (!grouped[player.position]) {
                        grouped[player.position] = [];
                      }
                      grouped[player.position].push(player);
                    });

                    // Position order
                    const positionOrder = ['QB', 'RB', 'WR', 'Slot', 'TE', 'OL'];
                    const sortedPositions = positionOrder.filter(pos => grouped[pos]);

                    return sortedPositions.map((position) => (
                      <View key={position}>
                        <Text style={styles.positionLabel}>{position}</Text>
                        {grouped[position].map((player) => (
                          <Pressable
                            key={player.number}
                            style={[
                              styles.playerItem,
                              fumbleRecoveryPlayer === player.number && styles.playerItemSelected
                            ]}
                            onPress={() => {
                              setFumbleRecoveryPlayer(player.number);
                              // Initialize yard line to current end yard when player selected
                              if (fumbleTurnoverYardLine === null) {
                                setFumbleTurnoverYardLine(endYard);
                              }
                            }}
                          >
                            <View style={styles.playerNumber}>
                              <Text style={styles.playerNumberText}>{player.number}</Text>
                            </View>
                            <Text style={[
                              styles.playerName,
                              fumbleRecoveryPlayer === player.number && { color: homeTeamColor }
                            ]}>{player.name}</Text>
                            {fumbleRecoveryPlayer === player.number && (
                              <Text style={styles.selectedCheckmark}>✓</Text>
                            )}
                          </Pressable>
                        ))}
                      </View>
                    ));
                  })()}
                </ScrollView>
              </View>
            )}

            {fumbleRecoveredBy === 'offense' && fumbleRecoveryPlayer && (
              <View style={styles.fumbleYardLineSection}>
                <Text style={styles.fumbleYardLineLabel}>Ball at yard line:</Text>
                <View style={styles.fumbleYardLineDisplay}>
                  <Pressable
                    style={styles.fumbleYardAdjust}
                    onPress={() => setFumbleTurnoverYardLine(Math.max(0, (fumbleTurnoverYardLine || endYard) - 5))}
                  >
                    <Text style={styles.fumbleYardAdjustText}>-5</Text>
                  </Pressable>

                  <Pressable
                    style={styles.fumbleYardLineBox}
                    onPress={() => {
                      setFumbleYardLineInput('');
                      // Initialize side based on current position
                      const currentYard = fumbleTurnoverYardLine || endYard;
                      setFumbleYardSide(currentYard < 50 ? 'left' : 'right');
                      setShowFumbleYardLineInput(true);
                    }}
                  >
                    <Text style={styles.fumbleYardLineValue}>
                      {(fumbleTurnoverYardLine || endYard) < 50 ? '◄ ' : (fumbleTurnoverYardLine || endYard) > 50 ? '► ' : ''}
                      {formatYardLine(fumbleTurnoverYardLine || endYard)}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.fumbleYardAdjust}
                    onPress={() => setFumbleTurnoverYardLine(Math.min(100, (fumbleTurnoverYardLine || endYard) + 5))}
                  >
                    <Text style={styles.fumbleYardAdjustText}>+5</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {fumbleRecoveredBy === 'defense' && (
              <View style={styles.fumbleYardLineSection}>
                <Text style={styles.fumbleYardLineLabel}>Ball at yard line:</Text>
                <View style={styles.fumbleYardLineDisplay}>
                  <Pressable
                    style={styles.fumbleYardAdjust}
                    onPress={() => setFumbleTurnoverYardLine(Math.max(0, (fumbleTurnoverYardLine || endYard) - 5))}
                  >
                    <Text style={styles.fumbleYardAdjustText}>-5</Text>
                  </Pressable>

                  <Pressable
                    style={styles.fumbleYardLineBox}
                    onPress={() => {
                      setFumbleYardLineInput('');
                      // Initialize side based on current position
                      const currentYard = fumbleTurnoverYardLine || endYard;
                      setFumbleYardSide(currentYard < 50 ? 'left' : 'right');
                      setShowFumbleYardLineInput(true);
                    }}
                  >
                    <Text style={styles.fumbleYardLineValue}>
                      {(fumbleTurnoverYardLine || endYard) < 50 ? '◄ ' : (fumbleTurnoverYardLine || endYard) > 50 ? '► ' : ''}
                      {formatYardLine(fumbleTurnoverYardLine || endYard)}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.fumbleYardAdjust}
                    onPress={() => setFumbleTurnoverYardLine(Math.min(100, (fumbleTurnoverYardLine || endYard) + 5))}
                  >
                    <Text style={styles.fumbleYardAdjustText}>+5</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={[
                  styles.modalButtonConfirm,
                  (!fumbleRecoveredBy ||
                   (fumbleRecoveredBy === 'offense' && (!fumbleRecoveryPlayer || fumbleTurnoverYardLine === null)) ||
                   (fumbleRecoveredBy === 'defense' && fumbleTurnoverYardLine === null)) && { opacity: 0.5 }
                ]}
                onPress={() => {
                  if (!fumbleRecoveredBy) return;
                  if (fumbleRecoveredBy === 'offense' && (!fumbleRecoveryPlayer || fumbleTurnoverYardLine === null)) return;
                  if (fumbleRecoveredBy === 'defense' && fumbleTurnoverYardLine === null) return;
                  setAddFumble(true);
                  setShowFumbleModal(false);
                }}
                disabled={!fumbleRecoveredBy ||
                         (fumbleRecoveredBy === 'offense' && (!fumbleRecoveryPlayer || fumbleTurnoverYardLine === null)) ||
                         (fumbleRecoveredBy === 'defense' && fumbleTurnoverYardLine === null)}
              >
                <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
              </Pressable>

              <Pressable
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowFumbleModal(false);
                  setFumbleRecoveredBy(null);
                  setFumbleTurnoverYardLine(null);
                  setFumbleRecoverySearch('');
                  setFumbleRecoveryPlayer(null);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Fumble Yard Line Input Modal */}
      {showFumbleYardLineInput && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Yard Line</Text>
              <Text style={styles.modalMessage}>Enter yard line (0-50)</Text>

              {/* Field Side Toggle */}
              <View style={styles.fieldSideToggle}>
                <Pressable
                  style={[
                    styles.fieldSideBtn,
                    fumbleYardSide === 'left' && styles.fieldSideBtnActive
                  ]}
                  onPress={() => setFumbleYardSide('left')}
                >
                  <Text style={[
                    styles.fieldSideBtnText,
                    fumbleYardSide === 'left' && styles.fieldSideBtnTextActive
                  ]}>◄</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.fieldSideBtn,
                    fumbleYardSide === 'right' && styles.fieldSideBtnActive
                  ]}
                  onPress={() => setFumbleYardSide('right')}
                >
                  <Text style={[
                    styles.fieldSideBtnText,
                    fumbleYardSide === 'right' && styles.fieldSideBtnTextActive
                  ]}>►</Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.modalInput}
                value={fumbleYardLineInput}
                onChangeText={(text) => {
                  // Only allow numeric input
                  const numericText = text.replace(/[^0-9]/g, '');
                  // Limit to 0-50
                  const numValue = parseInt(numericText) || 0;
                  if (numValue <= 50) {
                    setFumbleYardLineInput(numericText);
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="25"
                placeholderTextColor="#666"
                autoFocus={true}
                selectTextOnFocus={true}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalButtonConfirm}
                  onPress={() => {
                    const yardLineValue = parseInt(fumbleYardLineInput);
                    if (yardLineValue >= 0 && yardLineValue <= 50) {
                      // Convert field position to 0-100 system based on selected side
                      let internalYardLine;

                      if (yardLineValue === 50) {
                        internalYardLine = 50;
                      } else if (fumbleYardSide === 'left') {
                        // Left side (own side) - use yardLineValue directly
                        internalYardLine = yardLineValue;
                      } else {
                        // Right side (opponent side) - convert to 50+ range
                        internalYardLine = 100 - yardLineValue;
                      }

                      setFumbleTurnoverYardLine(internalYardLine);
                    }
                    setShowFumbleYardLineInput(false);
                    setFumbleYardLineInput('');
                  }}
                  disabled={!fumbleYardLineInput || parseInt(fumbleYardLineInput) > 50}
                >
                  <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
                </Pressable>
                <Pressable
                  style={styles.modalButtonCancel}
                  onPress={() => {
                    setShowFumbleYardLineInput(false);
                    setFumbleYardLineInput('');
                  }}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Safety Modal */}
      {showSafetyModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SAFETY</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowSafetyModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalMessage}>Which team scored the safety?</Text>

            <View style={styles.kickoffOptions}>
              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  // Home team scored safety - they get +2
                  setHomeTeam({ ...homeTeam, score: homeTeam.score + 2 });

                  const play: Play = {
                    category: 'safety',
                    player: 'Team',
                    startYard: currentYard,
                    endYard: fieldDirection === 'right' ? 0 : 100,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                  };

                  setRecentPlays([play, ...recentPlays]);

                  setShowSafetyModal(false);

                  // Away team free kicks from their 20
                  Alert.alert(
                    'SAFETY - FREE KICK',
                    `${awayTeam.name} will free kick from their own 20-yard line.`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.kickoffBtnText}>{homeTeam.name}</Text>
                <Text style={styles.kickoffBtnSubtext}>+2 Points</Text>
              </Pressable>

              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  // Away team scored safety - they get +2
                  setAwayTeam({ ...awayTeam, score: awayTeam.score + 2 });

                  const play: Play = {
                    category: 'safety',
                    player: 'Team',
                    startYard: currentYard,
                    endYard: fieldDirection === 'right' ? 0 : 100,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                  };

                  setRecentPlays([play, ...recentPlays]);

                  setShowSafetyModal(false);

                  // Home team free kicks from their 20
                  Alert.alert(
                    'SAFETY - FREE KICK',
                    `${homeTeam.name} will free kick from their own 20-yard line.`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.kickoffBtnText}>{awayTeam.name}</Text>
                <Text style={styles.kickoffBtnSubtext}>+2 Points</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Opponent Score Adjustment Modal */}
      {showOpponentScoreModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opponent Score</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowOpponentScoreModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalMessage}>{awayTeam.name}</Text>
              <Text style={[styles.modalTitle, { fontSize: 48, marginTop: 8 }]}>{awayTeam.score}</Text>
            </View>

            <Text style={[styles.modalMessage, { marginBottom: 12 }]}>Quick Scoring:</Text>

            <View style={styles.kickoffOptions}>
              <Pressable
                style={[styles.kickoffBtn, { backgroundColor: '#4CAF50', borderColor: '#45a049' }]}
                onPress={() => {
                  setAwayTeam({ ...awayTeam, score: awayTeam.score + 7 });
                  const play: Play = {
                    category: 'opponent-score',
                    player: 'Opponent TD + XP',
                    startYard: currentYard,
                    endYard: currentYard,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                    gameClock: clock,
                  };
                  setRecentPlays([play, ...recentPlays]);
                  setShowOpponentScoreModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>TD + XP</Text>
                <Text style={styles.kickoffBtnSubtext}>+7 Points</Text>
              </Pressable>

              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
                  const play: Play = {
                    category: 'opponent-score',
                    player: 'Opponent TD',
                    startYard: currentYard,
                    endYard: currentYard,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                    gameClock: clock,
                  };
                  setRecentPlays([play, ...recentPlays]);
                  setShowOpponentScoreModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>TD Only</Text>
                <Text style={styles.kickoffBtnSubtext}>+6 Points</Text>
              </Pressable>
            </View>

            <View style={styles.kickoffOptions}>
              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  setAwayTeam({ ...awayTeam, score: awayTeam.score + 8 });
                  const play: Play = {
                    category: 'opponent-score',
                    player: 'Opponent TD + 2PT',
                    startYard: currentYard,
                    endYard: currentYard,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                    gameClock: clock,
                  };
                  setRecentPlays([play, ...recentPlays]);
                  setShowOpponentScoreModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>TD + 2PT</Text>
                <Text style={styles.kickoffBtnSubtext}>+8 Points</Text>
              </Pressable>

              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  setAwayTeam({ ...awayTeam, score: awayTeam.score + 3 });
                  const play: Play = {
                    category: 'opponent-score',
                    player: 'Opponent Field Goal',
                    startYard: currentYard,
                    endYard: currentYard,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                    gameClock: clock,
                  };
                  setRecentPlays([play, ...recentPlays]);
                  setShowOpponentScoreModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>Field Goal</Text>
                <Text style={styles.kickoffBtnSubtext}>+3 Points</Text>
              </Pressable>

              <Pressable
                style={styles.kickoffBtn}
                onPress={() => {
                  setAwayTeam({ ...awayTeam, score: awayTeam.score + 2 });
                  const play: Play = {
                    category: 'opponent-score',
                    player: 'Opponent Safety',
                    startYard: currentYard,
                    endYard: currentYard,
                    yards: '0',
                    timestamp: new Date().toLocaleTimeString(),
                    gameClock: clock,
                  };
                  setRecentPlays([play, ...recentPlays]);
                  setShowOpponentScoreModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>Safety</Text>
                <Text style={styles.kickoffBtnSubtext}>+2 Points</Text>
              </Pressable>
            </View>

            <Text style={[styles.modalMessage, { marginTop: 16, marginBottom: 12 }]}>Manual Adjustment:</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <Pressable
                style={[styles.kickoffBtn, { flex: 1, maxWidth: 100 }]}
                onPress={() => {
                  if (awayTeam.score > 0) {
                    setAwayTeam({ ...awayTeam, score: awayTeam.score - 1 });
                  }
                }}
              >
                <Text style={styles.kickoffBtnText}>-1</Text>
              </Pressable>

              <Pressable
                style={[styles.kickoffBtn, { flex: 1, maxWidth: 100 }]}
                onPress={() => {
                  setAwayTeam({ ...awayTeam, score: awayTeam.score + 1 });
                }}
              >
                <Text style={styles.kickoffBtnText}>+1</Text>
              </Pressable>

              <Pressable
                style={[styles.kickoffBtn, { flex: 1, maxWidth: 120 }]}
                onPress={() => {
                  Alert.prompt(
                    'Set Exact Score',
                    `Enter exact score for ${awayTeam.name}:`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Set',
                        onPress: (value) => {
                          const newScore = parseInt(value || '0');
                          if (!isNaN(newScore) && newScore >= 0) {
                            setAwayTeam({ ...awayTeam, score: newScore });
                          }
                        }
                      }
                    ],
                    'plain-text',
                    awayTeam.score.toString()
                  );
                }}
              >
                <Text style={styles.kickoffBtnText}>Set Score</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.modalButtonConfirm, { marginTop: 8 }]}
              onPress={() => setShowOpponentScoreModal(false)}
            >
              <Text style={styles.modalButtonTextConfirm}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Penalty Confirmation Modal */}
      {showPenaltyConfirm && penaltySelected && penaltyResult && penaltyTeam && (
        <View style={styles.modalOverlay}>
          <View style={styles.penaltyModalContent}>
            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalBackBtn}
                onPress={() => {
                  setShowPenaltyConfirm(false);
                  setPenaltyPlayerNumber(null);
                  setIsPendingPenalty(false);
                  setPenaltyStep('player');
                }}
              >
                <Text style={styles.modalBackText}>← Back</Text>
              </Pressable>
              <Text style={styles.modalTitle}>PENALTY RESULT</Text>
              <View style={{ width: 60 }} />
            </View>

            <View style={styles.penaltyConfirmBox}>
              <View style={[
                styles.penaltyTeamBadge,
                penaltyTeam === 'offense' ? styles.offenseBtn : styles.defenseBtn
              ]}>
                <Text style={styles.penaltyTeamBadgeText}>{penaltyTeam.toUpperCase()}</Text>
              </View>

              <Text style={styles.penaltyConfirmName}>{penaltySelected.name}</Text>
              <Text style={styles.penaltyConfirmYards}>{penaltySelected.yards} YARD PENALTY</Text>

              <View style={styles.penaltyConfirmDivider} />

              <View style={styles.penaltyConfirmBeforeAfter}>
                <View style={styles.penaltyConfirmColumn}>
                  <Text style={styles.penaltyConfirmLabel}>BEFORE</Text>
                  <Text style={styles.penaltyConfirmValue}>
                    {formatDownAndDistance(down, distance, currentYard, fieldDirection)}
                  </Text>
                </View>

                <Text style={styles.penaltyConfirmArrow}>→</Text>

                <View style={styles.penaltyConfirmColumn}>
                  <Text style={styles.penaltyConfirmLabel}>AFTER</Text>
                  <Text style={[
                    styles.penaltyConfirmValue,
                    penaltyResult.isFirstDown && styles.penaltyConfirmValueHighlight
                  ]}>
                    {formatDownAndDistance(
                      penaltyResult.newDown,
                      penaltyResult.newDistance,
                      penaltyResult.newLOS,
                      fieldDirection
                    )}
                  </Text>
                </View>
              </View>

              <Text style={styles.penaltyConfirmDescription}>
                {penaltyResult.description}
              </Text>

              {penaltyResult.isSafety && (
                <View style={styles.penaltySafetyAlert}>
                  <Text style={styles.penaltySafetyText}>SAFETY - 2 Points!</Text>
                </View>
              )}

              {penaltyResult.isTurnover && (
                <View style={styles.penaltyTurnoverAlert}>
                  <Text style={styles.penaltyTurnoverText}>Turnover on Downs</Text>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonConfirm}
                onPress={() => {
                  // Close confirmation modal and show clock input
                  setShowPenaltyConfirm(false);
                  setIsPendingPenalty(true);
                  promptForClock();
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>Accept Penalty</Text>
              </Pressable>

              <Pressable
                style={styles.modalButtonDecline}
                onPress={() => {
                  // Decline penalty - no changes to game state
                  // Just close modal and reset penalty selection
                  setShowPenaltyConfirm(false);
                  setPenaltySelected(null);
                  setPenaltyResult(null);
                  setPenaltyTeam(null);
                  setPenaltyPlayerNumber(null);
                  setIsPendingPenalty(false);
                }}
              >
                <Text style={styles.modalButtonTextDecline}>Decline Penalty</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* End Quarter Confirmation Modal */}
      {showEndQuarterModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {quarter === 'Q2' ? 'BEGIN HALFTIME?' : `END ${quarter}?`}
              </Text>
              <Pressable 
                style={styles.modalCloseBtn}
                onPress={() => setShowEndQuarterModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            
            <Text style={styles.modalMessage}>
              {quarter === 'Q2' 
                ? 'Are you sure you want to begin halftime?' 
                : `Are you sure you want to end ${quarter}?`}
            </Text>
            
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonCancel}
                onPress={() => setShowEndQuarterModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={styles.modalButtonConfirm}
                onPress={handleEndQuarter}
              >
                <Text style={styles.modalButtonTextConfirm}>
                  {quarter === 'Q2' ? 'Begin Halftime' : 'End Quarter'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Halftime Report - Fixed Full-Screen (No Scroll) */}
      {showHalftime && (() => {
        // ═══════════════════════════════════════════════════════════════
        // OFFENSIVE STATS
        // ═══════════════════════════════════════════════════════════════
        const rushingPlays = recentPlays.filter(p => p.category === 'run' || p.category === 'run-td');
        const passingPlays = recentPlays.filter(p => p.category === 'pass' || p.category === 'pass-td');
        const incompletePlays = recentPlays.filter(p => p.category === 'incomplete');
        const sackPlays = recentPlays.filter(p => p.category === 'sack');

        const totalRushYards = rushingPlays.reduce((sum, p) => sum + parseInt(p.yards || '0'), 0);
        const totalPassYards = passingPlays.reduce((sum, p) => sum + parseInt(p.yards || '0'), 0);
        const totalYards = totalRushYards + totalPassYards;

        const rushAttempts = rushingPlays.length;
        const completions = passingPlays.length;
        const passAttempts = passingPlays.length + incompletePlays.length;
        const completionPct = passAttempts > 0 ? Math.round((completions / passAttempts) * 100) : 0;

        const totalPlays = rushAttempts + passAttempts;
        const rushPct = totalPlays > 0 ? Math.round((rushAttempts / totalPlays) * 100) : 0;
        const passPct = totalPlays > 0 ? Math.round((passAttempts / totalPlays) * 100) : 0;

        const yardsPerRush = rushAttempts > 0 ? (totalRushYards / rushAttempts).toFixed(1) : '0.0';
        const yardsPerPass = passAttempts > 0 ? (totalPassYards / passAttempts).toFixed(1) : '0.0';
        const yardsPerPlay = totalPlays > 0 ? (totalYards / totalPlays).toFixed(1) : '0.0';

        // ═══════════════════════════════════════════════════════════════
        // TURNOVER & PENALTY STATS
        // ═══════════════════════════════════════════════════════════════
        const interceptions = recentPlays.filter(p => p.category === 'interception' || p.category === 'interception-td').length;
        const fumblesLost = recentPlays.filter(p => p.fumble && p.fumbleRecoveredBy === 'defense').length;
        const turnovers = interceptions + fumblesLost;
        const sacks = sackPlays.length;

        const penaltyPlays = recentPlays.filter(p => p.category === 'penalty');
        const penalties = penaltyPlays.length;
        const penaltyYards = penaltyPlays.reduce((sum, p) => sum + Math.abs(parseInt(p.yards || '0')), 0);

        // ═══════════════════════════════════════════════════════════════
        // EFFICIENCY
        // ═══════════════════════════════════════════════════════════════
        const thirdDownPlays = recentPlays.filter(p => p.down === 3);
        const thirdDownConversions = thirdDownPlays.filter(p => {
          const yards = parseInt(p.yards || '0');
          const distance = p.distance || 10;
          return yards >= distance || p.category.includes('-td');
        }).length;
        const thirdDownPct = thirdDownPlays.length > 0 ? Math.round((thirdDownConversions / thirdDownPlays.length) * 100) : 0;

        const redZonePlays = recentPlays.filter(p => p.startYard >= 80);
        const redZoneTDs = redZonePlays.filter(p => p.category.includes('-td')).length;

        // First downs
        const firstDowns = recentPlays.filter(p => {
          const yards = parseInt(p.yards || '0');
          const distance = p.distance || 10;
          return yards >= distance || p.category.includes('-td');
        }).length;

        // Punts
        const punts = recentPlays.filter(p => p.category === 'punt').length;

        // Big plays
        const bigPlays = recentPlays.filter(p => parseInt(p.yards || '0') >= 10);

        // Longest play
        const longestPlay = recentPlays.reduce((max, p) => {
          const yards = parseInt(p.yards || '0');
          return yards > max.yards ? { play: p, yards } : max;
        }, { play: null as any, yards: 0 });

        // ═══════════════════════════════════════════════════════════════
        // QUARTER BREAKDOWN
        // ═══════════════════════════════════════════════════════════════
        const q1Plays = recentPlays.filter(p => p.quarter === 'Q1');
        const q2Plays = recentPlays.filter(p => p.quarter === 'Q2');
        const q1Yards = q1Plays.reduce((sum, p) => sum + parseInt(p.yards || '0'), 0);
        const q2Yards = q2Plays.reduce((sum, p) => sum + parseInt(p.yards || '0'), 0);

        // ═══════════════════════════════════════════════════════════════
        // TOP PERFORMERS
        // ═══════════════════════════════════════════════════════════════
        const rusherStats: Record<string, { yards: number, carries: number }> = {};
        rushingPlays.forEach(p => {
          if (!rusherStats[p.player]) rusherStats[p.player] = { yards: 0, carries: 0 };
          rusherStats[p.player].yards += parseInt(p.yards || '0');
          rusherStats[p.player].carries += 1;
        });
        const topRusher = Object.entries(rusherStats).sort((a, b) => b[1].yards - a[1].yards)[0];

        const passerStats: Record<string, { yards: number, comps: number, atts: number }> = {};
        passingPlays.forEach(p => {
          if (!passerStats[p.player]) passerStats[p.player] = { yards: 0, comps: 0, atts: 0 };
          passerStats[p.player].yards += parseInt(p.yards || '0');
          passerStats[p.player].comps += 1;
          passerStats[p.player].atts += 1;
        });
        incompletePlays.forEach(p => {
          if (!passerStats[p.player]) passerStats[p.player] = { yards: 0, comps: 0, atts: 0 };
          passerStats[p.player].atts += 1;
        });
        const topPasser = Object.entries(passerStats).sort((a, b) => b[1].yards - a[1].yards)[0];

        const receiverStats: Record<string, { yards: number, receptions: number }> = {};
        passingPlays.forEach(p => {
          if (p.player2) {
            if (!receiverStats[p.player2]) receiverStats[p.player2] = { yards: 0, receptions: 0 };
            receiverStats[p.player2].yards += parseInt(p.yards || '0');
            receiverStats[p.player2].receptions += 1;
          }
        });
        const topReceiver = Object.entries(receiverStats).sort((a, b) => b[1].yards - a[1].yards)[0];

        // ═══════════════════════════════════════════════════════════════
        // DEFENSIVE STATS - Real defensive production (not just yards allowed)
        // ═══════════════════════════════════════════════════════════════
        // Calculate defensive stats from DefensivePlayStat records

        // Total tackles
        const totalSoloTackles = defensiveStats.filter(d => d.soloTackle).length;
        const totalAssistedTackles = defensiveStats.filter(d => d.assistedTackle).length;
        const totalTackles = totalSoloTackles + totalAssistedTackles;

        // TFLs and sacks
        const totalTFLs = defensiveStats.filter(d => d.tackleForLoss).length;
        const tflYardsTotal = defensiveStats.reduce((sum, d) => sum + d.tflYards, 0);
        const totalSacks = defensiveStats.filter(d => d.sack).length;
        const totalHalfSacks = defensiveStats.filter(d => d.halfSack).length;
        const sackYardsTotal = defensiveStats.reduce((sum, d) => sum + d.sackYards, 0);
        const totalQBHits = defensiveStats.filter(d => d.qbHit).length;

        // Turnovers created
        const totalPassBreakups = defensiveStats.filter(d => d.passBreakup).length;
        const totalInterceptions = defensiveStats.filter(d => d.interception).length;
        const intReturnYardsTotal = defensiveStats.reduce((sum, d) => sum + d.intReturnYards, 0);
        const totalForcedFumbles = defensiveStats.filter(d => d.forcedFumble).length;
        const totalFumbleRecoveries = defensiveStats.filter(d => d.fumbleRecovery).length;
        const fumbleReturnYardsTotal = defensiveStats.reduce((sum, d) => sum + d.fumbleReturnYards, 0);
        const totalDefensiveTDs = defensiveStats.filter(d => d.touchdown).length;
        const defTotalTakeaways = totalInterceptions + totalFumbleRecoveries;

        // Yards allowed (from opponent's offensive plays)
        const defRushYardsAllowed = totalRushYards;
        const defPassYardsAllowed = totalPassYards;
        const defTotalYardsAllowed = defRushYardsAllowed + defPassYardsAllowed;
        const defRushPlaysAllowed = rushingPlays.length;
        const defPassPlaysAllowed = passingPlays.length + incompletePlays.length;

        // Defensive rates
        const defYPCAllowed = defRushPlaysAllowed > 0 ? (defRushYardsAllowed / defRushPlaysAllowed).toFixed(1) : '0.0';
        const defYPAAllowed = defPassPlaysAllowed > 0 ? (defPassYardsAllowed / defPassPlaysAllowed).toFixed(1) : '0.0';
        const defCompPctAllowed = defPassPlaysAllowed > 0 ? Math.round((passingPlays.length / defPassPlaysAllowed) * 100) : 0;

        // 3rd down defense
        const def3rdDownAttempts = thirdDownPlays.length;
        const def3rdDownConversionsAllowed = thirdDownConversions;
        const def3rdDownStopPct = def3rdDownAttempts > 0 ? Math.round(((def3rdDownAttempts - def3rdDownConversionsAllowed) / def3rdDownAttempts) * 100) : 0;

        // TOP DEFENDERS - Aggregate stats by player
        const defenderStatsMap: Record<string, {
          soloTackles: number;
          assistedTackles: number;
          totalTackles: number;
          tfls: number;
          tflYards: number;
          sacks: number;
          halfSacks: number;
          sackYards: number;
          qbHits: number;
          pbus: number;
          ints: number;
          intReturnYards: number;
          forcedFumbles: number;
          fumbleRecoveries: number;
          fumbleReturnYards: number;
          defensiveTDs: number;
          impactScore: number; // Weighted score for ranking
        }> = {};

        defensiveStats.forEach(stat => {
          const key = `${stat.playerId}|${stat.playerName}`;
          if (!defenderStatsMap[key]) {
            defenderStatsMap[key] = {
              soloTackles: 0,
              assistedTackles: 0,
              totalTackles: 0,
              tfls: 0,
              tflYards: 0,
              sacks: 0,
              halfSacks: 0,
              sackYards: 0,
              qbHits: 0,
              pbus: 0,
              ints: 0,
              intReturnYards: 0,
              forcedFumbles: 0,
              fumbleRecoveries: 0,
              fumbleReturnYards: 0,
              defensiveTDs: 0,
              impactScore: 0
            };
          }

          const player = defenderStatsMap[key];
          if (stat.soloTackle) player.soloTackles += 1;
          if (stat.assistedTackle) player.assistedTackles += 1;
          player.totalTackles += (stat.soloTackle ? 1 : 0) + (stat.assistedTackle ? 1 : 0);
          if (stat.tackleForLoss) { player.tfls += 1; player.tflYards += stat.tflYards; }
          if (stat.sack) { player.sacks += 1; player.sackYards += stat.sackYards; }
          if (stat.halfSack) player.halfSacks += 1;
          if (stat.qbHit) player.qbHits += 1;
          if (stat.passBreakup) player.pbus += 1;
          if (stat.interception) { player.ints += 1; player.intReturnYards += stat.intReturnYards; }
          if (stat.forcedFumble) player.forcedFumbles += 1;
          if (stat.fumbleRecovery) { player.fumbleRecoveries += 1; player.fumbleReturnYards += stat.fumbleReturnYards; }
          if (stat.touchdown) player.defensiveTDs += 1;

          // Calculate impact score (weighted for ranking)
          player.impactScore =
            (player.totalTackles * 1) +
            (player.tfls * 2) +
            (player.sacks * 3) +
            (player.halfSacks * 1.5) +
            (player.qbHits * 0.5) +
            (player.pbus * 1.5) +
            (player.ints * 4) +
            (player.forcedFumbles * 3) +
            (player.fumbleRecoveries * 3) +
            (player.defensiveTDs * 6);
        });

        // Get top 3 defenders
        const topDefenders = Object.entries(defenderStatsMap)
          .map(([key, stats]) => {
            const [playerId, playerName] = key.split('|');
            return { playerId, playerName, ...stats };
          })
          .sort((a, b) => b.impactScore - a.impactScore)
          .slice(0, 3);

        // ═══════════════════════════════════════════════════════════════
        // SCORING PLAYS
        // ═══════════════════════════════════════════════════════════════
        const scoringPlays = recentPlays.filter(p =>
          p.category.includes('-td') ||
          p.category === 'fieldgoal' ||
          p.category === 'safety' ||
          p.category === 'touchdown'
        );

        return (
          <View style={styles.htOverlay}>
            {/* ════════════════════════════════════════════════════════════ */}
            {/* COMBINED HEADER BAR - Title | Scoreboard | Button */}
            {/* ════════════════════════════════════════════════════════════ */}
            <View style={styles.htHeaderBar}>
              {/* LEFT: Title */}
              <View style={styles.htTitleSection}>
                <View style={styles.htHeaderAccent} />
                <Text style={styles.htTitle}>HALFTIME REPORT</Text>
                <View style={styles.htHeaderAccent} />
              </View>

              {/* CENTER: Scoreboard */}
              <View style={styles.htScoreboard}>
                {/* HOME TEAM - Dark card (home jersey) */}
                <View style={styles.htTeamCardHome}>
                  <View style={[styles.htTeamColorEdge, { backgroundColor: homeTeamColor }]} />
                  <View style={styles.htTeamCardContent}>
                    <View style={styles.htTeamInfo}>
                      <Text style={[styles.htTeamName, { color: homeTeamColor }]}>{homeTeam.name}</Text>
                      <View style={styles.htTimeoutRow}>
                        {[0, 1, 2].map(i => (
                          <View
                            key={i}
                            style={[
                              styles.htTimeoutDot,
                              { backgroundColor: i < homeTeam.timeouts ? homeTeamColor : '#3a3a3a' }
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={[styles.htTeamScore, { color: homeTeamColor }]}>{homeTeam.score}</Text>
                  </View>
                </View>

                {/* VS BADGE */}
                <View style={styles.htVsBadge}>
                  <Text style={styles.htVsText}>VS</Text>
                </View>

                {/* AWAY TEAM - Light card (away jersey / white) */}
                <View style={styles.htTeamCardAway}>
                  <View style={styles.htTeamCardContentAway}>
                    <Text style={[styles.htTeamScoreAway, { color: awayTeamTextColor }]}>{awayTeam.score}</Text>
                    <View style={[styles.htTeamInfo, { alignItems: 'flex-end' }]}>
                      <Text style={[styles.htTeamNameAway, { color: awayTeamTextColor }]}>{awayTeam.name}</Text>
                      <View style={styles.htTimeoutRow}>
                        {[0, 1, 2].map(i => (
                          <View
                            key={i}
                            style={[
                              styles.htTimeoutDotAway,
                              { backgroundColor: i < awayTeam.timeouts ? awayTeamTextColor : '#ccc' }
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={[styles.htTeamColorEdge, { backgroundColor: awayTeamTextColor }]} />
                </View>
              </View>

              {/* RIGHT: Button */}
              <Pressable
                style={styles.htEndBtn}
                onPress={() => {
                  Alert.alert(
                    'Begin 2nd Half?',
                    'End halftime and start the 3rd quarter?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Begin 2nd Half', onPress: handleEndHalftime }
                    ]
                  );
                }}
              >
                <Text style={styles.htEndBtnText}>BEGIN 2ND HALF →</Text>
              </Pressable>
            </View>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* STATS GRID - 3x3 Layout */}
            {/* ════════════════════════════════════════════════════════════ */}
            {/* ROW 1: OFFENSE | DEFENSE | EFFICIENCY */}
            <View style={styles.htRow}>
              {/* OFFENSE CARD */}
              <View style={styles.htCard}>
                <View style={[styles.htCardAccent, { backgroundColor: homeTeamColor }]} />
                <Text style={styles.htCardTitle}>OFFENSE</Text>

                <View style={styles.htOffenseMain}>
                  <Text style={[styles.htBigNumber, { color: homeTeamColor }]}>{totalYards}</Text>
                  <Text style={styles.htBigLabel}>TOTAL YARDS</Text>
                </View>

                <View style={styles.htOffenseBreakdown}>
                  <View style={styles.htOffenseStat}>
                    <View style={[styles.htOffenseIndicator, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.htOffenseValue}>{totalRushYards}</Text>
                    <Text style={styles.htOffenseLabel}>RUSH ({rushAttempts})</Text>
                  </View>
                  <View style={styles.htOffenseDivider} />
                  <View style={styles.htOffenseStat}>
                    <View style={[styles.htOffenseIndicator, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.htOffenseValue}>{totalPassYards}</Text>
                    <Text style={styles.htOffenseLabel}>PASS ({completions}/{passAttempts})</Text>
                  </View>
                </View>

                <View style={styles.htOffenseFooter}>
                  <View style={styles.htMiniStat}>
                    <Text style={styles.htMiniValue}>{yardsPerRush}</Text>
                    <Text style={styles.htMiniLabel}>YPC</Text>
                  </View>
                  <View style={styles.htMiniDivider} />
                  <View style={styles.htMiniStat}>
                    <Text style={styles.htMiniValue}>{yardsPerPass}</Text>
                    <Text style={styles.htMiniLabel}>YPA</Text>
                  </View>
                  <View style={styles.htMiniDivider} />
                  <View style={styles.htMiniStat}>
                    <Text style={styles.htMiniValue}>{completionPct}%</Text>
                    <Text style={styles.htMiniLabel}>COMP</Text>
                  </View>
                </View>
              </View>

              {/* DEFENSE CARD - Shows defensive production, not yards allowed */}
              <View style={styles.htCard}>
                <View style={[styles.htCardAccent, { backgroundColor: '#FF3636' }]} />
                <Text style={styles.htCardTitle}>DEFENSE</Text>

                <View style={styles.htOffenseMain}>
                  <Text style={[styles.htBigNumber, { color: '#FF3636' }]}>{totalTackles}</Text>
                  <Text style={styles.htBigLabel}>TOTAL TACKLES</Text>
                </View>

                <View style={styles.htOffenseBreakdown}>
                  <View style={styles.htOffenseStat}>
                    <View style={[styles.htOffenseIndicator, { backgroundColor: '#FF3636' }]} />
                    <Text style={styles.htOffenseValue}>{totalSoloTackles}</Text>
                    <Text style={styles.htOffenseLabel}>SOLO</Text>
                  </View>
                  <View style={styles.htOffenseDivider} />
                  <View style={styles.htOffenseStat}>
                    <View style={[styles.htOffenseIndicator, { backgroundColor: '#FF7777' }]} />
                    <Text style={styles.htOffenseValue}>{totalAssistedTackles}</Text>
                    <Text style={styles.htOffenseLabel}>ASSISTED</Text>
                  </View>
                </View>

                <View style={styles.htOffenseFooter}>
                  <View style={styles.htMiniStat}>
                    <Text style={styles.htMiniValue}>{totalTFLs}</Text>
                    <Text style={styles.htMiniLabel}>TFL</Text>
                  </View>
                  <View style={styles.htMiniDivider} />
                  <View style={styles.htMiniStat}>
                    <Text style={styles.htMiniValue}>{totalSacks}</Text>
                    <Text style={styles.htMiniLabel}>SACKS</Text>
                  </View>
                  <View style={styles.htMiniDivider} />
                  <View style={styles.htMiniStat}>
                    <Text style={styles.htMiniValue}>{totalPassBreakups}</Text>
                    <Text style={styles.htMiniLabel}>PBU</Text>
                  </View>
                </View>
              </View>

              {/* EFFICIENCY CARD */}
              <View style={styles.htCard}>
                <View style={[styles.htCardAccent, { backgroundColor: homeTeamColor }]} />
                <Text style={styles.htCardTitle}>EFFICIENCY</Text>

                <View style={styles.htEffRow}>
                  <View style={styles.htEffItem}>
                    <View style={[styles.htEffCircle, { borderColor: homeTeamColor }]}>
                      <Text style={styles.htEffCircleValue}>{thirdDownPct}<Text style={styles.htEffCirclePercent}>%</Text></Text>
                    </View>
                    <Text style={styles.htEffLabel}>3RD DOWN</Text>
                    <Text style={styles.htEffSub}>{thirdDownConversions}/{thirdDownPlays.length || 0}</Text>
                  </View>
                  <View style={styles.htEffDivider} />
                  <View style={styles.htEffItem}>
                    <View style={[styles.htEffCircle, { borderColor: redZoneTDs > 0 ? '#4CAF50' : '#3a3a3a' }]}>
                      <Text style={[styles.htEffCircleValue, redZoneTDs > 0 && { color: '#4CAF50' }]}>{redZoneTDs}</Text>
                    </View>
                    <Text style={styles.htEffLabel}>RED ZONE TD</Text>
                    <Text style={styles.htEffSub}>{redZonePlays.length} trips</Text>
                  </View>
                </View>

                <View style={styles.htWarningRow}>
                  <View style={[styles.htWarningBox, turnovers > 0 && styles.htWarningBad]}>
                    <Text style={[styles.htWarningNum, turnovers > 0 && { color: '#FF3636' }]}>{turnovers}</Text>
                    <Text style={styles.htWarningLabel}>TURNOVERS</Text>
                  </View>
                  <View style={[styles.htWarningBox, penalties > 0 && styles.htWarningCaution]}>
                    <Text style={[styles.htWarningNum, penalties > 0 && { color: '#FFC107' }]}>{penalties}</Text>
                    <Text style={styles.htWarningLabel}>PENALTIES</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ROW 2: TOP PERFORMERS | PLAY BREAKDOWN | TOP DEFENDERS */}
            <View style={styles.htRow}>
              {/* TOP PERFORMERS CARD */}
              <View style={styles.htCard}>
                <View style={[styles.htCardAccent, { backgroundColor: homeTeamColor }]} />
                <Text style={styles.htCardTitle}>TOP PERFORMERS</Text>

                {topRusher || topPasser || topReceiver ? (
                  <View style={styles.htPerformers}>
                    {topRusher && (
                      <View style={styles.htPerformerRow}>
                        <View style={[styles.htPerformerBadge, { backgroundColor: '#4CAF50' }]}>
                          <Text style={styles.htPerformerBadgeText}>RB</Text>
                        </View>
                        <View style={styles.htPerformerInfo}>
                          <Text style={styles.htPerformerName}>{topRusher[0]}</Text>
                          <Text style={styles.htPerformerStats}>{topRusher[1].carries} car, {topRusher[1].yards} yds</Text>
                        </View>
                        <Text style={styles.htPerformerYards}>{topRusher[1].yards}</Text>
                      </View>
                    )}
                    {topPasser && (
                      <View style={styles.htPerformerRow}>
                        <View style={[styles.htPerformerBadge, { backgroundColor: '#2196F3' }]}>
                          <Text style={styles.htPerformerBadgeText}>QB</Text>
                        </View>
                        <View style={styles.htPerformerInfo}>
                          <Text style={styles.htPerformerName}>{topPasser[0]}</Text>
                          <Text style={styles.htPerformerStats}>{topPasser[1].comps}/{topPasser[1].atts}, {topPasser[1].yards} yds</Text>
                        </View>
                        <Text style={styles.htPerformerYards}>{topPasser[1].yards}</Text>
                      </View>
                    )}
                    {topReceiver && (
                      <View style={styles.htPerformerRow}>
                        <View style={[styles.htPerformerBadge, { backgroundColor: '#9C27B0' }]}>
                          <Text style={styles.htPerformerBadgeText}>WR</Text>
                        </View>
                        <View style={styles.htPerformerInfo}>
                          <Text style={styles.htPerformerName}>{topReceiver[0]}</Text>
                          <Text style={styles.htPerformerStats}>{topReceiver[1].receptions} rec, {topReceiver[1].yards} yds</Text>
                        </View>
                        <Text style={styles.htPerformerYards}>{topReceiver[1].yards}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.htEmptyState}>
                    <Text style={styles.htEmptyIcon}>📊</Text>
                    <Text style={styles.htEmptyText}>No stats recorded yet</Text>
                    <Text style={styles.htEmptySub}>Stats will appear as plays are logged</Text>
                  </View>
                )}
              </View>

              {/* PLAY BREAKDOWN CARD */}
              <View style={styles.htCard}>
                <View style={[styles.htCardAccent, { backgroundColor: homeTeamColor }]} />
                <Text style={styles.htCardTitle}>PLAY BREAKDOWN</Text>

                <View style={styles.htPlayBars}>
                  <View style={styles.htPlayBarRow}>
                    <Text style={styles.htPlayBarLabel}>RUN</Text>
                    <View style={styles.htPlayBarTrack}>
                      <View style={[styles.htPlayBarFill, { width: `${rushPct || 50}%`, backgroundColor: '#4CAF50' }]}>
                        <Text style={styles.htPlayBarInnerText}>{rushPct}%</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.htPlayBarRow}>
                    <Text style={styles.htPlayBarLabel}>PASS</Text>
                    <View style={styles.htPlayBarTrack}>
                      <View style={[styles.htPlayBarFill, { width: `${passPct || 50}%`, backgroundColor: '#2196F3' }]}>
                        <Text style={styles.htPlayBarInnerText}>{passPct}%</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.htPlayTotals}>
                  <View style={styles.htPlayTotal}>
                    <Text style={styles.htPlayTotalNum}>{totalPlays}</Text>
                    <Text style={styles.htPlayTotalLabel}>PLAYS</Text>
                  </View>
                  <View style={styles.htPlayTotalDivider} />
                  <View style={styles.htPlayTotal}>
                    <Text style={styles.htPlayTotalNum}>{bigPlays.length}</Text>
                    <Text style={styles.htPlayTotalLabel}>EXPLOSIVE</Text>
                  </View>
                  <View style={styles.htPlayTotalDivider} />
                  <View style={styles.htPlayTotal}>
                    <Text style={[styles.htPlayTotalNum, { color: homeTeamColor }]}>{longestPlay.yards || '-'}</Text>
                    <Text style={styles.htPlayTotalLabel}>LONG</Text>
                  </View>
                </View>
              </View>

              {/* TOP DEFENDERS CARD */}
              <View style={styles.htCard}>
                <View style={[styles.htCardAccent, { backgroundColor: '#FF3636' }]} />
                <Text style={styles.htCardTitle}>TOP DEFENDERS</Text>

                {topDefenders.length > 0 ? (
                  <View style={styles.htPerformers}>
                    {topDefenders.map((defender, index) => {
                      // Build stats string showing only non-zero stats
                      const statParts = [];
                      if (defender.totalTackles > 0) statParts.push(`${defender.totalTackles} tkl (${defender.soloTackles}S/${defender.assistedTackles}A)`);
                      if (defender.sacks > 0) statParts.push(`${defender.sacks} sk`);
                      if (defender.tfls > 0) statParts.push(`${defender.tfls} TFL`);
                      if (defender.ints > 0) statParts.push(`${defender.ints} INT`);
                      if (defender.pbus > 0) statParts.push(`${defender.pbus} PBU`);
                      if (defender.forcedFumbles > 0) statParts.push(`${defender.forcedFumbles} FF`);
                      if (defender.fumbleRecoveries > 0) statParts.push(`${defender.fumbleRecoveries} FR`);

                      return (
                        <View key={index} style={styles.htPerformerRow}>
                          <View style={[styles.htPerformerBadge, { backgroundColor: '#FF3636' }]}>
                            <Text style={styles.htPerformerBadgeText}>D</Text>
                          </View>
                          <View style={styles.htPerformerInfo}>
                            <Text style={styles.htPerformerName}>#{defender.playerId} {defender.playerName}</Text>
                            <Text style={styles.htPerformerStats}>
                              {statParts.join(', ') || 'No stats'}
                            </Text>
                          </View>
                          <Text style={styles.htPerformerYards}>{defender.totalTackles}</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.htEmptyState}>
                    <Text style={styles.htEmptyIcon}>🛡️</Text>
                    <Text style={styles.htEmptyText}>No defensive stats yet</Text>
                    <Text style={styles.htEmptySub}>Log defensive stats after each play</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ROW 3: SCORING SUMMARY | GAME FLOW | QUARTER STATS */}
            <View style={[styles.htRow, { marginBottom: 0 }]}>
              {/* SCORING PLAYS CARD */}
              <View style={styles.htCard}>
                <View style={[styles.htCardAccent, { backgroundColor: homeTeamColor }]} />
                <Text style={styles.htCardTitle}>SCORING SUMMARY</Text>

                {scoringPlays.length > 0 ? (
                  <View style={styles.htScoringList}>
                    {scoringPlays.slice(0, 4).map((play, index) => (
                      <View key={index} style={styles.htScoringItem}>
                        <View style={[styles.htScoringBadge, { backgroundColor: play.category.includes('td') ? homeTeamColor : '#FFC107' }]}>
                          <Text style={styles.htScoringBadgeText}>
                            {play.category.includes('td') ? 'TD' : play.category === 'fieldgoal' ? 'FG' : 'SF'}
                          </Text>
                        </View>
                        <View style={styles.htScoringInfo}>
                          <Text style={styles.htScoringPlayer} numberOfLines={1}>{play.player}</Text>
                          <Text style={styles.htScoringDetail}>
                            {play.category.includes('run') ? 'Rush' : play.category.includes('pass') ? 'Pass' : ''} {play.yards} yds
                          </Text>
                        </View>
                        <View style={styles.htScoringQuarter}>
                          <Text style={styles.htScoringQuarterText}>{play.quarter || 'Q1'}</Text>
                          <Text style={styles.htScoringTime}>{play.gameClock || ''}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.htEmptyState}>
                    <Text style={styles.htEmptyIcon}>🏈</Text>
                    <Text style={styles.htEmptyText}>No scores yet</Text>
                    <Text style={styles.htEmptySub}>Keep grinding!</Text>
                  </View>
                )}
              </View>

              {/* GAME FLOW CARD */}
              <View style={styles.htCard}>
                <View style={[styles.htCardAccent, { backgroundColor: homeTeamColor }]} />
                <Text style={styles.htCardTitle}>GAME FLOW</Text>

                <View style={styles.htFlowQuarters}>
                  <View style={styles.htFlowQuarter}>
                    <View style={styles.htFlowQuarterHeader}>
                      <Text style={styles.htFlowLabel}>Q1</Text>
                      <Text style={[styles.htFlowYards, { color: homeTeamColor }]}>{q1Yards} yds</Text>
                    </View>
                    <View style={styles.htFlowBarTrack}>
                      <View style={[styles.htFlowBarFill, { width: `${Math.min((q1Yards / 150) * 100, 100)}%`, backgroundColor: homeTeamColor }]} />
                    </View>
                  </View>
                  <View style={styles.htFlowQuarter}>
                    <View style={styles.htFlowQuarterHeader}>
                      <Text style={styles.htFlowLabel}>Q2</Text>
                      <Text style={[styles.htFlowYards, { color: homeTeamColor }]}>{q2Yards} yds</Text>
                    </View>
                    <View style={styles.htFlowBarTrack}>
                      <View style={[styles.htFlowBarFill, { width: `${Math.min((q2Yards / 150) * 100, 100)}%`, backgroundColor: homeTeamColor }]} />
                    </View>
                  </View>
                </View>

                <View style={styles.htFlowDivider} />

                <View style={styles.htFlowStats}>
                  <View style={styles.htFlowStat}>
                    <Text style={styles.htFlowStatValue}>{firstDowns}</Text>
                    <Text style={styles.htFlowStatLabel}>1ST DOWNS</Text>
                  </View>
                  <View style={styles.htFlowStatDivider} />
                  <View style={styles.htFlowStat}>
                    <Text style={styles.htFlowStatValue}>{punts}</Text>
                    <Text style={styles.htFlowStatLabel}>PUNTS</Text>
                  </View>
                  <View style={styles.htFlowStatDivider} />
                  <View style={styles.htFlowStat}>
                    <Text style={[styles.htFlowStatValue, { color: homeTeamColor }]}>{yardsPerPlay}</Text>
                    <Text style={styles.htFlowStatLabel}>YDS/PLAY</Text>
                  </View>
                </View>
              </View>

              {/* QUARTER STATS CARD */}
              <View style={styles.htCard}>
                <View style={[styles.htCardAccent, { backgroundColor: homeTeamColor }]} />
                <Text style={styles.htCardTitle}>QUARTER BREAKDOWN</Text>

                <View style={styles.htOffenseBreakdown}>
                  <View style={styles.htOffenseStat}>
                    <Text style={[styles.htOffenseValue, { color: homeTeamColor }]}>{q1Plays.length}</Text>
                    <Text style={styles.htOffenseLabel}>Q1 PLAYS</Text>
                  </View>
                  <View style={styles.htOffenseDivider} />
                  <View style={styles.htOffenseStat}>
                    <Text style={[styles.htOffenseValue, { color: homeTeamColor }]}>{q2Plays.length}</Text>
                    <Text style={styles.htOffenseLabel}>Q2 PLAYS</Text>
                  </View>
                </View>

                <View style={styles.htOffenseBreakdown}>
                  <View style={styles.htOffenseStat}>
                    <Text style={styles.htOffenseValue}>{q1Yards}</Text>
                    <Text style={styles.htOffenseLabel}>Q1 YARDS</Text>
                  </View>
                  <View style={styles.htOffenseDivider} />
                  <View style={styles.htOffenseStat}>
                    <Text style={styles.htOffenseValue}>{q2Yards}</Text>
                    <Text style={styles.htOffenseLabel}>Q2 YARDS</Text>
                  </View>
                </View>

                <View style={styles.htOffenseFooter}>
                  <View style={styles.htMiniStat}>
                    <Text style={styles.htMiniValue}>{defTotalTakeaways}</Text>
                    <Text style={styles.htMiniLabel}>TAKEAWAYS</Text>
                  </View>
                  <View style={styles.htMiniDivider} />
                  <View style={styles.htMiniStat}>
                    <Text style={styles.htMiniValue}>{totalSacks}</Text>
                    <Text style={styles.htMiniLabel}>SACKS</Text>
                  </View>
                  <View style={styles.htMiniDivider} />
                  <View style={styles.htMiniStat}>
                    <Text style={styles.htMiniValue}>{def3rdDownStopPct}%</Text>
                    <Text style={styles.htMiniLabel}>3RD STOPS</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* NO BOTTOM BUTTON - It's now in the top bar */}
          </View>
        );
      })()}

      <View style={styles.grayContainer}>
        <View style={styles.contentContainer}>

      <View style={styles.scoreboard}>
        <View style={[styles.teamSection, {
          backgroundColor: homeTeamColor,
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          position: 'relative',
        }]}>
          {/* Exit button in top-left of home team box */}
          <Pressable
            style={styles.exitButtonInBox}
            onPress={() => setShowExitConfirm(true)}
          >
            <Text style={styles.exitButtonText}>×</Text>
          </Pressable>

          <Text style={styles.teamLabel}>HOME</Text>
          <Text style={styles.teamName}>{homeTeam.name}</Text>
          <View style={styles.timeoutsContainer}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[styles.timeoutDot, i >= homeTeam.timeouts && styles.timeoutDotUsed]} />
            ))}
          </View>
        </View>

        {/* Middle section with gray background - wraps both scores + game info */}
        <View style={styles.scoreboardMiddle}>
          <View style={styles.scoreSection}>
            <Text style={styles.score}>{homeTeam.score}</Text>
          </View>

          <View style={styles.gameInfoContainer}>
            {/* Possession indicator on left (absolute positioned) */}
            {possession === 'offense' && (
              <View style={styles.possessionIndicatorLeft}>
                <PossessionIcon />
              </View>
            )}

            {/* Centered game info */}
            <View style={styles.gameInfo}>
              <Text style={styles.quarter}>{quarter}</Text>

              <Pressable onPress={() => {
                setClockInput(clock.replace(':', ''));  // Pre-fill with current clock value so it auto-highlights
                setShowClockEdit(true);
              }}>
                <Text style={styles.clock}>{clock}</Text>
              </Pressable>

              <Pressable onPress={() => setShowDownEdit(true)}>
                <Text style={styles.downDistance}>
                  {down === 1 ? '1st' : down === 2 ? '2nd' : down === 3 ? '3rd' : '4th'} & {distance}
                </Text>
              </Pressable>
            </View>

            {/* Possession indicator on right (absolute positioned) */}
            {possession === 'defense' && (
              <View style={styles.possessionIndicatorRight}>
                <PossessionIcon />
              </View>
            )}
          </View>

          <Pressable style={styles.scoreSection} onPress={() => setShowOpponentScoreModal(true)}>
            <Text style={styles.score}>{awayTeam.score}</Text>
          </Pressable>
        </View>

        <View style={[styles.teamSection, {
          backgroundColor: awayTeamColor,
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
        }]}>
          <Text style={[styles.teamLabel, styles.teamLabelAway]}>AWAY</Text>
          <Text style={[styles.teamName, { color: awayTeamTextColor }]}>{awayTeam.name}</Text>
          <View style={styles.timeoutsContainer}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[
                styles.timeoutDot,
                { backgroundColor: i >= awayTeam.timeouts ? '#d0d0d0' : awayTeamTextColor }
              ]} />
            ))}
          </View>
        </View>
      </View>

      {/* Utility Buttons - Always Available */}
      <View style={styles.utilityButtonRow}>
        <Pressable
          style={styles.utilityBtn}
          onPress={() => setShowScoringMenu(true)}
        >
          <Text style={styles.utilityBtnText}>SCORING</Text>
        </Pressable>
        <Pressable
          style={styles.utilityBtn}
          onPress={() => {
            // Start penalty flow - show team selection
            setPenaltyStep('team');
            setPenaltyTeam(null);
            setPenaltyCategory(null);
            setPenaltySelected(null);
            setPenaltyResult(null);
          }}
        >
          <Text style={styles.utilityBtnText}>PENALTY</Text>
        </Pressable>
        <Pressable
          style={styles.utilityBtn}
          onPress={() => {
            Alert.alert(
              'TIMEOUT',
              'Which team called timeout?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: homeTeam.name,
                  onPress: () => {
                    if (homeTeam.timeouts > 0) {
                      setHomeTeam({ ...homeTeam, timeouts: homeTeam.timeouts - 1 });
                      
                      // Log timeout in recent plays
                      const play: Play = {
                        category: 'timeout',
                        player: homeTeam.name,
                        startYard: currentYard,
                        endYard: currentYard,
                        yards: '0',
                        timestamp: new Date().toLocaleTimeString(),
                      };
                      setRecentPlays([play, ...recentPlays]);
                    } else {
                      Alert.alert('No Timeouts', `${homeTeam.name} has no timeouts remaining.`);
                    }
                  }
                },
                {
                  text: awayTeam.name,
                  onPress: () => {
                    if (awayTeam.timeouts > 0) {
                      setAwayTeam({ ...awayTeam, timeouts: awayTeam.timeouts - 1 });
                      
                      // Log timeout in recent plays
                      const play: Play = {
                        category: 'timeout',
                        player: awayTeam.name,
                        startYard: currentYard,
                        endYard: currentYard,
                        yards: '0',
                        timestamp: new Date().toLocaleTimeString(),
                      };
                      setRecentPlays([play, ...recentPlays]);
                    } else {
                      Alert.alert('No Timeouts', `${awayTeam.name} has no timeouts remaining.`);
                    }
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.utilityBtnText}>TIMEOUT</Text>
        </Pressable>
        <Pressable 
          style={styles.utilityBtn} 
          onPress={() => setShowEndQuarterModal(true)}
        >
          <Text style={styles.utilityBtnText}>END QUARTER</Text>
        </Pressable>
        <Pressable 
          style={styles.utilityBtn} 
          onPress={() => {
            Alert.alert(
              'END GAME',
              `Final Score:\n${homeTeam.name}: ${homeTeam.score}\n${awayTeam.name}: ${awayTeam.score}\n\nExport game data?`,
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'Export & Exit',
                  onPress: () => {
                    // Export game data
                    exportGameData();
                    
                    // Show success message
                    Alert.alert(
                      'Game Data Exported!',
                      'Your game data has been downloaded. Thanks for using StatIQ!',
                      [
                        {
                          text: 'Exit to Dashboard',
                          onPress: () => router.back()
                        }
                      ]
                    );
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.utilityBtnText}>END GAME</Text>
        </Pressable>
      </View>

      {/* Prompt Bar */}
      <View style={styles.promptBar}>
        {selectedCategory ? (
          <Text style={styles.promptText}>
            {/* PENALTY SCRIPT */}
            {selectedCategory === 'penalty' ? (
              <>
                <Text style={styles.promptFilled}>
                  {selectedPenalty ? selectedPenalty.name.toUpperCase() : 'PENALTY'}
                </Text>
                {' ON '}
                <Text style={selectedPlayer ? styles.promptFilled : styles.promptBlank}>
                  {selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name.toUpperCase()}` : '____________'}
                </Text>
                {selectedPenalty && (
                  <>
                    {' - '}
                    <Text style={styles.promptFilled}>{selectedPenalty.yards} YDS</Text>
                  </>
                )}
              </>
            ) : /* PASS SCRIPT: Pass from [passer] to [receiver] for [x]-yd [gain/loss] */
            (selectedCategory === 'pass' || selectedCategory === 'incomplete') ? (
              <>
                <Text style={styles.promptFilled}>
                  {selectedCategory === 'pass' ? 'COMPLETE PASS' : 'INCOMPLETE PASS'}
                </Text>
                {' FROM '}
                <Text style={selectedPlayer ? styles.promptFilled : styles.promptBlank}>
                  {selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name.toUpperCase()}` : '____________'}
                </Text>
                {' TO '}
                <Text style={selectedPlayer2 ? styles.promptFilled : styles.promptBlank}>
                  {selectedPlayer2 ? `#${selectedPlayer2.number} ${selectedPlayer2.name.toUpperCase()}` : '____________'}
                </Text>
                {selectedCategory === 'pass' && (
                  <>
                    {' FOR A '}
                    <Text style={selectedPlayer2 ? styles.promptFilled : styles.promptBlank}>
                      {selectedPlayer2 ? (() => {
                        const drivingRight = fieldDirection === 'right';
                        const actualYards = drivingRight ? endYard - currentYard : currentYard - endYard;
                        return `${actualYards > 0 ? '+' : ''}${actualYards}`;
                      })() : '__'}
                    </Text>
                    {'-YD '}
                    <Text style={selectedPlayer2 ? styles.promptFilled : styles.promptBlank}>
                      {selectedPlayer2 ? (() => {
                        const drivingRight = fieldDirection === 'right';
                        const actualYards = drivingRight ? endYard - currentYard : currentYard - endYard;
                        return actualYards > 0 ? 'GAIN' : 'LOSS';
                      })() : '_______'}
                    </Text>
                  </>
                )}
              </>
            ) : (
              /* RUN SCRIPT: Rush by [player] for [x]-yd [gain/loss] */
              <>
                <Text style={styles.promptFilled}>{selectedCategory === 'run' ? 'RUSH' : selectedCategory.toUpperCase()}</Text>
                {' BY '}
                <Text style={selectedPlayer ? styles.promptFilled : styles.promptBlank}>
                  {selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name.toUpperCase()}` : '____________'}
                </Text>
                {' FOR A '}
                <Text style={selectedPlayer ? styles.promptFilled : styles.promptBlank}>
                  {selectedPlayer ? (() => {
                    const drivingRight = fieldDirection === 'right';
                    const actualYards = drivingRight ? endYard - currentYard : currentYard - endYard;
                    return `${actualYards > 0 ? '+' : ''}${actualYards}`;
                  })() : '__'}
                </Text>
                {'-YD '}
                <Text style={selectedPlayer ? styles.promptFilled : styles.promptBlank}>
                  {selectedPlayer ? (() => {
                    const drivingRight = fieldDirection === 'right';
                    const actualYards = drivingRight ? endYard - currentYard : currentYard - endYard;
                    return actualYards > 0 ? 'GAIN' : 'LOSS';
                  })() : '_______'}
                </Text>
              </>
            )}
          </Text>
        ) : (
          <View style={styles.emptyPromptBar} />
        )}
      </View>

      {!selectedCategory && !selectedSubcategory ? (
        <>
          {possession === 'offense' ? (
            /* OFFENSE BUTTONS - 6 buttons */
            <View style={styles.categoryGrid}>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedCategory('run')}>
                <Text style={styles.categoryBtnText}>RUN</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedCategory('pass')}>
                <Text style={styles.categoryBtnText}>COMPLETE{'\n'}PASS</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedCategory('incomplete')}>
                <Text style={styles.categoryBtnText}>INCOMPLETE{'\n'}PASS</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedSubcategory('special-teams')}>
                <Text style={styles.categoryBtnText}>SPECIAL{'\n'}TEAMS</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedSubcategory('turnover')}>
                <Text style={styles.categoryBtnText}>TURNOVER</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedSubcategory('other')}>
                <Text style={styles.categoryBtnText}>OTHER</Text>
              </Pressable>
            </View>
          ) : (
            /* DEFENSE BUTTONS - 6 buttons */
            <View style={styles.categoryGrid}>
              <Pressable style={[styles.categoryBtn, styles.defenseBtn]} onPress={() => setSelectedCategory('tackle')}>
                <Text style={styles.categoryBtnText}>TACKLE</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.defenseBtn]} onPress={() => setSelectedCategory('sack')}>
                <Text style={styles.categoryBtnText}>SACK</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.defenseBtn]} onPress={() => setSelectedCategory('interception')}>
                <Text style={styles.categoryBtnText}>INTERCEPTION</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.defenseBtn]} onPress={() => setSelectedCategory('fumble')}>
                <Text style={styles.categoryBtnText}>FUMBLE{'\n'}RECOVERY</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.defenseBtn]} onPress={() => setSelectedCategory('penalty')}>
                <Text style={styles.categoryBtnText}>PENALTY</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.defenseBtn]} onPress={() => setShowSafetyModal(true)}>
                <Text style={styles.categoryBtnText}>SAFETY</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.recentPlaysSection}>
            <Text style={styles.sectionTitle}>Recent Plays</Text>
            <View style={styles.playsListContainer}>
              {recentPlays.length === 0 ? (
                <Text style={styles.emptyText}>No plays logged yet</Text>
              ) : (
                recentPlays.slice(0, 3).map((play, index) => {
                  // Determine accent color
                  const yards = parseInt(play.yards) || 0;
                  let accentColor = '#F3F3F7'; // Default neutral

                  // Penalties (yellow) - check BEFORE positive/negative yard logic
                  if (play.category === 'penalty') {
                    accentColor = '#FFD836'; // FLAG yellow
                  }
                  // Opponent scores (gray/neutral)
                  else if (play.category === 'opponent-score') {
                    accentColor = '#888888'; // Neutral gray
                  }
                  // Positive plays (green)
                  else if (play.category === 'run-td' || play.category === 'pass-td' ||
                      (play.category === 'interception-td' && play.possession === 'defense') ||
                      play.category === 'fumble-td' ||
                      play.category === 'punt-return-td' || play.category === 'kickoff-return-td' ||
                      play.category === 'touchdown' ||
                      play.category === 'fieldgoal' || play.category === 'safety' ||
                      (play.category === 'interception' && play.possession === 'defense') ||
                      play.category === 'kickoff-onside-recovered' ||
                      yards > 0) {
                    accentColor = '#B4D836'; // SURGE green
                  }
                  // Negative plays (red)
                  else if (play.category === 'sack' ||
                      play.category === 'fieldgoal-missed' ||
                      (play.category === 'interception-td' && play.possession === 'offense') ||
                      (play.category === 'interception' && play.possession === 'offense') ||
                      play.category === 'fumble' || yards < 0) {
                    accentColor = '#FF3636'; // BLAZE red
                  }

                  // Format play description
                  let description = '';
                  if (play.category === 'penalty') {
                    description = `${play.penaltyName} on ${play.player} (${play.yards} yards)`;
                  } else if (play.category === 'timeout') {
                    description = `⏱️ Timeout - ${play.player}`;
                  } else if (play.category === 'halftime') {
                    description = `🏁 HALFTIME - ${play.player}`;
                  } else if (play.category === 'end-quarter') {
                    description = `📍 ${play.player}`;
                  } else if (play.category === 'kickoff-return-td') {
                    description = `🏈 Kickoff Return TD by ${play.player} (${play.yards} yds)`;
                  } else if (play.category === 'kickoff-return') {
                    description = `Kickoff return by ${play.player} to ${formatYardLine(play.endYard)}`;
                  } else if (play.category === 'kickoff-touchback') {
                    description = `Touchback - Ball at 25`;
                  } else if (play.category === 'kickoff-onside-recovered') {
                    description = `⚡ ${play.player}`;
                  } else if (play.category === 'kickoff-onside-failed') {
                    description = `${play.player}`;
                  } else if (play.category === 'kickoff-oob') {
                    description = `⚠️ ${play.player}`;
                  } else if (play.category === 'fieldgoal') {
                    description = `✓ Field Goal GOOD (+3)`;
                  } else if (play.category === 'fieldgoal-missed') {
                    description = `❌ Field Goal MISSED`;
                  } else if (play.category === 'safety') {
                    description = `⚠️ SAFETY (+2)`;
                  } else if (play.category === 'interception-td') {
                    if (play.possession === 'defense') {
                      description = `🏈 Turnover - Interception TD by ${play.player}`;
                    } else {
                      description = `🏈 INT TD - ${play.player} threw pick`;
                    }
                  } else if (play.category === 'fumble-td') {
                    description = `🏈 Fumble Return TD by ${play.player}`;
                  } else if (play.category === 'punt-return-td') {
                    description = `🏈 Punt Return TD by ${play.player}`;
                  } else if (play.category === 'run-td') {
                    description = `🏈 Rushing TD by ${play.player} (${play.yards} yds)`;
                  } else if (play.category === 'pass-td') {
                    description = `🏈 TD Pass ${play.player} to ${play.player2} (${play.yards} yds)`;
                  } else if (play.category === 'touchdown') {
                    description = `🏈 TOUCHDOWN - ${play.player} (+6)`;
                  } else if (play.category === 'sack') {
                    description = `Sack by ${play.player} (${play.yards} yds)`;
                  } else if (play.category === 'interception') {
                    if (play.possession === 'defense') {
                      description = `Turnover - Interception by ${play.player}`;
                    } else {
                      description = `INT - ${play.player} threw pick`;
                    }
                  } else if (play.category === 'fumble') {
                    description = `Fumble recovery by ${play.player} (${play.yards} yds)`;
                  } else if (play.category === 'opponent-score') {
                    description = `⚠️ ${play.player}`;
                  } else if (play.category === 'punt') {
                    description = `Punt by ${play.player} (${play.yards} yds)`;
                  } else if (play.category === 'pass') {
                    const gainLoss = parseInt(play.yards) >= 0 ? 'gain' : 'loss';
                    let baseDesc = `${play.player} pass to ${play.player2} for a ${Math.abs(parseInt(play.yards))} yard ${gainLoss}`;
                    if (play.fumble) {
                      if (play.fumbleRecoveredBy === 'defense') {
                        baseDesc += ` - FUMBLE LOST - TURNOVER`;
                      } else {
                        baseDesc += ` - FUMBLE RECOVERED BY OFFENSE`;
                      }
                    }
                    description = baseDesc;
                  } else if (play.category === 'incomplete') {
                    description = `${play.player} incomplete pass to ${play.player2}`;
                  } else if (play.category === 'run') {
                    const gainLoss = parseInt(play.yards) >= 0 ? 'gain' : 'loss';
                    description = `${play.player} rushed for a ${Math.abs(parseInt(play.yards))} yard ${gainLoss}`;
                  } else {
                    const gainLoss = parseInt(play.yards) >= 0 ? 'gain' : 'loss';
                    description = `${play.player} for a ${Math.abs(parseInt(play.yards))} yard ${gainLoss}`;
                  }

                  return (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.playCard,
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      {/* Colored accent bar */}
                      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                      {/* Card content */}
                      <View style={styles.cardContent}>
                        <Text style={styles.playDescription} numberOfLines={1}>
                          {description}
                        </Text>

                        <View style={styles.metadataRow}>
                          {play.down && play.distance && (
                            <Text style={styles.downDistanceText}>
                              {play.down} & {play.distance}   |   {play.gameClock || play.timestamp}
                            </Text>
                          )}
                          {(!play.down || !play.distance) && (
                            <Text style={styles.timestampText}>
                              {play.gameClock || play.timestamp}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Edit button */}
                      <Pressable
                        style={styles.editButton}
                        onPress={() => {
                          // Populate the form with the play data
                          setSelectedCategory(play.category);
                          setCurrentYard(play.startYard);
                          setEndYard(play.endYard);

                          // Find and set the players
                          const player1 = roster.find(p => `#${p.number} ${p.name}` === play.player);
                          if (player1) setSelectedPlayer(player1);

                          if (play.player2) {
                            const player2 = roster.find(p => `#${p.number} ${p.name}` === play.player2);
                            if (player2) setSelectedPlayer2(player2);
                          }

                          // Remove this play from recent plays (they can re-submit after editing)
                          setRecentPlays(recentPlays.filter((_, i) => i !== index));
                        }}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </Pressable>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </>
      ) : selectedSubcategory === 'turnover' ? (
        /* TURNOVER Submenu */
        <View style={styles.submenuContainer}>
          <Pressable
            style={styles.backToCategories}
            onPress={() => {
              setSelectedSubcategory(null);
            }}
          >
            <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
          </Pressable>

          <Text style={styles.submenuTitle}>SELECT TURNOVER TYPE</Text>

          <View style={styles.submenuGrid}>
            <Pressable
              style={[styles.submenuBtn, styles.submenuBtnThird, styles.offenseBtn]}
              onPress={() => setSelectedCategory('fumble')}
            >
              <Text style={styles.categoryBtnText}>FUMBLE</Text>
            </Pressable>
            <Pressable
              style={[styles.submenuBtn, styles.submenuBtnThird, styles.offenseBtn]}
              onPress={() => setSelectedCategory('interception')}
            >
              <Text style={styles.categoryBtnText}>INTERCEPTION</Text>
            </Pressable>
            <Pressable
              style={[styles.submenuBtn, styles.submenuBtnThird, styles.offenseBtn]}
              onPress={() => {
                setSelectedCategory('turnover-on-downs');
                setSelectedSubcategory(null);
              }}
            >
              <Text style={styles.categoryBtnText}>TURNOVER{'\n'}ON DOWNS</Text>
            </Pressable>
          </View>
        </View>
      ) : selectedSubcategory === 'special-teams' ? (
        /* SPECIAL TEAMS Submenu */
        <View style={styles.submenuContainer}>
          <Pressable
            style={styles.backToCategories}
            onPress={() => {
              setSelectedSubcategory(null);
            }}
          >
            <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
          </Pressable>

          <Text style={styles.submenuTitle}>SELECT SPECIAL TEAMS PLAY</Text>

          <View style={styles.submenuGrid}>
            <Pressable
              style={[styles.submenuBtn, styles.offenseBtn]}
              onPress={() => setSelectedCategory('punt')}
            >
              <Text style={styles.categoryBtnText}>PUNT</Text>
            </Pressable>
            <Pressable
              style={[styles.submenuBtn, styles.offenseBtn]}
              onPress={() => setShowFieldGoalModal(true)}
            >
              <Text style={styles.categoryBtnText}>FIELD GOAL</Text>
            </Pressable>
          </View>
        </View>
      ) : selectedSubcategory === 'other' ? (
        /* OTHER Submenu */
        <View style={styles.submenuContainer}>
          <Pressable
            style={styles.backToCategories}
            onPress={() => {
              setSelectedSubcategory(null);
            }}
          >
            <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
          </Pressable>

          <Text style={styles.submenuTitle}>SELECT OTHER PLAY TYPE</Text>

          <View style={styles.submenuGrid}>
            <Pressable
              style={[styles.submenuBtn, styles.submenuBtnThird, styles.offenseBtn]}
              onPress={() => {
                setSelectedCategory('kneel');
                setSelectedSubcategory(null);
              }}
            >
              <Text style={styles.categoryBtnText}>KNEEL</Text>
            </Pressable>
            <Pressable
              style={[styles.submenuBtn, styles.submenuBtnThird, styles.offenseBtn]}
              onPress={() => {
                setSelectedCategory('spike');
                setSelectedSubcategory(null);
              }}
            >
              <Text style={styles.categoryBtnText}>SPIKE</Text>
            </Pressable>
            <Pressable
              style={[styles.submenuBtn, styles.submenuBtnThird, styles.offenseBtn]}
              onPress={() => {
                setSelectedCategory('bad-snap');
                setSelectedSubcategory(null);
              }}
            >
              <Text style={styles.categoryBtnText}>BAD SNAP</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Player Selection View */
        <>
          {selectedCategory === 'penalty' && selectedSubcategory === 'selectPlayer' ? (
            /* Penalty Player Selection */
            <View style={styles.twoColumnLayout}>
              {/* Player Column */}
              <View style={styles.columnHalf}>
                <View style={styles.columnHeader}>
                  <Pressable 
                    style={styles.backToCategories}
                    onPress={() => {
                      setSelectedSubcategory(null);
                      setSelectedPenalty(null);
                      setSelectedPlayer(null);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.backToCategoriesText}>← Back to Penalties</Text>
                  </Pressable>
                  <Text style={styles.sectionTitle}>WHO COMMITTED THE PENALTY?</Text>
                  <Text style={styles.penaltySelectedName}>{selectedPenalty?.name} - {selectedPenalty?.yards} yards</Text>
                </View>
                
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search player..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                
                <ScrollView style={styles.rosterList} showsVerticalScrollIndicator={false}>
                  {/* Unknown Player Option */}
                  <Pressable
                    style={[
                      styles.playerItem,
                      !selectedPlayer && styles.playerItemSelected
                    ]}
                    onPress={() => setSelectedPlayer(null)}
                  >
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>?</Text>
                    </View>
                    <Text style={styles.playerName}>UNKNOWN PLAYER</Text>
                  </Pressable>
                  
                  {/* Grouped by position */}
                  {Object.entries(groupedRoster).map(([position, players]) => (
                    <View key={position}>
                      <Text style={styles.positionLabel}>{position}</Text>
                      {players
                        .filter(p => 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.number.includes(searchQuery)
                        )
                        .map(player => (
                          <Pressable
                            key={`${player.number}-${player.name}`}
                            style={[
                              styles.playerItem,
                              selectedPlayer?.number === player.number &&
                              selectedPlayer?.name === player.name &&
                              styles.playerItemSelected
                            ]}
                            onPress={() => setSelectedPlayer(player)}
                          >
                            <View style={styles.playerNumber}>
                              <Text style={styles.playerNumberText}>#{player.number}</Text>
                            </View>
                            <Text style={[
                              styles.playerName,
                              selectedPlayer?.number === player.number &&
                              selectedPlayer?.name === player.name &&
                              { color: homeTeamColor }
                            ]}>{player.name}</Text>
                            {player.isStarter && (
                              <View style={styles.starterBadge}>
                                <Text style={styles.starterText}>STARTER</Text>
                              </View>
                            )}
                          </Pressable>
                        ))}
                    </View>
                  ))}
                </ScrollView>
              </View>
              
              {/* Confirmation Column */}
              <View style={styles.columnHalf}>
                <Text style={styles.sectionTitle}>CONFIRM PENALTY</Text>
                <View style={styles.penaltyConfirmCard}>
                  <Text style={styles.penaltyConfirmTitle}>{selectedPenalty?.name}</Text>
                  <Text style={styles.penaltyConfirmYards}>{selectedPenalty?.yards} yards</Text>
                  <Text style={styles.penaltyConfirmPlayer}>
                    Player: {selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Unknown'}
                  </Text>
                  
                  <Pressable
                    style={styles.submitButton}
                    onPress={() => {
                      if (!selectedPenalty) return;

                      // STEP 1: Ask if penalty was accepted or declined
                      Alert.alert(
                        'PENALTY: ' + selectedPenalty.name,
                        `${selectedPenalty.yards} yards on ${selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Unknown'}\n\nWas the penalty accepted or declined?`,
                        [
                          {
                            text: 'Declined',
                            onPress: () => {
                              // Log declined penalty
                              const play: Play = {
                                category: 'penalty-declined',
                                player: selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Unknown',
                                startYard: currentYard,
                                endYard: currentYard,
                                yards: '0',
                                timestamp: new Date().toLocaleTimeString(),
                                penaltyName: `${selectedPenalty.name} (DECLINED)`,
                              };
                              setRecentPlays([play, ...recentPlays]);

                              // No change to field position or down & distance
                              Alert.alert(
                                'Penalty Declined',
                                'The penalty was declined. Result of the play stands.',
                                [{ text: 'OK' }]
                              );

                              setSelectedCategory(null);
                              setSelectedSubcategory(null);
                              setSelectedPenalty(null);
                              setSelectedPlayer(null);
                              setSearchQuery('');
                            }
                          },
                          {
                            text: 'Accepted',
                            onPress: () => {
                              // Handle dead ball personal foul tracking with proper ejection
                              if (selectedPenalty.deadBall) {
                                const team = possession === 'offense' ? 'home' : 'away';
                                const currentCount = deadBallPersonalFouls[team];
                                const newCount = currentCount + 1;

                                setDeadBallPersonalFouls({
                                  ...deadBallPersonalFouls,
                                  [team]: newCount
                                });

                                if (newCount >= 2) {
                                  // EJECTION
                                  Alert.alert(
                                    '🚨 PLAYER EJECTION',
                                    `${selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Player'} from ${team === 'home' ? homeTeam.name : awayTeam.name} has received their 2nd dead ball personal foul and is EJECTED from the game.\n\nNote: The ejected player cannot return for the remainder of the game.`,
                                    [
                                      {
                                        text: 'Acknowledge Ejection',
                                        onPress: () => {
                                          // Reset counter for this team
                                          setDeadBallPersonalFouls({
                                            ...deadBallPersonalFouls,
                                            [team]: 0
                                          });
                                        }
                                      }
                                    ]
                                  );
                                } else {
                                  // First dead ball foul - warning
                                  Alert.alert(
                                    '⚠️ DEAD BALL PERSONAL FOUL',
                                    `${selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Player'} from ${team === 'home' ? homeTeam.name : awayTeam.name} has received a dead ball personal foul.\n\n⚠️ WARNING: One more dead ball personal foul will result in ejection.`,
                                    [{ text: 'OK' }]
                                  );
                                }
                              }

                              // Apply penalty yardage
                              const penaltyYards = selectedPenalty.yards;
                              let newYard;

                              const isDefensivePenalty = selectedPenalty.autoFirstDown;

                              if (isDefensivePenalty) {
                                if (fieldDirection === 'right') {
                                  newYard = currentYard + penaltyYards;
                                } else {
                                  newYard = currentYard - penaltyYards;
                                }
                              } else {
                                if (fieldDirection === 'right') {
                                  newYard = currentYard - penaltyYards;
                                } else {
                                  newYard = currentYard + penaltyYards;
                                }
                              }

                              // Apply half-the-distance rule when penalty would cross goal line
                              if (isDefensivePenalty) {
                                // Defensive penalty: check if advancing into opponent's end zone
                                if (fieldDirection === 'right' && newYard > 99) {
                                  // Calculate half the distance to the goal line
                                  const distanceToGoal = 100 - currentYard; // At yard 90, 100-90=10 to goal
                                  const halfDistance = Math.floor(distanceToGoal / 2);
                                  newYard = currentYard + halfDistance;
                                  Alert.alert('Penalty Capped', `Half the distance to the goal (${halfDistance} yards).`);
                                } else if (fieldDirection === 'left' && newYard < 1) {
                                  // Calculate half the distance to the goal line
                                  const distanceToGoal = currentYard; // OPP 10 = 10 yards to goal
                                  const halfDistance = Math.floor(distanceToGoal / 2);
                                  newYard = currentYard - halfDistance;
                                  Alert.alert('Penalty Capped', `Half the distance to the goal (${halfDistance} yards).`);
                                }
                              } else {
                                // Offensive penalty: check if backing into own end zone
                                if (fieldDirection === 'right' && newYard < 1) {
                                  // Calculate half the distance to own goal line
                                  const distanceToOwnGoal = currentYard; // OWN 10 = 10 yards to goal
                                  const halfDistance = Math.floor(distanceToOwnGoal / 2);
                                  newYard = currentYard - halfDistance;
                                  Alert.alert('Penalty Capped', `Half the distance to the goal (${halfDistance} yards).`);
                                } else if (fieldDirection === 'left' && newYard > 99) {
                                  // Calculate half the distance to own goal line
                                  const distanceToOwnGoal = 100 - currentYard; // At yard 90, 100-90=10 to goal
                                  const halfDistance = Math.floor(distanceToOwnGoal / 2);
                                  newYard = currentYard + halfDistance;
                                  Alert.alert('Penalty Capped', `Half the distance to the goal (${halfDistance} yards).`);
                                }
                              }

                              // Additional safety check
                              newYard = Math.max(1, Math.min(99, newYard));

                              // Log accepted penalty
                              const play: Play = {
                                category: 'penalty',
                                player: selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Unknown',
                                startYard: currentYard,
                                endYard: newYard,
                                yards: isDefensivePenalty ? `+${penaltyYards}` : `-${penaltyYards}`,
                                timestamp: new Date().toLocaleTimeString(),
                                penaltyName: `${selectedPenalty.name} (ACCEPTED)`,
                              };
                              setRecentPlays([play, ...recentPlays]);

                              setCurrentYard(newYard);
                              setEndYard(newYard);

                              // Handle down/distance
                              if (isDefensivePenalty) {
                                setDown(1);
                                setDistance(10);
                              } else if (selectedPenalty.lossOfDown) {
                                const newDown = down + 1;
                                if (newDown > 4) {
                                  setPossession(possession === 'offense' ? 'defense' : 'offense');
                                  setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                                  setDown(1);
                                  setDistance(10);
                                } else {
                                  setDown(newDown);
                                }
                              } else {
                                // FIX BUG #3: Use calculateDistance helper for consistent goal-to-go logic
                                const newDistance = distance + penaltyYards;
                                setDistance(calculateDistance(newYard, fieldDirection, newDistance));
                              }

                              setSelectedCategory(null);
                              setSelectedSubcategory(null);
                              setSelectedPenalty(null);
                              setSelectedPlayer(null);
                              setSearchQuery('');
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.submitButtonText}>CONFIRM PENALTY</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : selectedCategory === 'punt' ? (
            /* Punt Flow */
            <View style={styles.twoColumnLayout}>
              {/* Player Selection on LEFT (consistent with other plays) */}
              <View style={styles.columnHalf}>
                <Text style={styles.sectionTitle}>
                  {possession === 'offense' ? 'SELECT PUNTER' : 'SELECT RETURNER'}
                </Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search player..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView style={styles.rosterList} showsVerticalScrollIndicator={false}>
                  {Object.entries(groupedRoster)
                    .filter(([position]) => {
                      // If offense is punting, show K/P
                      if (possession === 'offense') {
                        return position === 'K' || position === 'P';
                      }
                      // If defense is returning, show WR/RB/DB
                      return position === 'WR' || position === 'RB' || position === 'DB';
                    })
                    .map(([position, players]) => (
                      <View key={position}>
                        <Text style={styles.positionLabel}>{position}</Text>
                        {players
                          .filter(p => 
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.number.includes(searchQuery)
                          )
                          .map(player => (
                            <Pressable
                              key={`${player.number}-${player.name}`}
                              style={[
                                styles.playerItem,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                styles.playerItemSelected
                              ]}
                              onPress={() => setSelectedPlayer(player)}
                            >
                              <View style={styles.playerNumber}>
                                <Text style={[
                                  styles.playerNumberText,
                                  selectedPlayer?.number === player.number &&
                                  selectedPlayer?.name === player.name &&
                                  { color: homeTeamColor }
                                ]}>#{player.number}</Text>
                              </View>
                              <Text style={[
                                styles.playerName,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                { color: homeTeamColor }
                              ]}>{player.name}</Text>
                            </Pressable>
                          ))}
                      </View>
                    ))}
                </ScrollView>
              </View>
              
              {/* Field and Submit on RIGHT (consistent with other plays) */}
              <View style={styles.columnHalf}>
                <View style={styles.columnHeader}>
                  <Pressable 
                    style={styles.backToCategories}
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
                  </Pressable>
                  <Text style={styles.sectionTitle}>PUNT RETURN</Text>
                </View>
                
                {/* Yard Line Selector */}
                <View style={styles.yardLineContainer}>
                  <View style={styles.yardLineLabels}>
                    <View style={styles.yardLineGroup}>
                      <Text style={styles.yardLineLabel}>START</Text>
                      <Text style={styles.yardLineValue}>
                        {currentYard < 50 ? '◄' : currentYard > 50 ? '►' : ''} {formatYardLine(currentYard)}
                      </Text>
                    </View>
                    <View style={styles.yardLineGroup}>
                      <Text style={styles.yardLineLabel}>END</Text>
                      <Text style={styles.yardLineValue}>
                        {endYard < 50 ? '◄' : endYard > 50 ? '►' : ''} {formatYardLine(endYard)}
                      </Text>
                    </View>
                    <View style={styles.yardLineGroup}>
                      <Text style={styles.yardLineLabel}>YARDS</Text>
                      <Text style={styles.yardLineValue}>
                        {Math.abs(endYard - currentYard)}
                      </Text>
                    </View>
                  </View>

                  {/* Visual Football Field */}
                  <View style={styles.footballField}>
                    <Text style={styles.fieldTitle}>
                      DRAG TO SET RETURN YARD LINE
                    </Text>
                    
                    {/* Field visualization */}
                    <View style={styles.fieldVisualization}>
                      {/* Yard line markers */}
                      <View style={styles.yardLineMarkers}>
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((yard, i) => (
                          <View key={yard} style={styles.yardMarker}>
                            <View style={styles.yardTickMark} />
                            <Text style={styles.yardNumberLabel}>
                              {getArrowDirection(i)} {getYardDisplay(i)}
                            </Text>
                          </View>
                        ))}
                      </View>
                      
                      {/* Progress bar showing play */}
                      <View style={styles.playProgressBar}>
                        <View 
                          style={[
                            styles.playProgress,
                            {
                              left: `${Math.min(currentYard, endYard)}%`,
                              width: `${Math.abs(endYard - currentYard)}%`,
                              backgroundColor: '#0066cc',
                            }
                          ]}
                        />
                        
                        {/* Start position marker */}
                        <View style={[styles.positionMarker, styles.startMarker, { left: `${currentYard}%` }]}>
                          <View style={styles.markerDot} />
                          <Text style={styles.markerLabel}>START</Text>
                        </View>
                        
                        {/* End position marker */}
                        <View style={[styles.positionMarker, styles.endMarker, { left: `${endYard}%` }]}>
                          <View style={[styles.markerDot, styles.endMarkerDot]} />
                          <Text style={styles.markerLabel}>END</Text>
                        </View>
                      </View>
                    </View>

                    <Slider
                      style={styles.fieldSlider}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={endYard}
                      onValueChange={setEndYard}
                      minimumTrackTintColor="#0066cc"
                      maximumTrackTintColor="#3a3a3a"
                      thumbTintColor="#fff"
                    />
                  </View>
                </View>
                
                {/* Submit button */}
                <Pressable
                  style={[styles.submitButton, !selectedPlayer && styles.submitButtonDisabled]}
                  onPress={() => {
                    if (!selectedPlayer) return;
                    
                    // Check if they dragged to end zone (0 or 100)
                    const inEndZone = endYard === 0 || endYard === 100;
                    
                    if (inEndZone) {
                      Alert.alert(
                        'TOUCHDOWN SCORED?',
                        `You marked the return to the ${endYard === 0 ? 'LEFT' : 'RIGHT'} end zone. Did the defense score a touchdown?`,
                        [
                          {
                            text: 'Cancel',
                            style: 'cancel'
                          },
                          {
                            text: 'Yes, Touchdown',
                            onPress: () => {
                              // Punt return touchdown
                              const scoringTeam = possession === 'defense' ? 'home' : 'away';
                              
                              if (scoringTeam === 'home') {
                                setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
                              } else {
                                setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
                              }
                              
                              const play: Play = {
                                category: 'punt-return-td',
                                player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
                                startYard: currentYard,
                                endYard: endYard,
                                yards: '0',
                                timestamp: new Date().toLocaleTimeString(),
                              };
                              
                              setRecentPlays([play, ...recentPlays]);
                              
                              setPossession(scoringTeam === 'home' ? 'offense' : 'defense');
                              setCurrentYard(3);
                              setEndYard(3);
                              setDown(1);
                              setDistance(10);
                              
                              setSelectedCategory(null);
                              setSelectedPlayer(null);
                              setSearchQuery('');
                            }
                          }
                        ]
                      );
                    } else {
                      // Normal punt return
                      handleSubmitPlay();
                    }
                  }}
                  disabled={!selectedPlayer}
                >
                  <Text style={styles.submitButtonText}>SUBMIT PLAY</Text>
                </Pressable>
              </View>
            </View>
          ) : (selectedCategory === 'pass' || selectedCategory === 'incomplete') ? (
            /* 3 Column Layout for Passes: Passer | Receiver | Yardage */
            <View style={styles.threeColumnLayout}>
              {/* Passer Column */}
              <View style={styles.columnThird}>
                <View style={styles.columnHeader}>
                  <Pressable
                    style={styles.backToCategories}
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSelectedPlayer2(null);
                      setSearchQuery('');
                      setPasserSearch('');
                      setReceiverSearch('');
                      setAddFumble(false);
                      setFumbleRecoveredBy(null);
                      setFumbleTurnoverYardLine(null);
                      setShowFumbleModal(false);
                    }}
                  >
                    <Text style={styles.backToCategoriesText}>← Back</Text>
                  </Pressable>
                </View>
                <Text style={styles.sectionTitle}>Passer</Text>
                <TextInput
                  style={styles.searchInput}
                  value={passerSearch}
                  onChangeText={setPasserSearch}
                  placeholder="Search..."
                  placeholderTextColor="#666"
                />
                <ScrollView style={styles.rosterList}>
                  {sortedPasserPositions.map((position) => (
                    <View key={position}>
                      <Text style={styles.positionLabel}>{position}</Text>
                      {groupedRoster[position]
                        .filter(p =>
                          passerSearch === '' ||
                          p.name.toLowerCase().includes(passerSearch.toLowerCase()) ||
                          p.number.includes(passerSearch)
                        )
                        .map((player) => (
                        <Pressable
                          key={player.number}
                          style={[styles.playerItem, selectedPlayer?.number === player.number && styles.playerItemSelected]}
                          onPress={() => setSelectedPlayer(player)}
                        >
                          <View style={styles.playerNumber}>
                            <Text style={styles.playerNumberText}>{player.number}</Text>
                          </View>
                          <Text style={[
                            styles.playerName,
                            selectedPlayer?.number === player.number &&
                            { color: homeTeamColor }
                          ]}>{player.name}</Text>
                          {player.isStarter && (
                            <View style={styles.starterBadge}>
                              <Text style={styles.starterText}>S</Text>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Receiver Column */}
              <View style={styles.columnThird}>
                <Text style={[styles.sectionTitle, { marginTop: 36 }]}>Receiver</Text>
                <TextInput
                  style={styles.searchInput}
                  value={receiverSearch}
                  onChangeText={setReceiverSearch}
                  placeholder="Search..."
                  placeholderTextColor="#666"
                />
                <ScrollView style={styles.rosterList}>
                  {sortedReceiverPositions.map((position) => (
                    <View key={`receiver-${position}`}>
                      <Text style={styles.positionLabel}>{position}</Text>
                      {groupedRoster[position]
                        .filter(p =>
                          receiverSearch === '' ||
                          p.name.toLowerCase().includes(receiverSearch.toLowerCase()) ||
                          p.number.includes(receiverSearch)
                        )
                        .map((player) => (
                        <Pressable
                          key={`receiver-${player.number}`}
                          style={[styles.playerItem, selectedPlayer2?.number === player.number && styles.playerItemSelected]}
                          onPress={() => setSelectedPlayer2(player)}
                        >
                          <View style={styles.playerNumber}>
                            <Text style={styles.playerNumberText}>{player.number}</Text>
                          </View>
                          <Text style={[
                            styles.playerName,
                            selectedPlayer2?.number === player.number &&
                            { color: homeTeamColor }
                          ]}>{player.name}</Text>
                          {player.isStarter && (
                            <View style={styles.starterBadge}>
                              <Text style={styles.starterText}>S</Text>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Yardage Column */}
              <View style={styles.columnThird}>
                {selectedCategory === 'incomplete' ? (
                  // Incomplete pass doesn't need yardage
                  selectedPlayer && selectedPlayer2 ? (
                    <View style={styles.submitButtonContainer}>
                      <Pressable
                        style={[styles.submitButton]}
                        onPress={handleSubmitPlay}
                      >
                        <Text style={styles.submitButtonText}>SUBMIT</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.noSelectionPlaceholder}>
                      <Text style={styles.placeholderText}>
                        {!selectedPlayer ? 'Select passer first' : 'Select receiver'}
                      </Text>
                    </View>
                  )
                ) : (
                  // Complete pass needs yardage
                  selectedPlayer && selectedPlayer2 ? (
                    renderYardLineSelector()
                  ) : (
                    <View style={styles.noSelectionPlaceholder}>
                      <Text style={styles.placeholderText}>
                        {!selectedPlayer ? 'Select passer first' : 'Select receiver'}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          ) : selectedCategory === 'run' ? (
            /* 2 Column Layout for Runs: Player | Yardage */
            <View style={styles.twoColumnLayout}>
              <View style={styles.columnHalf}>
                <View style={styles.columnHeader}>
                  <Pressable 
                    style={styles.backToCategories}
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSelectedPlayer2(null);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
                  </Pressable>
                </View>
                
                <Text style={styles.sectionTitle}>
                  Select {selectedCategory === 'run' ? 'Rusher' : 'Player'}
                </Text>
                
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search name, #, or position"
                  placeholderTextColor="#666"
                />

                <ScrollView style={styles.rosterList}>
                  {getPositionOrder().map((position) => {
                    if (!groupedRoster[position]) return null;
                    return (
                      <View key={position}>
                        <Text style={styles.positionLabel}>{position}</Text>
                        {groupedRoster[position].map((player) => (
                          <Pressable
                            key={player.number}
                            style={[styles.playerItem, selectedPlayer?.number === player.number && styles.playerItemSelected]}
                            onPress={() => setSelectedPlayer(player)}
                          >
                            <View style={styles.playerNumber}>
                              <Text style={styles.playerNumberText}>{player.number}</Text>
                            </View>
                            <Text style={[
                              styles.playerName,
                              selectedPlayer?.number === player.number &&
                              { color: homeTeamColor }
                            ]}>{player.name}</Text>
                            {player.isStarter && (
                              <View style={styles.starterBadge}>
                                <Text style={styles.starterText}>Starter</Text>
                              </View>
                            )}
                          </Pressable>
                        ))}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.columnHalf}>
                {selectedPlayer ? (
                  renderYardLineSelector()
                ) : (
                  <View style={styles.noSelectionPlaceholder}>
                    <Text style={styles.placeholderText}>Select a player to continue</Text>
                  </View>
                )}
              </View>
            </View>
          ) : selectedCategory === 'sack' ? (
            /* Sack - Offensive QB who got sacked */
            <View style={styles.twoColumnLayout}>
              <View style={styles.columnHalf}>
                <View style={styles.columnHeader}>
                  <Pressable
                    style={styles.backToCategories}
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
                  </Pressable>
                </View>
                <Text style={styles.sectionTitle}>SELECT QUARTERBACK (SACKED)</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search player..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView style={styles.rosterList} showsVerticalScrollIndicator={false}>
                  {getPositionOrder().map((position) => {
                    const players = groupedRoster[position];
                    if (!players) return null;
                    return (
                      <View key={position}>
                        <Text style={styles.positionLabel}>{position}</Text>
                        {players
                          .filter(p =>
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.number.includes(searchQuery)
                          )
                          .map(player => (
                            <Pressable
                              key={`${player.number}-${player.name}`}
                              style={[
                                styles.playerItem,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                styles.playerItemSelected
                              ]}
                              onPress={() => setSelectedPlayer(player)}
                            >
                              <View style={styles.playerNumber}>
                                <Text style={[
                                  styles.playerNumberText,
                                  selectedPlayer?.number === player.number &&
                                  selectedPlayer?.name === player.name &&
                                  { color: homeTeamColor }
                                ]}>#{player.number}</Text>
                              </View>
                              <Text style={[
                                styles.playerName,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                { color: homeTeamColor }
                              ]}>{player.name}</Text>
                            </Pressable>
                          ))}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.columnHalf}>
                {selectedPlayer ? (
                  renderYardLineSelector()
                ) : (
                  <View style={styles.noSelectionPlaceholder}>
                    <Text style={styles.placeholderText}>Select QB who was sacked</Text>
                  </View>
                )}
              </View>
            </View>
          ) : selectedCategory === 'tackle' ? (
            /* Tackle - Defense plays */
            <View style={styles.twoColumnLayout}>
              <View style={styles.columnHalf}>
                <View style={styles.columnHeader}>
                  <Pressable
                    style={styles.backToCategories}
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
                  </Pressable>
                </View>
                <Text style={styles.sectionTitle}>SELECT DEFENDER (TACKLE)</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search player..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView style={styles.rosterList} showsVerticalScrollIndicator={false}>
                  {getPositionOrder().map((position) => {
                    const players = groupedRoster[position];
                    if (!players) return null;
                    return (
                      <View key={position}>
                        <Text style={styles.positionLabel}>{position}</Text>
                        {players
                          .filter(p =>
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.number.includes(searchQuery)
                          )
                          .map(player => (
                            <Pressable
                              key={`${player.number}-${player.name}`}
                              style={[
                                styles.playerItem,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                styles.playerItemSelected
                              ]}
                              onPress={() => setSelectedPlayer(player)}
                            >
                              <View style={styles.playerNumber}>
                                <Text style={[
                                  styles.playerNumberText,
                                  selectedPlayer?.number === player.number &&
                                  selectedPlayer?.name === player.name &&
                                  { color: homeTeamColor }
                                ]}>#{player.number}</Text>
                              </View>
                              <Text style={[
                                styles.playerName,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                { color: homeTeamColor }
                              ]}>{player.name}</Text>
                            </Pressable>
                          ))}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.columnHalf}>
                {selectedPlayer ? (
                  renderYardLineSelector()
                ) : (
                  <View style={styles.noSelectionPlaceholder}>
                    <Text style={styles.placeholderText}>Select a defender to continue</Text>
                  </View>
                )}
              </View>
            </View>
          ) : selectedCategory === 'interception' ? (
            /* Interception - Return yards + TD option */
            <View style={styles.twoColumnLayout}>
              <View style={styles.columnHalf}>
                <View style={styles.columnHeader}>
                  <Pressable
                    style={styles.backToCategories}
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
                  </Pressable>
                </View>
                <Text style={styles.sectionTitle}>
                  {possession === 'offense'
                    ? 'WHO THREW THE INTERCEPTION?'
                    : 'WHO MADE THE INTERCEPTION?'}
                </Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search player..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView style={styles.rosterList} showsVerticalScrollIndicator={false}>
                  {getPositionOrder().map((position) => {
                    const players = groupedRoster[position];
                    if (!players) return null;
                    return (
                      <View key={position}>
                        <Text style={styles.positionLabel}>{position}</Text>
                        {players
                          .filter(p =>
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.number.includes(searchQuery)
                          )
                          .map(player => (
                            <Pressable
                              key={`${player.number}-${player.name}`}
                              style={[
                                styles.playerItem,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                styles.playerItemSelected
                              ]}
                              onPress={() => setSelectedPlayer(player)}
                            >
                              <View style={styles.playerNumber}>
                                <Text style={[
                                  styles.playerNumberText,
                                  selectedPlayer?.number === player.number &&
                                  selectedPlayer?.name === player.name &&
                                  { color: homeTeamColor }
                                ]}>#{player.number}</Text>
                              </View>
                              <Text style={[
                                styles.playerName,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                { color: homeTeamColor }
                              ]}>{player.name}</Text>
                            </Pressable>
                          ))}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.columnHalf}>
                <Text style={styles.sectionTitle}>WHERE IS THE BALL SPOTTED?</Text>

                {selectedPlayer ? (
                  <>
                    {renderInterceptionYardSelector()}
                  </>
                ) : (
                  <View style={styles.noSelectionPlaceholder}>
                    <Text style={styles.placeholderText}>
                      {possession === 'offense'
                        ? 'Select player who threw it'
                        : 'Select player who caught it'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : selectedCategory === 'fumble' ? (
            /* Fumble Recovery */
            <View style={styles.twoColumnLayout}>
              <View style={styles.columnHalf}>
                <View style={styles.columnHeader}>
                  <Pressable 
                    style={styles.backToCategories}
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
                  </Pressable>
                </View>
                <Text style={styles.sectionTitle}>SELECT DEFENDER (FUMBLE RECOVERY)</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search player..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView style={styles.rosterList} showsVerticalScrollIndicator={false}>
                  {getPositionOrder().map((position) => {
                    const players = groupedRoster[position];
                    if (!players) return null;
                    return (
                      <View key={position}>
                        <Text style={styles.positionLabel}>{position}</Text>
                        {players
                          .filter(p => 
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.number.includes(searchQuery)
                          )
                          .map(player => (
                            <Pressable
                              key={`${player.number}-${player.name}`}
                              style={[
                                styles.playerItem,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                styles.playerItemSelected
                              ]}
                              onPress={() => setSelectedPlayer(player)}
                            >
                              <View style={styles.playerNumber}>
                                <Text style={[
                                  styles.playerNumberText,
                                  selectedPlayer?.number === player.number &&
                                  selectedPlayer?.name === player.name &&
                                  { color: homeTeamColor }
                                ]}>#{player.number}</Text>
                              </View>
                              <Text style={[
                                styles.playerName,
                                selectedPlayer?.number === player.number &&
                                selectedPlayer?.name === player.name &&
                                { color: homeTeamColor }
                              ]}>{player.name}</Text>
                            </Pressable>
                          ))}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.columnHalf}>
                {selectedPlayer ? (
                  renderYardLineSelector()
                ) : (
                  <View style={styles.noSelectionPlaceholder}>
                    <Text style={styles.placeholderText}>Select a defender to continue</Text>
                  </View>
                )}
              </View>
            </View>
          ) : selectedCategory === 'fieldgoal' ? (
            /* Field Goal - Simple GOOD or MISSED */
            <View style={styles.fieldGoalContainer}>
              <View style={styles.columnHeader}>
                <Pressable 
                  style={styles.backToCategories}
                  onPress={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
                </Pressable>
              </View>
              
              <Text style={styles.sectionTitle}>FIELD GOAL ATTEMPT</Text>
              <Text style={styles.fieldGoalSubtext}>From {formatYardLine(currentYard)} yard line</Text>
              
              <View style={styles.fieldGoalButtons}>
                <Pressable
                  style={[styles.fieldGoalBtn, styles.fieldGoalMissed]}
                  onPress={() => {
                    // Missed FG - opponent gets ball at spot of kick or 20
                    const newYard = currentYard < 20 ? 20 : currentYard;
                    
                    const play: Play = {
                      category: 'fieldgoal-missed',
                      player: 'Team',
                      startYard: currentYard,
                      endYard: newYard,
                      yards: '0',
                      timestamp: new Date().toLocaleTimeString(),
                    };
                    
                    setRecentPlays([play, ...recentPlays]);
                    
                    // Switch possession
                    setPossession(possession === 'offense' ? 'defense' : 'offense');
                    setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                    setCurrentYard(newYard);
                    setEndYard(newYard);
                    setDown(1);
                    setDistance(10);
                    
                    setSelectedCategory(null);
                  }}
                >
                  <Text style={styles.fieldGoalBtnText}>❌ MISSED</Text>
                  <Text style={styles.fieldGoalBtnSubtext}>Opponent's ball</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.fieldGoalBtn, styles.fieldGoalGood]}
                  onPress={() => {
                    // Made FG - +3 points
                    const scoringTeam = possession === 'offense' ? 'home' : 'away';
                    
                    if (scoringTeam === 'home') {
                      setHomeTeam({ ...homeTeam, score: homeTeam.score + 3 });
                    } else {
                      setAwayTeam({ ...awayTeam, score: awayTeam.score + 3 });
                    }
                    
                    const play: Play = {
                      category: 'fieldgoal',
                      player: 'Team',
                      startYard: currentYard,
                      endYard: currentYard,
                      yards: '0',
                      timestamp: new Date().toLocaleTimeString(),
                    };
                    
                    setRecentPlays([play, ...recentPlays]);
                    
                    // Switch possession for kickoff from 35
                    setPossession(possession === 'offense' ? 'defense' : 'offense');
                    setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                    setCurrentYard(35);
                    setEndYard(35);
                    setDown(1);
                    setDistance(10);
                    
                    setSelectedCategory(null);
                  }}
                >
                  <Text style={styles.fieldGoalBtnText}>✓ GOOD (+3)</Text>
                  <Text style={styles.fieldGoalBtnSubtext}>Kickoff from 35</Text>
                </Pressable>
              </View>
            </View>
          ) : selectedCategory === 'safety' ? (
            /* Safety - Defense scores 2 points */
            <View style={styles.fieldGoalContainer}>
              <View style={styles.columnHeader}>
                <Pressable 
                  style={styles.backToCategories}
                  onPress={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
                </Pressable>
              </View>
              
              <Text style={styles.sectionTitle}>SAFETY</Text>
              <Text style={styles.fieldGoalSubtext}>Offense tackled in own end zone</Text>
              
              <View style={styles.fieldGoalButtons}>
                <Pressable
                  style={[styles.fieldGoalBtn, styles.safetyBtn]}
                  onPress={() => {
                    Alert.alert(
                      'CONFIRM SAFETY',
                      'Award 2 points to the defense?',
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel'
                        },
                        {
                          text: 'Confirm Safety',
                          onPress: () => {
                            // Safety - defense scores 2 points
                            const scoringTeam = possession === 'defense' ? 'home' : 'away';

                            if (scoringTeam === 'home') {
                              setHomeTeam({ ...homeTeam, score: homeTeam.score + 2 });
                            } else {
                              setAwayTeam({ ...awayTeam, score: awayTeam.score + 2 });
                            }

                            const play: Play = {
                              category: 'safety',
                              player: 'Team',
                              startYard: currentYard,
                              endYard: fieldDirection === 'right' ? 0 : 100,
                              yards: '0',
                              timestamp: new Date().toLocaleTimeString(),
                            };

                            setRecentPlays([play, ...recentPlays]);

                            // FIXED: After safety, team that was scored on gets ball at their 20
                            // If they were driving right (toward 100), they were defending left endzone
                            // So they get ball at 20 (their 20) driving right
                            // If they were driving left (toward 0), they were defending right endzone
                            // So they get ball at 80 (their 20 from the right) driving left
                            const freeKickYard = fieldDirection === 'right' ? 20 : 80;

                            // Show FREE KICK prompt
                            Alert.alert(
                              'SAFETY FREE KICK',
                              `${possession === 'offense' ? homeTeam.name : awayTeam.name} must now perform a free kick from their 20-yard line.\n\nSelect the type of kick:`,
                              [
                                {
                                  text: 'Punt',
                                  onPress: () => {
                                    handleSafetyFreeKick('punt', freeKickYard);
                                  }
                                },
                                {
                                  text: 'Kickoff Style',
                                  onPress: () => {
                                    handleSafetyFreeKick('kickoff', freeKickYard);
                                  }
                                }
                              ]
                            );
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.fieldGoalBtnText}>CONFIRM SAFETY (+2)</Text>
                  <Text style={styles.fieldGoalBtnSubtext}>Defense scores, gets free kick</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </>
      )}

      {/* MORE Plays Modal */}
      <MorePlaysModal
        visible={showMorePlaysModal}
        onClose={() => setShowMorePlaysModal(false)}
        onSelectPlay={handleMorePlaySelect}
      />
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  grayContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 12,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: { position: 'absolute', top: 36, left: 36, width: 44, height: 44, backgroundColor: '#2a2a2a', borderRadius: 8, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  backButtonText: { color: '#f3f3f7', fontSize: 32, fontFamily: 'NeueHaas-Bold', marginTop: -4 },
  exitButtonInBox: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  exitButtonText: {
    color: '#f3f3f7',
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  scoreboard: { backgroundColor: 'transparent', borderRadius: 12, padding: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: 12, overflow: 'hidden', width: '100%' },
  scoreboardMiddle: { flexDirection: 'row', backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center', flex: 1 },
  teamSection: { flex: 0.75, alignItems: 'center', gap: 6 },
  teamSectionAway: {
    backgroundColor: '#e8f2ff', // Light blue tint fallback
    borderRadius: 8,
    paddingVertical: 8,
  },
  teamLabel: { fontSize: 12, fontFamily: 'NeueHaas-Bold', color: 'rgba(243, 243, 247, 0.7)', letterSpacing: 1 },
  teamLabelAway: { color: '#006847' },
  teamName: { fontSize: 24, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7', letterSpacing: 1, textTransform: 'uppercase' },
  teamNameAway: { color: '#262626' },
  scoreSection: { minWidth: 70, alignItems: 'center', paddingHorizontal: 32, paddingVertical: 20, backgroundColor: 'transparent' },
  score: { fontSize: 64, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7', lineHeight: 64 },
  gameInfoContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  gameInfo: { alignItems: 'center', paddingVertical: 4 },
  quarter: { fontSize: 24, fontFamily: 'NeueHaas-Bold', color: '#b4d836', marginBottom: 2 },
  clock: { fontSize: 36, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7', marginBottom: 2 },
  downDistance: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#b4d836' },
  possessionIndicatorLeft: {
    position: 'absolute',
    left: 4,
    top: '50%',
    marginTop: -20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  possessionIndicatorRight: {
    position: 'absolute',
    right: 4,
    top: '50%',
    marginTop: -20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeoutsContainer: { 
    flexDirection: 'row', 
    gap: 6,
  },
  timeoutDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#f3f3f7' },
  timeoutDotAway: { backgroundColor: '#262626' },
  timeoutDotUsed: { backgroundColor: '#4a4a4a' },
  timeoutDotUsedAway: { backgroundColor: '#d0d0d0' },
  promptBar: {
    minHeight: 40,
    backgroundColor: '#0066cc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  possessionText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
  },
  emptyPromptBar: {
    height: 8,
  },
  downDistanceText: {
    fontSize: 17,
    fontFamily: 'NeueHaas-Medium',
    color: '#f3f3f7',
    textAlign: 'center',
  },
  promptText: { 
    fontSize: 18, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#f3f3f7',
    textAlign: 'center',
  },
  promptFilled: {
    color: '#f3f3f7',
    textDecorationLine: 'underline',
  },
  promptBlank: {
    color: 'rgba(255, 255, 255, 0.3)',
    textDecorationLine: 'underline',
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  categoryBtn: { flex: 1, minWidth: '31%', height: 90, backgroundColor: '#3a3a3a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 16 },
  submenuContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  submenuTitle: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#999',
    marginBottom: 24,
    letterSpacing: 1,
    textAlign: 'center',
  },
  submenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  submenuBtn: {
    width: '48%',
    height: 90,
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  submenuFullWidth: {
    width: '100%',
  },
  submenuBtnThird: {
    width: '31%',  // Fits 3 buttons with gaps in a single row
  },
  offenseBtn: {
    borderWidth: 3,
    borderColor: '#b4d836',  // Green border for offense
  },
  defenseBtn: { 
    borderWidth: 3, 
    borderColor: '#ff3636',  // Red border for defense
  },
  categoryBtnLight: { backgroundColor: '#f3f3f7' },
  categoryBtnText: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7', textAlign: 'center', letterSpacing: 0.5 },
  categoryBtnTextBlue: { fontSize: 32, fontFamily: 'NeueHaas-Bold', color: '#0066cc', letterSpacing: 1 },
  moreBtn: {
    position: 'relative',
  },
  moreBtnDots: {
    fontSize: 28,
    color: '#B4D836',
    marginTop: 4,
    fontFamily: 'NeueHaas-Bold',
  },
  utilityButtonRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 16,
  },
  utilityBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  utilityBtnText: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold', 
    color: '#f3f3f7',
    textAlign: 'center',
  },
  kickoffOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  touchdownExtraPointGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  extraPointBtn: {
    height: 80,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kickoffBtn: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0066cc',
    minHeight: 56,
  },
  kickoffBtnText: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    marginBottom: 4,
    textAlign: 'center',
  },
  kickoffBtnSubtext: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    color: '#999',
    textAlign: 'center',
  },
  possessionToggle: { 
    backgroundColor: '#3a3a3a', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#b4d836',
  },
  possessionToggleText: { 
    fontSize: 16, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#b4d836',
  },
  twoColumnLayout: { flexDirection: 'row', gap: 20, flex: 1, maxHeight: '100%' },
  threeColumnLayout: { flexDirection: 'row', gap: 12, flex: 1, maxHeight: '100%' },
  columnThird: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 16, padding: 16, maxHeight: '100%' },
  columnHalf: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 16, padding: 20, maxHeight: '100%' },
  columnHeader: { marginBottom: 8 },
  backToCategories: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f3f3f7',
    borderRadius: 8,
  },
  backToCategoriesText: { fontSize: 14, fontFamily: 'NeueHaas-Bold', color: '#0066cc' },
  sectionTitle: { fontSize: 22, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7', marginBottom: 16 },
  sectionSubtitle: { fontSize: 16, fontFamily: 'NeueHaas-Roman', color: '#999', marginBottom: 16 },
  searchInput: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, fontSize: 16, fontFamily: 'NeueHaas-Roman', color: '#f3f3f7', marginBottom: 16 },
  rosterList: { flex: 1 },
  positionLabel: { fontSize: 14, fontFamily: 'NeueHaas-Bold', color: '#999', marginTop: 12, marginBottom: 8 },
  playerItem: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerItemSelected: { backgroundColor: '#f3f3f7' },
  selectedCheckmark: { fontSize: 20, fontFamily: 'NeueHaas-Bold', color: '#0066cc', marginLeft: 'auto' },
  playerNumber: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0066cc', justifyContent: 'center', alignItems: 'center' },
  playerNumberText: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7' },
  playerName: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7', flex: 1 },
  starterBadge: { backgroundColor: '#0066cc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  starterText: { fontSize: 11, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7' },
  yardLineContainer: {
    flex: 1,
    justifyContent: 'space-between'
  },
  downDistanceBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downDistanceLabel: {
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    textAlign: 'center',
  },
  yardLineBoxes: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    width: '100%',
    gap: 6,
    marginBottom: 8,
  },
  yardLineBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: '33.33%',
    minHeight: 85,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yardLineBoxPositive: {
    backgroundColor: '#b4d836',
  },
  yardLineBoxNegative: {
    backgroundColor: '#ff3636',
  },
  yardLineLabel: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
    marginBottom: 6,
    letterSpacing: 1,
    textAlign: 'center',
  },
  yardLineLabelDark: {
    color: '#1a1a1a',
  },
  yardLineValue: {
    fontSize: 38,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    textAlign: 'center',
  },
  yardLineValueDark: {
    color: '#1a1a1a',
  },
  controlsContainer: {
    marginTop: 8,
  },
  footballField: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 14, marginBottom: 0 },
  fieldTitle: { fontSize: 11, fontFamily: 'NeueHaas-Bold', color: '#666', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  fieldVisualization: { position: 'relative', height: 76, marginBottom: 10 },
  playProgressBar: {
    position: 'relative',
    width: '100%',
    height: 56,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  playProgress: {
    position: 'absolute',
    height: '100%',
    borderRadius: 8,
    zIndex: 1,
  },
  yardLineMarkersOnBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  yardMarkerOnBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: '-50%' }],
  },
  yardTickMarkOnBar: {
    width: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  yardTickMark5OnBar: {
    height: 14,
  },
  yardTickMark10OnBar: {
    height: 32,
    width: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  yardNumberLabelOnBar: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    textAlign: 'center',
    marginTop: 4,
  },
  verticalLineMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    width: 20,
    transform: [{ translateX: '-50%' }],
    zIndex: 3,
  },
  startLineMarker: {},
  endLineMarker: {},
  startLine: {
    width: 4,
    height: '100%',
    backgroundColor: '#b4d836',
    borderRadius: 2,
    shadowColor: '#b4d836',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  endLine: {
    width: 4,
    height: '100%',
    backgroundColor: '#ff3636',
    borderRadius: 2,
    shadowColor: '#ff3636',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  lineMarkerLabel: {
    position: 'absolute',
    bottom: -22,
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    backgroundColor: '#1a1a1a',
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#3a3a3a',
  },
  startLabel: {
    color: '#b4d836',
    borderColor: '#b4d836',
  },
  endLabel: {
    color: '#ff3636',
    borderColor: '#ff3636',
  },
  adjustButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 6,
    gap: 4,
  },
  adjustButtonsGroup: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  adjustButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  adjustButtonText: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
  },
  sliderContainer: {
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  fieldSlider: {
    width: '100%',
    height: 60,
  },
  submitButton: { backgroundColor: '#f3f3f7', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 4, marginBottom: 0 },
  submitButtonContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  submitButtonPositive: { backgroundColor: '#b4d836' },
  submitButtonNegative: { backgroundColor: '#ff3636' },
  submitButtonText: { fontSize: 24, fontFamily: 'NeueHaas-Bold', color: '#000', letterSpacing: 1 },
  fumbleSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  addFumbleButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    padding: 10,
    alignItems: 'center',
  },
  addFumbleButtonText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#999',
  },
  fumbleSummary: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b4d836',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fumbleSummaryText: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    flex: 1,
  },
  fumbleEditBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fumbleEditBtnText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#999',
  },
  fumblePlayerSection: {
    marginTop: 12,
  },
  fumblePlayerList: {
    maxHeight: 240,
    marginTop: 8,
  },
  fieldSideToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  fieldSideBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldSideBtnActive: {
    backgroundColor: 'rgba(180, 216, 54, 0.15)',
    borderColor: '#B4D836',
    borderWidth: 3,
  },
  fieldSideBtnText: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
  },
  fieldSideBtnTextActive: {
    color: '#B4D836',
  },
  fumbleYardLineSection: {
    marginTop: 12,
    alignItems: 'center',
  },
  fumbleYardLineLabel: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  fumbleYardLineDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fumbleYardLineBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fumbleYardAdjust: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  fumbleYardAdjustText: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    textAlign: 'center',
  },
  fumbleYardLineValue: {
    fontSize: 36,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    textAlign: 'center',
  },
  noSelectionPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fieldGoalContainer: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldGoalSubtext: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 12,
  },
  fieldGoalButtons: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
    maxWidth: 600,
  },
  fieldGoalBtn: {
    flex: 1,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  fieldGoalMissed: {
    backgroundColor: '#3a3a3a',
  },
  fieldGoalGood: {
    backgroundColor: '#b4d836',
  },
  safetyBtn: {
    backgroundColor: '#ff3636',
  },
  fieldGoalBtnText: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    letterSpacing: 1,
    marginBottom: 8,
  },
  fieldGoalBtnSubtext: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  kickoffSliderContainer: {
    width: '100%',
    maxWidth: 500,
    marginVertical: 30,
    paddingHorizontal: 20,
  },
  kickoffYardText: {
    fontSize: 48,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    textAlign: 'center',
    marginBottom: 20,
  },
  kickoffSlider: {
    width: '100%',
    height: 40,
  },
  kickoffSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  kickoffSliderLabel: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
  },
  kickoffLayout: {
    flexDirection: 'row',
    gap: 20,
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  kickoffFullContainer: {
    width: '100%',
    maxWidth: 1400,
    alignItems: 'center',
    flex: 1,
  },
  kickoffColumn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
  },
  kickoffTouchbackBtn: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#b4d836',
  },
  kickoffTouchbackText: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  kickoffTouchbackSubtext: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
    marginTop: 4,
  },
  kickoffOrText: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  kickoffPlayerList: {
    flex: 1,
    marginTop: 10,
  },
  kickoffSliderSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  kickoffYardDisplay: {
    fontSize: 64,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    textAlign: 'center',
    marginBottom: 30,
  },
  kickoffReturnPlayerText: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
  },
  placeholderText: { fontSize: 16, fontFamily: 'NeueHaas-Roman', color: '#666' },
  // Recent Plays Section Styles
  recentPlaysSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    width: '100%',
  },
  playsListContainer: {
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  playCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 72,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
  },
  playDescription: {
    fontFamily: 'NeueHaas-Bold',
    fontSize: 20,
    color: '#F3F3F7',
    lineHeight: 24,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampText: {
    fontFamily: 'NeueHaas-Medium',
    fontSize: 17,
    color: '#F3F3F7',
    opacity: 0.6,
    lineHeight: 18,
  },
  editButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontFamily: 'NeueHaas-Medium',
    fontSize: 14,
    color: '#F3F3F7',
    letterSpacing: 0.5,
  },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  keyboardAvoidingView: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  modalContent: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 32, width: '80%', maxWidth: 400 },
  penaltyModalContent: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 24, width: '85%', maxWidth: 420, borderWidth: 1, borderColor: '#2C2C2E' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7', textAlign: 'center', flex: 1 },
  modalCloseBtn: {
    position: 'absolute',
    right: 0,
    top: -8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 16,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#999',
    fontFamily: 'NeueHaas-Bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  modalBackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalBackText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
  },
  modalMessage: { fontSize: 16, fontFamily: 'NeueHaas-Roman', color: '#999', marginBottom: 16, textAlign: 'center' },
  modalInput: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 8, 
    padding: 16, 
    fontSize: 24, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#f3f3f7', 
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: { flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 },
  modalButtonCancel: { width: '100%', backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#3a3a3a', padding: 12, borderRadius: 12, alignItems: 'center', minHeight: 48 },
  modalButtonConfirm: { width: '100%', backgroundColor: '#B4D836', padding: 14, borderRadius: 12, alignItems: 'center', minHeight: 52 },
  modalButtonDecline: { width: '100%', backgroundColor: '#FF3636', padding: 16, borderRadius: 12, alignItems: 'center', minHeight: 52 },
  modalButtonTextCancel: { fontSize: 15, fontFamily: 'NeueHaas-Bold', color: '#999', textAlign: 'center' },
  modalButtonTextConfirm: { fontSize: 16, fontFamily: 'NeueHaas-Bold', color: '#1a1a1a', textAlign: 'center' },
  modalButtonTextDecline: { fontSize: 16, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7' },
  pickerRow: { marginBottom: 24 },
  pickerLabel: { fontSize: 16, fontFamily: 'NeueHaas-Bold', color: '#999', marginBottom: 12 },
  pickerButtons: { flexDirection: 'row', gap: 8 },
  pickerBtn: { 
    flex: 1, 
    backgroundColor: '#3a3a3a', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pickerBtnSelected: { 
    backgroundColor: '#0066cc',
    borderColor: '#fff',
  },
  pickerBtnText: { fontSize: 14, fontFamily: 'NeueHaas-Bold', color: '#f3f3f7' },
  distancePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  arrowBtn: { 
    backgroundColor: '#3a3a3a', 
    width: 50, 
    height: 50, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  arrowBtnText: { fontSize: 24, color: '#f3f3f7' },
  distanceValue: { 
    fontSize: 36, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#f3f3f7', 
    minWidth: 60, 
    textAlign: 'center' 
  },
  teamButtons: { 
    gap: 12, 
    marginBottom: 24,
  },
  teamTimeoutBtn: { 
    backgroundColor: '#3a3a3a', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  teamTimeoutText: { 
    fontSize: 20, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#f3f3f7',
    marginBottom: 6,
  },
  timeoutsRemaining: { 
    fontSize: 14, 
    fontFamily: 'NeueHaas-Roman', 
    color: '#999',
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // HALFTIME REPORT - BROADCAST QUALITY
  // ═══════════════════════════════════════════════════════════════════════════
  htOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    zIndex: 3000,
    paddingHorizontal: 20,
    paddingTop: 50, // Safe area for status bar
    paddingBottom: 20,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER BAR - Balanced left/right for true center scoreboard
  // ═══════════════════════════════════════════════════════════════════════════
  htHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  htTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 200, // Fixed width
  },

  htHeaderAccent: {
    height: 3,
    width: 30,
    borderRadius: 1.5,
    backgroundColor: '#B4D836',
  },

  htTitle: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#B4D836',
    letterSpacing: 2,
  },

  htScoreboard: {
    flex: 1, // Takes all remaining space
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Centers the cards within
    gap: 12,
  },

  htEndBtn: {
    backgroundColor: '#B4D836',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: 200, // Match title section width
    alignItems: 'center',
  },

  htEndBtnText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#000',
    letterSpacing: 0.5,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOREBOARD - Home (dark) vs Away (light/white)
  // ═══════════════════════════════════════════════════════════════════════════

  // HOME TEAM - Dark card (like home jersey)
  htTeamCardHome: {
    backgroundColor: '#252525',
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    minWidth: 180,
  },

  htTeamColorEdge: {
    width: 4,
  },

  htTeamCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  htTeamInfo: {
    gap: 3,
  },

  htTeamName: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    letterSpacing: 0.5,
  },

  htTimeoutRow: {
    flexDirection: 'row',
    gap: 4,
  },

  htTimeoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  htTeamScore: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
  },

  // AWAY TEAM - Light/White card (like away jersey)
  htTeamCardAway: {
    backgroundColor: '#f5f5f5', // White/light background
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    minWidth: 180,
  },

  htTeamCardContentAway: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  htTeamNameAway: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    letterSpacing: 0.5,
  },

  htTeamScoreAway: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
  },

  htTimeoutDotAway: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // VS Badge
  htVsBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },

  htVsText: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STAT CARDS
  // ═══════════════════════════════════════════════════════════════════════════
  htRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    marginBottom: 12,
  },

  htCard: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 14,
    overflow: 'hidden',
  },

  htCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },

  htCardTitle: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 4,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OFFENSE CARD
  // ═══════════════════════════════════════════════════════════════════════════
  htOffenseMain: {
    alignItems: 'center',
    marginBottom: 14,
  },

  htBigNumber: {
    fontSize: 44,
    fontFamily: 'NeueHaas-Bold',
    lineHeight: 48,
  },

  htBigLabel: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
    letterSpacing: 1,
    marginTop: 2,
  },

  htOffenseBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    gap: 20,
  },

  htOffenseStat: {
    alignItems: 'center',
  },

  htOffenseIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 6,
  },

  htOffenseValue: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htOffenseLabel: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Medium',
    color: '#666',
    marginTop: 2,
  },

  htOffenseDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3a3a3a',
  },

  htOffenseFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
    gap: 24,
  },

  htMiniStat: {
    alignItems: 'center',
  },

  htMiniValue: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htMiniLabel: {
    fontSize: 8,
    fontFamily: 'NeueHaas-Bold',
    color: '#555',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  htMiniDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#333',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAY BREAKDOWN CARD
  // ═══════════════════════════════════════════════════════════════════════════
  htPlayBars: {
    marginBottom: 14,
    gap: 10,
  },

  htPlayBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  htPlayBarLabel: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#888',
    width: 40,
  },

  htPlayBarTrack: {
    flex: 1,
    height: 22,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },

  htPlayBarFill: {
    height: '100%',
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 40,
  },

  htPlayBarInnerText: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htPlayTotals: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },

  htPlayTotal: {
    alignItems: 'center',
    flex: 1,
  },

  htPlayTotalNum: {
    fontSize: 22,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htPlayTotalLabel: {
    fontSize: 8,
    fontFamily: 'NeueHaas-Bold',
    color: '#555',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  htPlayTotalDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#333',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFICIENCY CARD
  // ═══════════════════════════════════════════════════════════════════════════
  htEffRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    gap: 24,
  },

  htEffItem: {
    alignItems: 'center',
  },

  htEffCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 8,
  },

  htEffCircleValue: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htEffCirclePercent: {
    fontSize: 12,
  },

  htEffLabel: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Bold',
    color: '#888',
    letterSpacing: 0.5,
  },

  htEffSub: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Roman',
    color: '#555',
    marginTop: 2,
  },

  htEffDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#333',
  },

  htWarningRow: {
    flexDirection: 'row',
    gap: 10,
  },

  htWarningBox: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },

  htWarningBad: {
    backgroundColor: 'rgba(255,54,54,0.1)',
    borderColor: '#FF3636',
  },

  htWarningCaution: {
    backgroundColor: 'rgba(255,193,7,0.1)',
    borderColor: '#FFC107',
  },

  htWarningNum: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htWarningLabel: {
    fontSize: 8,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOP PERFORMERS CARD
  // ═══════════════════════════════════════════════════════════════════════════
  htPerformers: {
    flex: 1,
    gap: 2,
  },

  htPerformerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },

  htPerformerBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  htPerformerBadgeText: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htPerformerInfo: {
    flex: 1,
  },

  htPerformerName: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htPerformerStats: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Roman',
    color: '#888',
    marginTop: 2,
  },

  htPerformerYards: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORING PLAYS CARD
  // ═══════════════════════════════════════════════════════════════════════════
  htScoringList: {
    flex: 1,
    gap: 2,
  },

  htScoringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },

  htScoringBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },

  htScoringBadgeText: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htScoringInfo: {
    flex: 1,
  },

  htScoringPlayer: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htScoringDetail: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Roman',
    color: '#888',
    marginTop: 1,
  },

  htScoringQuarter: {
    alignItems: 'flex-end',
  },

  htScoringQuarterText: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
  },

  htScoringTime: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Roman',
    color: '#555',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME FLOW CARD
  // ═══════════════════════════════════════════════════════════════════════════
  htFlowQuarters: {
    gap: 12,
    marginBottom: 14,
  },

  htFlowQuarter: {
    gap: 6,
  },

  htFlowQuarterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  htFlowLabel: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#888',
  },

  htFlowYards: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
  },

  htFlowBarTrack: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },

  htFlowBarFill: {
    height: '100%',
    borderRadius: 5,
  },

  htFlowDivider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 12,
  },

  htFlowStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  htFlowStat: {
    alignItems: 'center',
    flex: 1,
  },

  htFlowStatValue: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  htFlowStatLabel: {
    fontSize: 8,
    fontFamily: 'NeueHaas-Bold',
    color: '#555',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  htFlowStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#333',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPTY STATES
  // ═══════════════════════════════════════════════════════════════════════════
  htEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  htEmptyIcon: {
    fontSize: 24,
    marginBottom: 4,
  },

  htEmptyText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
    color: '#666',
  },

  htEmptySub: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Roman',
    color: '#555',
  },
  gameInitBtnSubtext: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  gameInitTitle: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  gameInitSubtitle: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  gameInitBackBtn: {
    backgroundColor: '#3a3a3a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  gameInitBackText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
  },
  penaltyContainer: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    maxHeight: '100%',
  },
  penaltyScroll: {
    flex: 1,
  },
  penaltyCategorySection: {
    marginBottom: 24,
  },
  penaltyCategoryTitle: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  penaltyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  penaltyBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    width: '23%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  penaltyBtnPressed: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  penaltyBtnName: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 14,
  },
  penaltyBtnYards: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#ff3636',
    textAlign: 'center',
    marginBottom: 2,
  },
  penaltyBtnExtra: {
    fontSize: 8,
    fontFamily: 'NeueHaas-Bold',
    color: '#0066cc',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  penaltyBtnDeadBall: {
    fontSize: 8,
    fontFamily: 'NeueHaas-Bold',
    color: '#ff3636',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  penaltySelectedName: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    marginTop: 8,
  },
  penaltyConfirmCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  penaltyConfirmTitle: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    marginBottom: 12,
    textAlign: 'center',
  },
  penaltyConfirmYards: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
    color: '#ff3636',
    marginBottom: 20,
  },
  penaltyConfirmPlayer: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Roman',
    color: '#999',
    marginBottom: 32,
  },
  // Penalty Confirmation Modal specific styles
  penaltyConfirmBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  penaltyTeamBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  penaltyTeamBadgeText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  penaltyConfirmName: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    textAlign: 'center',
    marginBottom: 4,
  },
  penaltyConfirmDivider: {
    height: 1,
    backgroundColor: '#3a3a3a',
    width: '100%',
    marginVertical: 16,
  },
  penaltyConfirmBeforeAfter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  penaltyConfirmColumn: {
    alignItems: 'center',
    minWidth: 100,
  },
  penaltyConfirmLabel: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  penaltyConfirmValue: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
  },
  penaltyConfirmValueHighlight: {
    color: '#B4D836',
  },
  penaltyConfirmArrow: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
  },
  penaltyConfirmDescription: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  penaltySafetyAlert: {
    backgroundColor: '#FF3636',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  penaltySafetyText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  penaltyTurnoverAlert: {
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  penaltyTurnoverText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  specialTeamsOptions: {
    gap: 20,
    marginTop: 20,
  },
  specialTeamsBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
  },
  specialTeamsMake: {
    borderColor: '#b4d836',
  },
  specialTeamsMiss: {
    borderColor: '#ff3636',
  },
  specialTeamsBtnText: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    marginBottom: 8,
  },
  specialTeamsBtnSubtext: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Roman',
    color: '#999',
  },
  specialTeamsInfo: {
    flex: 1,
  },
  touchdownBtn: {
    backgroundColor: '#ff3636',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  touchdownBtnText: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    marginBottom: 4,
  },
  touchdownBtnSubtext: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#f3f3f7',
  },
  puntScrollContent: {
    flex: 1,
  },
  compactYardSelector: {
    flex: 1,
  },
  compactFieldContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
  },
  yardSlider: {
    width: '100%',
    height: 40,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  inputLabel: { fontSize: 14, fontFamily: 'NeueHaas-Bold', color: '#999', marginBottom: 8, marginTop: 12 },
  gameConfirmContainer: { 
    width: '100%',
    alignItems: 'center',
    marginVertical: 24,
  },
  teamConfirmCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  teamConfirmCardAway: {
    backgroundColor: '#e8f2ff', // Light blue tint fallback
    borderColor: '#e8f2ff',
  },
  teamConfirmLabel: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: 'rgba(243, 243, 247, 0.7)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  teamConfirmLabelAway: {
    color: '#006847',
  },
  teamConfirmName: {
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    letterSpacing: 1,
  },
  teamConfirmNameAway: {
    color: '#262626',
  },
  vsText: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    marginVertical: 8,
  },
  editTeamsButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  editTeamsText: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: '#0066cc',
    textAlign: 'center',
  },
  // Simple Kickoff Modal Styles - matching GameTime design
  kickoffModalContainer: {
    width: 400,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
  },
  kickoffHeaderRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  kickoffHeaderText: {
    fontFamily: 'NeueHaas-Bold',
    fontSize: 16,
    color: '#F3F3F7',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  kickoffTouchbackButton: {
    backgroundColor: '#B4D836',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginBottom: 24,
  },
  kickoffTouchbackTitle: {
    fontFamily: 'NeueHaas-Bold',
    fontSize: 24,
    color: '#000000',
    textTransform: 'uppercase',
  },
  kickoffTouchbackSubtitle: {
    fontFamily: 'NeueHaas-Medium',
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    marginTop: 4,
  },
  kickoffDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  kickoffDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1a1a1a',
  },
  kickoffDividerText: {
    fontFamily: 'NeueHaas-Roman',
    fontSize: 13,
    color: '#8E8E93',
    marginHorizontal: 12,
  },
  kickoffSearchContainer: {
    marginBottom: 16,
  },
  kickoffSearchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'NeueHaas-Roman',
    fontSize: 16,
    color: '#F3F3F7',
    height: 48,
  },
  kickoffPositionLabel: {
    fontFamily: 'NeueHaas-Bold',
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  kickoffPlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    height: 56,
  },
  kickoffJerseyNumber: {
    fontFamily: 'NeueHaas-Bold',
    fontSize: 16,
    color: '#0A84FF',
    width: 40,
  },
  kickoffPlayerName: {
    fontFamily: 'NeueHaas-Medium',
    fontSize: 16,
    color: '#F3F3F7',
    flex: 1,
  },
  // Keep old styles for slider view
  step4Header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  step4Subtitle: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  step4SelectedText: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    textAlign: 'center',
    marginBottom: 24,
  },
  step4YardLabel: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  step4YardDisplay: {
    fontSize: 48,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    textAlign: 'center',
    marginBottom: 16,
  },
  step4Slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  step4SliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  step4SliderLabel: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
  },
  step4ChangePlayerBtn: {
    width: '100%',
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
    minHeight: 44,
  },
  step4ChangePlayerText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#0066cc',
    textAlign: 'center',
  },
  // ===== PENALTY STYLES =====
  penaltyYardsText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  penaltyTeamLabel: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  penaltyCategoryIcon: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  penaltyListContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  penaltyDetailBtn: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  // ===== NEW PENALTY TWO-STEP FLOW STYLES =====
  // Step 1: Team Selection Modal
  penaltyTeamSelectionModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '85%',
  },
  penaltyModalTitle: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  penaltyTeamButtons: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  penaltyTeamBtn: {
    width: 170,
    height: 80,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  penaltyTeamBtnText: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  penaltyTeamBtnSubtext: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  penaltyTeamCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  penaltyTeamCancelText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#666666',
  },
  // Step 2: Penalty Selection Screen
  penaltySelectionContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '85%',
    maxWidth: '90%',
    width: '90%',
  },
  penaltySelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  penaltyBackBtn: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  penaltyBackText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  penaltySelectionTitle: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  // Quick Select Card
  quickSelectCard: {
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  quickSelectHeader: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#B4D836',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  // Section Headers
  penaltySectionHeader: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#888888',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
    letterSpacing: 1,
  },
  penaltySectionDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  penaltyButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  penaltyNewBtn: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    padding: 14,
    minWidth: '31%',
    flexGrow: 1,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  penaltyQuickSelectBtn: {
    minHeight: 70,
    borderLeftWidth: 3,
    borderLeftColor: '#B4D836',
  },
  penaltyNewBtnName: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#F3F3F7',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 16,
  },
  penaltyNewBtnYards: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Bold',
    color: '#B4D836',
    textAlign: 'center',
    marginBottom: 4,
  },
  penaltyNewBtnTagGreen: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#B4D836',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  penaltyNewBtnTagYellow: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  penaltyNewBtnTagRed: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#FF3636',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Step 3: Player Selection Screen
  penaltySummaryBox: {
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  penaltySummaryLeft: {
    flex: 1,
  },
  penaltySummaryName: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#F3F3F7',
  },
  penaltySummaryTag: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#B4D836',
    marginTop: 4,
  },
  penaltySummaryYards: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#B4D836',
  },
  playerSelectLabel: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  playerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  playerSearchIcon: {
    fontSize: 18,
    color: '#666666',
    marginRight: 12,
  },
  playerSearchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#F3F3F7',
  },
  playerQuickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  playerQuickActionBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerQuickActionSymbol: {
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
    color: '#F3F3F7',
  },
  playerQuickActionLabel: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#888888',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  playerRosterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },
  playerRosterBtn: {
    width: '18.5%',
    flexGrow: 1,
    maxWidth: '19.2%',
    minWidth: 60,
    height: 70,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerRosterBtnPressed: {
    backgroundColor: '#333333',
  },
  playerRosterBtnHighlight: {
    backgroundColor: '#333333',
    borderWidth: 2,
    borderColor: '#B4D836',
  },
  playerRosterNumber: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#F3F3F7',
  },
  playerRosterPosition: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
    color: '#888888',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  playerNoMatch: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
  },
  playerNoMatchText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: '#888888',
    marginBottom: 16,
    textAlign: 'center',
  },
  playerUseAnywayBtn: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  playerUseAnywayText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#F3F3F7',
  },
  playerNoRosterText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: '#888888',
    textAlign: 'center',
    paddingVertical: 40,
  },
  // Scoring Modal Styles
  scoringOptionsContainer: {
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  scoringOptionBtn: {
    width: '100%',
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  scoringOptionText: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  scoringOptionSubtext: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Punt Return Selector Styles
  yardLineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  yardLineGroup: {
    alignItems: 'center',
    flex: 1,
  },
  yardLineMarkers: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    zIndex: 2,
  },
  yardMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  yardTickMark: {
    width: 1.5,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  yardNumberLabel: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Medium',
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  positionMarker: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    zIndex: 3,
  },
  startMarker: {
    // Additional styles for start marker if needed
  },
  endMarker: {
    // Additional styles for end marker if needed
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#b4d836',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerLabel: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#f3f3f7',
    marginTop: 4,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  endMarkerDot: {
    backgroundColor: '#ff3636',
  },
});