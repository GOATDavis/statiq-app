import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

interface Play {
  category: string;
  player: string;
  player2?: string;
  startYard: number;
  endYard: number;
  yards: string;
  timestamp: string;
  gameClock?: string;
  penaltyName?: string;
  down?: number;
  distance?: number;
  quarter?: string;
  possession?: 'O' | 'D' | 'K';
  playNumber?: number;
}

interface TeamInfo {
  name: string;
  score: number;
}

export const generateHudlCSV = (plays: Play[]): string => {
  const headers = [
    'QTR', 'PLAY #', 'ODK', 'DN', 'DIST', 'YARD LN', 'PLAY TYPE',
    'FRONT', 'FORMATION', 'OWL OFF FORMATION', 'PLAY', 'OWL OFF PLAY',
    'MOTION', 'TAG 1', 'TAG 2', 'GN/LS', 'OPP COV', 'NOTES',
    'LINE GAME', 'RESULT', 'PENALTY'
  ];

  const playTypeMap: Record<string, string> = {
    'run': 'Run', 'run-td': 'Run', 'pass': 'Pass', 'pass-td': 'Pass',
    'incomplete': 'Pass', 'sack': 'Pass', 'punt': 'Punt',
    'punt-return-td': 'Punt Rec', 'kickoff-touchback': 'KO Rec',
    'kickoff-return': 'KO Rec', 'kickoff-return-td': 'KO Rec',
    'fieldgoal': 'FG', 'fieldgoal-missed': 'FG', 'interception': 'Pass',
    'interception-td': 'Pass', 'fumble': 'Run', 'fumble-td': 'Run',
    'penalty': 'Penalty', 'safety': 'Run',
  };

  const getResult = (cat: string): string => {
    if (cat.includes('-td')) {
      if (cat.includes('run')) return 'Rush, TD';
      if (cat.includes('pass')) return 'Complete, TD';
      if (cat.includes('interception')) return 'Interception, Def TD';
      if (cat.includes('fumble')) return 'Fumble, Def TD';
      if (cat.includes('kickoff')) return 'KO Return, TD';
      if (cat.includes('punt')) return 'Punt Return, TD';
      return 'TD';
    }
    const resultMap: Record<string, string> = {
      'run': 'Rush', 'pass': 'Complete', 'incomplete': 'Incomplete',
      'sack': 'Sack', 'interception': 'Interception', 'fumble': 'Fumble',
      'fieldgoal': 'FG Good', 'fieldgoal-missed': 'FG Missed', 'punt': 'Punt',
      'kickoff-touchback': 'Touchback', 'kickoff-return': 'KO Return',
      'penalty': 'Penalty', 'safety': 'Safety',
    };
    return resultMap[cat] || cat;
  };

  const rows = plays.map((play, index) => {
    const qtr = play.quarter?.replace('Q', '') || '';
    const playNum = play.playNumber || index + 1;
    const odk = play.possession || 'O';
    const isKickPlay = ['kickoff', 'kickoff-return', 'kickoff-touchback', 'punt'].some(k => play.category?.includes(k));
    const dn = isKickPlay ? '0' : (play.down || '');
    const dist = dn === '0' ? '' : (play.distance || '');
    const yardLn = play.startYard !== undefined
      ? (play.startYard <= 50 ? -(50 - play.startYard + 1) : play.startYard - 50)
      : '';
    const playType = playTypeMap[play.category] || play.category || '';
    const gnLs = play.yards || '0';
    const result = getResult(play.category || '');
    const penaltyCol = play.penaltyName || '';

    return [
      qtr, playNum, odk, dn, dist, yardLn, playType,
      '', '', '', '', '', '', '', '', gnLs, '', '', '', result, penaltyCol
    ].map(val => `"${val}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const exportToHudl = async (
  plays: Play[],
  homeTeam: TeamInfo,
  awayTeam: TeamInfo
): Promise<boolean> => {
  try {
    const csv = generateHudlCSV(plays);
    const datePart = new Date().toISOString().split('T')[0];
    const fileName = `StatIQ_${homeTeam.name}_vs_${awayTeam.name}_${datePart}.csv`;
    const filePath = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(filePath, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Game Data to Hudl',
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    } else {
      Alert.alert('Export Complete', `File saved to: ${fileName}`);
      return true;
    }
  } catch (error) {
    console.error('Export failed:', error);
    Alert.alert('Export Failed', 'Could not export game data. Please try again.');
    return false;
  }
};
