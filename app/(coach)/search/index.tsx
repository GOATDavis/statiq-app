import React from "react";
import { View, Text } from "react-native";
import ScreenLayout from "../../../components/ScreenLayout";
import SearchContent from "./search-content";

export default function SearchScreen() {
  return (
    <ScreenLayout title="" subtitle="" scrollable={false}>
      <SearchContent />
    </ScreenLayout>
  );
}
