import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { search, type SearchResult } from "../../../src/lib/api";
import { getTeamColorByName } from "../../../src/constants/team-colors";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function performSearch() {
    try {
      setLoading(true);
      // Add timeout to fail fast
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

  function handleRecentClick(query: string) {
    setSearchQuery(query);
  }

  function handleResultClick(result: SearchResult) {
    // Add to recent searches (local only for now)
    if (!recentSearches.includes(result.name)) {
      setRecentSearches([result.name, ...recentSearches].slice(0, 10)); // Keep max 10
    }
    
    // Navigate based on type
    if (result.type === "player") {
      // Use player id if available, otherwise use name as fallback
      const playerId = result.id || result.name.toLowerCase().replace(/\s+/g, "-");
      router.push(`/player/${playerId}`);
    } else if (result.type === "team") {
      // Navigate to team page - convert team name to slug
      const teamId = result.id || result.name.toLowerCase().replace(/\s+/g, "-");
      router.push(`/team/${teamId}`);
    } else if (result.type === "coach") {
      // TODO: Navigate to coach page when created
      console.log("Coach navigation not yet implemented");
    }
  }

  const showResults = searchQuery.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#505050", borderRadius: 24, padding: 24 }}>
      {/* Search Input */}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#3a3a3a", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24 }}>
        <Text style={{ color: "#999", fontSize: 20, marginRight: 12 }}>🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search"
          placeholderTextColor="#999"
          style={{ flex: 1, color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Roman" }}
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {!showResults ? (
          // Recent Searches
          <View>
            <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Medium", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
              Recent
            </Text>
            {recentSearches.length === 0 ? (
              <Text style={{ color: "#666", fontSize: 16, fontFamily: "NeueHaas-Roman", textAlign: "center", marginTop: 40 }}>
                No recent searches
              </Text>
            ) : (
              recentSearches.map((search, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleRecentClick(search)}
                  style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#3a3a3a" }}
                >
                  <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                    {search}
                  </Text>
                </Pressable>
              ))
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
              <Text style={{ color: "#666", fontSize: 16, fontFamily: "NeueHaas-Roman", textAlign: "center", marginTop: 40 }}>
                No results found
              </Text>
            ) : (
              searchResults.map((result, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleResultClick(result)}
                  style={{ backgroundColor: "#3a3a3a", borderRadius: 12, padding: 16, marginBottom: 12 }}
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
                    // Coach
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
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}