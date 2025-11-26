import React, { Component } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

interface DeckSwiperProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onCardPress?: (item: T, index: number) => void;
  cardHeight?: number;
  swipeEnabled?: boolean;
}

export default class DeckSwiper<T> extends Component<DeckSwiperProps<T>> {
  position = new Animated.ValueXY();
  panResponder: any;
  state = {
    animatedIndex: this.props.currentIndex,
  };

  constructor(props: DeckSwiperProps<T>) {
    super(props);
    this.setupPanResponder();
  }

  static getDerivedStateFromProps(nextProps: DeckSwiperProps<any>, prevState: any) {
    if (nextProps.currentIndex !== prevState.animatedIndex) {
      return { animatedIndex: nextProps.currentIndex };
    }
    return null;
  }

  componentDidUpdate(prevProps: DeckSwiperProps<T>) {
    if (this.props.currentIndex !== prevProps.currentIndex) {
      this.position.setValue({ x: 0, y: 0 });
    }
  }

  setupPanResponder() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        this.position.setOffset({ x: 0, y: this.position.y._value });
        this.position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        if (this.props.swipeEnabled === false) return;
        this.position.setValue({ x: 0, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (this.props.swipeEnabled === false) {
          Animated.spring(this.position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
          return;
        }

        const { data, onIndexChange } = this.props;
        const { animatedIndex } = this.state;
        const SWIPE_THRESHOLD = 50;
        const SWIPE_VELOCITY = 0.3;

        // Swipe UP → Next
        if (
          -gestureState.dy > SWIPE_THRESHOLD &&
          -gestureState.vy > SWIPE_VELOCITY &&
          animatedIndex < data.length - 1
        ) {
          this.position.setOffset({ x: 0, y: 0 });
          Animated.timing(this.position, {
            toValue: { x: 0, y: -SCREEN_HEIGHT },
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onIndexChange(animatedIndex + 1);
          });
        }
        // Swipe DOWN → Previous
        else if (
          gestureState.dy > SWIPE_THRESHOLD &&
          gestureState.vy > SWIPE_VELOCITY &&
          animatedIndex > 0
        ) {
          this.position.setOffset({ x: 0, y: 0 });
          Animated.timing(this.position, {
            toValue: { x: 0, y: SCREEN_HEIGHT },
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onIndexChange(animatedIndex - 1);
          });
        } else {
          this.position.setOffset({ x: 0, y: 0 });
          Animated.spring(this.position, {
            toValue: { x: 0, y: 0 },
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }

  handleCardPress = (item: T, index: number) => {
    if (this.props.onCardPress) {
      this.props.onCardPress(item, index);
    }
  };

  renderCards = () => {
    const { data, renderCard, cardHeight = SCREEN_HEIGHT } = this.props;
    const { animatedIndex } = this.state;

    if (data.length === 0) {
      return (
        <View style={styles.empty}>
          <Animated.Text>No items available</Animated.Text>
        </View>
      );
    }

    return data
      .map((item, i) => {
        if (i < animatedIndex - 1 || i > animatedIndex + 1) return null;

        let translateY = new Animated.Value(0);
        let scale = new Animated.Value(1);
        let overlayOpacity = new Animated.Value(0);
        let panHandlers = {};
        let key = `${i}`;

        if (i === animatedIndex) {
          translateY = this.position.y.interpolate({
            inputRange: [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT],
            outputRange: [-SCREEN_HEIGHT, 0, 0],
            extrapolate: "clamp",
          });

          scale = this.position.y.interpolate({
            inputRange: [0, SCREEN_HEIGHT],
            outputRange: [1, 0.9],
            extrapolate: "clamp",
          });

          overlayOpacity = this.position.y.interpolate({
            inputRange: [0, SCREEN_HEIGHT],
            outputRange: [0, 0.5],
            extrapolate: "clamp",
          });

          panHandlers = this.panResponder.panHandlers;
        } else if (i === animatedIndex + 1) {
          scale = this.position.y.interpolate({
            inputRange: [-SCREEN_HEIGHT, 0],
            outputRange: [1, 0.9],
            extrapolate: "clamp",
          });
        } else if (i === animatedIndex - 1) {
          translateY = this.position.y.interpolate({
            inputRange: [0, SCREEN_HEIGHT],
            outputRange: [-SCREEN_HEIGHT, 0],
            extrapolate: "clamp",
          });
        }

        return (
          <Animated.View
            key={key}
            style={[
              styles.cardWrapper,
              { transform: [{ translateY }, { scale }], height: cardHeight },
            ]}
            {...panHandlers}
          >
            <TouchableWithoutFeedback onPress={() => this.handleCardPress(item, i)}>
              <View style={{ flex: 1 }}>
                {renderCard(item, i)}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: "black", opacity: overlayOpacity },
                  ]}
                />
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        );
      })
      .reverse();
  };

  render() {
    return <View style={{ flex: 1 }}>{this.renderCards()}</View>;
  }
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    position: "absolute",
    width: SCREEN_WIDTH,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});