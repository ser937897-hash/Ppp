#!/usr/bin/env python3
"""Добавляет нативный оверлей в Android-проект, созданный `npx cap add android`.

Копирует Java-файлы из native/android в пакет приложения и дописывает
разрешения и сервис в AndroidManifest.xml. Можно запускать повторно.
"""
import json
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
src_dir = root / "native" / "android"
android_dir = root / "android"
manifest_path = android_dir / "app" / "src" / "main" / "AndroidManifest.xml"

if not manifest_path.exists():
    sys.exit("android/ не найден: сначала выполните `npx cap add android`")

package = json.loads((root / "capacitor.config.json").read_text(encoding="utf-8"))["appId"]
dest_dir = android_dir / "app" / "src" / "main" / "java" / pathlib.Path(*package.split("."))
dest_dir.mkdir(parents=True, exist_ok=True)

for java_file in sorted(src_dir.glob("*.java")):
    text = java_file.read_text(encoding="utf-8").replace("__PACKAGE__", package)
    (dest_dir / java_file.name).write_text(text, encoding="utf-8")
    print(f"copied {java_file.name} -> {dest_dir}")

manifest = manifest_path.read_text(encoding="utf-8")
if "OverlayService" in manifest:
    print("manifest already patched")
else:
    permissions = """    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

"""
    service = """        <service
            android:name=".OverlayService"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="floating_ev_overlay" />
        </service>
    """
    if "<application" not in manifest or "</application>" not in manifest:
        sys.exit("AndroidManifest.xml: не найден блок <application>")
    manifest = manifest.replace("<application", permissions + "    <application", 1)
    manifest = manifest.replace("</application>", service + "</application>", 1)
    manifest_path.write_text(manifest, encoding="utf-8")
    print("manifest patched")
