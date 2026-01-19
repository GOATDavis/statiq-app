import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/src/constants/design';
import { getScores, getGameRoster, getGameDistrict, GameRosterResponse, GameDistrictResponse } from '@/src/lib/api';
import type { LiveGame, FinishedGame } from '@/src/lib/types/game';
import GameLeaders from '@/components/game/GameLeaders';
import { GameShareCard } from '@/components/share/GameShareCard';

// Helper function to lighten a color
function lightenColor(hex: string, amount: number = 0.85): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

interface PlayerStat {
  name: string;
  position: string;
  stats: string;
}

interface Play {
  id: string;
  quarter: number;
  time: string;
  down: string;
  distance: number;
  fieldPosition: string;
  yardLine: number;
  playerName?: string;
  playerPosition?: string;
  action: string;
  playerStats?: string;
  secondaryPlayer?: {
    name: string;
    position: string;
    stats: string;
  };
  yardsGained: number;
  isBigPlay: boolean;
  isScoring: boolean;
  possession: 'home' | 'away';
  type: 'rush' | 'pass' | 'punt' | 'kickoff' | 'fieldgoal' | 'penalty' | 'timeout';
  homeScoreAtTime: number;
  awayScoreAtTime: number;
}

interface GameScore {
  homeTeam: string;
  homeTeamShort: string;
  homeTeamId?: string;
  awayTeam: string;
  awayTeamShort: string;
  awayTeamId?: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: string;
  possession: 'home' | 'away';
  down: string;
  distance: number;
  fieldPosition: string;
  yardLine: number;
  homeColor: string;
  awayColor: string;
}

