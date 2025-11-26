package com.Neurom;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class AppReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        // Handle package removed or replaced event
        String action = intent.getAction();
        if (action != null && action.equals("android.intent.action.PACKAGE_REMOVED")) {
            // The app is removed from recent tasks, clear cache
            Log.d("AppReceiver", "App removed, clearing cache.");
            clearAppCache(context);
        } 
    }

    private void clearAppCache(Context context) {
        // Clear app cache or reset settings
        // Example: Clear SQLite DB, files, or preferences
        Log.d("AppReceiver", "Cache Cleared");
        // Add your cache clearing logic here
    }
}
