import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import ScreenLayout from "../../../components/ScreenLayout";
import Svg, { Path } from "react-native-svg";

// Import integration logos
import CatapultLogo from "../../../assets/images/notifications/Catapult.svg";
import HudlLogo from "../../../assets/images/notifications/Hudl.svg";
import MaxPrepsLogo from "../../../assets/images/notifications/MaxPreps.svg";
import RankOneLogo from "../../../assets/images/notifications/RankOne.svg";
import SportsYouLogo from "../../../assets/images/notifications/sportsYou.svg";

// Email Icon Component
const EmailIcon = ({ color = "#000", size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 155.021 155.021">
    <Path d="M.281,32.594v68.516H.281c8.325,8.325,12.992,12.992,21.316,21.316h111.825c8.325-8.325,12.992-12.992,21.316-21.316h0V32.594h-18.663v68.516H18.945V32.594H.281Z" fill={color}/>
    <Path d="M110.214,32.594l-32.703,38.259-32.703-38.259h-25.863l41.669,48.748h33.794l41.669-48.748h-25.863Z" fill={color}/>
  </Svg>
);

export default function SettingsScreen() {
  const [activeSection, setActiveSection] = React.useState("team-profile");
  const [schoolName, setSchoolName] = React.useState("Joshua");
  const [mascot, setMascot] = React.useState("Owls");
  const [conference, setConference] = React.useState("District 5A-1");
  const [region, setRegion] = React.useState("Region 2");
  const [district, setDistrict] = React.useState("District 7");

  const menuItems = [
    { id: "team-profile", label: "Team Profile" },
    { id: "my-profile", label: "My Profile" },
    { id: "password", label: "Password" },
    { id: "team", label: "Team" },
    { id: "plan", label: "Plan" },
    { id: "billing", label: "Billing" },
    { id: "notifications", label: "Notifications" },
    { id: "integrations", label: "Integrations" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "team-profile":
        return (
          <View>
            {/* Header with buttons */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <View>
                <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Team Profile
                </Text>
                <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                  Update your team details here.
                </Text>
              </View>
              
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable style={{ backgroundColor: "#3a3a3a", paddingVertical: 9, paddingHorizontal: 20, borderRadius: 8 }}>
                  <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>Cancel</Text>
                </Pressable>
                <Pressable style={{ backgroundColor: "#b4d836", paddingVertical: 9, paddingHorizontal: 20, borderRadius: 8 }}>
                  <Text style={{ color: "#000", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>Save</Text>
                </Pressable>
              </View>
            </View>

            {/* Form */}
            <View style={{ gap: 18 }}>
              {/* Public Profile Header */}
              <View style={{ marginBottom: 2 }}>
                <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Public profile
                </Text>
                <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                  This will be displayed on your profile.
                </Text>
              </View>

              {/* School Input */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  School
                </Text>
                <TextInput
                  value={schoolName}
                  onChangeText={setSchoolName}
                  placeholder="School"
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                  }}
                  placeholderTextColor="#666"
                />
              </View>

              {/* Mascot Input */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Mascot
                </Text>
                <TextInput
                  value={mascot}
                  onChangeText={setMascot}
                  placeholder="Mascot"
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                  }}
                  placeholderTextColor="#666"
                />
              </View>

              {/* Conference Dropdown */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Conference
                </Text>
                <Pressable
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>
                    {conference}
                  </Text>
                  <Text style={{ color: "#999", fontSize: 12 }}>▾</Text>
                </Pressable>
              </View>

              {/* Region Dropdown */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Region
                </Text>
                <Pressable
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>
                    {region}
                  </Text>
                  <Text style={{ color: "#999", fontSize: 12 }}>▾</Text>
                </Pressable>
              </View>

              {/* District Dropdown */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  District
                </Text>
                <Pressable
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>
                    {district}
                  </Text>
                  <Text style={{ color: "#999", fontSize: 12 }}>▾</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );

      case "my-profile":
        return (
          <View>
            {/* Header with buttons */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <View>
                <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Personal information
                </Text>
                <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                  Update your photo and personal details here.
                </Text>
              </View>
              
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable style={{ backgroundColor: "#3a3a3a", paddingVertical: 9, paddingHorizontal: 20, borderRadius: 8 }}>
                  <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>Cancel</Text>
                </Pressable>
                <Pressable style={{ backgroundColor: "#b4d836", paddingVertical: 9, paddingHorizontal: 20, borderRadius: 8 }}>
                  <Text style={{ color: "#000", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>Save</Text>
                </Pressable>
              </View>
            </View>

            {/* Form */}
            <View style={{ gap: 18 }}>
              {/* Name Row */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Name
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TextInput
                    value="Danny"
                    style={{
                      flex: 1,
                      backgroundColor: "#3a3a3a",
                      borderRadius: 8,
                      padding: 14,
                      color: "#fff",
                      fontSize: 15,
                      fontFamily: "NeueHaas-Roman",
                    }}
                  />
                  <TextInput
                    value="DeArman"
                    style={{
                      flex: 1,
                      backgroundColor: "#3a3a3a",
                      borderRadius: 8,
                      padding: 14,
                      color: "#fff",
                      fontSize: 15,
                      fontFamily: "NeueHaas-Roman",
                    }}
                  />
                </View>
              </View>

              {/* Email */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Email address
                </Text>
                <TextInput
                  value="d.dearman@joshuaisd.org"
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                  }}
                />
              </View>

              {/* Photo Upload */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Your photo
                </Text>
                <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                  {/* Avatar */}
                  <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "#3a3a3a", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 36 }}>👤</Text>
                  </View>
                  
                  {/* Upload Area */}
                  <Pressable style={{ 
                    flex: 1, 
                    backgroundColor: "#3a3a3a", 
                    borderRadius: 8, 
                    padding: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#4a4a4a",
                    borderStyle: "dashed"
                  }}>
                    <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Medium", marginBottom: 2 }}>
                      📤
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>Click to upload </Text>
                      <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>or drag and drop</Text>
                    </View>
                    <Text style={{ color: "#999", fontSize: 11, fontFamily: "NeueHaas-Roman", marginTop: 2 }}>
                      PNG, JPG, or GIF (max. 1200x800px)
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Role */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Role
                </Text>
                <TextInput
                  value="Athletic Director/Head Coach"
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                  }}
                />
              </View>

              {/* Bio */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Bio
                </Text>
                <TextInput
                  value="Athletic Director and Head Football Coach at Aledo High School."
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                    minHeight: 90,
                    textAlignVertical: "top"
                  }}
                />
                <Text style={{ color: "#666", fontSize: 11, fontFamily: "NeueHaas-Roman", marginTop: 4, textAlign: "right" }}>
                  41 characters left
                </Text>
              </View>
            </View>
          </View>
        );

      case "password":
        return (
          <View>
            {/* Header with buttons */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <View>
                <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Password
                </Text>
                <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                  Please enter your current password to change your password.
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={{ gap: 18, maxWidth: 500 }}>
              {/* Current Password */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Current password
                </Text>
                <TextInput
                  secureTextEntry
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                  }}
                  placeholderTextColor="#666"
                />
              </View>

              {/* New Password */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  New password
                </Text>
                <TextInput
                  secureTextEntry
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                  }}
                  placeholderTextColor="#666"
                />
                <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman", marginTop: 6 }}>
                  Your new password must be more than 8 characters.
                </Text>
              </View>

              {/* Confirm Password */}
              <View>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Confirm password
                </Text>
                <TextInput
                  secureTextEntry
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                  }}
                  placeholderTextColor="#666"
                />
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <Pressable style={{ backgroundColor: "#3a3a3a", paddingVertical: 9, paddingHorizontal: 20, borderRadius: 8 }}>
                  <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>Cancel</Text>
                </Pressable>
                <Pressable style={{ backgroundColor: "#b4d836", paddingVertical: 9, paddingHorizontal: 20, borderRadius: 8 }}>
                  <Text style={{ color: "#000", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>Update password</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );

      case "team":
        return (
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                Team management
              </Text>
              <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                Update your billing details and address.
              </Text>
            </View>

            {/* Invite Team Members Section */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                Invite team members
              </Text>
              <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 16 }}>
                Get your players & coaches up and running fasterby inviting them to your team.
              </Text>

              {/* Single Invite Input */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <TextInput
                  placeholder="example@email.com"
                  style={{
                    flex: 1,
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                  }}
                  placeholderTextColor="#666"
                />
                <Pressable
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    minWidth: 120,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>Player</Text>
                  <Text style={{ color: "#999", fontSize: 12, marginLeft: 8 }}>▾</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <Pressable style={{ 
                  backgroundColor: "#b4d836", 
                  paddingVertical: 9, 
                  paddingHorizontal: 20, 
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8
                }}>
                  <EmailIcon color="#000" size={16} />
                  <Text style={{ color: "#000", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>Send Invite</Text>
                </Pressable>
              </View>
            </View>

            {/* Team Members Table */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                Team members
              </Text>
              <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 16 }}>
                Manage your current team members and their roles.
              </Text>

              {/* Table */}
              <View style={{ backgroundColor: "#3a3a3a", borderRadius: 12, overflow: "hidden", flex: 1 }}>
                {/* Table Header */}
                <View style={{ 
                  flexDirection: "row", 
                  paddingVertical: 12, 
                  paddingHorizontal: 16, 
                  backgroundColor: "#2a2a2a",
                  borderBottomWidth: 1,
                  borderBottomColor: "#4a4a4a"
                }}>
                  <View style={{ width: 40 }} />
                  <Text style={{ flex: 1, color: "#999", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>Name</Text>
                  <Text style={{ width: 100, color: "#999", fontSize: 13, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>Role</Text>
                  <View style={{ width: 140 }} />
                </View>

                {/* Scrollable Table Rows */}
                <ScrollView showsVerticalScrollIndicator={true}>
                  {[
                    { name: "Danny DeArman", email: "d.dearman@joshuaisd.org", role: "Admin" },
                    { name: "Travis Dougherty", email: "t.dougherty@joshuaisd.org", role: "Coach" },
                    { name: "Jason Payne", email: "j.payne@joshuaisd.org", role: "Coach" },
                    { name: "Barron Wortham", email: "b.wortham@joshuaisd.org", role: "Coach" },
                    { name: "Jeremy Gillmore", email: "j.gillmore@joshuaisd.org", role: "Coach" },
                    { name: "Brayden Payne", email: "b.payne@joshuaisd.org", role: "Player" },
                    { name: "Esteban Salas", email: "e.salas@joshuaisd.org", role: "Player" },
                  ].map((member, idx) => (
                    <View 
                      key={idx}
                      style={{ 
                        flexDirection: "row", 
                        paddingVertical: 14, 
                        paddingHorizontal: 16,
                        alignItems: "center",
                        borderBottomWidth: idx < 6 ? 1 : 0,
                        borderBottomColor: "#4a4a4a"
                      }}
                    >
                      {/* Checkbox */}
                      <View style={{ width: 40 }}>
                        <View style={{ width: 18, height: 18, borderWidth: 2, borderColor: "#666", borderRadius: 4 }} />
                      </View>

                      {/* Avatar & Name */}
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: 18, 
                          backgroundColor: "#666", 
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <Text style={{ color: "#999", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                            {member.name.split(" ").map(n => n[0]).join("")}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Medium" }}>{member.name}</Text>
                          <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>{member.email}</Text>
                        </View>
                      </View>

                      {/* Role */}
                      <Text style={{ width: 100, color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                        {member.role}
                      </Text>

                      {/* Actions */}
                      <View style={{ width: 140, flexDirection: "row", gap: 12, justifyContent: "flex-end" }}>
                        <Pressable>
                          <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>Delete</Text>
                        </Pressable>
                        <Pressable>
                          <Text style={{ color: "#b4d836", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>Edit</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        );

      case "plan":
        return (
          <View style={{ flex: 1 }}>
            {/* Pricing Cards */}
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 32 }}>
              {/* Freshman Plan */}
              <View style={{ flex: 1, backgroundColor: "#3a3a3a", borderRadius: 12, padding: 20 }}>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  Freshman plan
                </Text>
                <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 16 }}>
                  Includes 1 player with limited stats.
                </Text>
                <View style={{ gap: 8 }}>
                  {[
                    "Includes 1 player profile",
                    "Access to all basic features",
                    "Basic reporting and analytics",
                    "20GB individual data",
                    "Basic email support"
                  ].map((feature, idx) => (
                    <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: "#b4d836", fontSize: 16 }}>✓</Text>
                      <Text style={{ color: "#d0d0d0", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* JV Plan */}
              <View style={{ flex: 1, backgroundColor: "#3a3a3a", borderRadius: 12, padding: 20 }}>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                  JV plan
                </Text>
                <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 16 }}>
                  Includes 20 players with unlimited stats.
                </Text>
                <View style={{ gap: 8 }}>
                  {[
                    "Includes 10 player profiles",
                    "20+ integrations",
                    "Advanced reporting and analytics",
                    "100GB individual data",
                    "Priority email support"
                  ].map((feature, idx) => (
                    <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: "#b4d836", fontSize: 16 }}>✓</Text>
                      <Text style={{ color: "#d0d0d0", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Varsity Plan - Selected */}
              <View style={{ flex: 1, backgroundColor: "#3a3a3a", borderRadius: 12, padding: 20, borderWidth: 2, borderColor: "#b4d836" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                    Varsity plan
                  </Text>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#b4d836", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#000", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>✓</Text>
                  </View>
                </View>
                <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 16 }}>
                  Includes unlimited player and unlimited stats.
                </Text>
                <View style={{ gap: 8 }}>
                  {[
                    "Includes unlimited player profiles",
                    "20+ integrations",
                    "Unlimited player profiles",
                    "Unlimited individual data",
                    "Personalized priority support"
                  ].map((feature, idx) => (
                    <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: "#b4d836", fontSize: 16 }}>✓</Text>
                      <Text style={{ color: "#d0d0d0", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Billing History */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                Billing history
              </Text>
              <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 16 }}>
                Download previous invoices.
              </Text>

              {/* Table */}
              <View style={{ backgroundColor: "#3a3a3a", borderRadius: 12, overflow: "hidden" }}>
                {/* Table Header */}
                <View style={{ 
                  flexDirection: "row", 
                  paddingVertical: 12, 
                  paddingHorizontal: 16, 
                  backgroundColor: "#2a2a2a",
                  borderBottomWidth: 1,
                  borderBottomColor: "#4a4a4a"
                }}>
                  <View style={{ width: 40 }} />
                  <Text style={{ width: 80, color: "#999", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>Invoice</Text>
                  <Text style={{ flex: 1, color: "#999", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>Plan</Text>
                  <Text style={{ width: 120, color: "#999", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>Billing date</Text>
                  <Text style={{ width: 100, color: "#999", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>Amount</Text>
                  <Text style={{ width: 100, color: "#999", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>Users</Text>
                  <View style={{ width: 120 }} />
                </View>

                {/* Table Rows */}
                {[
                  { plan: "Varsity", date: "Dec 1, 2022", users: "Unlimited" },
                  { plan: "Varsity", date: "Nov 1, 2022", users: "Unlimited" },
                ].map((invoice, idx) => (
                  <View 
                    key={idx}
                    style={{ 
                      flexDirection: "row", 
                      paddingVertical: 14, 
                      paddingHorizontal: 16,
                      alignItems: "center",
                      borderBottomWidth: idx < 1 ? 1 : 0,
                      borderBottomColor: "#4a4a4a"
                    }}
                  >
                    {/* Checkbox */}
                    <View style={{ width: 40 }}>
                      <View style={{ width: 18, height: 18, borderWidth: 2, borderColor: "#666", borderRadius: 4 }} />
                    </View>

                    {/* PDF Icon */}
                    <View style={{ width: 80 }}>
                      <View style={{ width: 32, height: 40, backgroundColor: "#505050", borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#fff", fontSize: 20 }}>📄</Text>
                      </View>
                    </View>

                    {/* Plan */}
                    <Text style={{ flex: 1, color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                      {invoice.plan}
                    </Text>

                    {/* Billing Date */}
                    <Text style={{ width: 120, color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                      {invoice.date}
                    </Text>

                    {/* Amount - Empty */}
                    <Text style={{ width: 100, color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                      -
                    </Text>

                    {/* Users */}
                    <Text style={{ width: 100, color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                      {invoice.users}
                    </Text>

                    {/* Download Button */}
                    <View style={{ width: 120, alignItems: "flex-end" }}>
                      <Pressable style={{ 
                        backgroundColor: "#2a2a2a", 
                        paddingVertical: 6, 
                        paddingHorizontal: 16, 
                        borderRadius: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6
                      }}>
                        <Text style={{ fontSize: 14 }}>⬇️</Text>
                        <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Medium" }}>Download</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );

      case "billing":
        return (
          <View>
            {/* Header */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                Payment method
              </Text>
              <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                Update your billing details and address.
              </Text>
            </View>

            <View style={{ gap: 24 }}>
              {/* Card Details Section */}
              <View>
                <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Card details
                </Text>
                <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 16 }}>
                  Your card will automatically be charged.
                </Text>

                <View style={{ gap: 12 }}>
                  {/* Name on Card */}
                  <View>
                    <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                      Name on card
                    </Text>
                    <TextInput
                      value="Danny DeArman"
                      style={{
                        backgroundColor: "#3a3a3a",
                        borderRadius: 8,
                        padding: 14,
                        color: "#fff",
                        fontSize: 15,
                        fontFamily: "NeueHaas-Roman",
                      }}
                    />
                  </View>

                  {/* Card Number */}
                  <View>
                    <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                      Card number
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <TextInput
                        value="💳 1234 1234 1234 1234"
                        style={{
                          flex: 1,
                          backgroundColor: "#3a3a3a",
                          borderRadius: 8,
                          padding: 14,
                          color: "#fff",
                          fontSize: 15,
                          fontFamily: "NeueHaas-Roman",
                        }}
                      />
                      <TextInput
                        value="01/23"
                        style={{
                          width: 100,
                          backgroundColor: "#3a3a3a",
                          borderRadius: 8,
                          padding: 14,
                          color: "#fff",
                          fontSize: 15,
                          fontFamily: "NeueHaas-Roman",
                        }}
                      />
                      <TextInput
                        value="123"
                        style={{
                          width: 80,
                          backgroundColor: "#3a3a3a",
                          borderRadius: 8,
                          padding: 14,
                          color: "#fff",
                          fontSize: 15,
                          fontFamily: "NeueHaas-Roman",
                        }}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Email Address Section */}
              <View>
                <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Email address
                </Text>
                <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 16 }}>
                  Invoices will be sent to this email address.
                </Text>

                <TextInput
                  value="billing@joshuaisd.org"
                  style={{
                    backgroundColor: "#3a3a3a",
                    borderRadius: 8,
                    padding: 14,
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "NeueHaas-Roman",
                    marginBottom: 8,
                  }}
                />
                <Pressable>
                  <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>+ Add another</Text>
                </Pressable>
              </View>

              {/* Billing Address Section */}
              <View>
                <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Billing address
                </Text>
                <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 16 }}>
                  Don't worry, we won't send anything here.
                </Text>

                <View style={{ gap: 12 }}>
                  <TextInput
                    value="909 S Broadway St"
                    placeholder="Address 1"
                    style={{
                      backgroundColor: "#3a3a3a",
                      borderRadius: 8,
                      padding: 14,
                      color: "#fff",
                      fontSize: 15,
                      fontFamily: "NeueHaas-Roman",
                    }}
                    placeholderTextColor="#666"
                  />
                  <TextInput
                    placeholder="Address 2"
                    style={{
                      backgroundColor: "#3a3a3a",
                      borderRadius: 8,
                      padding: 14,
                      color: "#fff",
                      fontSize: 15,
                      fontFamily: "NeueHaas-Roman",
                    }}
                    placeholderTextColor="#666"
                  />
                  <TextInput
                    value="Joshua"
                    placeholder="City"
                    style={{
                      backgroundColor: "#3a3a3a",
                      borderRadius: 8,
                      padding: 14,
                      color: "#fff",
                      fontSize: 15,
                      fontFamily: "NeueHaas-Roman",
                    }}
                    placeholderTextColor="#666"
                  />
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TextInput
                      value="Texas"
                      placeholder="State"
                      style={{
                        flex: 1,
                        backgroundColor: "#3a3a3a",
                        borderRadius: 8,
                        padding: 14,
                        color: "#fff",
                        fontSize: 15,
                        fontFamily: "NeueHaas-Roman",
                      }}
                      placeholderTextColor="#666"
                    />
                    <TextInput
                      value="76058"
                      placeholder="Zip"
                      style={{
                        width: 140,
                        backgroundColor: "#3a3a3a",
                        borderRadius: 8,
                        padding: 14,
                        color: "#fff",
                        fontSize: 15,
                        fontFamily: "NeueHaas-Roman",
                      }}
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      case "notifications":
        return (
          <View>
            {/* Header */}
            <View style={{ marginBottom: 36 }}>
              <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 6 }}>
                Notifications
              </Text>
              <Text style={{ color: "#999", fontSize: 15, fontFamily: "NeueHaas-Roman", lineHeight: 22 }}>
                We may still send you important notifications about your account outside of your notification settings.
              </Text>
            </View>

            <View style={{ gap: 48 }}>
              {/* StatIQ Section */}
              <View>
                <Text style={{ color: "#fff", fontSize: 17, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  StatIQ
                </Text>
                <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 22, lineHeight: 20 }}>
                  These are notifications from StatIQ.
                </Text>

                <View style={{ gap: 16 }}>
                  {[
                    { label: "Push", enabled: true },
                    { label: "Email", enabled: true },
                    { label: "SMS", enabled: false },
                  ].map((item, idx) => (
                    <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 }}>
                      <Text style={{ color: "#d0d0d0", fontSize: 16, fontFamily: "NeueHaas-Roman" }}>{item.label}</Text>
                      <Pressable style={{ 
                        width: 48, 
                        height: 26, 
                        borderRadius: 13, 
                        backgroundColor: item.enabled ? "#b4d836" : "#3a3a3a",
                        padding: 2,
                        justifyContent: "center",
                        alignItems: item.enabled ? "flex-end" : "flex-start"
                      }}>
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#000" }} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>

              {/* Other integrations Section */}
              <View>
                <Text style={{ color: "#fff", fontSize: 17, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Other intergrations
                </Text>
                <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 22, lineHeight: 20 }}>
                  These are notifications from your other app intergrations.
                </Text>

                <View style={{ gap: 16 }}>
                  {[
                    { label: "Push", enabled: true },
                    { label: "Email", enabled: false },
                    { label: "SMS", enabled: false },
                  ].map((item, idx) => (
                    <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 }}>
                      <Text style={{ color: "#d0d0d0", fontSize: 16, fontFamily: "NeueHaas-Roman" }}>{item.label}</Text>
                      <Pressable style={{ 
                        width: 48, 
                        height: 26, 
                        borderRadius: 13, 
                        backgroundColor: item.enabled ? "#b4d836" : "#3a3a3a",
                        padding: 2,
                        justifyContent: "center",
                        alignItems: item.enabled ? "flex-end" : "flex-start"
                      }}>
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#000" }} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );

      case "integrations":
        const apps = [
          { name: "Hudl", desc: "Analyze and learn from video and data.", enabled: true, hasLogo: true, Logo: HudlLogo },
          { name: "RankOne", desc: "A comprehensive set of management features to meet your school needs.", enabled: true, hasLogo: true, Logo: RankOneLogo },
          { name: "sportsYou", desc: "Connects coaches, players, and families.", enabled: true, hasLogo: true, Logo: SportsYouLogo },
          { name: "THSCA", desc: "The principle advocate and leadership organization for Texas high school coaches.", enabled: true, hasLogo: false, Logo: null },
          { name: "MaxPreps", desc: "America's source for high school sports.", enabled: true, hasLogo: true, Logo: MaxPrepsLogo },
          { name: "BAND", desc: "An all-in-one group communication app that connects athletes and coaches.", enabled: false, hasLogo: false, Logo: null },
          { name: "CoachUp", desc: "Easiest, safest and most affordable way to connect UIL and NCAA athletes.", enabled: false, hasLogo: false, Logo: null },
          { name: "Catapult", desc: "Technology to help athletes and teams perform to their true potential.", enabled: true, hasLogo: true, Logo: CatapultLogo },
          { name: "gametraka", desc: "Measure your Sports Performance.", enabled: false, hasLogo: false, Logo: null },
          { name: "JustPlay", desc: "An end-to-end workflow and automation platform built for the needs of elite sports programs.", enabled: true, hasLogo: false, Logo: null },
        ];

        return (
          <View style={{ flex: 1 }}>
            {/* Header with Search */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Connected apps
                </Text>
                <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                  Supercharge your workflow + connect tools you use.
                </Text>
              </View>
              <View style={{ 
                backgroundColor: "#2a2a2a", 
                borderRadius: 8, 
                paddingHorizontal: 16, 
                paddingVertical: 11,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                minWidth: 200
              }}>
                <Text style={{ fontSize: 16 }}>🔍</Text>
                <Text style={{ color: "#666", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>Search</Text>
              </View>
            </View>

            {/* Apps List - Scrollable */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <View>
                {apps.map((app, idx) => {
                  const LogoComponent = app.Logo;
                  
                  return (
                    <View 
                      key={idx}
                      style={{ 
                        flexDirection: "row", 
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 16,
                        borderBottomWidth: idx < apps.length - 1 ? 1 : 0,
                        borderBottomColor: "#2a2a2a"
                      }}
                    >
                      {/* Icon & Info */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flex: 1 }}>
                        {/* App Icon/Logo */}
                        {app.hasLogo && LogoComponent ? (
                          <View style={{ 
                            width: 52, 
                            height: 52, 
                            borderRadius: 12, 
                            overflow: "hidden",
                            backgroundColor: "#2a2a2a"
                          }}>
                            <LogoComponent width={52} height={52} />
                          </View>
                        ) : (
                          <View style={{ 
                            width: 52, 
                            height: 52, 
                            borderRadius: 12, 
                            backgroundColor: "#2a2a2a", 
                            alignItems: "center", 
                            justifyContent: "center" 
                          }}>
                            <Text style={{ 
                              color: "#666", 
                              fontSize: 20, 
                              fontFamily: "NeueHaas-Bold" 
                            }}>
                              {app.name.substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        )}

                        {/* App Info */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "#fff", fontSize: 17, fontFamily: "NeueHaas-Bold", marginBottom: 3 }}>
                            {app.name}
                          </Text>
                          <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman", lineHeight: 20 }}>
                            {app.desc}
                          </Text>
                        </View>
                      </View>

                      {/* Learn More & Toggle */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                        <Pressable>
                          <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>Learn more</Text>
                        </Pressable>
                        <Pressable style={{ 
                          width: 48, 
                          height: 26, 
                          borderRadius: 13, 
                          backgroundColor: app.enabled ? "#b4d836" : "#3a3a3a",
                          padding: 2,
                          justifyContent: "center",
                          alignItems: app.enabled ? "flex-end" : "flex-start"
                        }}>
                          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#000" }} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );

      default:
        return (
          <View>
            <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold" }}>
              {menuItems.find(item => item.id === activeSection)?.label}
            </Text>
            <Text style={{ color: "#999", fontSize: 15, fontFamily: "NeueHaas-Roman", marginTop: 8 }}>
              Coming soon...
            </Text>
          </View>
        );
    }
  };

  return (
    <ScreenLayout 
      title="Settings" 
      subtitle="Manage your team and preferences here."
      scrollable={false}
    >
      <View style={{ flexDirection: "row", gap: 20, flex: 1 }}>
        {/* Left Menu - Simple list */}
        <View style={{ width: 160 }}>
          <View style={{ gap: 4 }}>
            {menuItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setActiveSection(item.id)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: activeSection === item.id ? "#3a3a3a" : "transparent",
                }}
              >
                <Text style={{ 
                  color: "#fff", 
                  fontSize: 17, 
                  fontFamily: "NeueHaas-Roman" 
                }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Right Content Area */}
        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>
      </View>
    </ScreenLayout>
  );
}
