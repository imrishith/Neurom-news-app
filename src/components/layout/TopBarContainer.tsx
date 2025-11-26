// components/layout/TopBarContainer.tsx
import React from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fh } from "../../../utils/responsive";


interface Props {
    children: React.ReactNode;
    backgroundColor?: string;
    translucent?: boolean;
    onLayout?: (event: LayoutChangeEvent) => void;
}

const TopBarContainer: React.FC<Props> = ({
    children,
    backgroundColor = "transparent",
    translucent = true,
    onLayout,
}) => {

    return (
        <SafeAreaView
            edges={["top"]}
            onLayout={onLayout}
            style={[
                styles.container,
                {
                    backgroundColor,
                },
            ]}
        >
            <View >{children}</View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 50,
        position: "absolute",
        left: 0,
        right: 0,
    },
    // inner: {
    //     paddingBottom: fh(-5),    // Adds space at bottom for the underline
    // },
});

export default TopBarContainer;