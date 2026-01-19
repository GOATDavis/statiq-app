import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/design';
import { useAuth } from '@/src/context/AuthContext';
import {
  getChatMessages,
  sendChatMessage,
  reportMessage,
  type ChatMessage,
} from '@/src/lib/chat-api';

interface ChatRoomProps {
  roomId: number;
  roomName: string;
  onClose?: () => void;
}

export function ChatRoom({ roomId, roomName, onClose }: ChatRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  
  // @mention autocomplete state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  // Set current user from auth context
  useEffect(() => {
    if (user) {
      // Parse user.id as number since backend returns user_id as number
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      console.log('[ChatRoom] Setting currentUserId:', userId, 'from user.id:', user.id);
      setCurrentUserId(userId);
      setCurrentUserName(user.firstName || user.email?.split('@')[0] || 'User');
    }
  }, [user]);

  // Get unique users from messages (excluding current user)
  const chatParticipants = useMemo(() => {
    const userMap = new Map<number, { id: number; name: string }>();
    
    messages.forEach(msg => {
      if (msg.user_id !== currentUserId && !userMap.has(msg.user_id)) {
        userMap.set(msg.user_id, {
          id: msg.user_id,
          name: msg.user_name,
        });
      }
    });
    
    return Array.from(userMap.values());
  }, [messages, currentUserId]);

  // Filter suggestions based on query
  const filteredSuggestions = useMemo(() => {
    if (!mentionQuery) return chatParticipants;
    
    const query = mentionQuery.toLowerCase();
    return chatParticipants.filter(user => 
      user.name.toLowerCase().includes(query)
    );
  }, [chatParticipants, mentionQuery]);

  useEffect(() => {
    loadMessages();
    
    // Poll every 500ms for real-time chat
    pollInterval.current = setInterval(() => {
      loadMessages(true);
    }, 500);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [roomId]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      console.log('[ChatRoom] Loading messages for room:', roomId);
      const msgs = await getChatMessages(roomId);
      console.log('[ChatRoom] Received', msgs.length, 'messages:', msgs.map(m => ({ id: m.id, user: m.user_name, text: m.message_text.substring(0, 20) })));
      setMessages(msgs);
      setError(null);
    } catch (err: any) {
      console.error('[ChatRoom] Error loading messages:', err);
      if (!silent) {
        setError(err.message || 'Failed to load messages');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Handle text input changes and detect @mentions
  const handleTextChange = (text: string) => {
    setNewMessage(text);
    
    // Find the last @ symbol that might be starting a mention
    const lastAtIndex = text.lastIndexOf('@');
    
    if (lastAtIndex >= 0) {
      // Check if there's a space before @ (or it's at the start)
      const charBeforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : ' ';
      
      if (charBeforeAt === ' ' || lastAtIndex === 0) {
        // Get the text after @
        const afterAt = text.substring(lastAtIndex + 1);
        
        // Check if we're still typing the mention (no space after @)
        if (!afterAt.includes(' ')) {
          setShowMentionSuggestions(true);
          setMentionQuery(afterAt);
          setMentionStartIndex(lastAtIndex);
          return;
        }
      }
    }
    
    // Hide suggestions if no valid @ mention in progress
    setShowMentionSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
  };

  // Insert selected mention into the message
  const insertMention = (userName: string) => {
    if (mentionStartIndex >= 0) {
      const beforeMention = newMessage.substring(0, mentionStartIndex);
      const afterMention = newMessage.substring(mentionStartIndex + 1 + mentionQuery.length);
      const newText = `${beforeMention}@${userName} ${afterMention}`;
      setNewMessage(newText);
    }
    
    setShowMentionSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
    
    // Keep focus on input
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setShowMentionSuggestions(false);
    
    // Dismiss keyboard immediately like iOS Messages
    Keyboard.dismiss();
    
    setIsSending(true);

    try {
      const result = await sendChatMessage(roomId, messageToSend);
      
      if (result.was_censored) {
        Alert.alert(
          'Message Sent',
          'Your message contained profanity and was automatically censored.',
          [{ text: 'OK' }]
        );
      }

      await loadMessages(true);
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      if (err.message.includes('blocked term')) {
        Alert.alert(
          'Message Blocked',
          'Your message contains a blocked term. Please revise your message and try again.',
          [{ text: 'OK' }]
        );
        setNewMessage(messageToSend);
      } else if (err.message.includes('Invalid authentication') || err.message.includes('logged in')) {
        Alert.alert(
          'Authentication Error',
          'Please log out and log back in to send messages.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', err.message || 'Failed to send message');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleReportMessage = (message: ChatMessage) => {
    Alert.alert(
      'Report',
      'What would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Message Content', 
          onPress: () => showMessageReportReasons(message.id) 
        },
        { 
          text: 'Username', 
          onPress: () => submitReport(message.id, `Inappropriate Username: ${message.user_name}`) 
        },
        { 
          text: 'Profile Picture', 
          onPress: () => submitReport(message.id, 'Inappropriate Profile Picture') 
        },
      ]
    );
  };

  const showMessageReportReasons = (messageId: number) => {
    Alert.alert(
      'Report Message',
      'Why are you reporting this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Content', onPress: () => submitReport(messageId, 'Inappropriate Content') },
        { text: 'Spam', onPress: () => submitReport(messageId, 'Spam') },
        { text: 'Harassment', onPress: () => submitReport(messageId, 'Harassment') },
        { text: 'Hate Speech', onPress: () => submitReport(messageId, 'Hate Speech') },
      ]
    );
  };

  const parseMessageText = (text: string) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts: any[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }
      
      const mentionedName = match[1];
      const isMentioningMe = mentionedName.toLowerCase() === currentUserName.toLowerCase();
      parts.push({
        type: 'mention',
        content: `@${mentionedName}`,
        isMentioningMe,
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  const messageHasMentionOfMe = (text: string) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      if (match[1].toLowerCase() === currentUserName.toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  const submitReport = async (messageId: number, reason: string) => {
    try {
      await reportMessage(messageId, reason);
      Alert.alert('Success', 'Message reported successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to report message');
    }
  };

  // Tap on username to start mentioning them
  const handleUsernameTap = (userName: string) => {
    // Add @ mention at the end of current message
    const currentText = newMessage.trim();
    const newText = currentText ? `${currentText} @${userName} ` : `@${userName} `;
    setNewMessage(newText);
    inputRef.current?.focus();
  };

  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.SURGE} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.BLAZE} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadMessages()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Tab bar height: 52 (icon) + 18 (paddingTop) + 32 (paddingBottom on iOS) = ~102
  // Add some extra margin for visual comfort
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 110 : 90;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Messages ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesScrollView}
        contentContainerStyle={styles.messagesContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Be the first to start the conversation!</Text>
          </View>
        ) : (
          <View style={styles.messagesContent}>
            {messages.map((item, index) => {
              const isCurrentUser = item.user_id === currentUserId;
              const showAvatar = !isCurrentUser && (index === messages.length - 1 || messages[index + 1].user_id !== item.user_id);
              const hasMentionOfMe = !isCurrentUser && messageHasMentionOfMe(item.message_text);
              const messageParts = parseMessageText(item.message_text);
              
              return (
                <Pressable 
                  key={item.id}
                  style={[
                    styles.messageRow,
                    isCurrentUser ? styles.messageRowRight : styles.messageRowLeft
                  ]}
                  onLongPress={() => handleReportMessage(item)}
                >
                  {!isCurrentUser && (
                    <View style={styles.avatarContainer}>
                      {showAvatar ? (
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {item.user_name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.avatarSpacer} />
                      )}
                    </View>
                  )}
                  
                  <View style={styles.messageContent}>
                    {!isCurrentUser && (
                      <Pressable onPress={() => handleUsernameTap(item.user_name)}>
                        <Text style={styles.senderName}>@{item.user_name}</Text>
                      </Pressable>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft,
                        hasMentionOfMe && styles.messageBubbleMention
                      ]}
                    >
                      <Text style={[
                        styles.messageText,
                        isCurrentUser ? styles.messageTextRight : styles.messageTextLeft
                      ]}>
                        {messageParts.map((part: any, partIndex: number) => {
                          if (part.type === 'mention') {
                            return (
                              <Text
                                key={partIndex}
                                style={[
                                  styles.mentionText,
                                  isCurrentUser ? styles.mentionTextRight : styles.mentionTextLeft,
                                  part.isMentioningMe && styles.mentionTextHighlight
                                ]}
                              >
                                {part.content}
                              </Text>
                            );
                          }
                          return <Text key={partIndex}>{part.content}</Text>;
                        })}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* @Mention Suggestions */}
      {showMentionSuggestions && filteredSuggestions.length > 0 && (
        <View style={[styles.mentionSuggestionsContainer, { bottom: TAB_BAR_HEIGHT + 60 }]}>
          <View style={styles.mentionSuggestionsHeader}>
            <Text style={styles.mentionSuggestionsTitle}>People in this chat</Text>
          </View>
          <FlatList
            data={filteredSuggestions}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            style={styles.mentionSuggestionsList}
            renderItem={({ item }) => (
              <Pressable
                style={styles.mentionSuggestionItem}
                onPress={() => insertMention(item.name)}
              >
                <View style={styles.mentionSuggestionAvatar}>
                  <Text style={styles.mentionSuggestionAvatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.mentionSuggestionName}>@{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Input Bar - sits above the absolute-positioned tab bar */}
      <View style={[styles.inputBar, { marginBottom: TAB_BAR_HEIGHT }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={newMessage}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            maxLength={500}
            editable={!isSending}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
        </View>
        <Pressable
          style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="arrow-up" size={24} color="#000" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.SHADOW,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 16, 
    paddingVertical: 80 
  },
  loadingText: { 
    color: '#999', 
    fontSize: 16 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 16, 
    padding: 32, 
    paddingVertical: 80 
  },
  errorText: { 
    color: Colors.BLAZE, 
    fontSize: 16, 
    textAlign: 'center' 
  },
  retryButton: { 
    backgroundColor: Colors.SURGE, 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 8 
  },
  retryButtonText: { 
    color: Colors.BASALT, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  // Messages ScrollView
  messagesScrollView: {
    flex: 1,
  },
  messagesContentContainer: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  messagesContent: { 
    padding: 16, 
    gap: 2,
  },
  messageRow: { 
    width: '100%', 
    flexDirection: 'row', 
    marginBottom: 4, 
    alignItems: 'flex-end' 
  },
  messageRowLeft: { 
    justifyContent: 'flex-start' 
  },
  messageRowRight: { 
    justifyContent: 'flex-end' 
  },
  avatarContainer: { 
    width: 32, 
    marginRight: 8, 
    alignItems: 'center' 
  },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: Colors.SURGE, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    color: '#000', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  avatarSpacer: { 
    width: 32, 
    height: 32 
  },
  messageContent: { 
    maxWidth: '75%' 
  },
  senderName: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: Colors.SURGE, 
    marginBottom: 2, 
    marginLeft: 4 
  },
  messageBubble: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20 
  },
  messageBubbleLeft: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#2a2a2a', 
    borderBottomLeftRadius: 4 
  },
  messageBubbleRight: { 
    alignSelf: 'flex-end', 
    backgroundColor: Colors.SURGE, 
    borderBottomRightRadius: 4 
  },
  messageBubbleMention: { 
    borderWidth: 2, 
    borderColor: Colors.SURGE 
  },
  messageText: { 
    fontSize: 16, 
    lineHeight: 20 
  },
  messageTextLeft: { 
    color: '#fff' 
  },
  messageTextRight: { 
    color: '#000' 
  },
  mentionText: { 
    fontWeight: '700' 
  },
  mentionTextLeft: { 
    color: Colors.SURGE 
  },
  mentionTextRight: { 
    color: '#000', 
    textDecorationLine: 'underline' 
  },
  mentionTextHighlight: { 
    fontWeight: '800' 
  },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 80, 
    gap: 12 
  },
  emptyText: { 
    color: '#999', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  emptySubtext: { 
    color: '#666', 
    fontSize: 14 
  },
  
  // @Mention Suggestions
  mentionSuggestionsContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mentionSuggestionsHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  mentionSuggestionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mentionSuggestionsList: {
    maxHeight: 150,
  },
  mentionSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  mentionSuggestionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.SURGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionSuggestionAvatarText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  mentionSuggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Input Bar - sits above the tab bar
  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: Colors.SHADOW, 
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  inputWrapper: { 
    flex: 1, 
    backgroundColor: '#2a2a2a', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#3a3a3a' 
  },
  input: { 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    color: '#fff', 
    fontSize: 17, 
    minHeight: 44 
  },
  sendButton: { 
    backgroundColor: Colors.SURGE, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sendButtonDisabled: { 
    backgroundColor: '#3a3a3a', 
    opacity: 0.6 
  },
});
