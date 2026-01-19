import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

interface TeamInfo {
  name: string;
  score: number;
}

interface EndGameModalProps {
  visible: boolean;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  onClose: () => void;
  onExport: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  visible,
  homeTeam,
  awayTeam,
  onClose,
  onExport,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>🏈 END GAME?</Text>
          <Text style={styles.score}>
            {homeTeam.name} {homeTeam.score} - {awayTeam.score} {awayTeam.name}
          </Text>
          <View style={styles.buttons}>
            <Pressable style={[styles.btn, styles.closeBtn]} onPress={onClose}>
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.exportBtn]} onPress={onExport}>
              <Text style={styles.exportBtnText}>CLOSE & EXPORT</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#262626',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'NeueHaas-Bold',
  },
  score: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F3F3F7',
    marginBottom: 32,
    fontFamily: 'NeueHaas-Roman',
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: '#404040',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'NeueHaas-Bold',
  },
  exportBtn: {
    backgroundColor: '#B4D836',
  },
  exportBtnText: {
    color: '#262626',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'NeueHaas-Bold',
  },
});
