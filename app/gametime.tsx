import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

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
  category: string;
  player: string;
  player2?: string; // Receiver for passes
  startYard: number;
  endYard: number;
  yards: string;
  timestamp: string;
  penaltyName?: string; // For penalties
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
  
  const [homeTeam, setHomeTeam] = useState<Team>({ name: 'JOSHUA', score: 0, timeouts: 3 });
  const [awayTeam, setAwayTeam] = useState<Team>({ name: 'BURLESON', score: 0, timeouts: 3 });
  const [clock, setClock] = useState('12:00');
  const [quarter, setQuarter] = useState('Q1');
  
  // Team colors - replace with actual team colors
  const teamColor = '#0066cc'; // Blue for home team
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null); // For receiver
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const [currentYard, setCurrentYard] = useState(25);
  const [endYard, setEndYard] = useState(35);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentPlays, setRecentPlays] = useState<Play[]>([]);
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
  const [showGameInit, setShowGameInit] = useState(true);
  const [initStep, setInitStep] = useState(1); // 1: Coin flip, 2: Winner choice, 3: Field direction, 4: Kickoff return
  const [coinFlipWinner, setCoinFlipWinner] = useState<'home' | 'away' | null>(null);
  const [winnerChoice, setWinnerChoice] = useState<'receive' | 'defer' | null>(null);
  const [kickoffReturnYard, setKickoffReturnYard] = useState(25);
  const [deadBallPersonalFouls, setDeadBallPersonalFouls] = useState({ home: 0, away: 0 });
  const [clockInput, setClockInput] = useState('');
  
  // Down & Distance state
  const [down, setDown] = useState(1);
  const [distance, setDistance] = useState(10);
  
  // Field direction: 'left' = driving toward 0 yard line, 'right' = driving toward 100 yard line
  const [fieldDirection, setFieldDirection] = useState<'left' | 'right'>('right');

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

  // Fetch roster from backend
  useEffect(() => {
    const fetchRoster = async () => {
      try {
        // Your FastAPI backend on Dell server
        const BACKEND_URL = 'http://192.168.1.197:8000'; // Update port if different
        const TEAM_ID = 16; // Burleson team ID from your database
        
        const response = await fetch(`${BACKEND_URL}/api/v1/players?team_id=${TEAM_ID}&limit=100`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch roster: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Map backend data to expected Player format
        const players: Player[] = data.map((player: any) => ({
          number: player.jersey?.toString() || '0',
          name: `${player.first_name} ${player.last_name}`,
          position: player.position || 'N/A',
          isStarter: player.is_starter || false,
        }));
        
        setRoster(players);
        console.log(`Loaded ${players.length} players from backend`);
      } catch (error) {
        console.error('Failed to fetch roster:', error);
        // Fallback to mock data if API fails
        setRoster([
          { number: '26', name: 'Taji Matthews', position: 'RB', isStarter: true },
          { number: '21', name: 'Esteban Salas', position: 'RB', isStarter: false },
          { number: '27', name: 'Tyler Evans', position: 'RB', isStarter: false },
          { number: '10', name: 'Cash Criner', position: 'WR', isStarter: true },
          { number: '4', name: 'Alex Rubacalba', position: 'WR', isStarter: true },
          { number: '7', name: 'J. Miller', position: 'QB', isStarter: true },
          { number: '15', name: 'D. Johnson', position: 'WR', isStarter: false },
        ]);
      }
    };
    
    fetchRoster();
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
    
    if (currentIndex < quarters.length - 1) {
      const nextQuarter = quarters[currentIndex + 1];
      
      // Check if going into halftime
      if (quarter === 'Q2') {
        setShowHalftime(true);
      } else {
        setQuarter(nextQuarter);
        // Flip field direction at end of each quarter
        setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
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
    // Flip field direction
    setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
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
    
    // Go to kickoff return screen (step 4)
    setInitStep(4);
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
    // Example: 
    // fetch('https://api.statiq.com/games', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(gameData)
    // });
    
    return gameData;
  };

  const handleSubmitPlay = () => {
    // For punt, player is optional
    if (selectedCategory !== 'punt' && !selectedPlayer) return;
    // For passes, require receiver too
    if ((selectedCategory === 'pass' || selectedCategory === 'incomplete') && !selectedPlayer2) return;

    // Handle punt
    if (selectedCategory === 'punt') {
      const play: Play = {
        category: 'punt',
        player: selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Team',
        startYard: currentYard,
        endYard: endYard,
        yards: Math.abs(endYard - currentYard).toString(),
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setRecentPlays([play, ...recentPlays]);
      
      // Switch possession and flip field
      setPossession(possession === 'offense' ? 'defense' : 'offense');
      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
      setCurrentYard(endYard);
      setEndYard(endYard);
      setDown(1);
      setDistance(10);
      
      // Reset selections
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedPlayer(null);
      setSearchQuery('');
      return;
    }

    // Handle Interception with TD check
    if (selectedCategory === 'interception') {
      if (!selectedPlayer) return;
      
      const inEndZone = endYard === 0 || endYard === 100;
      
      if (inEndZone) {
        Alert.alert(
          'TOUCHDOWN SCORED?',
          `You marked the interception return to the ${endYard === 0 ? 'LEFT' : 'RIGHT'} end zone. Did the defense score a touchdown?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Yes, Touchdown',
              onPress: () => {
                // Interception return TD
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
        return;
      }
      
      // Regular interception - no TD
      const play: Play = {
        category: 'interception',
        player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
        startYard: currentYard,
        endYard: endYard,
        yards: Math.abs(endYard - currentYard).toString(),
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setRecentPlays([play, ...recentPlays]);
      
      // Switch possession and flip field
      setPossession(possession === 'offense' ? 'defense' : 'offense');
      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
      setCurrentYard(endYard);
      setEndYard(endYard);
      setDown(1);
      setDistance(10);
      
      setSelectedCategory(null);
      setSelectedPlayer(null);
      setSearchQuery('');
      return;
    }

    // Handle Fumble Recovery with TD check
    if (selectedCategory === 'fumble') {
      if (!selectedPlayer) return;
      
      const inEndZone = endYard === 0 || endYard === 100;
      
      if (inEndZone) {
        Alert.alert(
          'TOUCHDOWN SCORED?',
          `You marked the fumble return to the ${endYard === 0 ? 'LEFT' : 'RIGHT'} end zone. Did the defense score a touchdown?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Yes, Touchdown',
              onPress: () => {
                // Fumble return TD
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
        return;
      }
      
      // Regular fumble recovery - no TD
      const play: Play = {
        category: 'fumble',
        player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
        startYard: currentYard,
        endYard: endYard,
        yards: Math.abs(endYard - currentYard).toString(),
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setRecentPlays([play, ...recentPlays]);
      
      // Switch possession and flip field
      setPossession(possession === 'offense' ? 'defense' : 'offense');
      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
      setCurrentYard(endYard);
      setEndYard(endYard);
      setDown(1);
      setDistance(10);
      
      setSelectedCategory(null);
      setSelectedPlayer(null);
      setSearchQuery('');
      return;
    }

    // Calculate yards gained based on field direction
    let yardsGained;
    if (selectedCategory === 'incomplete') {
      yardsGained = 0;
    } else if (fieldDirection === 'right') {
      yardsGained = endYard - currentYard; // Normal: higher yard = gain
    } else {
      yardsGained = currentYard - endYard; // Inverted: lower yard = gain
    }
    
    const playType = selectedSubcategory || selectedCategory;
    
    // Require player for non-special-teams plays
    if (!selectedPlayer) return;
    
    // Check for offensive touchdown (reached end zone)
    const reachedEndZone = (fieldDirection === 'right' && endYard >= 100) || 
                          (fieldDirection === 'left' && endYard <= 0);
    
    if (reachedEndZone && (selectedCategory === 'run' || selectedCategory === 'pass')) {
      Alert.alert(
        'TOUCHDOWN!',
        `${selectedPlayer.name} scored! Choose extra point attempt:`,
        [
          {
            text: 'PAT (1pt)',
            onPress: () => {
              // Score touchdown
              const scoringTeam = possession === 'offense' ? 'home' : 'away';
              
              if (scoringTeam === 'home') {
                setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
              } else {
                setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
              }
              
              // Log TD play
              const play: Play = {
                category: `${selectedCategory}-td`,
                player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
                player2: selectedPlayer2 ? `#${selectedPlayer2.number} ${selectedPlayer2.name}` : undefined,
                startYard: currentYard,
                endYard: fieldDirection === 'right' ? 100 : 0,
                yards: yardsGained.toString(),
                timestamp: new Date().toLocaleTimeString(),
              };
              setRecentPlays([play, ...recentPlays]);
              
              // PAT attempt - simple success/fail
              Alert.alert(
                'EXTRA POINT',
                'Did the PAT go through the uprights?',
                [
                  {
                    text: 'No Good',
                    onPress: () => {
                      // Miss - no points, switch possession
                      setPossession(possession === 'offense' ? 'defense' : 'offense');
                      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                      setCurrentYard(35);
                      setEndYard(35);
                      setDown(1);
                      setDistance(10);
                      
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSelectedPlayer2(null);
                      setSearchQuery('');
                    }
                  },
                  {
                    text: 'Good (+1)',
                    onPress: () => {
                      // Made it - add 1 point
                      if (scoringTeam === 'home') {
                        setHomeTeam({ ...homeTeam, score: homeTeam.score + 1 });
                      } else {
                        setAwayTeam({ ...awayTeam, score: awayTeam.score + 1 });
                      }
                      
                      // Switch possession for kickoff
                      setPossession(possession === 'offense' ? 'defense' : 'offense');
                      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                      setCurrentYard(35);
                      setEndYard(35);
                      setDown(1);
                      setDistance(10);
                      
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSelectedPlayer2(null);
                      setSearchQuery('');
                    }
                  }
                ]
              );
            }
          },
          {
            text: '2-PT Conversion',
            onPress: () => {
              // Score touchdown
              const scoringTeam = possession === 'offense' ? 'home' : 'away';
              
              if (scoringTeam === 'home') {
                setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
              } else {
                setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
              }
              
              // Log TD play
              const play: Play = {
                category: `${selectedCategory}-td`,
                player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
                player2: selectedPlayer2 ? `#${selectedPlayer2.number} ${selectedPlayer2.name}` : undefined,
                startYard: currentYard,
                endYard: fieldDirection === 'right' ? 100 : 0,
                yards: yardsGained.toString(),
                timestamp: new Date().toLocaleTimeString(),
              };
              setRecentPlays([play, ...recentPlays]);
              
              // 2-PT attempt
              Alert.alert(
                '2-POINT CONVERSION',
                'Did they convert?',
                [
                  {
                    text: 'Failed',
                    onPress: () => {
                      // Failed - no points, switch possession
                      setPossession(possession === 'offense' ? 'defense' : 'offense');
                      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                      setCurrentYard(35);
                      setEndYard(35);
                      setDown(1);
                      setDistance(10);
                      
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSelectedPlayer2(null);
                      setSearchQuery('');
                    }
                  },
                  {
                    text: 'Success (+2)',
                    onPress: () => {
                      // Made it - add 2 points
                      if (scoringTeam === 'home') {
                        setHomeTeam({ ...homeTeam, score: homeTeam.score + 2 });
                      } else {
                        setAwayTeam({ ...awayTeam, score: awayTeam.score + 2 });
                      }
                      
                      // Switch possession for kickoff
                      setPossession(possession === 'offense' ? 'defense' : 'offense');
                      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                      setCurrentYard(35);
                      setEndYard(35);
                      setDown(1);
                      setDistance(10);
                      
                      setSelectedCategory(null);
                      setSelectedPlayer(null);
                      setSelectedPlayer2(null);
                      setSearchQuery('');
                    }
                  }
                ]
              );
            }
          }
        ]
      );
      return;
    }
    
    const play: Play = {
      category: selectedCategory!,
      player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
      player2: selectedPlayer2 ? `#${selectedPlayer2.number} ${selectedPlayer2.name}` : undefined,
      startYard: currentYard,
      endYard: selectedCategory === 'incomplete' ? currentYard : endYard,
      yards: yardsGained.toString(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setRecentPlays([play, ...recentPlays]);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedPlayer(null);
    setSelectedPlayer2(null);
    setSearchQuery('');
    
    // Don't update currentYard for incomplete passes
    if (selectedCategory !== 'incomplete') {
      setCurrentYard(endYard);
    }
    
    // Possession switching logic
    const switchPossession = () => {
      setPossession(possession === 'offense' ? 'defense' : 'offense');
      setDown(1);
      setDistance(10);
      // Flip field direction when possession changes
      setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
    };
    
    // Plays that switch possession
    const possessionChangePlays: string[] = [
      'punt', 'kickoff', 'interception', 'fumble', 'fumble_recovery',
      'muffed_punt', 'kickoff_fumble', 'onside_recovery',
      'fieldgoal', 'safety', 'blocked_punt', 'blocked_fg',
    ];
    
    if (possessionChangePlays.includes(playType as string) || 
        playType === 'fieldgoal' || // After field goal attempt, other team gets ball
        down === 4 && yardsGained < distance) { // Turnover on downs
      switchPossession();
    }
    // Scoring plays (touchdowns, field goals) - kickoff to opponent
    else if (playType === 'fieldgoal' && yardsGained >= 0) { // Made field goal
      switchPossession();
    }
    // Incomplete pass - down advances, no yardage change
    else if (selectedCategory === 'incomplete') {
      if (down < 4) {
        setDown(down + 1);
        // Distance stays the same
      } else {
        // Turnover on downs
        switchPossession();
      }
    }
    // Normal down & distance progression
    else {
      if (yardsGained >= distance) {
        // First down!
        setDown(1);
        setDistance(10);
      } else {
        // Next down
        if (down < 4) {
          setDown(down + 1);
          setDistance(distance - yardsGained);
        } else {
          // Turnover on downs
          switchPossession();
        }
      }
    }
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
    if (playType === 'sack' || playType === 'interception' || playType === 'fumble') {
      return roster.filter(p => defensivePositions.includes(p.position));
    }
    
    // Offensive plays - filter by possession
    if (possession === 'offense') {
      return roster.filter(p => offensivePositions.includes(p.position));
    } else {
      return roster.filter(p => defensivePositions.includes(p.position));
    }
  };

  const filteredRoster = getFilteredRoster().filter(player => {
    const query = searchQuery.toLowerCase();
    return (
      player.name.toLowerCase().includes(query) ||
      player.number.includes(query) ||
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
    
    if (playType === 'sack' || playType === 'interception' || playType === 'fumble') {
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
      actualYards = endYard - currentYard; // Normal: moving up in yards = gain
    } else {
      actualYards = currentYard - endYard; // Inverted: moving down in yards = gain
    }
    
    const isNegative = actualYards < 0;
    const isPositive = actualYards > 0;
    
    return (
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
            <Text style={[
              styles.yardLineValue,
              isPositive && styles.yardLinePositive,
              isNegative && styles.yardLineNegative,
            ]}>
              {actualYards > 0 ? '+' : ''}{actualYards}
            </Text>
          </View>
        </View>

        {/* Visual Football Field */}
        <View style={styles.footballField}>
          <Text style={styles.fieldTitle}>
            DRAG TO SET ENDING YARD LINE {drivingRight ? '(DRIVING →)' : '(DRIVING ←)'}
          </Text>
          
          {/* Field visualization with both markers */}
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
                    backgroundColor: isPositive ? '#b4d83640' : '#ff363640',
                  }
                ]} 
              />
              
              {/* Start marker */}
              <View style={[styles.positionMarker, styles.startMarker, { left: `${currentYard}%` }]}>
                <View style={styles.markerDot} />
                <Text style={styles.markerLabel}>START</Text>
              </View>
              
              {/* End marker */}
              <View style={[styles.positionMarker, styles.endMarker, { left: `${endYard}%` }]}>
                <View style={[styles.markerDot, styles.endMarkerDot]} />
                <Text style={styles.markerLabel}>END</Text>
              </View>
            </View>
          </View>

          {/* Slider */}
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.fieldSlider}
              minimumValue={1}
              maximumValue={99}
              step={1}
              value={endYard}
              onValueChange={setEndYard}
              minimumTrackTintColor={isPositive ? '#b4d836' : '#ff3636'}
              maximumTrackTintColor="#3a3a3a"
              thumbTintColor="#fff"
            />
          </View>
        </View>

        <Pressable 
          style={[
            styles.submitButton,
            isPositive && styles.submitButtonPositive,
            isNegative && styles.submitButtonNegative,
          ]} 
          onPress={handleSubmitPlay}
        >
          <Text style={styles.submitButtonText}>SUBMIT PLAY</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.screenBorder, { backgroundColor: teamColor }]}>
      <Pressable style={styles.backButton} onPress={() => setShowExitConfirm(true)}>
        <Text style={styles.backButtonText}>×</Text>
      </Pressable>

      {/* Game Initialization Flow */}
      {showGameInit && (
        <View style={styles.gameInitOverlay}>
          <View style={styles.gameInitContent}>
            {/* Step 1: Coin Flip Winner */}
            {initStep === 1 && (
              <>
                <Text style={styles.gameInitTitle}>COIN FLIP</Text>
                <Text style={styles.gameInitSubtitle}>Who won the coin flip?</Text>
                
                <View style={styles.gameInitButtons}>
                  <Pressable
                    style={styles.gameInitBtn}
                    onPress={() => handleCoinFlipWinner('home')}
                  >
                    <Text style={styles.gameInitBtnText}>{homeTeam.name}</Text>
                  </Pressable>
                  
                  <Pressable
                    style={styles.gameInitBtn}
                    onPress={() => handleCoinFlipWinner('away')}
                  >
                    <Text style={styles.gameInitBtnText}>{awayTeam.name}</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* Step 2: Winner's Choice */}
            {initStep === 2 && (
              <>
                <Text style={styles.gameInitTitle}>{coinFlipWinner === 'home' ? homeTeam.name : awayTeam.name} WON</Text>
                <Text style={styles.gameInitSubtitle}>What did they choose?</Text>
                
                <View style={styles.gameInitButtons}>
                  <Pressable
                    style={styles.gameInitBtn}
                    onPress={() => handleWinnerChoice('receive')}
                  >
                    <Text style={styles.gameInitBtnText}>RECEIVE</Text>
                    <Text style={styles.gameInitBtnSubtext}>Get the ball first</Text>
                  </Pressable>
                  
                  <Pressable
                    style={styles.gameInitBtn}
                    onPress={() => handleWinnerChoice('defer')}
                  >
                    <Text style={styles.gameInitBtnText}>DEFER</Text>
                    <Text style={styles.gameInitBtnSubtext}>Other team gets ball</Text>
                  </Pressable>
                </View>
                
                <Pressable
                  style={styles.gameInitBackBtn}
                  onPress={() => {
                    setInitStep(1);
                    setCoinFlipWinner(null);
                  }}
                >
                  <Text style={styles.gameInitBackText}>← Back</Text>
                </Pressable>
              </>
            )}

            {/* Step 3: Field Direction */}
            {initStep === 3 && (
              <>
                <Text style={styles.gameInitTitle}>FIELD DIRECTION</Text>
                <Text style={styles.gameInitSubtitle}>
                  {winnerChoice === 'receive' 
                    ? `${coinFlipWinner === 'home' ? homeTeam.name : awayTeam.name} will receive`
                    : `${coinFlipWinner === 'home' ? awayTeam.name : homeTeam.name} will receive`}
                </Text>
                <Text style={styles.gameInitSubtitle2}>Which direction are they driving?</Text>
                
                <View style={styles.gameInitButtons}>
                  <Pressable
                    style={styles.gameInitBtn}
                    onPress={() => handleStartGame('left')}
                  >
                    <Text style={styles.gameInitBtnText}>◄ LEFT</Text>
                    <Text style={styles.gameInitBtnSubtext}>Toward 0 yard line</Text>
                  </Pressable>
                  
                  <Pressable
                    style={styles.gameInitBtn}
                    onPress={() => handleStartGame('right')}
                  >
                    <Text style={styles.gameInitBtnText}>RIGHT ►</Text>
                    <Text style={styles.gameInitBtnSubtext}>Toward 100 yard line</Text>
                  </Pressable>
                </View>
                
                <Pressable
                  style={styles.gameInitBackBtn}
                  onPress={() => {
                    setInitStep(2);
                    setWinnerChoice(null);
                  }}
                >
                  <Text style={styles.gameInitBackText}>← Back</Text>
                </Pressable>
              </>
            )}
            
            {/* Step 4: Kickoff Return */}
            {initStep === 4 && (
              <View style={styles.kickoffFullContainer}>
                <Text style={styles.gameInitTitle}>OPENING KICKOFF</Text>
                <Text style={styles.gameInitSubtitle}>
                  {winnerChoice === 'receive' 
                    ? `${coinFlipWinner === 'home' ? homeTeam.name : awayTeam.name} RECEIVING`
                    : `${coinFlipWinner === 'home' ? awayTeam.name : homeTeam.name} RECEIVING`}
                </Text>
                
                {/* 2-Column Layout like Run/Pass screens */}
                <View style={styles.kickoffLayout}>
                  {/* Left Column - Touchback OR Player Selection */}
                  <View style={styles.kickoffColumn}>
                    <Pressable
                      style={styles.kickoffTouchbackBtn}
                      onPress={() => {
                        // Touchback - ball at 25
                        setCurrentYard(25);
                        setEndYard(25);
                        
                        // Log touchback
                        const play: Play = {
                          category: 'kickoff-touchback',
                          player: 'Team',
                          startYard: 0,
                          endYard: 25,
                          yards: '0',
                          timestamp: new Date().toLocaleTimeString(),
                        };
                        setRecentPlays([play, ...recentPlays]);
                        
                        setShowGameInit(false);
                      }}
                    >
                      <Text style={styles.kickoffTouchbackText}>TOUCHBACK</Text>
                      <Text style={styles.kickoffTouchbackSubtext}>Ball at 25</Text>
                    </Pressable>
                    
                    <Text style={styles.kickoffOrText}>OR SELECT RETURNER</Text>
                    
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search player..."
                      placeholderTextColor="#666"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    
                    <ScrollView style={styles.kickoffPlayerList} showsVerticalScrollIndicator={false}>
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
                                    <Text style={styles.playerNumberText}>#{player.number}</Text>
                                  </View>
                                  <Text style={styles.playerName}>{player.name}</Text>
                                </Pressable>
                              ))}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                  
                  {/* Right Column - Slider + Submit */}
                  <View style={styles.kickoffColumn}>
                    {selectedPlayer ? (
                      <>
                        <Text style={styles.sectionTitle}>RETURN YARDAGE</Text>
                        <Text style={styles.kickoffReturnPlayerText}>
                          #{selectedPlayer.number} {selectedPlayer.name}
                        </Text>
                        
                        <View style={styles.kickoffSliderSection}>
                          <Text style={styles.kickoffYardDisplay}>{formatYardLine(kickoffReturnYard)}</Text>
                          <Slider
                            style={styles.kickoffSlider}
                            minimumValue={0}
                            maximumValue={100}
                            step={1}
                            value={kickoffReturnYard}
                            onValueChange={setKickoffReturnYard}
                            minimumTrackTintColor="#b4d836"
                            maximumTrackTintColor="#3a3a3a"
                            thumbTintColor="#b4d836"
                          />
                          <View style={styles.sliderLabels}>
                            <Text style={styles.sliderLabel}>0</Text>
                            <Text style={styles.sliderLabel}>50</Text>
                            <Text style={styles.sliderLabel}>100</Text>
                          </View>
                        </View>
                        
                        <Pressable
                          style={styles.submitButton}
                          onPress={() => {
                            // Check for touchdown
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
                                      // Add 6 points to receiving team
                                      const scoringTeam = possession === 'offense' ? 'home' : 'away';
                                      if (scoringTeam === 'home') {
                                        setHomeTeam({ ...homeTeam, score: homeTeam.score + 6 });
                                      } else {
                                        setAwayTeam({ ...awayTeam, score: awayTeam.score + 6 });
                                      }
                                      
                                      // Log kickoff return TD
                                      const play: Play = {
                                        category: 'kickoff-return-td',
                                        player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
                                        startYard: 0,
                                        endYard: kickoffReturnYard,
                                        yards: kickoffReturnYard.toString(),
                                        timestamp: new Date().toLocaleTimeString(),
                                      };
                                      setRecentPlays([play, ...recentPlays]);
                                      
                                      // PAT attempt
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
                              // Normal kickoff return
                              setCurrentYard(kickoffReturnYard);
                              setEndYard(kickoffReturnYard);
                              
                              // Log kickoff return
                              const play: Play = {
                                category: 'kickoff-return',
                                player: `#${selectedPlayer.number} ${selectedPlayer.name}`,
                                startYard: 0,
                                endYard: kickoffReturnYard,
                                yards: kickoffReturnYard.toString(),
                                timestamp: new Date().toLocaleTimeString(),
                              };
                              setRecentPlays([play, ...recentPlays]);
                              
                              setSelectedPlayer(null);
                              setSearchQuery('');
                              setShowGameInit(false);
                            }
                          }}
                        >
                          <Text style={styles.submitButtonText}>START GAME</Text>
                        </Pressable>
                      </>
                    ) : (
                      <View style={styles.noSelectionPlaceholder}>
                        <Text style={styles.placeholderText}>Select touchback or choose returner</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <Pressable
                  style={styles.gameInitBackBtn}
                  onPress={() => {
                    setInitStep(3);
                    setSelectedPlayer(null);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.gameInitBackText}>← Back</Text>
                </Pressable>
              </View>
            )}
          </View>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Clock</Text>
            <Text style={styles.modalMessage}>Enter time (e.g., 1053 for 10:53)</Text>
            <TextInput
              style={styles.modalInput}
              value={clockInput}
              onChangeText={setClockInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="1200"
              placeholderTextColor="#666"
              autoFocus
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
                  setCurrentYard(25);
                  setShowKickoffModal(false);
                }}
              >
                <Text style={styles.kickoffBtnText}>TOUCHBACK</Text>
                <Text style={styles.kickoffBtnSubtext}>Ball at 25</Text>
              </Pressable>
              
              <Pressable 
                style={styles.kickoffBtn}
                onPress={() => {
                  // TODO: Show yard line selector
                  setShowKickoffModal(false);
                  console.log('Select yard line');
                }}
              >
                <Text style={styles.kickoffBtnText}>RETURN</Text>
                <Text style={styles.kickoffBtnSubtext}>Select yard line</Text>
              </Pressable>
            </View>
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
              <Text style={styles.modalTitle}>TOUCHDOWN! 🏈</Text>
              <Pressable 
                style={styles.modalCloseBtn}
                onPress={() => setShowTouchdownModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            
            <Text style={styles.modalMessage}>Select extra point attempt</Text>
            
            <View style={styles.kickoffOptions}>
              <Pressable
                style={styles.kickoffBtn}
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
                <Text style={styles.kickoffBtnText}>PAT (KICK)</Text>
                <Text style={styles.kickoffBtnSubtext}>1 Point</Text>
              </Pressable>
              
              <Pressable
                style={styles.kickoffBtn}
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
                <Text style={styles.kickoffBtnText}>2-PT CONV</Text>
                <Text style={styles.kickoffBtnSubtext}>2 Points</Text>
              </Pressable>
            </View>
            
            <Pressable
              style={styles.modalButtonCancel}
              onPress={() => setShowTouchdownModal(false)}
            >
              <Text style={styles.modalButtonTextCancel}>CANCEL</Text>
            </Pressable>
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

      {/* Halftime Report */}
      {showHalftime && (
        <View style={styles.halftimeOverlay}>
          <View style={styles.halftimeContent}>
            <Text style={styles.halftimeTitle}>HALFTIME</Text>
            
            <View style={styles.halftimeScoreboard}>
              <View style={styles.halftimeTeam}>
                <Text style={styles.halftimeTeamName}>{homeTeam.name}</Text>
                <Text style={styles.halftimeScore}>{homeTeam.score}</Text>
              </View>
              
              <Text style={styles.halftimeDash}>-</Text>
              
              <View style={styles.halftimeTeam}>
                <Text style={styles.halftimeTeamName}>{awayTeam.name}</Text>
                <Text style={styles.halftimeScore}>{awayTeam.score}</Text>
              </View>
            </View>
            
            <View style={styles.halftimeStats}>
              <Text style={styles.halftimeStatsTitle}>GAME SUMMARY</Text>
              
              <View style={styles.halftimeStatRow}>
                <Text style={styles.halftimeStatLabel}>Total Plays</Text>
                <Text style={styles.halftimeStatValue}>{recentPlays.length}</Text>
              </View>
              
              <View style={styles.halftimeStatRow}>
                <Text style={styles.halftimeStatLabel}>Current Down</Text>
                <Text style={styles.halftimeStatValue}>
                  {down === 1 ? '1st' : down === 2 ? '2nd' : down === 3 ? '3rd' : '4th'} & {distance}
                </Text>
              </View>
              
              <View style={styles.halftimeStatRow}>
                <Text style={styles.halftimeStatLabel}>Possession</Text>
                <Text style={styles.halftimeStatValue}>
                  {possession === 'offense' ? homeTeam.name : awayTeam.name}
                </Text>
              </View>
            </View>
            
            <View style={styles.halftimeRecentPlays}>
              <Text style={styles.halftimeStatsTitle}>RECENT PLAYS</Text>
              <ScrollView style={styles.halftimePlaysList} showsVerticalScrollIndicator={false}>
                {recentPlays.slice(0, 10).map((play, index) => (
                  <View key={index} style={styles.halftimePlayItem}>
                    <Text style={styles.halftimePlayText}>
                      {play.category === 'penalty' 
                        ? `${play.penaltyName} on ${play.player} (${play.yards} yards)`
                        : `${play.player} - ${Number(play.yards) > 0 ? '+' : ''}${play.yards} yards`
                      }
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
            
            <Pressable
              style={styles.endHalftimeBtn}
              onPress={() => {
                Alert.alert(
                  'End Halftime?',
                  'Are you sure you want to end halftime and begin the 3rd quarter?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'End Halftime', onPress: handleEndHalftime }
                  ]
                );
              }}
            >
              <Text style={styles.endHalftimeBtnText}>END HALFTIME</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.grayContainer}>
        <View style={styles.contentContainer}>

      <View style={styles.scoreboard}>
        <View style={styles.teamSection}>
          <Text style={styles.teamLabel}>HOME</Text>
          <Text style={styles.teamName}>{homeTeam.name}</Text>
          <View style={styles.timeoutsContainer}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[styles.timeoutDot, i >= homeTeam.timeouts && styles.timeoutDotUsed]} />
            ))}
          </View>
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.score}>{homeTeam.score}</Text>
        </View>

        <View style={styles.gameInfoContainer}>
          {possession === 'offense' && (
            <View style={styles.possessionIndicator}>
              <PossessionIcon />
            </View>
          )}
          
          <View style={styles.gameInfo}>
            <Text style={styles.quarter}>{quarter}</Text>
            
            <Pressable onPress={() => {
              setClockInput(clock.replace(':', ''));
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
          
          {possession === 'defense' && (
            <View style={styles.possessionIndicator}>
              <PossessionIcon />
            </View>
          )}
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.score}>{awayTeam.score}</Text>
        </View>

        <View style={styles.teamSection}>
          <Text style={styles.teamLabel}>AWAY</Text>
          <Text style={styles.teamName}>{awayTeam.name}</Text>
          <View style={styles.timeoutsContainer}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[styles.timeoutDot, i >= awayTeam.timeouts && styles.timeoutDotUsed]} />
            ))}
          </View>
        </View>
      </View>

      {/* Utility Buttons - Always Available */}
      <View style={styles.utilityButtonRow}>
        <Pressable 
          style={styles.utilityBtn} 
          onPress={() => setShowKickoffModal(true)}
        >
          <Text style={styles.utilityBtnText}>KICKOFF</Text>
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
          onPress={() => {
            const quarterMap: { [key: string]: string } = {
              'Q1': 'Q2',
              'Q2': 'Q3',
              'Q3': 'Q4',
              'Q4': 'FINAL'
            };
            
            const nextQuarter = quarterMap[quarter];
            
            if (quarter === 'Q2') {
              // HALFTIME - Reset timeouts
              Alert.alert(
                'HALFTIME',
                `${homeTeam.name}: ${homeTeam.score}\n${awayTeam.name}: ${awayTeam.score}\n\nTimeouts reset for both teams.`,
                [
                  {
                    text: 'Start 2nd Half',
                    onPress: () => {
                      setQuarter('Q3');
                      setHomeTeam({ ...homeTeam, timeouts: 3 });
                      setAwayTeam({ ...awayTeam, timeouts: 3 });
                      
                      // Log halftime in recent plays
                      const play: Play = {
                        category: 'halftime',
                        player: `${homeTeam.name} ${homeTeam.score} - ${awayTeam.score} ${awayTeam.name}`,
                        startYard: currentYard,
                        endYard: currentYard,
                        yards: '0',
                        timestamp: new Date().toLocaleTimeString(),
                      };
                      setRecentPlays([play, ...recentPlays]);
                    }
                  }
                ]
              );
            } else if (quarter === 'Q4') {
              // GAME OVER
              Alert.alert(
                'GAME OVER',
                `Final Score:\n${homeTeam.name}: ${homeTeam.score}\n${awayTeam.name}: ${awayTeam.score}\n\nWinner: ${homeTeam.score > awayTeam.score ? homeTeam.name : awayTeam.score > homeTeam.score ? awayTeam.name : 'TIE'}\n\nExport game data?`,
                [
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Export & Exit',
                    onPress: () => {
                      exportGameData();
                      Alert.alert(
                        'Game Data Exported!',
                        'Your game data has been saved. Thanks for using StatIQ!',
                        [{ text: 'Exit to Dashboard', onPress: () => router.back() }]
                      );
                    }
                  }
                ]
              );
            } else {
              // Regular quarter change
              Alert.alert(
                `End of ${quarter}`,
                `${homeTeam.name}: ${homeTeam.score}\n${awayTeam.name}: ${awayTeam.score}`,
                [
                  {
                    text: `Start ${nextQuarter}`,
                    onPress: () => {
                      setQuarter(nextQuarter);
                      
                      // Log quarter change in recent plays
                      const play: Play = {
                        category: 'end-quarter',
                        player: `End of ${quarter}`,
                        startYard: currentYard,
                        endYard: currentYard,
                        yards: '0',
                        timestamp: new Date().toLocaleTimeString(),
                      };
                      setRecentPlays([play, ...recentPlays]);
                    }
                  }
                ]
              );
            }
          }}
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
                      {selectedPlayer2 ? `${endYard - currentYard > 0 ? '+' : ''}${endYard - currentYard}` : '__'}
                    </Text>
                    {'-YD '}
                    <Text style={selectedPlayer2 ? styles.promptFilled : styles.promptBlank}>
                      {selectedPlayer2 ? (endYard - currentYard > 0 ? 'GAIN' : 'LOSS') : '_______'}
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
                  {selectedPlayer ? `${endYard - currentYard > 0 ? '+' : ''}${endYard - currentYard}` : '__'}
                </Text>
                {'-YD '}
                <Text style={selectedPlayer ? styles.promptFilled : styles.promptBlank}>
                  {selectedPlayer ? (endYard - currentYard > 0 ? 'GAIN' : 'LOSS') : '_______'}
                </Text>
              </>
            )}
          </Text>
        ) : (
          <View style={styles.emptyPromptBar} />
        )}
      </View>

      {!selectedCategory ? (
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
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedCategory('penalty')}>
                <Text style={styles.categoryBtnText}>PENALTY</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedCategory('punt')}>
                <Text style={styles.categoryBtnText}>PUNT</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedCategory('fieldgoal')}>
                <Text style={styles.categoryBtnText}>FIELD{'\n'}GOAL</Text>
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
              <Pressable style={[styles.categoryBtn, styles.defenseBtn]} onPress={() => setSelectedCategory('safety')}>
                <Text style={styles.categoryBtnText}>SAFETY</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.recentPlaysSection}>
            <Text style={styles.sectionTitle}>Recent Plays</Text>
            <ScrollView style={styles.recentPlaysScroll} showsVerticalScrollIndicator={false}>
              {recentPlays.length === 0 ? (
                <Text style={styles.emptyText}>No plays logged yet</Text>
              ) : (
                recentPlays.slice(0, 5).map((play, index) => (
                  <View key={index} style={styles.playItem}>
                    <View style={styles.playItemContent}>
                      <Text style={styles.playDescription}>
                        {play.category === 'penalty' 
                          ? `${play.penaltyName} on ${play.player} (${play.yards} yards)`
                          : play.category === 'timeout'
                          ? `⏱️ Timeout - ${play.player}`
                          : play.category === 'halftime'
                          ? `🏁 HALFTIME - ${play.player}`
                          : play.category === 'end-quarter'
                          ? `📍 ${play.player}`
                          : play.category === 'kickoff-return-td'
                          ? `🏈 Kickoff Return TD by ${play.player} (${play.yards} yds)`
                          : play.category === 'kickoff-return'
                          ? `Kickoff return by ${play.player} to ${formatYardLine(play.endYard)}`
                          : play.category === 'kickoff-touchback'
                          ? `Touchback - Ball at 25`
                          : play.category === 'fieldgoal'
                          ? `✓ Field Goal GOOD (+3)`
                          : play.category === 'fieldgoal-missed'
                          ? `❌ Field Goal MISSED`
                          : play.category === 'safety'
                          ? `⚠️ SAFETY (+2)`
                          : play.category === 'interception-td'
                          ? `🏈 INT TD by ${play.player}`
                          : play.category === 'fumble-td'
                          ? `🏈 Fumble Return TD by ${play.player}`
                          : play.category === 'punt-return-td'
                          ? `🏈 Punt Return TD by ${play.player}`
                          : play.category === 'run-td'
                          ? `🏈 Rushing TD by ${play.player} (${play.yards} yds)`
                          : play.category === 'pass-td'
                          ? `🏈 TD Pass ${play.player} to ${play.player2} (${play.yards} yds)`
                          : play.category === 'sack'
                          ? `Sack by ${play.player} (${play.yards} yds)`
                          : play.category === 'interception'
                          ? `INT by ${play.player} (${play.yards} yd return)`
                          : play.category === 'fumble'
                          ? `Fumble recovery by ${play.player} (${play.yards} yds)`
                          : play.category === 'punt'
                          ? `Punt by ${play.player} (${play.yards} yds)`
                          : play.category === 'pass'
                          ? `Pass ${play.player} to ${play.player2} (${play.yards} yds)`
                          : play.category === 'incomplete'
                          ? `Incomplete pass ${play.player} to ${play.player2}`
                          : `${play.player} - ${play.yards} yards`
                        }
                      </Text>
                      <Text style={styles.playMeta}>{play.timestamp}</Text>
                    </View>
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
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </>
      ) : selectedCategory === 'penalty' && !selectedSubcategory ? (
        /* Penalty Selection */
        <View style={styles.penaltyContainer}>
          <Pressable 
            style={styles.backToCategories}
            onPress={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }}
          >
            <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
          </Pressable>
          
          <Text style={styles.sectionTitle}>SELECT PENALTY</Text>
          
          <ScrollView style={styles.penaltyScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
            {Object.entries(penaltyCategories).map(([category, penalties]) => (
              <View key={category} style={styles.penaltyCategorySection} pointerEvents="box-none">
                <Text style={styles.penaltyCategoryTitle}>{category}</Text>
                <View style={styles.penaltyGrid} pointerEvents="box-none">
                  {penalties.map((penalty, index) => (
                    <Pressable 
                      key={`${category}-${index}`}
                      style={({ pressed }) => [
                        styles.penaltyBtn,
                        pressed && styles.penaltyBtnPressed
                      ]}
                      onPress={() => {
                        console.log('Penalty clicked:', penalty.name);
                        setSelectedPenalty(penalty);
                        setSelectedSubcategory('selectPlayer');
                      }}
                    >
                      <Text style={styles.penaltyBtnName}>{penalty.name}</Text>
                      {penalty.deadBall && (
                        <Text style={styles.penaltyBtnDeadBall}>DEAD BALL</Text>
                      )}
                      {penalty.autoFirstDown && (
                        <Text style={styles.penaltyBtnExtra}>AUTO 1ST</Text>
                      )}
                      {penalty.lossOfDown && (
                        <Text style={styles.penaltyBtnExtra}>LOSS OF DOWN</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
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
                            <Text style={styles.playerName}>{player.name}</Text>
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
                      
                      // Handle dead ball personal foul tracking
                      if (selectedPenalty.deadBall) {
                        const team = possession === 'offense' ? 'home' : 'away';
                        const newCount = deadBallPersonalFouls[team] + 1;
                        
                        setDeadBallPersonalFouls({
                          ...deadBallPersonalFouls,
                          [team]: newCount
                        });
                        
                        if (newCount >= 2) {
                          Alert.alert(
                            'PLAYER EJECTION',
                            `${team === 'home' ? homeTeam.name : awayTeam.name} player has received 2 dead ball personal fouls and is EJECTED from the game.`,
                            [
                              { 
                                text: 'OK', 
                                onPress: () => {
                                  setDeadBallPersonalFouls({
                                    ...deadBallPersonalFouls,
                                    [team]: 0
                                  });
                                }
                              }
                            ]
                          );
                        }
                      }
                      
                      // Apply penalty yardage based on field direction and who committed it
                      const penaltyYards = selectedPenalty.yards;
                      let newYard;
                      
                      // Defensive penalties (autoFirstDown flag) help the offense = move ball forward
                      // Offensive penalties hurt the offense = move ball backward
                      const isDefensivePenalty = selectedPenalty.autoFirstDown;
                      
                      if (isDefensivePenalty) {
                        // DEFENSIVE PENALTY - Move ball FORWARD for offense
                        if (fieldDirection === 'right') {
                          newYard = currentYard + penaltyYards; // Move right (forward)
                        } else {
                          newYard = currentYard - penaltyYards; // Move left (forward)
                        }
                      } else {
                        // OFFENSIVE PENALTY - Move ball BACKWARD for offense
                        if (fieldDirection === 'right') {
                          newYard = currentYard - penaltyYards; // Move left (backward)
                        } else {
                          newYard = currentYard + penaltyYards; // Move right (backward)
                        }
                      }
                      
                      // Keep within bounds
                      newYard = Math.max(1, Math.min(99, newYard));
                      
                      // Log penalty play
                      const play: Play = {
                        category: 'penalty',
                        player: selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : 'Unknown',
                        startYard: currentYard,
                        endYard: newYard,
                        yards: isDefensivePenalty ? `+${penaltyYards}` : `-${penaltyYards}`,
                        timestamp: new Date().toLocaleTimeString(),
                        penaltyName: selectedPenalty.name,
                      };
                      setRecentPlays([play, ...recentPlays]);
                      
                      // Update field position
                      setCurrentYard(newYard);
                      setEndYard(newYard);
                      
                      console.log('Penalty Debug:', {
                        penalty: selectedPenalty.name,
                        yards: penaltyYards,
                        autoFirstDown: selectedPenalty.autoFirstDown,
                        lossOfDown: selectedPenalty.lossOfDown,
                        currentDown: down,
                        currentDistance: distance,
                        newYard: newYard
                      });
                      
                      // Handle down/distance based on penalty type
                      // isDefensivePenalty already defined above
                      
                      if (isDefensivePenalty) {
                        // Defensive penalty with automatic first down
                        console.log('Setting 1st & 10 (defensive penalty)');
                        setDown(1);
                        setDistance(10);
                      } else if (selectedPenalty.lossOfDown) {
                        // Offensive penalty with loss of down (e.g., Intentional Grounding)
                        const newDown = down + 1;
                        console.log('Loss of down penalty, new down:', newDown);
                        if (newDown > 4) {
                          // Turnover on downs
                          console.log('Turnover on downs');
                          setPossession(possession === 'offense' ? 'defense' : 'offense');
                          setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                          setDown(1);
                          setDistance(10);
                        } else {
                          setDown(newDown);
                          // Keep same distance after loss of down
                        }
                      } else {
                        // Regular offensive penalty - replay down with increased distance
                        const newDistance = distance + penaltyYards;
                        console.log('Regular offensive penalty, new distance:', newDistance);
                        setDistance(newDistance);
                        // Check if beyond first down marker would be beyond goal line
                        if (fieldDirection === 'right') {
                          // Driving toward 100
                          if (newYard + newDistance > 99) {
                            // Goal to go situation
                            setDistance(99 - newYard);
                          }
                        } else {
                          // Driving toward 0
                          if (newYard - newDistance < 1) {
                            // Goal to go situation
                            setDistance(newYard - 1);
                          }
                        }
                      }
                      
                      // Reset
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                      setSelectedPenalty(null);
                      setSelectedPlayer(null);
                      setSearchQuery('');
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
                                <Text style={styles.playerNumberText}>#{player.number}</Text>
                              </View>
                              <Text style={styles.playerName}>{player.name}</Text>
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
                    }}
                  >
                    <Text style={styles.backToCategoriesText}>← Back</Text>
                  </Pressable>
                </View>
                <Text style={styles.sectionTitle}>Passer</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor="#666"
                />
                <ScrollView style={styles.rosterList}>
                  {sortedPasserPositions.map((position) => (
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
                          <Text style={styles.playerName}>{player.name}</Text>
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
                <Text style={styles.sectionTitle}>Receiver</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor="#666"
                />
                <ScrollView style={styles.rosterList}>
                  {sortedReceiverPositions.map((position) => (
                    <View key={`receiver-${position}`}>
                      <Text style={styles.positionLabel}>{position}</Text>
                      {groupedRoster[position].map((player) => (
                        <Pressable
                          key={`receiver-${player.number}`}
                          style={[styles.playerItem, selectedPlayer2?.number === player.number && styles.playerItemSelected]}
                          onPress={() => setSelectedPlayer2(player)}
                        >
                          <View style={styles.playerNumber}>
                            <Text style={styles.playerNumberText}>{player.number}</Text>
                          </View>
                          <Text style={styles.playerName}>{player.name}</Text>
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
                            <Text style={styles.playerName}>{player.name}</Text>
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
          ) : (selectedCategory === 'sack' || selectedCategory === 'tackle') ? (
            /* Sack/Tackle - Defense plays */
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
                  SELECT {selectedCategory === 'sack' ? 'DEFENDER (SACK)' : 'DEFENDER (TACKLE)'}
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
                                <Text style={styles.playerNumberText}>#{player.number}</Text>
                              </View>
                              <Text style={styles.playerName}>{player.name}</Text>
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
                <Text style={styles.sectionTitle}>SELECT DEFENDER (INTERCEPTION)</Text>
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
                                <Text style={styles.playerNumberText}>#{player.number}</Text>
                              </View>
                              <Text style={styles.playerName}>{player.name}</Text>
                            </Pressable>
                          ))}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.columnHalf}>
                <Text style={styles.sectionTitle}>INTERCEPTION RETURN</Text>
                
                {selectedPlayer ? (
                  <>
                    {renderYardLineSelector()}
                  </>
                ) : (
                  <View style={styles.noSelectionPlaceholder}>
                    <Text style={styles.placeholderText}>Select a defender to continue</Text>
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
                                <Text style={styles.playerNumberText}>#{player.number}</Text>
                              </View>
                              <Text style={styles.playerName}>{player.name}</Text>
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
                              endYard: 0,
                              yards: '0',
                              timestamp: new Date().toLocaleTimeString(),
                            };
                            
                            setRecentPlays([play, ...recentPlays]);
                            
                            // After safety, offense punts from their 20
                            setPossession(possession === 'offense' ? 'defense' : 'offense');
                            setFieldDirection(fieldDirection === 'left' ? 'right' : 'left');
                            setCurrentYard(20);
                            setEndYard(20);
                            setDown(1);
                            setDistance(10);
                            
                            setSelectedCategory(null);
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
    padding: 20,
  },
  contentContainer: {
    flex: 1,
  },
  backButton: { position: 'absolute', top: 36, left: 36, width: 44, height: 44, backgroundColor: '#2a2a2a', borderRadius: 8, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  backButtonText: { color: '#fff', fontSize: 32, fontFamily: 'NeueHaas-Bold', marginTop: -4 },
  scoreboard: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  teamSection: { flex: 1, alignItems: 'center', gap: 8 },
  teamLabel: { fontSize: 11, fontFamily: 'NeueHaas-Bold', color: '#666', letterSpacing: 1 },
  teamName: { fontSize: 20, fontFamily: 'NeueHaas-Bold', color: '#fff', letterSpacing: 1, textTransform: 'uppercase' },
  scoreSection: { minWidth: 70, alignItems: 'center' },
  score: { fontSize: 64, fontFamily: 'NeueHaas-Bold', color: '#fff', lineHeight: 64 },
  gameInfoContainer: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  gameInfo: { alignItems: 'center', paddingVertical: 4 },
  quarter: { fontSize: 24, fontFamily: 'NeueHaas-Bold', color: '#b4d836', marginBottom: 2 },
  clock: { fontSize: 36, fontFamily: 'NeueHaas-Bold', color: '#fff', marginBottom: 2 },
  downDistance: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#b4d836' },
  possessionIndicator: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  timeoutsContainer: { 
    flexDirection: 'row', 
    gap: 6,
  },
  timeoutDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#b4d836' },
  timeoutDotUsed: { backgroundColor: '#4a4a4a' },
  promptBar: { 
    minHeight: 40,
    backgroundColor: '#0066cc', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  promptText: { 
    fontSize: 18, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#fff',
    textAlign: 'center',
  },
  promptFilled: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
  promptBlank: {
    color: 'rgba(255, 255, 255, 0.3)',
    textDecorationLine: 'underline',
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  categoryBtn: { flex: 1, minWidth: '31%', height: 90, backgroundColor: '#3a3a3a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 16 },
  offenseBtn: { 
    borderWidth: 3, 
    borderColor: '#b4d836',  // Green border for offense
  },
  defenseBtn: { 
    borderWidth: 3, 
    borderColor: '#ff3636',  // Red border for defense
  },
  categoryBtnLight: { backgroundColor: '#fff' },
  categoryBtnText: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#fff', textAlign: 'center', letterSpacing: 0.5 },
  categoryBtnTextBlue: { fontSize: 32, fontFamily: 'NeueHaas-Bold', color: '#0066cc', letterSpacing: 1 },
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
    color: '#fff',
    textAlign: 'center',
  },
  kickoffOptions: { 
    flexDirection: 'row',
    gap: 12, 
    marginBottom: 12,
  },
  kickoffBtn: { 
    flex: 1,
    backgroundColor: '#3a3a3a', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  kickoffBtnText: { 
    fontSize: 18, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#fff',
    marginBottom: 6,
  },
  kickoffBtnSubtext: { 
    fontSize: 13, 
    fontFamily: 'NeueHaas-Roman', 
    color: '#999',
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
  threeColumnLayout: { flexDirection: 'row', gap: 16, flex: 1, maxHeight: '100%' },
  columnThird: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 16, padding: 20, maxHeight: '100%' },
  columnHalf: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 16, padding: 20, maxHeight: '100%' },
  columnHeader: { marginBottom: 16 },
  backToCategories: { alignSelf: 'flex-start', marginBottom: 20, paddingVertical: 8, paddingHorizontal: 4 },
  backToCategoriesText: { fontSize: 14, fontFamily: 'NeueHaas-Bold', color: '#0066cc' },
  sectionTitle: { fontSize: 22, fontFamily: 'NeueHaas-Bold', color: '#fff', marginBottom: 16 },
  sectionSubtitle: { fontSize: 16, fontFamily: 'NeueHaas-Roman', color: '#999', marginBottom: 16 },
  searchInput: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, fontSize: 16, fontFamily: 'NeueHaas-Roman', color: '#fff', marginBottom: 16 },
  rosterList: { flex: 1 },
  positionLabel: { fontSize: 14, fontFamily: 'NeueHaas-Bold', color: '#999', marginTop: 12, marginBottom: 8 },
  playerItem: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerItemSelected: { backgroundColor: '#fff' },
  playerNumber: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0066cc', justifyContent: 'center', alignItems: 'center' },
  playerNumberText: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  playerName: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#fff', flex: 1 },
  starterBadge: { backgroundColor: '#0066cc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  starterText: { fontSize: 11, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  yardLineContainer: { flex: 1 },
  yardLineLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, backgroundColor: '#2a2a2a', borderRadius: 12, padding: 12 },
  yardLineGroup: { alignItems: 'center' },
  yardLineLabel: { fontSize: 10, fontFamily: 'NeueHaas-Bold', color: '#666', marginBottom: 6, letterSpacing: 1 },
  yardLineValue: { fontSize: 28, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  yardLinePositive: { color: '#b4d836' },
  yardLineNegative: { color: '#ff3636' },
  footballField: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 16, marginBottom: 16 },
  fieldTitle: { fontSize: 11, fontFamily: 'NeueHaas-Bold', color: '#666', textAlign: 'center', marginBottom: 12, letterSpacing: 1 },
  fieldVisualization: { position: 'relative', height: 70, marginBottom: 12 },
  yardLineMarkers: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  yardMarker: { 
    alignItems: 'center',
    width: 20,
  },
  yardTickMark: {
    width: 2,
    height: 12,
    backgroundColor: '#3a3a3a',
    marginBottom: 4,
  },
  yardNumberLabel: { 
    fontSize: 9, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#666',
    textAlign: 'center',
  },
  playProgressBar: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  playProgress: {
    position: 'absolute',
    height: '100%',
    borderRadius: 8,
  },
  positionMarker: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
    transform: [{ translateX: -10 }],
  },
  startMarker: {},
  endMarker: {},
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#b4d836',
    marginBottom: 4,
  },
  endMarkerDot: {
    borderColor: '#ff3636',
  },
  markerLabel: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Bold',
    color: '#999',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sliderContainer: {
    paddingHorizontal: 10,
  },
  fieldSlider: { 
    width: '100%', 
    height: 40,
  },
  submitButton: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 24 },
  submitButtonContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  submitButtonPositive: { backgroundColor: '#b4d836' },
  submitButtonNegative: { backgroundColor: '#ff3636' },
  submitButtonText: { fontSize: 28, fontFamily: 'NeueHaas-Bold', color: '#000', letterSpacing: 1 },
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
    color: '#fff',
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
    color: '#b4d836',
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
  recentPlaysSection: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 20, flex: 1, maxHeight: 500 },
  recentPlaysScroll: { flex: 1 },
  emptyText: { fontSize: 14, fontFamily: 'NeueHaas-Roman', color: '#666', textAlign: 'center', marginTop: 20 },
  playItem: { backgroundColor: '#1a1a1a', padding: 14, marginBottom: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playItemContent: { flex: 1 },
  playDescription: { fontSize: 15, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  playMeta: { fontSize: 12, fontFamily: 'NeueHaas-Roman', color: '#999', marginTop: 4 },
  editButton: { backgroundColor: '#0066cc', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, marginLeft: 12 },
  editButtonText: { fontSize: 12, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 32, width: '80%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontFamily: 'NeueHaas-Bold', color: '#fff', textAlign: 'center', flex: 1 },
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
  modalCloseText: { fontSize: 20, color: '#999', fontFamily: 'NeueHaas-Bold' },
  modalMessage: { fontSize: 16, fontFamily: 'NeueHaas-Roman', color: '#999', marginBottom: 24, textAlign: 'center' },
  modalInput: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 8, 
    padding: 16, 
    fontSize: 24, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#fff', 
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButtonCancel: { flex: 1, backgroundColor: '#3a3a3a', padding: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonConfirm: { flex: 1, backgroundColor: '#0066cc', padding: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonTextCancel: { fontSize: 16, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  modalButtonTextConfirm: { fontSize: 16, fontFamily: 'NeueHaas-Bold', color: '#fff' },
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
  pickerBtnText: { fontSize: 14, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  distancePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  arrowBtn: { 
    backgroundColor: '#3a3a3a', 
    width: 50, 
    height: 50, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  arrowBtnText: { fontSize: 24, color: '#fff' },
  distanceValue: { 
    fontSize: 36, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#fff', 
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
    color: '#fff',
    marginBottom: 6,
  },
  timeoutsRemaining: { 
    fontSize: 14, 
    fontFamily: 'NeueHaas-Roman', 
    color: '#999',
  },
  halftimeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    zIndex: 3000,
    padding: 40,
  },
  halftimeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halftimeTitle: {
    fontSize: 64,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    marginBottom: 40,
    letterSpacing: 2,
  },
  halftimeScoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
    marginBottom: 60,
    backgroundColor: '#2a2a2a',
    padding: 40,
    borderRadius: 16,
  },
  halftimeTeam: {
    alignItems: 'center',
  },
  halftimeTeamName: {
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 1,
  },
  halftimeScore: {
    fontSize: 72,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  halftimeDash: {
    fontSize: 48,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
  },
  halftimeStats: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 600,
    marginBottom: 32,
  },
  halftimeStatsTitle: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    marginBottom: 20,
    textAlign: 'center',
  },
  halftimeStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  halftimeStatLabel: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Roman',
    color: '#999',
  },
  halftimeStatValue: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  halftimeRecentPlays: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 600,
    maxHeight: 300,
    marginBottom: 32,
  },
  halftimePlaysList: {
    flex: 1,
  },
  halftimePlayItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  halftimePlayText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
  },
  endHalftimeBtn: {
    backgroundColor: '#b4d836',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 12,
  },
  endHalftimeBtnText: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#000',
    letterSpacing: 1,
  },
  gameInitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    zIndex: 5000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  gameInitContent: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    flex: 1,
  },
  gameInitTitle: {
    fontSize: 48,
    fontFamily: 'NeueHaas-Bold',
    color: '#b4d836',
    marginBottom: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
  gameInitSubtitle: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameInitSubtitle2: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Roman',
    color: '#999',
    marginBottom: 40,
    textAlign: 'center',
  },
  gameInitButtons: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    marginBottom: 40,
  },
  gameInitBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3a3a3a',
  },
  gameInitBtnText: {
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  gameInitBtnSubtext: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#666',
    textAlign: 'center',
  },
  gameInitBackBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  gameInitBackText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#0066cc',
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
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  penaltyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  penaltyBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    width: '23.5%',
    minHeight: 70,
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
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  penaltyBtnYards: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#ff3636',
    marginBottom: 4,
  },
  penaltyBtnExtra: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Bold',
    color: '#0066cc',
    letterSpacing: 0.5,
  },
  penaltyBtnDeadBall: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Bold',
    color: '#ff3636',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  penaltySelectedName: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
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
    color: '#fff',
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
    color: '#fff',
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
    color: '#fff',
    marginBottom: 4,
  },
  touchdownBtnSubtext: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
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
});