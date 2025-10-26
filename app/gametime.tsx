import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';

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
}

export default function GameTimeScreen() {
  const router = useRouter();
  
  const [homeTeam, setHomeTeam] = useState<Team>({ name: 'BURLESON', score: 3, timeouts: 3 });
  const [awayTeam, setAwayTeam] = useState<Team>({ name: 'JOSHUA', score: 7, timeouts: 3 });
  const [clock, setClock] = useState('12:00');
  const [quarter, setQuarter] = useState('Q1');
  
  // Team colors - replace with actual team colors
  const teamColor = '#0066cc'; // Blue for home team
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null); // For receiver
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
  const [clockInput, setClockInput] = useState('');
  
  // Down & Distance state
  const [down, setDown] = useState(1);
  const [distance, setDistance] = useState(10);
  
  // Field direction: 'left' = driving toward 0 yard line, 'right' = driving toward 100 yard line
  const [fieldDirection, setFieldDirection] = useState<'left' | 'right'>('right');

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
    const baseDirection = yard <= 50 ? '◄' : '►';
    // Flip arrows when field direction is reversed (defense driving opposite way)
    if (fieldDirection === 'left') {
      return baseDirection === '◄' ? '►' : '◄';
    }
    return baseDirection;
  };

  const handleSubmitPlay = () => {
    if (!selectedPlayer) return;
    // For passes, require receiver too
    if ((selectedCategory === 'pass' || selectedCategory === 'incomplete') && !selectedPlayer2) return;

    const yardsGained = selectedCategory === 'incomplete' ? 0 : endYard - currentYard;
    const playType = selectedSubcategory || selectedCategory;
    
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
    if (playType === 'punt' || 
        playType === 'kickoff' || 
        playType === 'interception' || 
        playType === 'fumble' ||
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
    const totalYards = endYard - currentYard;
    const isNegative = totalYards < 0;
    const isPositive = totalYards > 0;
    
    return (
      <View style={styles.yardLineContainer}>
        <View style={styles.yardLineLabels}>
          <View style={styles.yardLineGroup}>
            <Text style={styles.yardLineLabel}>STARTING</Text>
            <Text style={styles.yardLineValue}>{currentYard <= 50 ? '◄' : '►'} {formatYardLine(currentYard)}</Text>
          </View>
          <View style={styles.yardLineGroup}>
            <Text style={styles.yardLineLabel}>ENDING</Text>
            <Text style={styles.yardLineValue}>{endYard <= 50 ? '◄' : '►'} {formatYardLine(endYard)}</Text>
          </View>
          <View style={styles.yardLineGroup}>
            <Text style={styles.yardLineLabel}>TOTAL</Text>
            <Text style={[
              styles.yardLineValue,
              isPositive && styles.yardLinePositive,
              isNegative && styles.yardLineNegative,
            ]}>
              {totalYards > 0 ? '+' : ''}{totalYards}
            </Text>
          </View>
        </View>

        {/* Visual Football Field */}
        <View style={styles.footballField}>
          <Text style={styles.fieldTitle}>Select Ending Yard Line</Text>
          
          {/* Starting Position Indicator */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldMarker, { left: `${currentYard}%` }]}>
              <View style={styles.startMarker} />
            </View>
            <View style={styles.yardLineStripe}>
              {[...Array(11)].map((_, i) => {
                const displayYard = getYardDisplay(i);
                const arrow = getArrowDirection(i);
                return (
                  <View key={i} style={styles.yardLineSection}>
                    <Text style={styles.yardLabel}>{arrow} {displayYard}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Ending Position Indicator */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldMarker, { left: `${endYard}%` }]}>
              <View style={styles.endMarker} />
            </View>
            <View style={styles.yardLineStripe}>
              {[...Array(11)].map((_, i) => {
                const displayYard = getYardDisplay(i);
                const arrow = getArrowDirection(i);
                return (
                  <View key={i} style={styles.yardLineSection}>
                    <Text style={styles.yardLabel}>{arrow} {displayYard}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Slider */}
          <Slider
            style={styles.fieldSlider}
            minimumValue={1}
            maximumValue={99}
            step={1}
            value={endYard}
            onValueChange={setEndYard}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor="#FFD700"
          />
        </View>

        <Pressable 
          style={[
            styles.submitButton,
            isPositive && styles.submitButtonPositive,
            isNegative && styles.submitButtonNegative,
          ]} 
          onPress={handleSubmitPlay}
        >
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.screenBorder, { backgroundColor: teamColor }]}>
      <Pressable style={styles.backButton} onPress={() => setShowExitConfirm(true)}>
        <Text style={styles.backButtonText}>×</Text>
      </Pressable>

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
                // Format input as MM:SS
                if (clockInput.length === 4) {
                  const minutes = clockInput.substring(0, 2);
                  const seconds = clockInput.substring(2, 4);
                  setClock(`${minutes}:${seconds}`);
                } else if (clockInput.length === 3) {
                  const minutes = clockInput.substring(0, 1);
                  const seconds = clockInput.substring(1, 3);
                  setClock(`${minutes}:${seconds}`);
                }
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
            
            <View style={styles.teamButtons}>
              <Pressable 
                style={styles.teamTimeoutBtn}
                onPress={() => {
                  if (homeTeam.timeouts > 0) {
                    setHomeTeam({ ...homeTeam, timeouts: homeTeam.timeouts - 1 });
                  }
                  setShowTimeoutModal(false);
                }}
              >
                <Text style={styles.teamTimeoutText}>{homeTeam.name}</Text>
                <Text style={styles.timeoutsRemaining}>{homeTeam.timeouts} timeout{homeTeam.timeouts !== 1 ? 's' : ''} left</Text>
              </Pressable>
              
              <Pressable 
                style={styles.teamTimeoutBtn}
                onPress={() => {
                  if (awayTeam.timeouts > 0) {
                    setAwayTeam({ ...awayTeam, timeouts: awayTeam.timeouts - 1 });
                  }
                  setShowTimeoutModal(false);
                }}
              >
                <Text style={styles.teamTimeoutText}>{awayTeam.name}</Text>
                <Text style={styles.timeoutsRemaining}>{awayTeam.timeouts} timeout{awayTeam.timeouts !== 1 ? 's' : ''} left</Text>
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

      <View style={styles.grayContainer}>
        <View style={styles.contentContainer}>

      <View style={styles.scoreboard}>
        <View style={styles.teamSection}>
          <View style={styles.teamNameRow}>
            <Text style={styles.teamName}>{homeTeam.name}</Text>
          </View>
          <View style={styles.timeouts}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[styles.timeoutDot, i >= homeTeam.timeouts && styles.timeoutDotUsed]} />
            ))}
          </View>
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.score}>{homeTeam.score}</Text>
        </View>

        <View style={styles.centerInfoWrapper}>
          {possession === 'offense' && (
            <View style={styles.possessionBall}>
              <Text style={styles.possessionBallText}>🏈</Text>
            </View>
          )}

          <View style={styles.gameInfo}>
            <Pressable onPress={() => {
              const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'];
              const currentIndex = quarters.indexOf(quarter);
              setQuarter(quarters[(currentIndex + 1) % quarters.length]);
            }}>
              <Text style={styles.quarter}>{quarter}</Text>
            </Pressable>
            
            <Pressable onPress={() => {
              setClockInput(clock.replace(':', ''));
              setShowClockEdit(true);
            }}>
              <Text style={styles.clock}>{clock}</Text>
            </Pressable>
            
            <View style={styles.downDistanceRow}>
              <Pressable onPress={() => setShowDownEdit(true)}>
                <Text style={styles.downDistance}>
                  {down === 1 ? '1ST' : down === 2 ? '2ND' : down === 3 ? '3RD' : '4TH'}
                </Text>
              </Pressable>
              <Text style={styles.downDistance}> & </Text>
              <Pressable onPress={() => setShowDownEdit(true)}>
                <Text style={styles.downDistance}>{distance}</Text>
              </Pressable>
            </View>
          </View>

          {possession === 'defense' && (
            <View style={styles.possessionBall}>
              <Text style={styles.possessionBallText}>🏈</Text>
            </View>
          )}
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.score}>{awayTeam.score}</Text>
        </View>

        <View style={styles.teamSection}>
          <View style={styles.timeouts}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[styles.timeoutDot, i >= awayTeam.timeouts && styles.timeoutDotUsed]} />
            ))}
          </View>
          <View style={styles.teamNameRow}>
            <Text style={styles.teamName}>{awayTeam.name}</Text>
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
          onPress={() => setShowTimeoutModal(true)}
        >
          <Text style={styles.utilityBtnText}>TIMEOUT</Text>
        </Pressable>
        <Pressable 
          style={styles.utilityBtn} 
          onPress={() => {
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'];
            const currentIndex = quarters.indexOf(quarter);
            if (currentIndex < quarters.length - 1) {
              const nextQuarter = quarters[currentIndex + 1];
              setQuarter(nextQuarter);
              
              // Reset timeouts at halftime (after Q2)
              if (quarter === 'Q2') {
                setHomeTeam({ ...homeTeam, timeouts: 3 });
                setAwayTeam({ ...awayTeam, timeouts: 3 });
              }
            }
          }}
        >
          <Text style={styles.utilityBtnText}>END QUARTER</Text>
        </Pressable>
        <Pressable 
          style={[styles.utilityBtn, styles.touchdownBtn]} 
          onPress={() => {
            // TODO: Show touchdown modal - which team scored
            console.log('Touchdown!');
          }}
        >
          <Text style={styles.utilityBtnText}>TOUCHDOWN</Text>
        </Pressable>
      </View>

      {/* Prompt Bar */}
      <View style={styles.promptBar}>
        {selectedCategory ? (
          <Text style={styles.promptText}>
            {/* PASS SCRIPT: Pass from [passer] to [receiver] for [x]-yd [gain/loss] */}
            {(selectedCategory === 'pass' || selectedCategory === 'incomplete') ? (
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
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedCategory('sack')}>
                <Text style={styles.categoryBtnText}>SACK</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedCategory('penalty')}>
                <Text style={styles.categoryBtnText}>PENALTY</Text>
              </Pressable>
              <Pressable style={[styles.categoryBtn, styles.offenseBtn]} onPress={() => setSelectedCategory('special')}>
                <Text style={styles.categoryBtnText}>SPECIAL{'\n'}TEAMS</Text>
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
              <Pressable style={[styles.categoryBtn, styles.defenseBtn]} onPress={() => setSelectedCategory('special')}>
                <Text style={styles.categoryBtnText}>SPECIAL{'\n'}TEAMS</Text>
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
                      <Text style={styles.playDescription}>{play.player} - {play.yards} yards</Text>
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
      ) : selectedCategory === 'special' && !selectedSubcategory ? (
        /* Special Teams Subcategory */
        <>
          <Pressable 
            style={styles.backToCategories}
            onPress={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }}
          >
            <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
          </Pressable>
          
          <View style={styles.categoryGrid}>
            <Pressable style={styles.categoryBtn} onPress={() => setSelectedSubcategory('fieldgoal')}>
              <Text style={styles.categoryBtnText}>FIELD GOAL</Text>
            </Pressable>
            <Pressable style={styles.categoryBtn} onPress={() => setSelectedSubcategory('punt')}>
              <Text style={styles.categoryBtnText}>PUNT</Text>
            </Pressable>
            <Pressable style={styles.categoryBtn} onPress={() => setSelectedSubcategory('kickoff')}>
              <Text style={styles.categoryBtnText}>KICKOFF</Text>
            </Pressable>
            <Pressable style={styles.categoryBtn} onPress={() => setSelectedSubcategory('extra-point')}>
              <Text style={styles.categoryBtnText}>EXTRA{'\n'}POINT</Text>
            </Pressable>
            <Pressable style={styles.categoryBtn} onPress={() => setSelectedSubcategory('two-point')}>
              <Text style={styles.categoryBtnText}>2-POINT{'\n'}CONVERSION</Text>
            </Pressable>
          </View>
        </>
      ) : (
        /* Player Selection View */
        <>
          {(selectedCategory === 'pass' || selectedCategory === 'incomplete') ? (
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
          ) : (
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
          )}
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
  scoreboard: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  teamSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamName: { fontSize: 20, fontFamily: 'NeueHaas-Bold', color: '#fff', letterSpacing: 1 },
  centerInfoWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16,
  },
  possessionBall: { 
    backgroundColor: '#FFD700',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  possessionBallText: { fontSize: 24 },
  timeouts: { flexDirection: 'row', gap: 4 },
  timeoutDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFD700' },
  timeoutDotUsed: { backgroundColor: '#4a4a4a' },
  scoreSection: { minWidth: 60, alignItems: 'center' },
  score: { fontSize: 56, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  gameInfo: { alignItems: 'center', minWidth: 160, paddingVertical: 8 },
  quarter: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#999', marginBottom: 6 },
  clock: { fontSize: 36, fontFamily: 'NeueHaas-Bold', color: '#fff', marginBottom: 6 },
  downDistanceRow: { flexDirection: 'row', alignItems: 'center' },
  downDistance: { fontSize: 22, fontFamily: 'NeueHaas-Bold', color: '#FFD700' },
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
  possessionIndicator: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  possessionText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#FFD700',
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
    borderColor: '#5FD35F',  // Green border for offense
  },
  defenseBtn: { 
    borderWidth: 3, 
    borderColor: '#FF5A5A',  // Red border for defense
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
  touchdownBtn: {
    backgroundColor: '#5FD35F',
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
    borderColor: '#FFD700',
  },
  possessionToggleText: { 
    fontSize: 16, 
    fontFamily: 'NeueHaas-Bold', 
    color: '#FFD700',
  },
  twoColumnLayout: { flexDirection: 'row', gap: 20, flex: 1, minHeight: 600 },
  threeColumnLayout: { flexDirection: 'row', gap: 16, flex: 1, minHeight: 600 },
  columnThird: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 16, padding: 20, minHeight: 600 },
  columnHalf: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 16, padding: 20, minHeight: 600 },
  columnHeader: { marginBottom: 16 },
  backToCategories: { alignSelf: 'flex-start' },
  backToCategoriesText: { fontSize: 14, fontFamily: 'NeueHaas-Bold', color: '#0066cc' },
  sectionTitle: { fontSize: 20, fontFamily: 'NeueHaas-Bold', color: '#fff', marginBottom: 16 },
  searchInput: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, fontSize: 15, fontFamily: 'NeueHaas-Roman', color: '#fff', marginBottom: 16 },
  rosterList: { flex: 1 },
  positionLabel: { fontSize: 13, fontFamily: 'NeueHaas-Bold', color: '#999', marginTop: 12, marginBottom: 8 },
  playerItem: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerItemSelected: { backgroundColor: '#fff' },
  playerNumber: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0066cc', justifyContent: 'center', alignItems: 'center' },
  playerNumberText: { fontSize: 16, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  playerName: { fontSize: 16, fontFamily: 'NeueHaas-Bold', color: '#fff', flex: 1 },
  starterBadge: { backgroundColor: '#0066cc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  starterText: { fontSize: 11, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  yardLineContainer: { flex: 1 },
  yardLineLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  yardLineGroup: { alignItems: 'center' },
  yardLineLabel: { fontSize: 11, fontFamily: 'NeueHaas-Bold', color: '#999', marginBottom: 4 },
  yardLineValue: { fontSize: 24, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  yardLinePositive: { color: '#5FD35F' },
  yardLineNegative: { color: '#FF5A5A' },
  footballField: { marginBottom: 32 },
  fieldTitle: { fontSize: 14, fontFamily: 'NeueHaas-Bold', color: '#fff', marginBottom: 24, textAlign: 'center' },
  fieldRow: { height: 60, marginBottom: 24, position: 'relative' },
  fieldMarker: { position: 'absolute', top: 0, width: 3, height: 40, zIndex: 10 },
  startMarker: { width: 3, height: 40, backgroundColor: '#fff' },
  endMarker: { width: 3, height: 40, backgroundColor: '#ff0000' },
  yardLineStripe: { flexDirection: 'row', height: 60, backgroundColor: '#1a1a1a', borderRadius: 8 },
  yardLineSection: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#3a3a3a' },
  yardLabel: { fontSize: 11, fontFamily: 'NeueHaas-Bold', color: '#999' },
  fieldSlider: { width: '100%', height: 40, marginTop: -20 },
  submitButton: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 24 },
  submitButtonContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  submitButtonPositive: { backgroundColor: '#5FD35F' },
  submitButtonNegative: { backgroundColor: '#FF5A5A' },
  submitButtonText: { fontSize: 28, fontFamily: 'NeueHaas-Bold', color: '#000', letterSpacing: 1 },
  noSelectionPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
});