package com.Neurom;

import android.app.Activity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.OnBackPressedDispatcher;
import androidx.activity.OnBackPressedDispatcherOwner;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

public class BackPressOverride {

    public static void enable(Activity activity) {
        OnBackPressedDispatcher dispatcher =
            ((OnBackPressedDispatcherOwner) activity).getOnBackPressedDispatcher();

        dispatcher.addCallback(
            new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    ReactInstanceManager manager =
                        ((ReactApplication) activity.getApplication())
                            .getReactNativeHost()
                            .getReactInstanceManager();

                    if (manager != null) {
                        ReactContext reactContext = manager.getCurrentReactContext();
                        
                        if (reactContext != null) {
                            // ✅ Trigger React Native's back press event
                            // This properly fires BackHandler listeners in JavaScript
                            reactContext
                                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("hardwareBackPress", null);
                            
                            // ✅ Also call the old method for compatibility
                            manager.onBackPressed();
                        } else {
                            // React not ready, allow default behavior
                            setEnabled(false);
                            dispatcher.onBackPressed();
                            setEnabled(true);
                        }
                    } else {
                        // No manager, allow default behavior
                        setEnabled(false);
                        dispatcher.onBackPressed();
                        setEnabled(true);
                    }
                }
            }
        );
    }
}