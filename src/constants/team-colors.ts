// Team color codes for all schools in the district
export const TEAM_COLORS: Record<string, { primary: string; secondary?: string; name: string; mascot: string }> = {
  "highland-park": {
    name: "Highland Park",
    mascot: "Scots",
    primary: "#ffbc19",
    secondary: "#003366"
  },
  "joshua": {
    name: "Joshua",
    mascot: "Owls",
    primary: "#0055aa",
    secondary: "#FFD700"
  },
  "red-oak": {
    name: "Red Oak",
    mascot: "Hawks",
    primary: "#4b1311",
    secondary: "#FFFFFF"
  },
  "midlothian": {
    name: "Midlothian",
    mascot: "Panthers",
    primary: "#0052cc",
    secondary: "#000000"
  },
  "tyler": {
    name: "Tyler",
    mascot: "Lions",
    primary: "#1946b9",
    secondary: "#FFFFFF"
  },
  "centennial": {
    name: "Centennial",
    mascot: "Titans",
    primary: "#1c3f95",
    secondary: "#FFD700"
  },
  "cleburne": {
    name: "Cleburne",
    mascot: "Yellow Jackets",
    primary: "#b0882d",
    secondary: "#000000"
  }
};

// Helper function to get team colors by team name or slug
export function getTeamColors(teamIdentifier: string): { primary: string; secondary?: string; name: string; mascot: string } {
  // Convert to slug format (lowercase, replace spaces with hyphens)
  const slug = teamIdentifier.toLowerCase().replace(/\s+/g, "-");
  
  return TEAM_COLORS[slug] || {
    name: teamIdentifier,
    mascot: "",
    primary: "#0066CC", // Default fallback color
    secondary: "#FFFFFF"
  };
}

// Helper to get team color by name (case insensitive)
export function getTeamColorByName(teamName: string): string {
  const colors = getTeamColors(teamName);
  return colors.primary;
}

// All team names for dropdowns/lists
export const ALL_TEAMS = Object.values(TEAM_COLORS);

// Export individual colors for quick access
export const COLORS = {
  HIGHLAND_PARK: "#ffbc19",
  JOSHUA: "#0055aa",
  RED_OAK: "#4b1311",
  MIDLOTHIAN: "#0052cc",
  TYLER: "#1946b9",
  CENTENNIAL: "#1c3f95",
  CLEBURNE: "#b0882d"
};