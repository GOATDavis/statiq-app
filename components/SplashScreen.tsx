import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/src/constants/design';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  progress: number;
  message: string;
}

export function SplashScreen({ progress, message }: SplashScreenProps) {
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const statOpacity = useRef(new Animated.Value(0)).current;
  const iqOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(20)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  
  // Data points animation
  const [dataPoints] = useState(() => 
    Array.from({ length: 12 }, (_, i) => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      left: Math.random() * (width - 40) + 20,
      top: Math.random() * (height - 200) + 100,
      delay: Math.random() * 1000,
    }))
  );

  useEffect(() => {
    // Sequence the animations like a video intro
    Animated.sequence([
      // 1. Fade in logo container with scale
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // 2. Reveal "Stat" then "IQ" 
      Animated.timing(statOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(iqOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      
      // 3. Slide up tagline
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      
      // 4. Show progress bar
      Animated.timing(progressOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate floating data points
    dataPoints.forEach((point) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(point.delay),
          Animated.parallel([
            Animated.timing(point.opacity, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(point.translateY, {
              toValue: 0,
              duration: 1500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(500),
          Animated.parallel([
            Animated.timing(point.opacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(point.translateY, {
              toValue: -30,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(point.translateY, {
            toValue: 50,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Animate progress bar width
  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a', '#0f0f0f']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        {/* Floating data points in background */}
        {dataPoints.map((point, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dataPoint,
              {
                left: point.left,
                top: point.top,
                opacity: point.opacity,
                transform: [{ translateY: point.translateY }],
              },
            ]}
          >
            <Text style={styles.dataPointText}>
              {['87', '14', '256', '3.2', '42', '99', '18', '7.5', '103', '21', '68', '4'][index]}
            </Text>
          </Animated.View>
        ))}

        {/* Logo container - moved up */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Glow effect behind logo */}
          <Animated.View
            style={[
              styles.glow,
              { opacity: glowOpacity },
            ]}
          />
          
          {/* Logo text */}
          <View style={styles.logoRow}>
            <Animated.Text style={[styles.logoStat, { opacity: statOpacity }]}>
              Stat
            </Animated.Text>
            <Animated.Text style={[styles.logoIQ, { opacity: iqOpacity }]}>
              IQ
            </Animated.Text>
          </View>
        </Animated.View>

        {/* Tagline Image - moved down */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslate }],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/data-always-wins-light.png')}
            style={styles.taglineImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Progress Section */}
        <Animated.View style={[styles.progressContainer, { opacity: progressOpacity }]}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.loadingMessage}>{message}</Text>
        </Animated.View>

        {/* Bottom accent */}
        <View style={styles.bottomAccent}>
          <View style={styles.accentDot} />
          <View style={styles.accentDotDim} />
          <View style={styles.accentDotDim} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataPoint: {
    position: 'absolute',
  },
  dataPointText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.SURGE,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -100,
    marginBottom: 60,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.SURGE,
    opacity: 0.1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoStat: {
    fontSize: 72,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.HALO,
    letterSpacing: -3,
  },
  logoIQ: {
    fontSize: 72,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.HALO,
    letterSpacing: -3,
  },
  taglineContainer: {
    marginTop: 20,
  },
  taglineImage: {
    width: 200,
    height: 30,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 120,
    width: width - 100,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.SURGE,
    borderRadius: 1,
  },
  loadingMessage: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.SURGE,
  },
  accentDotDim: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