export default function LiveGameScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [gameScore, setGameScore] = useState<GameScore | null>(null);
  const [plays, setPlays] = useState<Play[]>([]);
  const [activeTab, setActiveTab] = useState<'liveiq' | 'stats' | 'roster' | 'district'>('liveiq');
  
  // Share card ref
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    loadGame();
    const interval = setInterval(loadGame, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const loadGame = async () => {
    try {
      // [DEV] Handle Aledo demo game
      if (id === 'demo-aledo') {
        setGameScore({
          homeTeam: 'Aledo',
          homeTeamShort: 'ALE',
          awayTeam: 'Southlake Carroll',
          awayTeamShort: 'SLC',
          homeScore: 21,
          awayScore: 14,
          quarter: 3,
          timeRemaining: '8:42',
          possession: 'home',
          down: '2nd',
          distance: 6,
          fieldPosition: 'SLC 34',
          yardLine: 66,
          homeColor: '#FF6600', // Aledo orange
          awayColor: '#006847', // Carroll green
        });

        setPlays([
          {
            id: '1',
            quarter: 3,
            time: '8:42',
            down: '2nd',
            distance: 6,
            fieldPosition: 'SLC 34',
            yardLine: 66,
            playerName: 'H. Williams',
            playerPosition: 'RB',
            action: '4 yd rush',
            playerStats: '14 CAR, 87 YD, TD',
            secondaryPlayer: {
              name: 'M. Johnson',
              position: 'LB',
              stats: '6 TKL, 1 TFL',
            },
            yardsGained: 4,
            isBigPlay: false,
            isScoring: false,
            possession: 'home',
            type: 'rush',
            homeScoreAtTime: 21,
            awayScoreAtTime: 14,
          },
          {
            id: '2',
            quarter: 3,
            time: '9:15',
            down: '1st',
            distance: 10,
            fieldPosition: 'SLC 38',
            yardLine: 62,
            playerName: 'C. Davis',
            playerPosition: 'QB',
            action: '12 yd pass to J. Martinez',
            playerStats: '11/16 CMP, 156 YD, 2 TD',
            secondaryPlayer: {
              name: 'J. Martinez',
              position: 'WR',
              stats: '4 REC, 67 YD',
            },
            yardsGained: 12,
            isBigPlay: false,
            isScoring: false,
            possession: 'home',
            type: 'pass',
            homeScoreAtTime: 21,
            awayScoreAtTime: 14,
          },
          {
            id: '3',
            quarter: 3,
            time: '10:33',
            down: '3rd',
            distance: 4,
            fieldPosition: 'ALE 42',
            yardLine: 42,
            playerName: 'T. Anderson',
            playerPosition: 'WR',
            action: '22 yd catch',
            playerStats: '5 REC, 89 YD, TD',
            secondaryPlayer: {
              name: 'B. Thompson',
              position: 'QB',
              stats: '14/21 CMP, 178 YD, TD',
            },
            yardsGained: 22,
            isBigPlay: true,
            isScoring: false,
            possession: 'away',
            type: 'pass',
            homeScoreAtTime: 21,
            awayScoreAtTime: 14,
          },
          {
            id: 'timeout1',
            quarter: 3,
            time: '11:45',
            down: '',
            distance: 0,
            fieldPosition: '',
            yardLine: 0,
            action: 'Timeout 1 By Southlake Carroll',
            yardsGained: 0,
            isBigPlay: false,
            isScoring: false,
            possession: 'away',
            type: 'timeout',
            homeScoreAtTime: 21,
            awayScoreAtTime: 14,
          },
          {
            id: '4',
            quarter: 3,
            time: '0:08',
            down: '1st',
            distance: 10,
            fieldPosition: 'SLC 8',
            yardLine: 92,
            playerName: 'H. Williams',
            playerPosition: 'RB',
            action: 'TOUCHDOWN rush',
            playerStats: '13 CAR, 79 YD, TD',
            yardsGained: 8,
            isBigPlay: false,
            isScoring: true,
            possession: 'home',
            type: 'rush',
            homeScoreAtTime: 21,
            awayScoreAtTime: 14,
          },
          {
            id: '5',
            quarter: 2,
            time: '0:23',
            down: '2nd',
            distance: 8,
            fieldPosition: 'SLC 12',
            yardLine: 88,
            playerName: 'H. Williams',
            playerPosition: 'RB',
            action: 'TOUCHDOWN rush',
            playerStats: '12 CAR, 71 YD, TD',
            yardsGained: 12,
            isBigPlay: false,
            isScoring: true,
            possession: 'home',
            type: 'rush',
            homeScoreAtTime: 14,
            awayScoreAtTime: 14,
          },
          {
            id: '6',
            quarter: 2,
            time: '3:56',
            down: '1st',
            distance: 10,
            fieldPosition: 'ALE 25',
            yardLine: 25,
            playerName: 'C. Davis',
            playerPosition: 'QB',
            action: '45 yd pass to R. Smith',
            playerStats: '9/14 CMP, 144 YD, TD',
            secondaryPlayer: {
              name: 'R. Smith',
              position: 'WR',
              stats: '3 REC, 72 YD',
            },
            yardsGained: 45,
            isBigPlay: true,
            isScoring: false,
            possession: 'home',
            type: 'pass',
            homeScoreAtTime: 7,
            awayScoreAtTime: 14,
          },
          {
            id: '7',
            quarter: 2,
            time: '7:12',
            down: '3rd',
            distance: 2,
            fieldPosition: 'ALE 8',
            yardLine: 92,
            playerName: 'K. Brown',
            playerPosition: 'RB',
            action: 'TOUCHDOWN rush',
            playerStats: '8 CAR, 42 YD, TD',
            yardsGained: 8,
            isBigPlay: false,
            isScoring: true,
            possession: 'away',
            type: 'rush',
            homeScoreAtTime: 7,
            awayScoreAtTime: 14,
          },
          {
            id: '8',
            quarter: 1,
            time: '4:18',
            down: '2nd',
            distance: 6,
            fieldPosition: 'SLC 18',
            yardLine: 82,
            playerName: 'J. Martinez',
            playerPosition: 'WR',
            action: 'TOUCHDOWN catch',
            playerStats: '3 REC, 55 YD, TD',
            secondaryPlayer: {
              name: 'C. Davis',
              position: 'QB',
              stats: '6/9 CMP, 89 YD, TD',
            },
            yardsGained: 18,
            isBigPlay: false,
            isScoring: true,
            possession: 'home',
            type: 'pass',
            homeScoreAtTime: 7,
            awayScoreAtTime: 7,
          },
          {
            id: '9',
            quarter: 1,
            time: '9:45',
            down: '1st',
            distance: 10,
            fieldPosition: 'SLC 35',
            yardLine: 35,
            playerName: 'T. Anderson',
            playerPosition: 'WR',
            action: 'TOUCHDOWN catch',
            playerStats: '2 REC, 47 YD, TD',
            secondaryPlayer: {
              name: 'B. Thompson',
              position: 'QB',
              stats: '8/12 CMP, 112 YD, TD',
            },
            yardsGained: 35,
            isBigPlay: false,
            isScoring: true,
            possession: 'away',
            type: 'pass',
            homeScoreAtTime: 0,
            awayScoreAtTime: 7,
          },
        ]);

        setIsLoading(false);
        return;
      }

      // [DEV] Handle demo playoff game
      if (id === 'demo-playoff-001') {
        setGameScore({
          homeTeam: 'Highland Park',
          homeTeamShort: 'HP',
          awayTeam: 'Midlothian',
          awayTeamShort: 'MID',
          homeScore: 28,
          awayScore: 24,
          quarter: 4,
          timeRemaining: '3:47',
          possession: 'home',
          down: '2nd',
          distance: 7,
          fieldPosition: 'HP 38',
          yardLine: 38,
          homeColor: '#003087',
          awayColor: '#8B0000',
        });

        setPlays([
          {
            id: '1',
            quarter: 4,
            time: '3:47',
            down: '2nd',
            distance: 7,
            fieldPosition: 'HP 38',
            yardLine: 38,
            playerName: 'B. Johnson',
            playerPosition: 'RB',
            action: '4 yd rush',
            playerStats: '22 CAR, 142 YD, 2 TD',
            secondaryPlayer: {
              name: 'K. Williams',
              position: 'LB',
              stats: '12 TKL, 2 TFL',
            },
            yardsGained: 4,
            isBigPlay: false,
            isScoring: false,
            possession: 'home',
            type: 'rush',
            homeScoreAtTime: 28,
            awayScoreAtTime: 24,
          },
          {
            id: '2',
            quarter: 4,
            time: '5:23',
            down: '3rd',
            distance: 8,
            fieldPosition: 'MID 42',
            yardLine: 58,
            playerName: 'M. Rodriguez',
            playerPosition: 'WR',
            action: '15 yd catch',
            playerStats: '7 REC, 118 YD',
            secondaryPlayer: {
              name: 'D. Anderson',
              position: 'QB',
              stats: '18/26 CMP, 224 YD, TD',
            },
            yardsGained: 15,
            isBigPlay: true,
            isScoring: false,
            possession: 'away',
            type: 'pass',
            homeScoreAtTime: 28,
            awayScoreAtTime: 24,
          },
          {
            id: 'timeout1',
            quarter: 4,
            time: '6:45',
            down: '',
            distance: 0,
            fieldPosition: '',
            yardLine: 0,
            action: 'Timeout 2 By Highland Park',
            yardsGained: 0,
            isBigPlay: false,
            isScoring: false,
            possession: 'home',
            type: 'timeout',
            homeScoreAtTime: 28,
            awayScoreAtTime: 24,
          },
          {
            id: '3',
            quarter: 4,
            time: '7:12',
            down: '1st',
            distance: 10,
            fieldPosition: 'HP 22',
            yardLine: 78,
            playerName: 'T. Harris',
            playerPosition: 'WR',
            action: 'TOUCHDOWN catch',
            playerStats: '9 REC, 156 YD, 2 TD',
            secondaryPlayer: {
              name: 'C. Martinez',
              position: 'QB',
              stats: '21/31 CMP, 287 YD, 3 TD',
            },
            yardsGained: 22,
            isBigPlay: false,
            isScoring: true,
            possession: 'home',
            type: 'pass',
            homeScoreAtTime: 28,
            awayScoreAtTime: 24,
          },
          {
            id: '4',
            quarter: 3,
            time: '4:18',
            down: '2nd',
            distance: 3,
            fieldPosition: 'MID 8',
            yardLine: 92,
            playerName: 'J. Smith',
            playerPosition: 'RB',
            action: 'TOUCHDOWN rush',
            playerStats: '18 CAR, 94 YD, TD',
            yardsGained: 8,
            isBigPlay: false,
            isScoring: true,
            possession: 'away',
            type: 'rush',
            homeScoreAtTime: 21,
            awayScoreAtTime: 24,
          },
          {
            id: '5',
            quarter: 3,
            time: '8:34',
            down: '1st',
            distance: 10,
            fieldPosition: 'HP 45',
            yardLine: 45,
            playerName: 'C. Martinez',
            playerPosition: 'QB',
            action: '48 yd pass to R. Thompson',
            playerStats: '20/29 CMP, 265 YD, 2 TD',
            secondaryPlayer: {
              name: 'R. Thompson',
              position: 'WR',
              stats: '5 REC, 87 YD',
            },
            yardsGained: 48,
            isBigPlay: true,
            isScoring: false,
            possession: 'home',
            type: 'pass',
            homeScoreAtTime: 21,
            awayScoreAtTime: 17,
          },
          {
            id: 'timeout2',
            quarter: 3,
            time: '11:02',
            down: '',
            distance: 0,
            fieldPosition: '',
            yardLine: 0,
            action: 'Timeout 1 By Midlothian',
            yardsGained: 0,
            isBigPlay: false,
            isScoring: false,
            possession: 'away',
            type: 'timeout',
            homeScoreAtTime: 21,
            awayScoreAtTime: 17,
          },
          {
            id: '6',
            quarter: 2,
            time: '2:45',
            down: '3rd',
            distance: 12,
            fieldPosition: 'HP 28',
            yardLine: 72,
            playerName: 'B. Johnson',
            playerPosition: 'RB',
            action: 'TOUCHDOWN rush',
            playerStats: '18 CAR, 138 YD, TD',
            yardsGained: 28,
            isBigPlay: false,
            isScoring: true,
            possession: 'home',
            type: 'rush',
            homeScoreAtTime: 21,
            awayScoreAtTime: 17,
          },
          {
            id: '7',
            quarter: 2,
            time: '6:17',
            down: '2nd',
            distance: 6,
            fieldPosition: 'MID 35',
            yardLine: 35,
            playerName: 'D. Anderson',
            playerPosition: 'QB',
            action: '42 yd pass to L. Davis',
            playerStats: '16/24 CMP, 182 YD',
            secondaryPlayer: {
              name: 'L. Davis',
              position: 'WR',
              stats: '4 REC, 68 YD',
            },
            yardsGained: 42,
            isBigPlay: true,
            isScoring: false,
            possession: 'away',
            type: 'pass',
            homeScoreAtTime: 14,
            awayScoreAtTime: 17,
          },
          {
            id: '8',
            quarter: 2,
            time: '9:30',
            down: '2nd',
            distance: 5,
            fieldPosition: 'HP 5',
            yardLine: 95,
            playerName: 'M. Rodriguez',
            playerPosition: 'WR',
            action: 'TOUCHDOWN catch',
            playerStats: '5 REC, 88 YD, TD',
            secondaryPlayer: {
              name: 'D. Anderson',
              position: 'QB',
              stats: '14/22 CMP, 152 YD, TD',
            },
            yardsGained: 5,
            isBigPlay: false,
            isScoring: true,
            possession: 'away',
            type: 'pass',
            homeScoreAtTime: 14,
            awayScoreAtTime: 17,
          },
          {
            id: '9',
            quarter: 1,
            time: '3:22',
            down: '1st',
            distance: 10,
            fieldPosition: 'MID 32',
            yardLine: 68,
            playerName: 'B. Johnson',
            playerPosition: 'RB',
            action: 'TOUCHDOWN rush',
            playerStats: '12 CAR, 98 YD, TD',
            yardsGained: 32,
            isBigPlay: false,
            isScoring: true,
            possession: 'home',
            type: 'rush',
            homeScoreAtTime: 14,
            awayScoreAtTime: 10,
          },
          {
            id: '10',
            quarter: 1,
            time: '5:52',
            down: '1st',
            distance: 10,
            fieldPosition: 'MID 15',
            yardLine: 85,
            playerName: 'M. Rodriguez',
            playerPosition: 'WR',
            action: 'TOUCHDOWN catch',
            playerStats: '3 REC, 68 YD, TD',
            secondaryPlayer: {
              name: 'D. Anderson',
              position: 'QB',
              stats: '10/16 CMP, 122 YD, TD',
            },
            yardsGained: 15,
            isBigPlay: false,
            isScoring: true,
            possession: 'away',
            type: 'pass',
            homeScoreAtTime: 7,
            awayScoreAtTime: 10,
          },
          {
            id: '11',
            quarter: 1,
            time: '8:45',
            down: '3rd',
            distance: 3,
            fieldPosition: 'HP 3',
            yardLine: 97,
            playerName: 'T. Harris',
            playerPosition: 'WR',
            action: 'TOUCHDOWN catch',
            playerStats: '2 REC, 38 YD, TD',
            secondaryPlayer: {
              name: 'C. Martinez',
              position: 'QB',
              stats: '6/10 CMP, 78 YD, TD',
            },
            yardsGained: 3,
            isBigPlay: false,
            isScoring: true,
            possession: 'home',
            type: 'pass',
            homeScoreAtTime: 7,
            awayScoreAtTime: 3,
          },
          {
            id: '12',
            quarter: 1,
            time: '11:15',
            down: '4th',
            distance: 2,
            fieldPosition: 'HP 22',
            yardLine: 22,
            playerName: 'J. Wilson',
            playerPosition: 'K',
            action: '39 yd field goal',
            playerStats: '1/1 FG',
            yardsGained: 0,
            isBigPlay: false,
            isScoring: true,
            possession: 'away',
            type: 'fieldgoal',
            homeScoreAtTime: 0,
            awayScoreAtTime: 3,
          },
        ]);

        setIsLoading(false);
        return;
      }

      // Fetch all games and find the specific one
      const scores = await getScores();
      const game = [...scores.live_games, ...scores.finished_games].find(
        g => g.id === id
      );

      if (!game) {
        console.error('Game not found:', id);
        setIsLoading(false);
        return;
      }

      // Check if it's a live game or finished game
      const isLive = 'quarter' in game && 'time_remaining' in game;

      setGameScore({
        homeTeam: game.home_team_name,
        homeTeamShort: game.home_team_name.split(' ').map(w => w[0]).join(''),
        homeTeamId: game.home_team_id,
        awayTeam: game.away_team_name,
        awayTeamShort: game.away_team_name.split(' ').map(w => w[0]).join(''),
        awayTeamId: game.away_team_id,
        homeScore: game.home_score,
        awayScore: game.away_score,
        quarter: isLive ? (game as LiveGame).quarter : 'Final',
        timeRemaining: isLive ? (game as LiveGame).time_remaining : '',
        possession: 'home', // TODO: Get from game data when available
        down: '3rd', // TODO: Get from game data when available
        distance: 2, // TODO: Get from game data when available
        fieldPosition: '', // TODO: Get from game data when available
        yardLine: 50, // TODO: Get from game data when available
        homeColor: game.home_primary_color || '#003087',
        awayColor: game.away_primary_color || '#8B0000',
      });

      setPlays([
        {
          id: '1',
          quarter: 4,
          time: '2:27',
          down: '3rd',
          distance: 2,
          fieldPosition: 'TC 29',
          yardLine: 71,
          playerName: 'T. Williams',
          playerPosition: 'RB',
          action: 'catch',
          playerStats: '18 CAR, 127 YD',
          secondaryPlayer: {
            name: 'J. Martinez',
            position: 'QB',
            stats: '12/18 CMP, 185 YD',
          },
          yardsGained: 8,
          isBigPlay: false,
          isScoring: false,
          possession: 'home',
          type: 'pass',
          homeScoreAtTime: game.home_score,
          awayScoreAtTime: game.away_score,
        },
        {
          id: 'timeout1',
          quarter: 4,
          time: '3:15',
          down: '',
          distance: 0,
          fieldPosition: '',
          yardLine: 0,
          action: 'Timeout 2 By Parish Episcopal',
          yardsGained: 0,
          isBigPlay: false,
          isScoring: false,
          possession: 'away',
          type: 'timeout',
          homeScoreAtTime: game.home_score,
          awayScoreAtTime: game.away_score,
        },
        {
          id: '2',
          quarter: 4,
          time: '3:42',
          down: '2nd',
          distance: 14,
          fieldPosition: 'PE 41',
          yardLine: 59,
          playerName: 'M. Johnson',
          playerPosition: 'WR',
          action: '18 yd catch',
          playerStats: '6 REC, 94 YD',
          secondaryPlayer: {
            name: 'C. Davis',
            position: 'QB',
            stats: '15/22 CMP, 178 YD',
          },
          yardsGained: 18,
          isBigPlay: true,
          isScoring: false,
          possession: 'away',
          type: 'pass',
          homeScoreAtTime: game.home_score,
          awayScoreAtTime: game.away_score,
        },
        {
          id: 'timeout2',
          quarter: 4,
          time: '4:18',
          down: '',
          distance: 0,
          fieldPosition: '',
          yardLine: 0,
          action: 'Timeout 1 By Trinity Christian',
          yardsGained: 0,
          isBigPlay: false,
          isScoring: false,
          possession: 'home',
          type: 'timeout',
          homeScoreAtTime: game.home_score,
          awayScoreAtTime: game.away_score,
        },
        {
          id: '3',
          quarter: 4,
          time: '5:23',
          down: '1st',
          distance: 10,
          fieldPosition: 'PE 35',
          yardLine: 35,
          playerName: 'D. Thompson',
          playerPosition: 'RB',
          action: '3 yd rush',
          playerStats: '14 CAR, 68 YD',
          secondaryPlayer: {
            name: 'K. Anderson',
            position: 'LB',
            stats: '8 TKL',
          },
          yardsGained: 3,
          isBigPlay: false,
          isScoring: false,
          possession: 'away',
          type: 'rush',
          homeScoreAtTime: game.home_score,
          awayScoreAtTime: game.away_score,
        },
        {
          id: '4',
          quarter: 3,
          time: '8:45',
          down: '2nd',
          distance: 6,
          fieldPosition: 'PE 8',
          yardLine: 92,
          playerName: 'T. Williams',
          playerPosition: 'RB',
          action: 'TOUCHDOWN rush',
          playerStats: '17 CAR, 119 YD, TD',
          yardsGained: 8,
          isBigPlay: false,
          isScoring: true,
          possession: 'home',
          type: 'rush',
          homeScoreAtTime: game.home_score,
          awayScoreAtTime: game.away_score - 7,
        },
        {
          id: '5',
          quarter: 3,
          time: '10:12',
          down: '3rd',
          distance: 12,
          fieldPosition: 'TC 42',
          yardLine: 42,
          playerName: 'J. Martinez',
          playerPosition: 'QB',
          action: 'pass complete to R. Smith',
          playerStats: '11/17 CMP, 177 YD',
          secondaryPlayer: {
            name: 'R. Smith',
            position: 'WR',
            stats: '4 REC, 72 YD',
          },
          yardsGained: 28,
          isBigPlay: true,
          isScoring: false,
          possession: 'home',
          type: 'pass',
          homeScoreAtTime: game.home_score - 7,
          awayScoreAtTime: game.away_score - 7,
        },
        {
          id: '6',
          quarter: 2,
          time: '5:34',
          down: '1st',
          distance: 10,
          fieldPosition: 'TC 15',
          yardLine: 85,
          playerName: 'M. Johnson',
          playerPosition: 'WR',
          action: 'TOUCHDOWN catch',
          playerStats: '5 REC, 76 YD, TD',
          secondaryPlayer: {
            name: 'C. Davis',
            position: 'QB',
            stats: '13/20 CMP, 163 YD, TD',
          },
          yardsGained: 15,
          isBigPlay: false,
          isScoring: true,
          possession: 'away',
          type: 'pass',
          homeScoreAtTime: game.home_score - 7,
          awayScoreAtTime: game.away_score - 7,
        },
      ]);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.SURGE} />
      </View>
    );
  }

  if (!gameScore) return null;

  // Handle share button with custom share card
  const handleShare = async () => {
    if (!gameScore || !viewShotRef.current) return;
    
    try {
      // Capture the share card as an image
      const uri = await viewShotRef.current.capture();
      
      // Share the image
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${gameScore.awayTeam} vs ${gameScore.homeTeam} - Live`,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Away team lightened color for gradient
  const awayColorLight = lightenColor(gameScore.awayColor, 0.95);

  return (
    <View style={styles.container}>
      {/* Header Bar - PregameIQ Style */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </Pressable>
        <View style={styles.headerIcons}>
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Pressable style={styles.iconButton}>
            <Image 
              source={require('@/assets/images/notification-bell-filled-white.png')}
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleShare}>
            <Image 
              source={require('@/assets/images/export-icon.png')}
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </View>

      {/* Hero Gradient Header - Score Display */}
      <LinearGradient
        colors={[gameScore.homeColor, Colors.SHADOW, Colors.SHADOW, awayColorLight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0, 0.05, 0.95, 1]}
        style={styles.heroGradient}
      >
        {/* Home Team - LEFT SIDE */}
        <Pressable
          style={styles.heroTeam}
          onPress={() => {
            if (gameScore.homeTeamId) {
              router.push(`/(fan)/team/${gameScore.homeTeamId}`);
            }
          }}
        >
          <Text style={styles.heroTeamName}>{gameScore.homeTeam.toUpperCase()}</Text>
          <Text style={styles.heroScore}>{gameScore.homeScore}</Text>
        </Pressable>

        {/* Center Info - Clock */}
        <View style={styles.heroCenter}>
          <Text style={styles.heroQuarter}>Q{gameScore.quarter}</Text>
          <Text style={styles.heroClock}>{gameScore.timeRemaining}</Text>
          <Text style={styles.heroSituation}>{gameScore.down} & {gameScore.distance}</Text>
        </View>

        {/* Away Team - RIGHT SIDE */}
        <Pressable
          style={styles.heroTeam}
          onPress={() => {
            if (gameScore.awayTeamId) {
              router.push(`/(fan)/team/${gameScore.awayTeamId}`);
            }
          }}
        >
          <Text style={styles.heroTeamName}>{gameScore.awayTeam.toUpperCase()}</Text>
          <Text style={styles.heroScore}>{gameScore.awayScore}</Text>
        </Pressable>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('liveiq')}
        >
          <Text style={[styles.tabText, activeTab === 'liveiq' && styles.tabTextActive]}>
            LiveIQ
          </Text>
          {activeTab === 'liveiq' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Stats
          </Text>
          {activeTab === 'stats' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('roster')}
        >
          <Text style={[styles.tabText, activeTab === 'roster' && styles.tabTextActive]}>
            Roster
          </Text>
          {activeTab === 'roster' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('district')}
        >
          <Text style={[styles.tabText, activeTab === 'district' && styles.tabTextActive]}>
            District
          </Text>
          {activeTab === 'district' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      {/* Tab Content */}
      {activeTab === 'liveiq' && (
        <ScrollView style={styles.playsContainer} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          {/* Game Leaders - StatIQ stat comparison */}
          <GameLeaders gameId={id as string} />

          {/* Play-by-play cards */}
          {plays.map((play) => (
            <PlayCard key={play.id} play={play} gameScore={gameScore} />
          ))}
        </ScrollView>
      )}

      {activeTab === 'stats' && (
        <View style={{ flex: 1 }}>
          <StatsTab gameScore={gameScore} bottomInset={insets.bottom} />
        </View>
      )}

      {activeTab === 'roster' && (
        <View style={{ flex: 1 }}>
          <RosterTab gameScore={gameScore} bottomInset={insets.bottom} gameId={id as string} />
        </View>
      )}

      {activeTab === 'district' && (
        <View style={{ flex: 1 }}>
          <DistrictTab gameScore={gameScore} bottomInset={insets.bottom} gameId={id as string} />
        </View>
      )}

      {/* Hidden Share Card for capture */}
      <ViewShot 
        ref={viewShotRef} 
        options={{ format: 'png', quality: 1 }}
        style={{ position: 'absolute', left: -1000 }}
      >
        <GameShareCard
          type="live"
          homeTeamName={gameScore.homeTeam}
          awayTeamName={gameScore.awayTeam}
          homeScore={gameScore.homeScore}
          awayScore={gameScore.awayScore}
          homeColor={gameScore.homeColor}
          awayColor={gameScore.awayColor}
          quarter={gameScore.quarter}
          timeRemaining={gameScore.timeRemaining}
        />
      </ViewShot>
    </View>
  );
}

// Custom Possession Football Icon Component
const PossessionIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616" style={{ transform: [{ rotate: '45deg' }] }}>
    <Path d="M18.163,49.589L0,65.114v30.387l18.163,15.525v-61.438Z" fill={color}/>
    <Path d="M142.453,49.589v61.438l18.163-15.525v-30.387l-18.163-15.525Z" fill={color}/>
    <Path d="M128.413,37.588l-9.577-8.186H41.78l-9.577,8.186v85.44l9.577,8.186h77.057l9.577-8.186V37.588ZM60.251,94.883h-9.25v-29.151h9.25v29.151ZM76.706,94.883h-9.25v-29.151h9.25v29.151ZM93.161,94.883h-9.25v-29.151h9.25v29.151ZM109.615,94.883h-9.25v-29.151h9.25v29.151Z" fill={color}/>
  </Svg>
);

// Field Position Bar Component
function FieldPositionBar({
  yardLine,
  possession,
  homeColor,
  awayColor,
}: {
  yardLine: number;
  possession: 'home' | 'away';
  homeColor: string;
  awayColor: string;
}) {
  const position = `${yardLine}%`;
  const barColor = possession === 'home' ? homeColor : awayColor;

  return (
    <View style={styles.fieldBarContainer}>
      <View style={styles.fieldBar}>
        {/* Base layers: white (0-75%), BLAZE red (75-100% = red zone) */}
        <View style={styles.fieldBarWhite} />
        <View style={styles.fieldBarRedZone} />
        
        {/* Filled portion in team color */}
        <View style={[styles.fieldBarFilled, { width: position, backgroundColor: barColor }]} />
        
        {/* Possession indicator - circle with ball icon on top of bar */}
        <View style={[styles.possessionCircle, { left: position }]}>
          <View style={styles.possessionInner}>
            <PossessionIcon color={barColor} />
          </View>
        </View>
      </View>
    </View>
  );
}

// Stats Tab Component - ESPN Style with Sub-tabs
function StatsTab({ gameScore, bottomInset }: { gameScore: GameScore; bottomInset: number }) {
  const [activeSubTab, setActiveSubTab] = useState<'team' | 'offense' | 'defense' | 'specialteams'>('team');

  // Demo team stats data
  const teamStats = {
    totalYards: { home: 287, away: 234 },
    passingYards: { home: 156, away: 178 },
    rushingYards: { home: 131, away: 56 },
    firstDowns: { home: 14, away: 11 },
    thirdDowns: { home: '5/9', away: '3/8' },
    fourthDowns: { home: '1/1', away: '0/1' },
    turnovers: { home: 0, away: 1 },
    penalties: { home: '4/35', away: '6/52' },
    timeOfPossession: { home: '18:42', away: '14:18' },
    sacks: { home: 2, away: 1 },
    redZone: { home: '2/3', away: '2/2' },
  };

  // Demo individual stats data
  const playerStats = {
    passing: {
      home: [
        { name: 'C. Davis', pos: 'QB', num: 12, comp: 11, att: 16, yards: 156, td: 2, int: 0, lng: 45, rtg: 142.3 },
      ],
      away: [
        { name: 'B. Thompson', pos: 'QB', num: 7, comp: 14, att: 21, yards: 178, td: 1, int: 1, lng: 38, rtg: 98.7 },
      ],
    },
    rushing: {
      home: [
        { name: 'H. Williams', pos: 'RB', num: 22, car: 14, yards: 87, avg: 6.2, td: 1, lng: 22 },
        { name: 'C. Davis', pos: 'QB', num: 12, car: 3, yards: 18, avg: 6.0, td: 0, lng: 12 },
      ],
      away: [
        { name: 'K. Brown', pos: 'RB', num: 28, car: 8, yards: 42, avg: 5.3, td: 1, lng: 15 },
        { name: 'B. Thompson', pos: 'QB', num: 7, car: 2, yards: 14, avg: 7.0, td: 0, lng: 9 },
      ],
    },
    receiving: {
      home: [
        { name: 'J. Martinez', pos: 'WR', num: 1, rec: 4, yards: 67, avg: 16.8, td: 1, lng: 28, tgt: 6 },
        { name: 'R. Smith', pos: 'WR', num: 11, rec: 3, yards: 52, avg: 17.3, td: 0, lng: 24, tgt: 4 },
        { name: 'T. Wilson', pos: 'TE', num: 88, rec: 2, yards: 22, avg: 11.0, td: 0, lng: 14, tgt: 3 },
      ],
      away: [
        { name: 'T. Anderson', pos: 'WR', num: 4, rec: 5, yards: 89, avg: 17.8, td: 1, lng: 35, tgt: 8 },
        { name: 'D. Harris', pos: 'WR', num: 15, rec: 4, yards: 52, avg: 13.0, td: 0, lng: 18, tgt: 5 },
        { name: 'M. Lewis', pos: 'TE', num: 85, rec: 3, yards: 28, avg: 9.3, td: 0, lng: 12, tgt: 4 },
      ],
    },
    tackles: {
      home: [
        { name: 'D. Miller', pos: 'LB', num: 54, tkl: 8, solo: 5, ast: 3, tfl: 2, sack: 1.0, ff: 0 },
        { name: 'K. Jackson', pos: 'S', num: 21, tkl: 6, solo: 4, ast: 2, tfl: 1, sack: 0.5, ff: 0 },
        { name: 'S. Williams', pos: 'CB', num: 3, tkl: 5, solo: 3, ast: 2, tfl: 0, sack: 0, ff: 0 },
      ],
      away: [
        { name: 'M. Johnson', pos: 'LB', num: 52, tkl: 6, solo: 4, ast: 2, tfl: 1, sack: 0, ff: 1 },
        { name: 'R. Davis', pos: 'LB', num: 44, tkl: 5, solo: 3, ast: 2, tfl: 0, sack: 0.5, ff: 0 },
        { name: 'J. Thomas', pos: 'DL', num: 99, tkl: 4, solo: 2, ast: 2, tfl: 1, sack: 0, ff: 0 },
      ],
    },
    interceptions: {
      home: [
        { name: 'S. Williams', pos: 'CB', num: 3, int: 1, yards: 23, td: 0 },
      ],
      away: [],
    },
    fumbles: {
      home: [],
      away: [
        { name: 'K. Brown', pos: 'RB', num: 28, lost: 1, rec: 0 },
      ],
    },
    // Special Teams
    kicking: {
      home: [
        { name: 'J. Parker', pos: 'K', num: 95, fgm: 0, fga: 0, xpm: 3, xpa: 3, pts: 3, lng: 0 },
      ],
      away: [
        { name: 'M. Wilson', pos: 'K', num: 8, fgm: 0, fga: 0, xpm: 2, xpa: 2, pts: 2, lng: 0 },
      ],
    },
    punting: {
      home: [
        { name: 'T. Baker', pos: 'P', num: 14, punts: 2, yards: 87, avg: 43.5, inside20: 1, lng: 48, tb: 0 },
      ],
      away: [
        { name: 'C. Moore', pos: 'P', num: 19, punts: 3, yards: 118, avg: 39.3, inside20: 1, lng: 45, tb: 1 },
      ],
    },
    kickReturns: {
      home: [
        { name: 'R. Smith', pos: 'WR', num: 11, ret: 2, yards: 48, avg: 24.0, td: 0, lng: 32 },
      ],
      away: [
        { name: 'T. Anderson', pos: 'WR', num: 4, ret: 3, yards: 67, avg: 22.3, td: 0, lng: 28 },
      ],
    },
    puntReturns: {
      home: [
        { name: 'J. Martinez', pos: 'WR', num: 1, ret: 1, yards: 12, avg: 12.0, td: 0, lng: 12 },
      ],
      away: [
        { name: 'D. Harris', pos: 'WR', num: 15, ret: 2, yards: 18, avg: 9.0, td: 0, lng: 14 },
      ],
    },
  };

  // Team Stats Row Component
  const StatRow = ({ 
    label, 
    homeValue, 
    awayValue, 
    isBar = false 
  }: { 
    label: string; 
    homeValue: string | number; 
    awayValue: string | number;
    isBar?: boolean;
  }) => {
    const homeNum = typeof homeValue === 'number' ? homeValue : parseInt(homeValue.toString());
    const awayNum = typeof awayValue === 'number' ? awayValue : parseInt(awayValue.toString());
    const total = homeNum + awayNum || 1;
    const homePercent = (homeNum / total) * 100;
    const awayPercent = (awayNum / total) * 100;
    const homeWins = homeNum > awayNum;
    const awayWins = awayNum > homeNum;

    return (
      <View style={styles.statRow}>
        <Text style={[styles.statValue, styles.statValueLeft, homeWins && styles.statValueWinner]}>
          {homeValue}
        </Text>
        {isBar ? (
          <View style={styles.statBarContainer}>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statBarWrapper}>
              <View style={[styles.statBarHome, { width: `${homePercent}%`, backgroundColor: gameScore.homeColor }]} />
              <View style={[styles.statBarAway, { width: `${awayPercent}%`, backgroundColor: gameScore.awayColor }]} />
            </View>
          </View>
        ) : (
          <Text style={styles.statLabel}>{label}</Text>
        )}
        <Text style={[styles.statValue, styles.statValueRight, awayWins && styles.statValueWinner]}>
          {awayValue}
        </Text>
      </View>
    );
  };

  // Player Stat Row Component
  const PlayerStatRow = ({ 
    name, 
    stats, 
    teamColor,
    isHome 
  }: { 
    name: string; 
    stats: string; 
    teamColor: string;
    isHome: boolean;
  }) => {
    const initials = name.split(' ').map(n => n.charAt(0)).join('');
    return (
      <View style={styles.playerStatRow}>
        <View style={[
          styles.playerStatAvatar, 
          isHome 
            ? { backgroundColor: teamColor }
            : { backgroundColor: '#fff', borderWidth: 2, borderColor: teamColor }
        ]}>
          <Text style={[styles.playerStatAvatarText, !isHome && { color: teamColor }]}>{initials}</Text>
        </View>
        <Text style={styles.playerStatName}>{name}</Text>
        <Text style={styles.playerStatStats}>{stats}</Text>
      </View>
    );
  };

  // Section Header Component
  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  // Team Header for Individual Stats
  const TeamHeader = ({ name, color }: { name: string; color: string }) => (
    <View style={[styles.teamStatHeader, { borderLeftColor: color }]}>
      <Text style={styles.teamStatHeaderText}>{name}</Text>
    </View>
  );

  // Render Team Stats Tab
  const renderTeamStats = () => (
    <View style={styles.statsContent}>
      {/* Team Headers */}
      <View style={styles.statsHeader}>
        <View style={styles.statsTeamHeader}>
          <View style={[styles.statsTeamDot, { backgroundColor: gameScore.homeColor }]} />
          <Text style={styles.statsTeamName}>{gameScore.homeTeamShort}</Text>
        </View>
        <Text style={styles.statsTitle}>TEAM STATS</Text>
        <View style={styles.statsTeamHeader}>
          <Text style={styles.statsTeamName}>{gameScore.awayTeamShort}</Text>
          <View style={[styles.statsTeamDot, { backgroundColor: gameScore.awayColor }]} />
        </View>
      </View>

      {/* Stats Rows */}
      <StatRow label="Total Yards" homeValue={teamStats.totalYards.home} awayValue={teamStats.totalYards.away} isBar />
      <StatRow label="Passing Yards" homeValue={teamStats.passingYards.home} awayValue={teamStats.passingYards.away} isBar />
      <StatRow label="Rushing Yards" homeValue={teamStats.rushingYards.home} awayValue={teamStats.rushingYards.away} isBar />
      <StatRow label="First Downs" homeValue={teamStats.firstDowns.home} awayValue={teamStats.firstDowns.away} />
      <StatRow label="3rd Down" homeValue={teamStats.thirdDowns.home} awayValue={teamStats.thirdDowns.away} />
      <StatRow label="4th Down" homeValue={teamStats.fourthDowns.home} awayValue={teamStats.fourthDowns.away} />
      <StatRow label="Red Zone" homeValue={teamStats.redZone.home} awayValue={teamStats.redZone.away} />
      <StatRow label="Turnovers" homeValue={teamStats.turnovers.home} awayValue={teamStats.turnovers.away} />
      <StatRow label="Penalties" homeValue={teamStats.penalties.home} awayValue={teamStats.penalties.away} />
      <StatRow label="Sacks" homeValue={teamStats.sacks.home} awayValue={teamStats.sacks.away} />
      <StatRow label="Time of Possession" homeValue={teamStats.timeOfPossession.home} awayValue={teamStats.timeOfPossession.away} />
    </View>
  );

  // Render Offense Stats Tab
  const renderOffenseStats = () => (
    <View style={styles.statsContent}>
      {/* PASSING */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>PASSING</Text>
        </View>
        
        {/* Column Headers - Fixed + Scrollable */}
        <View style={styles.scrollableTableHeader}>
          <View style={styles.fixedPlayerHeader}>
            <Text style={styles.fixedHeaderText}>PLAYER</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableHeaderArea}>
            <View style={styles.scrollableHeaderRow}>
              <Text style={styles.scrollStatHeader}>C/A</Text>
              <Text style={styles.scrollStatHeader}>YDS</Text>
              <Text style={styles.scrollStatHeader}>TD</Text>
              <Text style={styles.scrollStatHeader}>INT</Text>
              <Text style={styles.scrollStatHeader}>LNG</Text>
              <Text style={styles.scrollStatHeader}>RTG</Text>
            </View>
          </ScrollView>
        </View>
        
        {/* Home Team Section */}
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.passing.home.map((p, i) => (
          <View key={`home-pass-${i}`} style={styles.scrollableTableRow}>
            <View style={styles.fixedPlayerCell}>
              <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerNameCell}>{p.name}</Text>
                <Text style={styles.playerPosNum}>{p.pos} #{p.num}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableStatsArea}>
              <View style={styles.scrollableStatsRow}>
                <Text style={styles.scrollStatCell}>{p.comp}/{p.att}</Text>
                <Text style={[styles.scrollStatCell, styles.statHighlight]}>{p.yards}</Text>
                <Text style={styles.scrollStatCell}>{p.td}</Text>
                <Text style={styles.scrollStatCell}>{p.int}</Text>
                <Text style={styles.scrollStatCell}>{p.lng}</Text>
                <Text style={styles.scrollStatCell}>{p.rtg.toFixed(1)}</Text>
              </View>
            </ScrollView>
          </View>
        ))}
        
        {/* Away Team Section */}
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.passing.away.map((p, i) => (
          <View key={`away-pass-${i}`} style={styles.scrollableTableRow}>
            <View style={styles.fixedPlayerCell}>
              <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerNameCell}>{p.name}</Text>
                <Text style={styles.playerPosNum}>{p.pos} #{p.num}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableStatsArea}>
              <View style={styles.scrollableStatsRow}>
                <Text style={styles.scrollStatCell}>{p.comp}/{p.att}</Text>
                <Text style={[styles.scrollStatCell, styles.statHighlight]}>{p.yards}</Text>
                <Text style={styles.scrollStatCell}>{p.td}</Text>
                <Text style={styles.scrollStatCell}>{p.int}</Text>
                <Text style={styles.scrollStatCell}>{p.lng}</Text>
                <Text style={styles.scrollStatCell}>{p.rtg.toFixed(1)}</Text>
              </View>
            </ScrollView>
          </View>
        ))}
      </View>

      {/* RUSHING */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>RUSHING</Text>
        </View>
        
        <View style={styles.scrollableTableHeader}>
          <View style={styles.fixedPlayerHeader}>
            <Text style={styles.fixedHeaderText}>PLAYER</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableHeaderArea}>
            <View style={styles.scrollableHeaderRow}>
              <Text style={styles.scrollStatHeader}>CAR</Text>
              <Text style={styles.scrollStatHeader}>YDS</Text>
              <Text style={styles.scrollStatHeader}>AVG</Text>
              <Text style={styles.scrollStatHeader}>TD</Text>
              <Text style={styles.scrollStatHeader}>LNG</Text>
            </View>
          </ScrollView>
        </View>
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.rushing.home.map((p, i) => (
          <View key={`home-rush-${i}`} style={styles.scrollableTableRow}>
            <View style={styles.fixedPlayerCell}>
              <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerNameCell}>{p.name}</Text>
                <Text style={styles.playerPosNum}>{p.pos} #{p.num}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableStatsArea}>
              <View style={styles.scrollableStatsRow}>
                <Text style={styles.scrollStatCell}>{p.car}</Text>
                <Text style={[styles.scrollStatCell, styles.statHighlight]}>{p.yards}</Text>
                <Text style={styles.scrollStatCell}>{p.avg.toFixed(1)}</Text>
                <Text style={styles.scrollStatCell}>{p.td}</Text>
                <Text style={styles.scrollStatCell}>{p.lng}</Text>
              </View>
            </ScrollView>
          </View>
        ))}
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.rushing.away.map((p, i) => (
          <View key={`away-rush-${i}`} style={styles.scrollableTableRow}>
            <View style={styles.fixedPlayerCell}>
              <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerNameCell}>{p.name}</Text>
                <Text style={styles.playerPosNum}>{p.pos} #{p.num}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableStatsArea}>
              <View style={styles.scrollableStatsRow}>
                <Text style={styles.scrollStatCell}>{p.car}</Text>
                <Text style={[styles.scrollStatCell, styles.statHighlight]}>{p.yards}</Text>
                <Text style={styles.scrollStatCell}>{p.avg.toFixed(1)}</Text>
                <Text style={styles.scrollStatCell}>{p.td}</Text>
                <Text style={styles.scrollStatCell}>{p.lng}</Text>
              </View>
            </ScrollView>
          </View>
        ))}
      </View>

      {/* RECEIVING */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>RECEIVING</Text>
        </View>
        
        <View style={styles.scrollableTableHeader}>
          <View style={styles.fixedPlayerHeader}>
            <Text style={styles.fixedHeaderText}>PLAYER</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableHeaderArea}>
            <View style={styles.scrollableHeaderRow}>
              <Text style={styles.scrollStatHeader}>REC</Text>
              <Text style={styles.scrollStatHeader}>TGT</Text>
              <Text style={styles.scrollStatHeader}>YDS</Text>
              <Text style={styles.scrollStatHeader}>AVG</Text>
              <Text style={styles.scrollStatHeader}>TD</Text>
              <Text style={styles.scrollStatHeader}>LNG</Text>
            </View>
          </ScrollView>
        </View>
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.receiving.home.map((p, i) => (
          <View key={`home-rec-${i}`} style={styles.scrollableTableRow}>
            <View style={styles.fixedPlayerCell}>
              <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerNameCell}>{p.name}</Text>
                <Text style={styles.playerPosNum}>{p.pos} #{p.num}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableStatsArea}>
              <View style={styles.scrollableStatsRow}>
                <Text style={styles.scrollStatCell}>{p.rec}</Text>
                <Text style={styles.scrollStatCell}>{p.tgt}</Text>
                <Text style={[styles.scrollStatCell, styles.statHighlight]}>{p.yards}</Text>
                <Text style={styles.scrollStatCell}>{p.avg.toFixed(1)}</Text>
                <Text style={styles.scrollStatCell}>{p.td}</Text>
                <Text style={styles.scrollStatCell}>{p.lng}</Text>
              </View>
            </ScrollView>
          </View>
        ))}
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.receiving.away.map((p, i) => (
          <View key={`away-rec-${i}`} style={styles.scrollableTableRow}>
            <View style={styles.fixedPlayerCell}>
              <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerNameCell}>{p.name}</Text>
                <Text style={styles.playerPosNum}>{p.pos} #{p.num}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableStatsArea}>
              <View style={styles.scrollableStatsRow}>
                <Text style={styles.scrollStatCell}>{p.rec}</Text>
                <Text style={styles.scrollStatCell}>{p.tgt}</Text>
                <Text style={[styles.scrollStatCell, styles.statHighlight]}>{p.yards}</Text>
                <Text style={styles.scrollStatCell}>{p.avg.toFixed(1)}</Text>
                <Text style={styles.scrollStatCell}>{p.td}</Text>
                <Text style={styles.scrollStatCell}>{p.lng}</Text>
              </View>
            </ScrollView>
          </View>
        ))}
      </View>
    </View>
  );

  // Render Defense Stats Tab
  const renderDefenseStats = () => (
    <View style={styles.statsContent}>
      {/* TACKLES */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>TACKLES</Text>
        </View>
        
        <View style={styles.statTableHeader}>
          <Text style={[styles.statTableHeaderCell, { flex: 2, textAlign: 'left' }]}>PLAYER</Text>
          <Text style={styles.statTableHeaderCell}>TKL</Text>
          <Text style={styles.statTableHeaderCell}>SOLO</Text>
          <Text style={styles.statTableHeaderCell}>TFL</Text>
          <Text style={styles.statTableHeaderCell}>SCK</Text>
        </View>
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.tackles.home.map((p, i) => (
          <View key={`home-tkl-${i}`} style={styles.statTableRow}>
            <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <Text style={styles.playerNameCell}>{p.name}</Text>
            </View>
            <Text style={[styles.statTableCell, styles.statHighlight]}>{p.tkl}</Text>
            <Text style={styles.statTableCell}>{p.solo}</Text>
            <Text style={styles.statTableCell}>{p.tfl}</Text>
            <Text style={styles.statTableCell}>{p.sack}</Text>
          </View>
        ))}
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.tackles.away.map((p, i) => (
          <View key={`away-tkl-${i}`} style={styles.statTableRow}>
            <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <Text style={styles.playerNameCell}>{p.name}</Text>
            </View>
            <Text style={[styles.statTableCell, styles.statHighlight]}>{p.tkl}</Text>
            <Text style={styles.statTableCell}>{p.solo}</Text>
            <Text style={styles.statTableCell}>{p.tfl}</Text>
            <Text style={styles.statTableCell}>{p.sack}</Text>
          </View>
        ))}
      </View>

      {/* INTERCEPTIONS */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>INTERCEPTIONS</Text>
        </View>
        
        <View style={styles.statTableHeader}>
          <Text style={[styles.statTableHeaderCell, { flex: 2, textAlign: 'left' }]}>PLAYER</Text>
          <Text style={styles.statTableHeaderCell}>INT</Text>
          <Text style={[styles.statTableHeaderCell, { flex: 1.5 }]}>YDS</Text>
        </View>
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.interceptions.home.length > 0 ? (
          playerStats.interceptions.home.map((p, i) => (
            <View key={`home-int-${i}`} style={styles.statTableRow}>
              <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                  <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <Text style={styles.playerNameCell}>{p.name}</Text>
              </View>
              <Text style={[styles.statTableCell, styles.statHighlight]}>{p.int}</Text>
              <Text style={[styles.statTableCell, { flex: 1.5 }]}>{p.yards}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStatsText}>No interceptions</Text>
        )}
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.interceptions.away.length > 0 ? (
          playerStats.interceptions.away.map((p, i) => (
            <View key={`away-int-${i}`} style={styles.statTableRow}>
              <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <Text style={styles.playerNameCell}>{p.name}</Text>
              </View>
              <Text style={[styles.statTableCell, styles.statHighlight]}>{p.int}</Text>
              <Text style={[styles.statTableCell, { flex: 1.5 }]}>{p.yards}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStatsText}>No interceptions</Text>
        )}
      </View>

      {/* FUMBLES */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>FUMBLES FORCED</Text>
        </View>
        
        <View style={styles.statTableHeader}>
          <Text style={[styles.statTableHeaderCell, { flex: 2, textAlign: 'left' }]}>PLAYER</Text>
          <Text style={[styles.statTableHeaderCell, { flex: 1.5 }]}>LOST</Text>
        </View>
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.fumbles.home.length > 0 ? (
          playerStats.fumbles.home.map((p, i) => (
            <View key={`home-fum-${i}`} style={styles.statTableRow}>
              <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                  <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <Text style={styles.playerNameCell}>{p.name}</Text>
              </View>
              <Text style={[styles.statTableCell, styles.statHighlight, { flex: 1.5 }]}>{p.lost}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStatsText}>No fumbles lost</Text>
        )}
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.fumbles.away.length > 0 ? (
          playerStats.fumbles.away.map((p, i) => (
            <View key={`away-fum-${i}`} style={styles.statTableRow}>
              <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <Text style={styles.playerNameCell}>{p.name}</Text>
              </View>
              <Text style={[styles.statTableCell, styles.statHighlight, { flex: 1.5 }]}>{p.lost}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStatsText}>No fumbles lost</Text>
        )}
      </View>
    </View>
  );

  // Render Special Teams Stats Tab
  const renderSpecialTeamsStats = () => (
    <View style={styles.statsContent}>
      {/* KICKING */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>KICKING</Text>
        </View>
        
        <View style={styles.statTableHeader}>
          <Text style={[styles.statTableHeaderCell, { flex: 2, textAlign: 'left' }]}>PLAYER</Text>
          <Text style={styles.statTableHeaderCell}>FG</Text>
          <Text style={styles.statTableHeaderCell}>XP</Text>
          <Text style={styles.statTableHeaderCell}>PTS</Text>
        </View>
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.kicking.home.map((p, i) => (
          <View key={`home-kick-${i}`} style={styles.statTableRow}>
            <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <Text style={styles.playerNameCell}>{p.name}</Text>
            </View>
            <Text style={styles.statTableCell}>{p.fgm}/{p.fga}</Text>
            <Text style={styles.statTableCell}>{p.xpm}/{p.xpa}</Text>
            <Text style={[styles.statTableCell, styles.statHighlight]}>{p.pts}</Text>
          </View>
        ))}
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.kicking.away.map((p, i) => (
          <View key={`away-kick-${i}`} style={styles.statTableRow}>
            <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <Text style={styles.playerNameCell}>{p.name}</Text>
            </View>
            <Text style={styles.statTableCell}>{p.fgm}/{p.fga}</Text>
            <Text style={styles.statTableCell}>{p.xpm}/{p.xpa}</Text>
            <Text style={[styles.statTableCell, styles.statHighlight]}>{p.pts}</Text>
          </View>
        ))}
      </View>

      {/* PUNTING */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>PUNTING</Text>
        </View>
        
        <View style={styles.statTableHeader}>
          <Text style={[styles.statTableHeaderCell, { flex: 2, textAlign: 'left' }]}>PLAYER</Text>
          <Text style={styles.statTableHeaderCell}>PNT</Text>
          <Text style={styles.statTableHeaderCell}>YDS</Text>
          <Text style={styles.statTableHeaderCell}>AVG</Text>
          <Text style={styles.statTableHeaderCell}>I20</Text>
        </View>
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.punting.home.map((p, i) => (
          <View key={`home-punt-${i}`} style={styles.statTableRow}>
            <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <Text style={styles.playerNameCell}>{p.name}</Text>
            </View>
            <Text style={styles.statTableCell}>{p.punts}</Text>
            <Text style={[styles.statTableCell, styles.statHighlight]}>{p.yards}</Text>
            <Text style={styles.statTableCell}>{p.avg.toFixed(1)}</Text>
            <Text style={styles.statTableCell}>{p.inside20}</Text>
          </View>
        ))}
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.punting.away.map((p, i) => (
          <View key={`away-punt-${i}`} style={styles.statTableRow}>
            <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <Text style={styles.playerNameCell}>{p.name}</Text>
            </View>
            <Text style={styles.statTableCell}>{p.punts}</Text>
            <Text style={[styles.statTableCell, styles.statHighlight]}>{p.yards}</Text>
            <Text style={styles.statTableCell}>{p.avg.toFixed(1)}</Text>
            <Text style={styles.statTableCell}>{p.inside20}</Text>
          </View>
        ))}
      </View>

      {/* KICK RETURNS */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>KICK RETURNS</Text>
        </View>
        
        <View style={styles.statTableHeader}>
          <Text style={[styles.statTableHeaderCell, { flex: 2, textAlign: 'left' }]}>PLAYER</Text>
          <Text style={styles.statTableHeaderCell}>RET</Text>
          <Text style={styles.statTableHeaderCell}>YDS</Text>
          <Text style={styles.statTableHeaderCell}>AVG</Text>
          <Text style={styles.statTableHeaderCell}>TD</Text>
        </View>
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.kickReturns.home.length > 0 ? (
          playerStats.kickReturns.home.map((p, i) => (
            <View key={`home-kr-${i}`} style={styles.statTableRow}>
              <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                  <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <Text style={styles.playerNameCell}>{p.name}</Text>
              </View>
              <Text style={styles.statTableCell}>{p.ret}</Text>
              <Text style={[styles.statTableCell, styles.statHighlight]}>{p.yards}</Text>
              <Text style={styles.statTableCell}>{p.avg.toFixed(1)}</Text>
              <Text style={styles.statTableCell}>{p.td}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStatsText}>No kick returns</Text>
        )}
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.kickReturns.away.length > 0 ? (
          playerStats.kickReturns.away.map((p, i) => (
            <View key={`away-kr-${i}`} style={styles.statTableRow}>
              <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <Text style={styles.playerNameCell}>{p.name}</Text>
              </View>
              <Text style={styles.statTableCell}>{p.ret}</Text>
              <Text style={[styles.statTableCell, styles.statHighlight]}>{p.yards}</Text>
              <Text style={styles.statTableCell}>{p.avg.toFixed(1)}</Text>
              <Text style={styles.statTableCell}>{p.td}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStatsText}>No kick returns</Text>
        )}
      </View>

      {/* PUNT RETURNS */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>PUNT RETURNS</Text>
        </View>
        
        <View style={styles.statTableHeader}>
          <Text style={[styles.statTableHeaderCell, { flex: 2, textAlign: 'left' }]}>PLAYER</Text>
          <Text style={styles.statTableHeaderCell}>RET</Text>
          <Text style={styles.statTableHeaderCell}>YDS</Text>
          <Text style={styles.statTableHeaderCell}>AVG</Text>
          <Text style={styles.statTableHeaderCell}>TD</Text>
        </View>
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.homeColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.homeTeam}</Text>
        </View>
        {playerStats.puntReturns.home.length > 0 ? (
          playerStats.puntReturns.home.map((p, i) => (
            <View key={`home-pr-${i}`} style={styles.statTableRow}>
              <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.miniAvatar, { backgroundColor: gameScore.homeColor }]}>
                  <Text style={styles.miniAvatarText}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <Text style={styles.playerNameCell}>{p.name}</Text>
              </View>
              <Text style={styles.statTableCell}>{p.ret}</Text>
              <Text style={[styles.statTableCell, styles.statHighlight]}>{p.yards}</Text>
              <Text style={styles.statTableCell}>{p.avg.toFixed(1)}</Text>
              <Text style={styles.statTableCell}>{p.td}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStatsText}>No punt returns</Text>
        )}
        
        <View style={[styles.teamSection, { borderLeftColor: gameScore.awayColor }]}>
          <Text style={styles.teamSectionLabel}>{gameScore.awayTeam}</Text>
        </View>
        {playerStats.puntReturns.away.length > 0 ? (
          playerStats.puntReturns.away.map((p, i) => (
            <View key={`away-pr-${i}`} style={styles.statTableRow}>
              <View style={[styles.statTableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.miniAvatar, { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: gameScore.awayColor }]}>
                <Text style={[styles.miniAvatarText, { color: gameScore.awayColor }]}>{p.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <Text style={styles.playerNameCell}>{p.name}</Text>
              </View>
              <Text style={styles.statTableCell}>{p.ret}</Text>
              <Text style={[styles.statTableCell, styles.statHighlight]}>{p.yards}</Text>
              <Text style={styles.statTableCell}>{p.avg.toFixed(1)}</Text>
              <Text style={styles.statTableCell}>{p.td}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStatsText}>No punt returns</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.statsContainer}>
      {/* Sub-tab Navigation - STICKY */}
      <View style={styles.subTabBar}>
        <Pressable
          style={[styles.subTab, activeSubTab === 'team' && styles.subTabActive]}
          onPress={() => setActiveSubTab('team')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'team' && styles.subTabTextActive]}>
            Team
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, activeSubTab === 'offense' && styles.subTabActive]}
          onPress={() => setActiveSubTab('offense')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'offense' && styles.subTabTextActive]}>
            Offense
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, activeSubTab === 'defense' && styles.subTabActive]}
          onPress={() => setActiveSubTab('defense')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'defense' && styles.subTabTextActive]}>
            Defense
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, activeSubTab === 'specialteams' && styles.subTabActive]}
          onPress={() => setActiveSubTab('specialteams')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'specialteams' && styles.subTabTextActive]}>
            Special Teams
          </Text>
        </Pressable>
      </View>

      {/* Sub-tab Content - SCROLLABLE */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#0f0f0f' }} 
        contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
      >
        {activeSubTab === 'team' && renderTeamStats()}
        {activeSubTab === 'offense' && renderOffenseStats()}
        {activeSubTab === 'defense' && renderDefenseStats()}
        {activeSubTab === 'specialteams' && renderSpecialTeamsStats()}
      </ScrollView>
    </View>
  );
}

// Roster Tab Component
function RosterTab({ gameScore, bottomInset, gameId }: { gameScore: GameScore; bottomInset: number; gameId: string }) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [rosterData, setRosterData] = useState<GameRosterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoster();
  }, [gameId]);

  const loadRoster = async () => {
    // Skip API call for demo games
    if (gameId.startsWith('demo-')) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getGameRoster(gameId);
      setRosterData(data);
    } catch (err) {
      console.error('Error loading roster:', err);
      setError('Failed to load roster');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo roster data for demo games
  const demoRosterData = {
    home: [
      { name: 'J. Martinez', num: 1, pos: 'WR', classYear: 'Sr', height: "6'0\"", weight: 175 },
      { name: 'S. Williams', num: 3, pos: 'CB', classYear: 'Jr', height: "5'11\"", weight: 175 },
      { name: 'C. Davis', num: 12, pos: 'QB', classYear: 'Sr', height: "6'2\"", weight: 195 },
      { name: 'H. Williams', num: 22, pos: 'RB', classYear: 'Jr', height: "5'11\"", weight: 185 },
      { name: 'D. Miller', num: 54, pos: 'LB', classYear: 'Sr', height: "6'1\"", weight: 215 },
    ],
    away: [
      { name: 'T. Anderson', num: 4, pos: 'WR', classYear: 'Sr', height: "6'1\"", weight: 180 },
      { name: 'B. Thompson', num: 7, pos: 'QB', classYear: 'Sr', height: "6'1\"", weight: 190 },
      { name: 'K. Brown', num: 28, pos: 'RB', classYear: 'Jr', height: "5'10\"", weight: 180 },
      { name: 'M. Johnson', num: 56, pos: 'LB', classYear: 'Sr', height: "6'2\"", weight: 220 },
    ],
  };

  // Get current roster - use real data if available, otherwise demo
  const getCurrentRoster = () => {
    if (rosterData) {
      const team = selectedTeam === 'home' ? rosterData.home_team : rosterData.away_team;
      return team.players.map(p => ({
        name: p.name,
        num: p.jersey || 0,
        pos: p.position,
        classYear: p.class_year || '',
        height: p.height || '',
        weight: p.weight || 0
      }));
    }
    return selectedTeam === 'home' ? demoRosterData.home : demoRosterData.away;
  };

  const currentRoster = getCurrentRoster();
  const teamColor = selectedTeam === 'home' ? gameScore.homeColor : gameScore.awayColor;
  const isHome = selectedTeam === 'home';

  const PlayerRow = ({ player }: { player: { name: string; num: number; pos: string; classYear: string; height: string; weight: number } }) => {
    const initials = player.name.split(' ').map(n => n[0]).join('');
    return (
      <View style={rosterStyles.playerRow}>
        {/* Avatar */}
        <View style={[
          rosterStyles.playerAvatar,
          isHome 
            ? { backgroundColor: teamColor }
            : { backgroundColor: Colors.HALO, borderWidth: 2, borderColor: teamColor }
        ]}>
          <Text style={[rosterStyles.playerAvatarText, !isHome && { color: teamColor }]}>{initials}</Text>
        </View>
        {/* Large Jersey Number */}
        <Text style={[rosterStyles.playerNumber, { color: Colors.HALO }]}>
          {player.num}
        </Text>
        {/* Player Info */}
        <View style={rosterStyles.playerInfo}>
          <Text style={rosterStyles.playerName}>{player.name}</Text>
          <Text style={rosterStyles.playerDetails}>{player.pos} • {player.classYear} • {player.height} • {player.weight}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[rosterStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.SURGE} />
      </View>
    );
  }

  return (
    <View style={rosterStyles.container}>
      {/* Team Toggle - Single segmented button */}
      <View style={rosterStyles.teamToggle}>
        <View style={rosterStyles.toggleContainer}>
          <Pressable
            style={[
              rosterStyles.toggleSegment,
              rosterStyles.toggleSegmentLeft,
              { borderWidth: 2, borderColor: 'transparent' },
              selectedTeam === 'home' && { backgroundColor: gameScore.homeColor, borderColor: gameScore.homeColor }
            ]}
            onPress={() => setSelectedTeam('home')}
          >
            <Text style={[
              rosterStyles.toggleText,
              selectedTeam === 'home' && rosterStyles.toggleTextActive
            ]}>
              {gameScore.homeTeam}
            </Text>
          </Pressable>
          <Pressable
            style={[
              rosterStyles.toggleSegment,
              rosterStyles.toggleSegmentRight,
              { borderWidth: 2, borderColor: 'transparent' },
              selectedTeam === 'away' && { backgroundColor: Colors.HALO, borderColor: gameScore.awayColor }
            ]}
            onPress={() => setSelectedTeam('away')}
          >
            <Text style={[
              rosterStyles.toggleText,
              selectedTeam === 'away' && { color: gameScore.awayColor, fontWeight: '700' }
            ]}>
              {gameScore.awayTeam}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Roster List */}
      <ScrollView 
        style={rosterStyles.scrollView}
        contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
      >
        <View style={rosterStyles.rosterCard}>
          <View style={rosterStyles.cardHeader}>
            <Text style={rosterStyles.cardTitle}>ROSTER</Text>
            <Text style={rosterStyles.playerCount}>{currentRoster.length} Players</Text>
          </View>
          {currentRoster.map((player, i) => (
            <PlayerRow key={`${player.num}-${i}`} player={player} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Roster Tab Styles
const rosterStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  teamToggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  toggleSegment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  toggleSegmentLeft: {
    borderTopLeftRadius: 9,
    borderBottomLeftRadius: 9,
  },
  toggleSegmentRight: {
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
  },
  toggleSegmentActive: {
    // backgroundColor applied inline with team color
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  positionGroup: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginHorizontal: 8,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.HALO,
    letterSpacing: 1,
  },
  groupCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
    gap: 12,
  },
  playerNumber: {
    fontSize: 24,
    fontWeight: '800',
    width: 44,
    textAlign: 'center',
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  playerDetails: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  playerMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  playerClass: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  playerSize: {
    fontSize: 11,
    fontWeight: '500',
    color: '#555',
  },
  rosterCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginHorizontal: 8,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.HALO,
    letterSpacing: 1,
  },
  playerCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
});

// District Tab Component
function DistrictTab({ gameScore, bottomInset, gameId }: { gameScore: GameScore; bottomInset: number; gameId: string }) {
  const router = useRouter();
  const [districtData, setDistrictData] = useState<GameDistrictResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDistrict();
  }, [gameId]);

  const loadDistrict = async () => {
    // Skip API call for demo games
    if (gameId.startsWith('demo-')) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getGameDistrict(gameId);
      setDistrictData(data);
    } catch (err) {
      console.error('Error loading district:', err);
      setError('Failed to load district data');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo district data for demo games
  // 2024-2026 UIL Realignment: Aledo is in District 3-5A Division I with:
  // Ryan, Azle, Granbury, Fossil Ridge, Birdville, Richland, Brewer
  // Southlake Carroll is 6A (different classification) - this would be a non-district game
  const demoDistrictName = 'District 3-5A DI';
  
  const demoStandings = [
    { rank: 1, team: 'Aledo', record: '10-0', districtRecord: '7-0', streak: 'W10', color: '#FF6600', isCurrentGame: true },
    { rank: 2, team: 'Denton Ryan', record: '9-1', districtRecord: '6-1', streak: 'W4', color: '#003087' },
    { rank: 3, team: 'Fossil Ridge', record: '7-3', districtRecord: '5-2', streak: 'W2', color: '#00843D' },
    { rank: 4, team: 'Birdville', record: '6-4', districtRecord: '4-3', streak: 'L1', color: '#000080' },
    { rank: 5, team: 'Azle', record: '5-5', districtRecord: '3-4', streak: 'W1', color: '#006341' },
    { rank: 6, team: 'Granbury', record: '4-6', districtRecord: '2-5', streak: 'L2', color: '#8B0000' },
    { rank: 7, team: 'Richland', record: '3-7', districtRecord: '1-6', streak: 'L4', color: '#00205B' },
    { rank: 8, team: 'Brewer', record: '1-9', districtRecord: '0-7', streak: 'L7', color: '#4B0082' },
  ];

  const demoDistrictGames = [
    { 
      id: 'game-1',
      homeTeam: 'Denton Ryan', 
      awayTeam: 'Fossil Ridge', 
      homeScore: 28, 
      awayScore: 21, 
      status: 'Q4 5:32', 
      isLive: true,
      homeColor: '#003087',
      awayColor: '#00843D'
    },
    { 
      id: 'game-2',
      homeTeam: 'Birdville', 
      awayTeam: 'Azle', 
      homeScore: 17, 
      awayScore: 14, 
      status: 'Q3 2:45', 
      isLive: true,
      homeColor: '#000080',
      awayColor: '#006341'
    },
  ];

  // Get data - use real if available, otherwise demo
  const districtName = districtData?.district_name || demoDistrictName;
  
  const standings = districtData ? districtData.standings.map(s => ({
    rank: s.rank,
    team: s.team_name,
    record: s.overall_record,
    districtRecord: s.district_record,
    streak: `${s.streak_type}${s.streak}`,
    color: s.primary_color,
    isCurrentGame: s.is_current_game
  })) : demoStandings;

  const districtGames = districtData ? districtData.other_games.map(g => ({
    id: String(g.game_id),
    homeTeam: g.home_team_name,
    awayTeam: g.away_team_name,
    homeScore: g.home_score,
    awayScore: g.away_score,
    status: g.status === 'live' ? `Q${g.quarter || ''} ${g.time_remaining || ''}` : (g.status === 'final' ? 'Final' : 'Scheduled'),
    isLive: g.status === 'live',
    homeColor: g.home_team_color,
    awayColor: g.away_team_color
  })) : demoDistrictGames;

  return (
    <View style={districtStyles.container}>
      <ScrollView 
        style={districtStyles.scrollView}
        contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
      >
        {/* District Header */}
        <View style={districtStyles.districtHeader}>
          <Ionicons name="trophy" size={20} color={Colors.HALO} />
          <Text style={districtStyles.districtName}>{districtName}</Text>
        </View>

        {/* Standings Card */}
        <View style={districtStyles.standingsCard}>
          <View style={districtStyles.cardHeader}>
            <Text style={districtStyles.cardTitle}>STANDINGS</Text>
          </View>
          
          {/* Table Header */}
          <View style={districtStyles.tableHeader}>
            <Text style={[districtStyles.headerCell, { width: 30, textAlign: 'center' }]}>#</Text>
            <Text style={[districtStyles.headerCell, { flex: 1 }]}>TEAM</Text>
            <Text style={[districtStyles.headerCell, { width: 50, textAlign: 'center' }]}>DIST</Text>
            <Text style={[districtStyles.headerCell, { width: 50, textAlign: 'center' }]}>OVR</Text>
            <Text style={[districtStyles.headerCell, { width: 40, textAlign: 'center' }]}>STK</Text>
          </View>

          {/* Standings Rows */}
          {standings.map((team, index) => (
            <View 
              key={team.team} 
              style={[
                districtStyles.standingRow,
                team.isCurrentGame && districtStyles.standingRowHighlight,
                index === standings.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <Text style={[districtStyles.rankCell, { width: 30 }]}>{team.rank}</Text>
              <View style={[districtStyles.teamCell, { flex: 1 }]}>
                <View style={[districtStyles.teamDot, { backgroundColor: team.color }]} />
                <Text style={[
                  districtStyles.teamName,
                  team.isCurrentGame && districtStyles.teamNameHighlight
                ]}>
                  {team.team}
                </Text>
                {team.isCurrentGame && (
                  <View style={districtStyles.playingBadge}>
                    <Text style={districtStyles.playingBadgeText}>NOW</Text>
                  </View>
                )}
              </View>
              <Text style={[districtStyles.recordCell, { width: 50, textAlign: 'center' }]}>{team.districtRecord}</Text>
              <Text style={[districtStyles.recordCell, { width: 50, textAlign: 'center' }]}>{team.record}</Text>
              <Text style={[
                districtStyles.streakCell, 
                { width: 40, textAlign: 'center' },
                team.streak.startsWith('W') && districtStyles.streakWin,
                team.streak.startsWith('L') && districtStyles.streakLoss
              ]}>
                {team.streak}
              </Text>
            </View>
          ))}
        </View>

        {/* District Games Card */}
        <View style={districtStyles.gamesCard}>
          <View style={districtStyles.cardHeader}>
            <Text style={districtStyles.cardTitle}>DISTRICT GAMES</Text>
            <Text style={districtStyles.cardSubtitle}>Week 11</Text>
          </View>

          {/* Current Game - Highlighted */}
          <View style={districtStyles.currentGameCard}>
            <View style={districtStyles.currentGameBadge}>
              <View style={districtStyles.liveDot} />
              <Text style={districtStyles.currentGameBadgeText}>THIS GAME</Text>
            </View>
            <View style={districtStyles.gameRow}>
              <View style={districtStyles.gameTeam}>
                <View style={[districtStyles.gameTeamDot, { backgroundColor: gameScore.homeColor }]} />
                <Text style={districtStyles.gameTeamName}>{gameScore.homeTeam}</Text>
              </View>
              <Text style={districtStyles.gameScore}>{gameScore.homeScore}</Text>
            </View>
            <View style={districtStyles.gameRow}>
              <View style={districtStyles.gameTeam}>
                <View style={[districtStyles.gameTeamDot, { backgroundColor: gameScore.awayColor }]} />
                <Text style={districtStyles.gameTeamName}>{gameScore.awayTeam}</Text>
              </View>
              <Text style={districtStyles.gameScore}>{gameScore.awayScore}</Text>
            </View>
            <Text style={districtStyles.gameStatus}>Q{gameScore.quarter} {gameScore.timeRemaining}</Text>
          </View>

          {/* Other Games */}
          {districtGames.map((game, index) => (
            <Pressable 
              key={game.id} 
              style={[
                districtStyles.gameCard,
                index === districtGames.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              {game.isLive && (
                <View style={districtStyles.gameLiveBadge}>
                  <View style={districtStyles.liveDot} />
                  <Text style={districtStyles.gameLiveBadgeText}>LIVE</Text>
                </View>
              )}
              <View style={districtStyles.gameRow}>
                <View style={districtStyles.gameTeam}>
                  <View style={[districtStyles.gameTeamDot, { backgroundColor: game.homeColor }]} />
                  <Text style={districtStyles.gameTeamName}>{game.homeTeam}</Text>
                </View>
                <Text style={[
                  districtStyles.gameScore,
                  game.homeScore !== null && game.homeScore > (game.awayScore || 0) && districtStyles.gameScoreWinner
                ]}>
                  {game.homeScore !== null ? game.homeScore : '-'}
                </Text>
              </View>
              <View style={districtStyles.gameRow}>
                <View style={districtStyles.gameTeam}>
                  <View style={[districtStyles.gameTeamDot, { backgroundColor: game.awayColor }]} />
                  <Text style={districtStyles.gameTeamName}>{game.awayTeam}</Text>
                </View>
                <Text style={[
                  districtStyles.gameScore,
                  game.awayScore !== null && game.awayScore > (game.homeScore || 0) && districtStyles.gameScoreWinner
                ]}>
                  {game.awayScore !== null ? game.awayScore : '-'}
                </Text>
              </View>
              <Text style={[
                districtStyles.gameStatus,
                game.status === 'Final' && districtStyles.gameStatusFinal
              ]}>
                {game.status}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// District Tab Styles
const districtStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollView: {
    flex: 1,
  },
  districtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  districtName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  standingsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginHorizontal: 8,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  gamesCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginHorizontal: 8,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.HALO,
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#151515',
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 0.5,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  standingRowHighlight: {
    backgroundColor: 'rgba(180, 216, 54, 0.08)',
  },
  rankCell: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
  teamCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ccc',
  },
  teamNameHighlight: {
    color: '#fff',
    fontWeight: '700',
  },
  playingBadge: {
    backgroundColor: Colors.BLAZE,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  playingBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  recordCell: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  streakCell: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakWin: {
    color: Colors.SURGE,
  },
  streakLoss: {
    color: Colors.BLAZE,
  },
  currentGameCard: {
    backgroundColor: 'rgba(180, 216, 54, 0.1)',
    marginHorizontal: 10,
    marginVertical: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(180, 216, 54, 0.3)',
  },
  currentGameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  currentGameBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.SURGE,
    letterSpacing: 0.5,
  },
  gameCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  gameLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  gameLiveBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.BLAZE,
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.BLAZE,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  gameTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  gameTeamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gameTeamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  gameScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    minWidth: 36,
    textAlign: 'right',
  },
  gameScoreWinner: {
    color: '#fff',
  },
  gameStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  gameStatusFinal: {
    color: '#555',
  },
});

// Play Card Component
function PlayCard({ play, gameScore }: { play: Play; gameScore: GameScore }) {
  const possessionColor = play.possession === 'home' ? gameScore.homeColor : gameScore.awayColor;

  // Timeout cards are special
  if (play.type === 'timeout') {
    return (
      <View style={styles.timeoutCard}>
        <View style={styles.timeoutLine} />
        <Text style={styles.timeoutText}>{play.action}</Text>
        <View style={styles.timeoutLine} />
      </View>
    );
  }

  // Scoring plays get special treatment
  if (play.isScoring) {
    // Build clean action text
    let actionText = '';
    if (play.type === 'pass' && play.secondaryPlayer) {
      // For passing TDs: "C. Davis 18 yd pass to J. Martinez"
      actionText = `${play.secondaryPlayer.name} ${play.yardsGained} yd pass to ${play.playerName}`;
    } else if (play.type === 'rush') {
      // For rushing TDs: "H. Williams 12 yd rush"
      actionText = `${play.playerName} ${play.yardsGained} yd rush`;
    } else {
      // Fallback: just remove TOUCHDOWN from action
      actionText = `${play.playerName} ${play.action.replace(/TOUCHDOWN\s*/i, '')}`;
    }

    return (
      <View style={[styles.playCard, styles.scoringCard]}>
        {/* Top row: Down/Distance + TD Badge + Time/Score */}
        <View style={styles.playHeader}>
          <View style={styles.playHeaderLeft}>
            <Text style={styles.playDownDistance}>
              {play.down} & {play.distance} @ {play.fieldPosition}
            </Text>
            <View style={[styles.tdBadge, { backgroundColor: possessionColor }]}>
              <Ionicons name="american-football" size={10} color="#fff" />
              <Text style={styles.tdBadgeText}>TOUCHDOWN</Text>
            </View>
          </View>
          <View style={styles.playHeaderRight}>
            <Text style={styles.playTime}>Q{play.quarter} {play.time}</Text>
            <Text style={styles.playScore}>
              <Text style={play.possession === 'home' ? styles.scoreWinner : undefined}>
                {gameScore.homeTeamShort} {play.homeScoreAtTime}
              </Text>
              {' - '}
              <Text style={play.possession === 'away' ? styles.scoreWinner : undefined}>
                {gameScore.awayTeamShort} {play.awayScoreAtTime}
              </Text>
            </Text>
          </View>
        </View>

        {/* Player info row */}
        <View style={styles.playerRow}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[
              styles.avatarScoring, 
              { backgroundColor: possessionColor }
            ]}>
              <Text style={styles.avatarTextScoring}>
                {play.playerName?.split(' ')[0]?.charAt(0)}{play.playerName?.split(' ')[1]?.charAt(0)}
              </Text>
            </View>
          </View>

          {/* Player action - all bold for TDs */}
          <View style={styles.playerInfo}>
            <Text style={styles.playerActionScoring}>
              {actionText}
            </Text>
            
            {/* Player stats */}
            {play.playerStats && (
              <Text style={styles.playerStats}>
                {play.playerName} <Text style={styles.playerPosition}>{play.playerPosition}</Text> • {play.playerStats}
              </Text>
            )}
            
            {/* Secondary player stats */}
            {play.secondaryPlayer && (
              <Text style={styles.playerStats}>
                {play.secondaryPlayer.name} <Text style={styles.playerPosition}>{play.secondaryPlayer.position}</Text> • {play.secondaryPlayer.stats}
              </Text>
            )}
          </View>
        </View>

        {/* Field position bar - mini version */}
        <View style={styles.playFieldBarContainer}>
          <View style={styles.playFieldBar}>
            <View style={styles.playFieldBarWhite} />
            <View style={styles.playFieldBarRedZone} />
            <View
              style={[
                styles.playFieldBarFilled,
                { width: `${play.yardLine}%`, backgroundColor: possessionColor },
              ]}
            />
            <View style={[styles.playPossessionCircle, { left: `${play.yardLine}%` }]}>
              <View style={styles.playPossessionInner}>
                <PossessionIcon color={possessionColor} size={14} />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Regular play card

  return (
    <View style={[styles.playCard, play.isScoring && styles.playCardScoring]}>
      {/* Top row: Down/Distance + Key Play + Time/Score */}
      <View style={styles.playHeader}>
        <View style={styles.playHeaderLeft}>
          <Text style={styles.playDownDistance}>
            {play.down} & {play.distance} @ {play.fieldPosition}
          </Text>
          {play.isBigPlay && !play.isScoring && (
            <View style={styles.keyPlayBadge}>
              <Ionicons name="flame" size={10} color={Colors.SHADOW} />
              <Text style={styles.keyPlayText}>KEY PLAY</Text>
            </View>
          )}
        </View>
        <View style={styles.playHeaderRight}>
          <Text style={styles.playTime}>Q{play.quarter} {play.time}</Text>
          <Text style={styles.playScore}>
            {gameScore.homeTeamShort} {play.homeScoreAtTime} - {gameScore.awayTeamShort} {play.awayScoreAtTime}
          </Text>
        </View>
      </View>

      {/* Player info row */}
      <View style={styles.playerRow}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[
            styles.avatar, 
            play.possession === 'home' 
              ? { backgroundColor: possessionColor }
              : { backgroundColor: '#fff', borderWidth: 2, borderColor: possessionColor }
          ]}>
            <Text style={[
              styles.avatarText,
              play.possession === 'away' && { color: possessionColor }
            ]}>
              {play.playerName?.split(' ')[0]?.charAt(0)}{play.playerName?.split(' ')[1]?.charAt(0)}
            </Text>
          </View>
        </View>

        {/* Player action */}
        <View style={styles.playerInfo}>
          <Text style={styles.playerAction}>
            <Text style={styles.playerName}>{play.playerName}</Text> {play.action}
          </Text>
          
          {/* Player stats */}
          {play.playerStats && (
            <Text style={styles.playerStats}>
              {play.playerName} <Text style={styles.playerPosition}>{play.playerPosition}</Text> • {play.playerStats}
            </Text>
          )}
          
          {/* Secondary player stats */}
          {play.secondaryPlayer && (
            <Text style={styles.playerStats}>
              {play.secondaryPlayer.name} <Text style={styles.playerPosition}>{play.secondaryPlayer.position}</Text> • {play.secondaryPlayer.stats}
            </Text>
          )}
        </View>
      </View>

      {/* Field position bar - mini version */}
      <View style={styles.playFieldBarContainer}>
        <View style={styles.playFieldBar}>
          {/* Base layers */}
          <View style={styles.playFieldBarWhite} />
          <View style={styles.playFieldBarRedZone} />
          
          {/* Filled portion */}
          <View
            style={[
              styles.playFieldBarFilled,
              { width: `${play.yardLine}%`, backgroundColor: possessionColor },
            ]}
          />
          
          {/* Possession circle with ball icon */}
          <View style={[styles.playPossessionCircle, { left: `${play.yardLine}%` }]}>
            <View style={styles.playPossessionInner}>
              <PossessionIcon color={possessionColor} size={14} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header Bar - PregameIQ Style
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.SHADOW,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.BLAZE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.8,
  },

  // Hero Gradient Header
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  heroTeam: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
    maxWidth: 120,
  },
  heroTeamName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 14,
  },
  heroScore: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 44,
  },
  heroCenter: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 0,
  },
  heroQuarter: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.HALO,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 18,
  },
  heroClock: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    lineHeight: 30,
  },
  heroSituation: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.85,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 16,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.SHADOW,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: Colors.HALO,
    borderRadius: 2,
  },

  // FIELD POSITION BAR (Main)
  fieldBarContainer: {
    marginTop: 12,
  },
  fieldBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  fieldBarWhite: {
    position: 'absolute',
    left: 0,
    width: '75%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  fieldBarRedZone: {
    position: 'absolute',
    right: 0,
    width: '25%',
    height: '100%',
    backgroundColor: '#ff3636', // BLAZE red
    borderRadius: 4,
  },
  fieldBarFilled: {
    position: 'absolute',
    left: 0,
    height: '100%',
    borderRadius: 4,
    zIndex: 1,
  },
  possessionCircle: {
    position: 'absolute',
    top: -16,
    width: 36,
    height: 36,
    marginLeft: -18,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  possessionInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a0a0a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  possessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },

  // PLAY FEED
  playsContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  playCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  playCardScoring: {
    borderLeftWidth: 3,
    borderLeftColor: '#b4d836',
  },

  // SCORING CARD (Touchdowns)
  scoringCard: {
    // backgroundColor applied inline with team color
  },
  tdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  avatarScoring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextScoring: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  playerActionScoring: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  playerNameScoring: {
    fontWeight: '800',
  },
  playHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  playHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  playHeaderRight: {
    alignItems: 'flex-end',
  },
  keyPlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  keyPlayText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.SHADOW,
    letterSpacing: 0.5,
  },
  playDownDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.3,
  },
  playTime: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  playScore: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  scoreWinner: {
    color: '#fff',
    fontWeight: '700',
  },
  playerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  avatarContainer: {
    paddingTop: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  playerInfo: {
    flex: 1,
    gap: 3,
  },
  playerAction: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  playerName: {
    fontWeight: '700',
  },
  playerStats: {
    fontSize: 12,
    color: '#888',
    letterSpacing: 0.2,
  },
  playerPosition: {
    fontWeight: '600',
    color: '#666',
  },

  // FIELD POSITION BAR (Play Cards - smaller)
  playFieldBarContainer: {
    marginTop: 6,
  },
  playFieldBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
    backgroundColor: '#0f0f0f',
  },
  playFieldBarWhite: {
    position: 'absolute',
    left: 0,
    width: '75%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  playFieldBarRedZone: {
    position: 'absolute',
    right: 0,
    width: '25%',
    height: '100%',
    backgroundColor: '#ff3636', // BLAZE red
    borderRadius: 3,
  },
  playFieldBarFilled: {
    position: 'absolute',
    left: 0,
    height: '100%',
    borderRadius: 3,
    zIndex: 1,
  },
  playPossessionCircle: {
    position: 'absolute',
    top: -12,
    width: 28,
    height: 28,
    marginLeft: -14,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPossessionInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  playPossessionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },

  timeoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    gap: 12,
  },
  timeoutLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  timeoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.3,
  },

  // STATS TAB
  statsContainer: {
    flex: 1,
  },
  statsContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.HALO,
    marginBottom: -1,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  subTabTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#777',
    letterSpacing: 1.2,
  },
  teamStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
  teamStatHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.3,
  },
  playerStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  playerStatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerStatAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  playerStatName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  playerStatStats: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    letterSpacing: 0.2,
  },
  noStatsText: {
    fontSize: 12,
    color: '#666',
    paddingVertical: 8,
    paddingLeft: 13,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  statsTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsTeamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsTeamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  statsTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#777',
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  statValue: {
    width: 55,
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  statValueLeft: {
    textAlign: 'left',
  },
  statValueRight: {
    textAlign: 'right',
  },
  statValueWinner: {
    color: '#fff',
    fontWeight: '700',
  },
  statLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#777',
    textAlign: 'center',
  },
  statBarContainer: {
    flex: 1,
    gap: 4,
  },
  statBarWrapper: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  statBarHome: {
    height: '100%',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  statBarAway: {
    height: '100%',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },

  // PLACEHOLDER
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingTop: 100,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },

  // NEW TABLE-BASED STATS STYLES
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginHorizontal: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statCardHeader: {
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.HALO,
    letterSpacing: 1,
  },
  statTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#151515',
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  statTableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  teamSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#141414',
    borderLeftWidth: 3,
  },
  teamSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.3,
  },
  statTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  statTableCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
    textAlign: 'center',
  },
  statHighlight: {
    color: '#fff',
    fontWeight: '700',
  },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  playerNameCell: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // SCROLLABLE TABLE STYLES
  scrollableTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#151515',
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  fixedPlayerHeader: {
    width: 130,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  fixedHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 0.5,
  },
  scrollableHeaderArea: {
    flex: 1,
  },
  scrollableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 14,
  },
  scrollStatHeader: {
    width: 50,
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  scrollableTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  fixedPlayerCell: {
    width: 130,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  playerNameContainer: {
    flex: 1,
    gap: 1,
  },
  playerPosNum: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    letterSpacing: 0.3,
  },
  scrollableStatsArea: {
    flex: 1,
  },
  scrollableStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 14,
  },
  scrollStatCell: {
    width: 50,
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
    textAlign: 'center',
  },
});
