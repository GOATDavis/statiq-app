import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Rect } from "react-native-svg";
import { Colors } from '@/src/constants/design';
import { search, type SearchResult } from "../../src/lib/api";
import { getRecentSearches, saveRecentSearch, deleteRecentSearch, type RecentSearch } from "../../src/lib/recent-searches";
import { getTeamColorByName } from "../../src/constants/team-colors";

// Custom Search Icon
const SearchIconSvg = ({ color = "#999", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M133.274,46.244L87.031,0h-36.79L0,50.241v36.79l46.244,46.244h36.79l50.241-50.241v-36.79h0ZM66.637,121.553L11.722,66.637,66.637,11.722l54.915,54.915-54.915,54.915h0Z" fill={color}/>
    <Rect x="125.589" y="109.993" width="19.883" height="51.073" transform="translate(-56.138 135.53) rotate(-45)" fill={color}/>
  </Svg>
);

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  async function loadRecentSearches() {
    const recent = await getRecentSearches();
    setRecentSearches(recent);
  }

  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function performSearch() {
    try {
      setLoading(true);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      const results = await Promise.race([search(searchQuery), timeoutPromise]) as SearchResult[];
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecentClick(recent: RecentSearch) {
    if (recent.type === "player") {
      router.push(`/(coach-phone)/players/${recent.id}`);
    } else if (recent.type === "team") {
      router.push(`/(coach-phone)/team/${recent.id}`);
    }
  }

  async function handleDeleteRecent(id: string) {
    await deleteRecentSearch(id);
    await loadRecentSearches();
  }

  async function handleResultClick(result: SearchResult) {
    await saveRecentSearch({
      type: result.type as 'player' | 'team',
      id: result.id,
      name: result.name,
      number: result.number,
      position: result.position,
      team: result.team,
      mascot: result.mascot
    });
    
    await loadRecentSearches();
    
    if (result.type === "player") {
      router.push(`/(coach-phone)/players/${result.id}`);
    } else if (result.type === "team") {
      const teamId = result.id || result.name.toLowerCase().replace(/\s+/g, "-");
      router.push(`/(coach-phone)/team/${teamId}`);
    }
  }

  const showResults = searchQuery.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <View style={styles.searchIcon}>
            <SearchIconSvg color="#999" size={18} />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search teams or players"
            placeholderTextColor="#999"
            style={styles.input}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!showResults ? (
          /* Recent Searches */
          <View>
            <Text style={styles.sectionTitle}>RECENT</Text>
            {recentSearches.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={42} color="#3a3a3a" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No recent searches</Text>
                <Text style={styles.emptySubtitle}>Search for players or teams to get started</Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                {recentSearches.map((item, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleRecentClick(item)}
                    style={styles.resultCard}
                  >
                    {item.type === "player" ? (
                      <>
                        <View style={[styles.avatar, { backgroundColor: "#0066cc" }]}>
                          <Text style={styles.avatarText}>{item.number}</Text>
                        </View>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          <Text style={styles.resultMeta}>{item.position} • {item.team}</Text>
                        </View>
                        <Pressable
                          onPress={() => handleDeleteRecent(item.id)}
                          style={styles.deleteButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close-circle" size={18} color="#666" />
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <View style={[styles.avatar, { backgroundColor: getTeamColorByName(item.name) }]}>
                          <Ionicons name="shield" size={20} color="#fff" />
                        </View>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultName}>{item.name} {item.mascot}</Text>
                          <Text style={styles.resultMeta}>Team</Text>
                        </View>
                        <Pressable
                          onPress={() => handleDeleteRecent(item.id)}
                          style={styles.deleteButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close-circle" size={18} color="#666" />
                        </Pressable>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Search Results */
          <View>
            <Text style={styles.sectionTitle}>RESULTS FOR "{searchQuery.toUpperCase()}"</Text>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.SURGE} style={styles.loader} />
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={42} color="#3a3a3a" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>Try a different search term</Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                {searchResults.map((result, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleResultClick(result)}
                    style={styles.resultCard}
                  >
                    {result.type === "team" ? (
                      <View style={styles.teamResult}>
                        <View style={[styles.avatar, { backgroundColor: getTeamColorByName(result.name) }]}>
                          <Ionicons name="shield" size={20} color="#fff" />
                        </View>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultName}>
                            {result.name} {result.mascot || ""}
                          </Text>
                          <View style={styles.teamMeta}>
                            {result.district && (
                              <Text style={styles.resultMeta}>{result.district}</Text>
                            )}
                            {result.record && (
                              <Text style={[styles.recordText, { color: getTeamColorByName(result.name) }]}>
                                {result.record}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    ) : result.type === "player" ? (
                      <View style={styles.playerResult}>
                        <View style={[styles.avatar, { backgroundColor: result.team ? getTeamColorByName(result.team) : "#0066cc" }]}>
                          <Text style={styles.avatarText}>{result.number || "?"}</Text>
                        </View>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultName}>{result.name}</Text>
                          <Text style={styles.resultMeta}>
                            {result.position && `${result.position} • `}{result.team}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.resultContent}>
                        <Text style={styles.resultName}>{result.name}</Text>
                        <Text style={styles.resultMeta}>
                          {result.title} • {result.team}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Bottom Spacer for Tab Bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BASALT,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'NeueHaas-Roman',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 14,
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#666',
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#555',
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    textAlign: 'center',
    marginTop: 6,
  },
  resultsList: {
    gap: 10,
  },
  resultCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 2,
  },
  resultMeta: {
    color: '#999',
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
  },
  deleteButton: {
    padding: 4,
  },
  teamResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  teamMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  recordText: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
  },
  playerResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  loader: {
    marginTop: 40,
  },
});
