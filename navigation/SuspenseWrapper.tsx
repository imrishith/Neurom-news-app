// utils/navigation/SuspenseWrapper.tsx

import React, { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";

export function SuspenseWrapper<T extends Record<string, any>>(
    LazyComponent: React.ComponentType<T>
) {
    return (props: T) => (
        <Suspense
            fallback={
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#000",
                    }}
                >
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            }
        >
            <LazyComponent {...props} />
        </Suspense>
    );
}
