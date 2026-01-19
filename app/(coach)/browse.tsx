import React from 'react';
import { View } from 'react-native';
import ScreenLayout from '../../components/ScreenLayout';
import SearchContent from './search/search-content';

export default function BrowseScreen() {
  return (
    <ScreenLayout scrollable={false}>
      <View style={{ flex: 1 }}>
        <SearchContent />
      </View>
    </ScreenLayout>
  );
}
