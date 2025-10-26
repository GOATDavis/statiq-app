import React from "react";
import { View, Text, ScrollView } from "react-native";

interface ScreenLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function ScreenLayout({ title, subtitle, children, scrollable = true }: ScreenLayoutProps) {
  const content = (
    <View style={{ flex: 1, backgroundColor: "#505050", borderRadius: 24, padding: 24 }}>
      {/* Header - only show if title is provided */}
      {title && (
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: "#fff", fontSize: 32, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ color: "#d0d0d0", fontSize: 16, fontFamily: "NeueHaas-Roman" }}>
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Content */}
      {children}
    </View>
  );

  // Return ScrollView wrapper if scrollable, otherwise just the content
  return scrollable ? (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {content}
    </ScrollView>
  ) : content;
}