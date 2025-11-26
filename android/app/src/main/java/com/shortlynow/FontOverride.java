package com.Neurom;

import android.content.Context;
import android.graphics.Typeface;
import androidx.core.content.res.ResourcesCompat;
import java.lang.reflect.Field;

public final class FontOverride {

    public static void setDefaultFont(Context context, String staticTypefaceFieldName, int fontResId) {
        try {
            final Typeface customFontTypeface = ResourcesCompat.getFont(context, fontResId);
            final Field staticField = Typeface.class.getDeclaredField(staticTypefaceFieldName);
            staticField.setAccessible(true);
            staticField.set(null, customFontTypeface);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
