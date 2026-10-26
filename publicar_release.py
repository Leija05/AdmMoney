#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
========================================================================
ADM MONEY — COMPILADOR LOCAL & PUBLICADOR AUTOMÁTICO DE RELEASES GITHUB
========================================================================
Compila el APK nativo en tu computadora y publica automáticamente un
nuevo Release en GitHub con el archivo APK adjunto listo para ser
detectado y descargado por la aplicación móvil.
========================================================================
"""

import os
import sys
import json
import re
import shutil
import subprocess

def print_banner():
    print("=" * 72)
    print("   ADM MONEY — COMPILADOR LOCAL Y PUBLICADOR AUTOMÁTICO EN GITHUB")
    print("=" * 72)
    print()

def get_gh_binary():
    gh = shutil.which("gh")
    if gh:
        return gh
    standard_paths = [
        r"C:\Program Files\GitHub CLI\gh.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\GitHub CLI\gh.exe"),
        os.path.expandvars(r"%PROGRAMFILES%\GitHub CLI\gh.exe"),
    ]
    for p in standard_paths:
        if os.path.exists(p):
            return p
    return "gh"

def read_current_version(app_json_path):
    try:
        with open(app_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("expo", {}).get("version", "1.0.0")
    except Exception:
        return "1.0.0"

def calculate_next_version(ver_str):
    parts = ver_str.strip().lstrip("vV").split(".")
    try:
        if len(parts) >= 3:
            return f"{parts[0]}.{parts[1]}.{int(parts[2]) + 1}"
        elif len(parts) == 2:
            return f"{parts[0]}.{int(parts[1]) + 1}.0"
        elif len(parts) == 1:
            return f"{parts[0]}.0.1"
    except Exception:
        pass
    return "1.0.1"

def update_version_files(frontend_dir, android_dir, clean_version):
    # 1. appConfig.ts
    app_config_path = os.path.join(frontend_dir, "src", "config", "appConfig.ts")
    if os.path.exists(app_config_path):
        with open(app_config_path, "r", encoding="utf-8") as f:
            content = f.read()
        new_content = re.sub(r"APP_VERSION:\s*['\"][^'\"]+['\"]", f"APP_VERSION: '{clean_version}'", content)
        with open(app_config_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  [OK] Actualizado appConfig.ts -> APP_VERSION: '{clean_version}'")

    # 2. app.json
    app_json_path = os.path.join(frontend_dir, "app.json")
    if os.path.exists(app_json_path):
        with open(app_json_path, "r", encoding="utf-8") as f:
            app_data = json.load(f)
        if "expo" in app_data:
            app_data["expo"]["version"] = clean_version
        with open(app_json_path, "w", encoding="utf-8") as f:
            json.dump(app_data, f, indent=2)
            f.write("\n")
        print(f"  [OK] Actualizado app.json -> version: '{clean_version}'")

    # 3. package.json
    package_json_path = os.path.join(frontend_dir, "package.json")
    if os.path.exists(package_json_path):
        with open(package_json_path, "r", encoding="utf-8") as f:
            pkg_data = json.load(f)
        pkg_data["version"] = clean_version
        with open(package_json_path, "w", encoding="utf-8") as f:
            json.dump(pkg_data, f, indent=2)
            f.write("\n")
        print(f"  [OK] Actualizado package.json -> version: '{clean_version}'")

    # 4. android/app/build.gradle
    build_gradle_path = os.path.join(android_dir, "app", "build.gradle")
    if os.path.exists(build_gradle_path):
        with open(build_gradle_path, "r", encoding="utf-8") as f:
            content = f.read()
        # Increment versionCode
        code_match = re.search(r"versionCode\s+(\d+)", content)
        new_code = 2
        if code_match:
            new_code = int(code_match.group(1)) + 1
        content = re.sub(r"versionCode\s+\d+", f"versionCode {new_code}", content)
        content = re.sub(r'versionName\s+"[^"]+"', f'versionName "{clean_version}"', content)
        with open(build_gradle_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  [OK] Actualizado build.gradle -> versionCode {new_code}, versionName \"{clean_version}\"")

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "AdmMoneyMovil", "frontend")
    android_dir = os.path.join(frontend_dir, "android")
    app_json_path = os.path.join(frontend_dir, "app.json")

    print_banner()

    gh_bin = get_gh_binary()

    # Verificar sesión de GitHub CLI
    try:
        auth_check = subprocess.run([gh_bin, "auth", "status"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if auth_check.returncode != 0 and "Logged in" not in auth_check.stderr and "Logged in" not in auth_check.stdout:
            print("[AVISO] GitHub CLI no ha iniciado sesión.")
            print("Por favor ejecuta: gh auth login")
            input("Presiona ENTER para salir...")
            return 1
        print("  ✓ Autenticación de GitHub detectada correctamente.")
    except Exception as e:
        print(f"[ERROR] No se pudo verificar GitHub CLI: {e}")
        return 1

    current_version = read_current_version(app_json_path)
    suggested_version = calculate_next_version(current_version)
    suggested_tag = f"v{suggested_version}"

    print(f"\nVersión actual del proyecto: {current_version}")
    tag_input = input(f"Ingresa el tag del nuevo Release [ENTER para {suggested_tag}]: ").strip()
    tag = tag_input if tag_input else suggested_tag
    clean_version = tag.lstrip("vV")

    default_title = f"Adm Money {tag} - Actualización Oficial"
    title_input = input(f"Título del Release [ENTER para '{default_title}']: ").strip()
    title = title_input if title_input else default_title

    print("\nDescribe las novedades o cambios de esta versión:")
    print("(Si dejas en blanco, se usarán notas automáticas de mejoras generales)")
    notes_input = input("Notas: ").strip()
    if not notes_input:
        notes_input = (
            f"Versión {tag} de Adm Money:\n"
            "- Optimización en la gestión de pedidos y tiempos de entrega.\n"
            "- Diseño responsivo mejorado y navegación ultra fluida en pantallas móviles.\n"
            "- Mejoras de estabilidad, rendimiento y cálculo de costos de producción."
        )

    print("\n" + "-" * 72)
    print(f"1. Sincronizando números de versión a: {clean_version}...")
    print("-" * 72)
    update_version_files(frontend_dir, android_dir, clean_version)

    print("\n" + "-" * 72)
    print("2. Compilando APK Nativo con Gradle (assembleRelease)...")
    print("   Esto tomará entre 1 y 2 minutos mientras empaqueta el release.")
    print("-" * 72)

    gradlew_bat = os.path.join(android_dir, "gradlew.bat")
    if not os.path.exists(gradlew_bat):
        print(f"[ERROR] No se encontró gradlew.bat en {android_dir}")
        return 1

    build_res = subprocess.run([gradlew_bat, "assembleRelease"], cwd=android_dir)
    if build_res.returncode != 0:
        print("\n[ERROR] La compilación de Gradle falló.")
        input("Presiona ENTER para salir...")
        return 1

    # Buscar el archivo generado
    release_apk_dir = os.path.join(android_dir, "app", "build", "outputs", "apk", "release")
    candidates = [
        os.path.join(release_apk_dir, "Adm_Monet.apk"),
        os.path.join(release_apk_dir, "app-release.apk"),
        os.path.join(release_apk_dir, "Adm_Money.apk"),
    ]

    found_apk = None
    for cand in candidates:
        if os.path.exists(cand):
            found_apk = cand
            break

    if not found_apk:
        # Buscar cualquier archivo .apk en la carpeta
        for fname in os.listdir(release_apk_dir):
            if fname.lower().endswith(".apk"):
                found_apk = os.path.join(release_apk_dir, fname)
                break

    if not found_apk:
        print(f"\n[ERROR] No se encontró ningún archivo .apk en {release_apk_dir}")
        input("Presiona ENTER para salir...")
        return 1

    dest_apk_money = os.path.join(root_dir, "Adm_Money.apk")
    dest_apk_monet = os.path.join(root_dir, "Adm_Monet.apk")
    shutil.copyfile(found_apk, dest_apk_money)
    shutil.copyfile(found_apk, dest_apk_monet)

    apk_size_mb = os.path.getsize(dest_apk_money) / (1024 * 1024)
    print(f"\n  ✓ APK compilado con éxito: {dest_apk_money} ({apk_size_mb:.1f} MB)")

    print("\n" + "-" * 72)
    print("3. Guardando cambios de versión en Git...")
    print("-" * 72)
    try:
        subprocess.run(["git", "add", "."], cwd=root_dir, check=True)
        # Commit solo si hay cambios
        commit_res = subprocess.run(
            ["git", "commit", "-m", f"chore(release): bump version to {tag}"],
            cwd=root_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if commit_res.returncode == 0:
            print(f"  ✓ Commit creado: chore(release): bump version to {tag}")
            print("  ✓ Enviando cambios a GitHub (git push origin master)...")
            subprocess.run(["git", "push", "origin", "master"], cwd=root_dir, check=True)
        else:
            print("  (Sin cambios pendientes por commitear en Git)")
    except Exception as e:
        print(f"  [AVISO] No se pudo hacer git push automáticamente: {e}")

    print("\n" + "-" * 72)
    print(f"4. Creando Release en GitHub ({tag}) y subiendo {os.path.basename(dest_apk_money)}...")
    print("-" * 72)

    release_cmd = [
        gh_bin,
        "release",
        "create",
        tag,
        dest_apk_money,
        "--repo",
        "Leija05/AdmMoney",
        "--title",
        title,
        "--notes",
        notes_input,
    ]

    upload_res = subprocess.run(release_cmd, cwd=root_dir)
    if upload_res.returncode == 0:
        print("\n" + "=" * 72)
        print("   ¡EXITO TOTAL! RELEASE PUBLICADO EXITOSAMENTE EN GITHUB")
        print("=" * 72)
        print(f"   Tag creado:      {tag}")
        print(f"   Título:          {title}")
        print(f"   Archivo adjunto: Adm_Money.apk ({apk_size_mb:.1f} MB)")
        print(f"   URL del Release: https://github.com/Leija05/AdmMoney/releases/tag/{tag}")
        print()
        print("   ¡Tu aplicación móvil ahora detectará automáticamente esta versión")
        print("   cuando consultes Ajustes -> Actualización de la App!")
        print("=" * 72)
    else:
        print(f"\n[AVISO] GitHub CLI devolvió código de salida {upload_res.returncode}.")
        print(f"Puedes verificar el estado en https://github.com/Leija05/AdmMoney/releases")

    print()
    input("Presiona ENTER para finalizar...")
    return 0

if __name__ == "__main__":
    sys.exit(main())
