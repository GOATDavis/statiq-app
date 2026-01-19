import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';

interface MorePlaysModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlay: (playType: string) => void;
}

const MorePlaysModal: React.FC<MorePlaysModalProps> = ({ visible, onClose, onSelectPlay }) => {
  const playCategories = [
    {
      title: 'SCORING',
      color: '#B4D836',
      plays: [
        { id: 'field_goal', label: 'FIELD GOAL', icon: '🥅' },
        { id: 'extra_point', label: 'EXTRA POINT', icon: '✓' },
        { id: 'two_point', label: '2-PT CONVERSION', icon: '2️⃣' },
        { id: 'safety', label: 'SAFETY', icon: '⚠️' },
      ],
    },
    {
      title: 'TURNOVERS',
      color: '#FF6B6B',
      plays: [
        { id: 'interception', label: 'INTERCEPTION', icon: '🔄' },
        { id: 'fumble', label: 'FUMBLE', icon: '💨' },
        { id: 'fumble_recovery', label: 'FUMBLE RECOVERY', icon: '🏈' },
      ],
    },
    {
      title: 'SPECIAL TEAMS',
      color: '#4ECDC4',
      plays: [
        { id: 'touchback', label: 'TOUCHBACK', icon: '↩️' },
        { id: 'onside_kick', label: 'ONSIDE KICK', icon: '⚡' },
        { id: 'blocked_kick', label: 'BLOCKED KICK', icon: '🛑' },
        { id: 'muffed_punt', label: 'MUFFED PUNT', icon: '🙈' },
        { id: 'fair_catch', label: 'FAIR CATCH', icon: '✋' },
      ],
    },
    {
      title: 'OTHER',
      color: '#95A5A6',
      plays: [
        { id: 'kneel', label: 'KNEEL', icon: '🧎' },
        { id: 'spike', label: 'SPIKE', icon: '⬇️' },
        { id: 'no_play', label: 'NO PLAY', icon: '🚫' },
      ],
    },
  ];

  const handlePlaySelect = (playId: string) => {
    onSelectPlay(playId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>MORE PLAYS</Text>
                <Text style={styles.headerSubtitle}>Select a play type</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Categorized Play Types */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {playCategories.map((category, categoryIndex) => (
                <View key={category.title} style={styles.categorySection}>
                  {/* Category Header */}
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIndicator, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  </View>

                  {/* Play Type Grid */}
                  <View style={styles.playsGrid}>
                    {category.plays.map((play, playIndex) => (
                      <TouchableOpacity
                        key={play.id}
                        style={[
                          styles.playButton,
                          { borderColor: category.color },
                        ]}
                        onPress={() => handlePlaySelect(play.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.playIcon}>{play.icon}</Text>
                        <Text style={styles.playLabel}>{play.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    width: 600,
    maxWidth: '100%',
    maxHeight: 700,
    borderWidth: 2,
    borderColor: '#B4D836',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#262626',
    borderBottomWidth: 2,
    borderBottomColor: '#B4D836',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#F3F3F7',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#8E8E93',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#F3F3F7',
    fontFamily: 'NeueHaas-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 4,
  },
  categoryIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: '#8E8E93',
    letterSpacing: 1.5,
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  playButton: {
    width: 'calc(50% - 6px)',
    minWidth: 260,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 88,
  },
  playIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  playLabel: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: '#F3F3F7',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default MorePlaysModal;
