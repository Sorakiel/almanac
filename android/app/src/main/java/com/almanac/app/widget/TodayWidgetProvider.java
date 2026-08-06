package com.almanac.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import com.almanac.app.MainActivity;
import com.almanac.app.R;
import org.json.JSONArray;

/**
 * Home-screen widget: shows today's habit completion at a glance. Read-only —
 * data comes from SharedPreferences written by WidgetBridgePlugin whenever the
 * web app's habit list changes; tapping just opens the app, never completes a
 * habit from here. onUpdate covers the OS's periodic refresh; the live path is
 * updateWidgets, called directly from the plugin the moment new data lands.
 */
public class TodayWidgetProvider extends AppWidgetProvider {
    private static final int MAX_PENDING_LINES = 3;
    private static final int PROGRESS_BLOCKS = 8;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        updateWidgets(context, manager, ids);
    }

    static void updateWidgets(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences prefs = context.getSharedPreferences(
            WidgetBridgePlugin.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        int done = prefs.getInt(WidgetBridgePlugin.PREF_DONE, 0);
        int total = prefs.getInt(WidgetBridgePlugin.PREF_TOTAL, 0);
        String pendingJson = prefs.getString(WidgetBridgePlugin.PREF_PENDING, "[]");
        JSONArray pending;
        try {
            pending = new JSONArray(pendingJson == null ? "[]" : pendingJson);
        } catch (Exception e) {
            pending = new JSONArray();
        }

        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.today_widget);

            views.setTextViewText(R.id.widget_count, total == 0 ? "—" : done + "/" + total);
            views.setTextViewText(
                R.id.widget_label,
                total == 0 ? "No habits today" : "done today"
            );
            views.setTextViewText(R.id.widget_progress, progressBlocks(done, total));

            int lineCount = Math.min(pending.length(), MAX_PENDING_LINES);
            StringBuilder lines = new StringBuilder();
            for (int i = 0; i < lineCount; i++) {
                if (i > 0) lines.append('\n');
                lines.append("·  ").append(pending.optString(i));
            }
            views.setTextViewText(R.id.widget_pending, lines.toString());
            views.setViewVisibility(
                R.id.widget_pending,
                lines.length() == 0 ? View.GONE : View.VISIBLE
            );

            Intent openIntent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

            manager.updateAppWidget(id, views);
        }
    }

    /** Almanac's block-progress motif (▓▓▓▓░░░░), rendered for RemoteViews. */
    private static String progressBlocks(int done, int total) {
        if (total == 0) return "";
        int clamped = Math.max(0, Math.min(done, total));
        int filled = (clamped * PROGRESS_BLOCKS) / total;
        StringBuilder blocks = new StringBuilder();
        for (int i = 0; i < PROGRESS_BLOCKS; i++) {
            blocks.append(i < filled ? '▓' : '░');
        }
        return blocks.toString();
    }
}
