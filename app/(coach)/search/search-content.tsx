import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Rect } from "react-native-svg";
import { search, getTeam, type SearchResult } from "../../../src/lib/api";
import { getRecentSearches, saveRecentSearch, deleteRecentSearch, type RecentSearch } from "../../../src/lib/recent-searches";
import { getTeamColorByName } from "../../../src/constants/team-colors";

// Custom Search Icon
const SearchIcon = ({ color = "#999", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M133.274,46.244L87.031,0h-36.79L0,50.241v36.79l46.244,46.244h36.79l50.241-50.241v-36.79h0ZM66.637,121.553L11.722,66.637,66.637,11.722l54.915,54.915-54.915,54.915h0Z" fill={color}/>
    <Rect x="125.589" y="109.993" width="19.883" height="51.073" transform="translate(-56.138 135.53) rotate(-45)" fill={color}/>
  </Svg>
);

export default function SearchContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  async function loadRecentSearches() {
    const recent = await getRecentSearches();
    console.log('[Search] Loaded recent searches:', JSON.stringify(recent, null, 2));
    
    // Fetch colors for any team entries missing primary_color
    const updatedRecent = await Promise.all(
      recent.map(async (item) => {
        if (item.type === 'team' && !item.primary_color) {
          try {
            const teamData = await getTeam(item.id);
            console.log('[Search] Fetched color for', item.name, ':', teamData.primary_color);
            return { ...item, primary_color: teamData.primary_color };
          } catch (err) {
            console.error('[Search] Failed to fetch color for', item.name);
            return item;
          }
        }
        return item;
      })
    );
    
    setRecentSearches(updatedRecent);
  }

  // Debounced search
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
      router.push(`/(coach)/players/${recent.id}`);
    } else if (recent.type === "team") {
      router.push(`/(coach)/team/${recent.id}`);
    }
  }

  async function handleDeleteRecent(id: string) {
    await deleteRecentSearch(id);
    await loadRecentSearches();
  }

  async function handleResultClick(result: SearchResult) {
    // For teams, fetch the profile to get the primary_color
    let primaryColor: string | undefined;
    if (result.type === 'team') {
      try {
        console.log('[Search] Fetching team data for:', result.id);
        const teamData = await getTeam(result.id);
        console.log('[Search] Team data received:', teamData);
        console.log('[Search] Primary color:', teamData.primary_color);
        primaryColor = teamData.primary_color;
      } catch (err) {
        console.error('Failed to fetch team color:', err);
      }
    }
    
    console.log('[Search] Saving recent search with color:', primaryColor);
    
    // Save to recent searches
    await saveRecentSearch({
      type: result.type as 'player' | 'team',
      id: result.id,
      name: result.name,
      number: result.number,
      position: result.position,
      team: result.team,
      mascot: result.mascot,
      primary_color: primaryColor
    });
    
    // Reload recent searches
    await loadRecentSearches();
    
    if (result.type === "player") {
      router.push(`/(coach)/players/${result.id}`);
    } else if (result.type === "team") {
      const teamId = result.id || result.name.toLowerCase().replace(/\s+/g, "-");
      router.push(`/(coach)/team/${teamId}`);
    }
  }

  const showResults = searchQuery.length > 0;

  return (
    <View style={{ flex: 1 }}>
      {/* Search Input */}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#3a3a3a", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24 }}>
        <View style={{ marginRight: 12 }}>
          <SearchIcon color="#999" size={20} />
        </View>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search"
          placeholderTextColor="#999"
          style={{ flex: 1, color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Roman" }}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </Pressable>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {!showResults ? (
          // Recent Searches
          <View>
            <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Medium", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
              Recent
            </Text>
            {recentSearches.length === 0 ? (
              <View style={{ alignItems: "center", marginTop: 60 }}>
                <Ionicons name="time-outline" size={48} color="#3a3a3a" style={{ marginBottom: 16 }} />
                <Text style={{ color: "#666", fontSize: 16, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                  No recent searches
                </Text>
                <Text style={{ color: "#555", fontSize: 14, fontFamily: "NeueHaas-Roman", textAlign: "center", marginTop: 8 }}>
                  Search for players or teams to get started
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {recentSearches.map((item, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleRecentClick(item)}
                    style={{ 
                      backgroundColor: "#3a3a3a", 
                      borderRadius: 12, 
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12
                    }}
                  >
                    {item.type === "player" ? (
                      <>
                        <View style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "#0066cc",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <Text style={{ fontSize: 20, fontFamily: "NeueHaas-Bold", color: "#fff" }}>
                            {item.number}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 18, fontFamily: "NeueHaas-Bold", color: "#fff", marginBottom: 2 }}>
                            {item.name}
                          </Text>
                          <Text style={{ fontSize: 14, fontFamily: "NeueHaas-Roman", color: "#999" }}>
                            {item.position} • {item.team}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleDeleteRecent(item.id)}
                          style={{ padding: 4 }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close-circle" size={20} color="#666" />
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <View style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: item.primary_color || getTeamColorByName(item.name),
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <Ionicons name="shield" size={24} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 18, fontFamily: "NeueHaas-Bold", color: "#fff", marginBottom: 2 }}>
                            {item.name} {item.mascot}
                          </Text>
                          <Text style={{ fontSize: 14, fontFamily: "NeueHaas-Roman", color: "#999" }}>
                            Team
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleDeleteRecent(item.id)}
                          style={{ padding: 4 }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close-circle" size={20} color="#666" />
                        </Pressable>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          // Search Results
          <View>
            <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Medium", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
              Results for "{searchQuery}"
            </Text>
            {loading ? (
              <ActivityIndicator size="large" color="#0066cc" style={{ marginTop: 40 }} />
            ) : searchResults.length === 0 ? (
              <View style={{ alignItems: "center", marginTop: 60 }}>
                <Ionicons name="search-outline" size={48} color="#3a3a3a" style={{ marginBottom: 16 }} />
                <Text style={{ color: "#666", fontSize: 16, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                  No results found
                </Text>
                <Text style={{ color: "#555", fontSize: 14, fontFamily: "NeueHaas-Roman", textAlign: "center", marginTop: 8 }}>
                  Try a different search term
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {searchResults.map((result, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleResultClick(result)}
                    style={{ backgroundColor: "#3a3a3a", borderRadius: 12, padding: 16 }}
                  >
                    {result.type === "team" ? (
                      <View>
                        <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                          {result.name} {result.mascot ? result.mascot : ""}
                        </Text>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                          {result.district && (
                            <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                              {result.district}
                            </Text>
                          )}
                          {result.record && (
                            <Text style={{ color: getTeamColorByName(result.name), fontSize: 14, fontFamily: "NeueHaas-Bold" }}>
                              {result.record}
                            </Text>
                          )}
                        </View>
                      </View>
                    ) : result.type === "player" ? (
                      <View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          {result.number && (
                            <Text style={{ color: result.team ? getTeamColorByName(result.team) : "#0066cc", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                              #{result.number}
                            </Text>
                          )}
                          <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold" }}>
                            {result.name}
                          </Text>
                        </View>
                        <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                          {result.position && `${result.position} • `}{result.team}
                        </Text>
                      </View>
                    ) : (
                      <View>
                        <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                          {result.name}
                        </Text>
                        <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
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
      </ScrollView>
    </View>
  );
}
