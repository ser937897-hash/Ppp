package __PACKAGE__;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.view.ContextThemeWrapper;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;

/**
 * Окно «поверх других приложений»: перетаскиваемая панель с анализатором
 * (WebView со страницей ?overlay=1) и круглая кнопка в свёрнутом виде.
 * Работает как foreground-сервис, поэтому остаётся на экране, когда
 * основное приложение свёрнуто.
 */
public class OverlayService extends Service {

    private static final String CHANNEL_ID = "ev_overlay";
    private static final int NOTIFICATION_ID = 4711;
    private static final String HOST = "overlay.local";

    private final Handler ui = new Handler(Looper.getMainLooper());

    private WindowManager wm;
    private LinearLayout panel;
    private TextView bubble;
    private WebView web;
    private WindowManager.LayoutParams panelParams;
    private WindowManager.LayoutParams bubbleParams;

    private boolean expanded = false;
    private int posX;
    private int posY;
    private int screenW;
    private int screenH;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForegroundCompat();

        if (!Settings.canDrawOverlays(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (panel == null) {
            buildViews();
        }

        String state = intent != null ? intent.getStringExtra("state") : null;
        String url = "https://" + HOST + "/index.html?overlay=1";
        if (state != null && !state.isEmpty()) {
            url += "&state=" + Uri.encode(state);
        }
        web.loadUrl(url);

        showPanel();
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        detachAll();
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    // ---------------------------------------------------------------- notification

    private void startForegroundCompat() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Оверлей ♠ EV", NotificationManager.IMPORTANCE_LOW);
            nm.createNotificationChannel(channel);
        }

        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = launch == null ? null : PendingIntent.getActivity(
                this, 0, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        int icon = getApplicationInfo().icon != 0
                ? getApplicationInfo().icon
                : android.R.drawable.ic_dialog_info;
        builder.setContentTitle("♠ EV оверлей активен")
                .setContentText("Нажмите, чтобы открыть приложение")
                .setSmallIcon(icon)
                .setOngoing(true);
        if (pi != null) {
            builder.setContentIntent(pi);
        }
        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIFICATION_ID, notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    // ---------------------------------------------------------------- views

    private int dp(int v) {
        return (int) (v * getResources().getDisplayMetrics().density + 0.5f);
    }

    private void buildViews() {
        DisplayMetrics dm = getResources().getDisplayMetrics();
        screenW = dm.widthPixels;
        screenH = dm.heightPixels;
        posX = dp(8);
        posY = dp(80);

        ContextThemeWrapper themed =
                new ContextThemeWrapper(this, android.R.style.Theme_DeviceDefault);

        // --- web view with the analyzer
        web = new WebView(themed);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        web.setBackgroundColor(0xFF121418);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "OverlayNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!HOST.equals(u.getHost())) {
                    return null;
                }
                String path = u.getPath();
                if (path == null || path.equals("/")) {
                    path = "/index.html";
                }
                try {
                    InputStream is = getAssets().open("public" + path);
                    return new WebResourceResponse(mime(path), "utf-8", is);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                            new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
                }
            }
        });

        // --- header with drag area and buttons
        LinearLayout header = new LinearLayout(themed);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setBackgroundColor(0xFF252A34);
        header.setPadding(dp(10), 0, dp(6), 0);

        TextView title = new TextView(themed);
        title.setText("✥ Перетащить");
        title.setTextColor(0xFFD0D5DD);
        title.setTextSize(12);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        header.addView(title, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f));

        header.addView(makeButton(themed, "—", 0xFF373E4D, new Runnable() {
            @Override
            public void run() {
                showBubble();
            }
        }));
        header.addView(makeButton(themed, "✕", 0xFFD32F2F, new Runnable() {
            @Override
            public void run() {
                stopSelf();
            }
        }));

        // --- panel = header + web view
        panel = new LinearLayout(themed);
        panel.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable panelBg = new GradientDrawable();
        panelBg.setColor(0xFF121418);
        panelBg.setCornerRadius(dp(16));
        panelBg.setStroke(dp(2), 0xAA00E676);
        panel.setBackground(panelBg);
        panel.setClipToOutline(true);
        panel.addView(header, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(40)));
        panel.addView(web, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

        // --- bubble (collapsed state)
        bubble = new TextView(themed);
        bubble.setText("♠ EV");
        bubble.setTextColor(0xFF00E676);
        bubble.setTextSize(13);
        bubble.setTypeface(null, android.graphics.Typeface.BOLD);
        bubble.setGravity(Gravity.CENTER);
        GradientDrawable bubbleBg = new GradientDrawable();
        bubbleBg.setShape(GradientDrawable.OVAL);
        bubbleBg.setColor(0xFF1E2229);
        bubbleBg.setStroke(dp(2), 0xFF00E676);
        bubble.setBackground(bubbleBg);
        bubble.setElevation(dp(6));

        // --- window params
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        int panelW = Math.min(dp(360), screenW - dp(16));
        int panelH = Math.min(dp(560), (int) (screenH * 0.8f));
        panelParams = new WindowManager.LayoutParams(panelW, panelH, type,
                panelFlags(false), PixelFormat.TRANSLUCENT);
        panelParams.gravity = Gravity.TOP | Gravity.START;
        panelParams.softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;

        bubbleParams = new WindowManager.LayoutParams(dp(56), dp(56), type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        bubbleParams.gravity = Gravity.TOP | Gravity.START;

        header.setOnTouchListener(new Dragger(panel, panelParams, null));
        bubble.setOnTouchListener(new Dragger(bubble, bubbleParams, new Runnable() {
            @Override
            public void run() {
                showPanel();
            }
        }));
    }

    private TextView makeButton(ContextThemeWrapper ctx, String text, int color, final Runnable onClick) {
        TextView b = new TextView(ctx);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(12);
        b.setTypeface(null, android.graphics.Typeface.BOLD);
        b.setGravity(Gravity.CENTER);
        b.setPadding(dp(12), dp(5), dp(12), dp(5));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(color);
        bg.setCornerRadius(dp(6));
        b.setBackground(bg);
        b.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onClick.run();
            }
        });
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.leftMargin = dp(6);
        b.setLayoutParams(lp);
        return b;
    }

    private int panelFlags(boolean focusable) {
        return WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
                | (focusable ? 0 : WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
    }

    private void showPanel() {
        detachAll();
        panelParams.flags = panelFlags(false);
        panelParams.x = posX;
        panelParams.y = posY;
        wm.addView(panel, panelParams);
        expanded = true;
    }

    private void showBubble() {
        detachAll();
        bubbleParams.x = posX;
        bubbleParams.y = posY;
        wm.addView(bubble, bubbleParams);
        expanded = false;
    }

    private void detachAll() {
        if (wm == null) {
            return;
        }
        try {
            if (panel != null) {
                wm.removeView(panel);
            }
        } catch (Exception ignored) {
            // not attached
        }
        try {
            if (bubble != null) {
                wm.removeView(bubble);
            }
        } catch (Exception ignored) {
            // not attached
        }
    }

    /** Окно забирает фокус (и показывает клавиатуру) только пока редактируется текстовое поле. */
    private void applyFocusable(boolean focusable) {
        if (!expanded || panelParams == null) {
            return;
        }
        int flags = panelFlags(focusable);
        if (panelParams.flags == flags) {
            return;
        }
        panelParams.flags = flags;
        try {
            wm.updateViewLayout(panel, panelParams);
        } catch (Exception ignored) {
            return;
        }
        if (focusable) {
            ui.postDelayed(new Runnable() {
                @Override
                public void run() {
                    if (web == null) {
                        return;
                    }
                    web.requestFocus();
                    InputMethodManager imm =
                            (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                    if (imm != null) {
                        imm.showSoftInput(web, InputMethodManager.SHOW_IMPLICIT);
                    }
                }
            }, 120);
        }
    }

    // ---------------------------------------------------------------- dragging

    private class Dragger implements View.OnTouchListener {
        private final View target;
        private final WindowManager.LayoutParams lp;
        private final Runnable onTap;
        private float downX;
        private float downY;
        private int startX;
        private int startY;
        private boolean moved;

        Dragger(View target, WindowManager.LayoutParams lp, Runnable onTap) {
            this.target = target;
            this.lp = lp;
            this.onTap = onTap;
        }

        @Override
        public boolean onTouch(View v, MotionEvent e) {
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    downX = e.getRawX();
                    downY = e.getRawY();
                    startX = lp.x;
                    startY = lp.y;
                    moved = false;
                    return true;
                case MotionEvent.ACTION_MOVE: {
                    float dx = e.getRawX() - downX;
                    float dy = e.getRawY() - downY;
                    if (!moved && Math.abs(dx) < dp(6) && Math.abs(dy) < dp(6)) {
                        return true;
                    }
                    moved = true;
                    int maxX = Math.max(0, screenW - target.getWidth());
                    int maxY = Math.max(0, screenH - target.getHeight());
                    lp.x = Math.min(maxX, Math.max(0, startX + (int) dx));
                    lp.y = Math.min(maxY, Math.max(0, startY + (int) dy));
                    posX = lp.x;
                    posY = lp.y;
                    try {
                        wm.updateViewLayout(target, lp);
                    } catch (Exception ignored) {
                        // view already removed
                    }
                    return true;
                }
                case MotionEvent.ACTION_UP:
                    if (!moved && onTap != null) {
                        onTap.run();
                    }
                    return true;
                default:
                    return true;
            }
        }
    }

    // ---------------------------------------------------------------- JS bridge

    private class Bridge {
        @JavascriptInterface
        public void setBubbleText(final String text) {
            ui.post(new Runnable() {
                @Override
                public void run() {
                    if (bubble != null) {
                        bubble.setText(text);
                    }
                }
            });
        }

        @JavascriptInterface
        public void setFocusable(final boolean focusable) {
            ui.post(new Runnable() {
                @Override
                public void run() {
                    applyFocusable(focusable);
                }
            });
        }

        @JavascriptInterface
        public void close() {
            ui.post(new Runnable() {
                @Override
                public void run() {
                    stopSelf();
                }
            });
        }
    }

    // ---------------------------------------------------------------- assets

    private static String mime(String path) {
        String p = path.toLowerCase(Locale.ROOT);
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".woff")) return "font/woff";
        if (p.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }
}
