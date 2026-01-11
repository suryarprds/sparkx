import time
import os
import shutil
import subprocess
from pathlib import Path

# ================= CONFIG =================
AUDACITY_EXE = r"C:\Program Files\Audacity\audacity.exe"
PIPE_TO_AUDACITY = r'\\.\pipe\ToSrvPipe'
PIPE_FROM_AUDACITY = r'\\.\pipe\FromSrvPipe'

INPUT_DIR = Path(".").resolve()
OUTPUT_DIR = (INPUT_DIR / "_out").resolve()
OUTPUT_DIR.mkdir(exist_ok=True)

# ================= PIPE HELPERS =================
def send(cmd):
    with open(PIPE_TO_AUDACITY, "w", encoding="utf-8") as f:
        f.write(cmd + "\n")

def recv():
    with open(PIPE_FROM_AUDACITY, "r", encoding="utf-8") as f:
        return f.readline().strip()

def safe_do(cmd, wait=0.4):
    print(f"➡️  {cmd}")
    send(cmd)
    time.sleep(wait)
    resp = recv()
    print(f"⬅️  {resp}")
    return resp

# ================= AUDACITY CONTROL =================
def kill_audacity():
    subprocess.run(
        ["taskkill", "/IM", "audacity.exe", "/F", "/T"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(3)

def start_audacity():
    kill_audacity()
    subprocess.Popen([AUDACITY_EXE])
    time.sleep(8)
    safe_do("Help:")

# ================= AUDIO =================
def wav_to_mp3(wav, mp3):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav), "-ac", "1", "-b:a", "62k", str(mp3)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

# ================= MAIN =================
print("=" * 60)
print("🎧 Audacity Single-Project Batch Processor")
print("=" * 60)

# start_audacity()

mp3_files = sorted(INPUT_DIR.glob("*.mp3"))

if not mp3_files:
    print("❌ No MP3 files found")
    kill_audacity()
    exit()

print(f"🎵 Found {len(mp3_files)} MP3 files")

for idx, mp3 in enumerate(mp3_files, start=1):
    print("\n" + "=" * 60)
    print(f"🎵 [{idx}/{len(mp3_files)}] {mp3.name}")
    print("=" * 60)

    wav_out = OUTPUT_DIR / mp3.with_suffix(".wav").name
    mp3_out = OUTPUT_DIR / mp3.name

    # --- CLEAN PREVIOUS TRACK ---
    # safe_do("RemoveTracks:")

    # --- IMPORT ---
    safe_do(f'Import2:Filename="{mp3}"', wait=1.0)
    safe_do("SelectAll")
    safe_do("Stereo to Mono:")

    # --- PROCESSING ---
    # safe_do("OpenVINONoiseSuppression:AttenuationLimit=16")
    safe_do("BassAndTreble:BassGain=-6 TrebleGain=0")
    safe_do("LoudnessNormalization:LUFS=-14")
    safe_do("Normalize:NormalizePeak=0.9 RemoveDCOffset=1")

    # --- EXPORT ---
    safe_do(f'Export2:Filename="{wav_out}" Format=wav', wait=1.2)

    # --- CLEAN PROJECT ---
    safe_do("RemoveTracks:")

    # --- MP3 CONVERSION ---
    wav_to_mp3(wav_out, mp3_out)
    wav_out.unlink(missing_ok=True)

    print("✅ Processed successfully")

# ================= SHUTDOWN =================
safe_do("Close:Force=1")
kill_audacity()

print("\n" + "=" * 60)
print("🎉 ALL FILES PROCESSED")
print(f"📁 Output folder: {OUTPUT_DIR}")
print("=" * 60)
