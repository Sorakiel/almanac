package com.almanac.app;

import android.os.Bundle;
import com.almanac.app.widget.WidgetBridgePlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugin (not an npm package) — must register before super.onCreate(),
        // which is where the Capacitor bridge builds its plugin list.
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
