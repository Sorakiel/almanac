package com.almanac.app.widget;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Read-only bridge: the web app pushes today's habit summary here whenever it
 * changes (see useNativeWidgetSync.ts), and TodayWidgetProvider reads it back
 * from SharedPreferences to redraw. Nothing flows the other way — the widget
 * never writes, matching RET-4's read-only scope (same contract as the macOS
 * tray's set_widget_summary).
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    static final String PREFS_NAME = "today_widget_prefs";
    static final String PREF_DONE = "done";
    static final String PREF_TOTAL = "total";
    static final String PREF_PENDING = "pending";

    @PluginMethod
    public void updateToday(PluginCall call) {
        int done = call.getInt("done", 0);
        int total = call.getInt("total", 0);
        JSArray pending = call.getArray("pending", new JSArray());

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putInt(PREF_DONE, done)
            .putInt(PREF_TOTAL, total)
            .putString(PREF_PENDING, pending.toString())
            .apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TodayWidgetProvider.class));
        if (ids.length > 0) {
            TodayWidgetProvider.updateWidgets(context, manager, ids);
        }

        call.resolve();
    }
}
