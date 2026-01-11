# import time
# import os
# import shutil
# import subprocess
# from pathlib import Path

# # ================= CONFIG =================
# AUDACITY_EXE = r"C:\Program Files\Audacity\audacity.exe"
# PIPE_TO_AUDACITY = r'\\.\pipe\ToSrvPipe'
# PIPE_FROM_AUDACITY = r'\\.\pipe\FromSrvPipe'

# INPUT_DIR = Path(".").resolve()
# OUTPUT_DIR = (INPUT_DIR / "_out").resolve()
# OUTPUT_DIR.mkdir(exist_ok=True)

# # ================= PIPE HELPERS =================
# def send(cmd):
#     with open(PIPE_TO_AUDACITY, "w", encoding="utf-8") as f:
#         f.write(cmd + "\n")

# def recv():
#     with open(PIPE_FROM_AUDACITY, "r", encoding="utf-8") as f:
#         return f.readline().strip()

# def safe_do(cmd, wait=0.4):
#     print(f"➡️  {cmd}")
#     send(cmd)
#     time.sleep(wait)
#     resp = recv()
#     print(f"⬅️  {resp}")
#     return resp

# # ================= AUDACITY CONTROL =================
# def kill_audacity():
#     subprocess.run(
#         ["taskkill", "/IM", "audacity.exe", "/F", "/T"],
#         stdout=subprocess.DEVNULL,
#         stderr=subprocess.DEVNULL
#     )
#     time.sleep(3)

# def start_audacity():
#     kill_audacity()
#     subprocess.Popen([AUDACITY_EXE])
#     time.sleep(8)
#     safe_do("Help:")

# # ================= MAIN =================
# print("=" * 60)
# print("🎧 Audacity Single-Project Batch Processor")
# print("=" * 60)

# start_audacity()

# mp3_files = sorted(INPUT_DIR.glob("*.mp3"))

# if not mp3_files:
#     print("❌ No MP3 files found")
#     kill_audacity()
#     exit()

# print(f"🎵 Found {len(mp3_files)} MP3 files")

# for idx, mp3 in enumerate(mp3_files, start=1):
#     print("\n" + "=" * 60)
#     print(f"🎵 [{idx}/{len(mp3_files)}] {mp3.name}")
#     print("=" * 60)


#     mp3_out = OUTPUT_DIR / mp3.name

#     # --- CLEAN PREVIOUS TRACK ---
#     # safe_do("RemoveTracks:")

#     # --- IMPORT ---
#     safe_do(f'Import2:Filename="{mp3}"', wait=1.0)
#     safe_do("SelectAll")
#     safe_do("Stereo to Mono:")

#     # --- PROCESSING ---
#     safe_do("LoudnessNormalization:LUFS=-14")
#     safe_do("SelectAll")
#     safe_do("Generate:Generator=Silence Duration=900", wait=2.0)

#     # --- EXPORT ---
#     safe_do(f'Export2:Filename="{mp3_out}" NumChannels=1 Quality=240', wait=1.2)

#     # --- CLEAN PROJECT ---
#     safe_do("RemoveTracks:")

#     print("✅ Processed successfully")

# # ================= SHUTDOWN =================
# # Keeping Audacity open for manual closure

# print("\n" + "=" * 60)
# print("🎉 ALL FILES PROCESSED")
# print(f"📁 Output folder: {OUTPUT_DIR}")
# print("=" * 60)


"""
Audacity Batch MP3 Processor

Automates batch processing of MP3 files using Audacity via named pipes.
Adds configurable silence duration to the end of each audio file.

Requirements:
- Audacity installed at: C:\\Program Files\\Audacity\\audacity.exe
- Enable named pipes in Audacity:
  1. Open Audacity
  2. Edit -> Preferences -> Modules
  3. Find "mod-script-pipe"
  4. Click Enable
  5. Restart Audacity

Usage:
    1. Place MP3 files in the current directory
    2. Run the script with desired silence duration:
       python batch_audio.py [options]

Options:
    -s, --silence   Add silence duration in minutes (default: 0)

Example:
    python batch_audio.py -s 2  # Add 2 minutes of silence to all MP3s in current directory

Note:
    Processed audio files are saved to the _out folder.
"""

import time
import subprocess
from pathlib import Path
import argparse

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

# ================= PROCESSING =================
def process_files(prepend_file=None, append_file=None, silence_minutes=0):
    print("=" * 60)
    print("🎧 Audacity Batch Processor")
    print("=" * 60)

    start_audacity()

    mp3_files = sorted(INPUT_DIR.glob("*.mp3"))

    if not mp3_files:
        print("❌ No MP3 files found")
        return

    print(f"🎵 Found {len(mp3_files)} MP3 files\n")

    for idx, mp3 in enumerate(mp3_files, start=1):
        print("\n" + "=" * 60)
        print(f"🎵 [{idx}/{len(mp3_files)}] {mp3.name}")
        print("=" * 60)

        mp3_out = OUTPUT_DIR / mp3.name

        # Load main audio
        print("Loading main audio...")
        safe_do(f'Import2:Filename="{mp3}"', wait=1.0)

        # --- ADD SILENCE ---
        if silence_minutes > 0:
            print(f"Adding {silence_minutes} minute(s) of silence...")
            duration_seconds = silence_minutes * 60
            # Select region at the end equal to the silence duration
            safe_do(f'Select:Start="0" End="{duration_seconds}" RelativeTo="ProjectEnd"', wait=0.5)
            # Repeat the selection
            safe_do('Repeat:Count="1"', wait=0.5)

            safe_do(f'Select:Start="0" End="{duration_seconds}" RelativeTo="ProjectEnd"', wait=0.5)
            # Apply silence to the selected region
            safe_do('Silence:', wait=2.0)
            safe_do("SelectAll")

        # Export processed audio
        print(f"Exporting to {mp3_out.name}...")
        safe_do(f'Export2:Filename="{mp3_out}" NumChannels=1 Quality=240', wait=1.2)

        # Clean up tracks
        safe_do("RemoveTracks:")

        print("✅ Processed successfully")

    print("\n" + "=" * 60)
    print("🎉 ALL FILES PROCESSED")
    print(f"📁 Output folder: {OUTPUT_DIR}")
    print("=" * 60)
    print("(Audacity is still open - close it manually when done)")

# ================= MAIN =================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="🎧 Audacity Batch MP3 Processor")
    parser.add_argument("-p", "--prepend", help="Audio file to prepend at beginning")
    parser.add_argument("-a", "--append", help="Audio file to append at end")
    parser.add_argument("-s", "--silence", type=float, default=0, help="Add silence duration in minutes (default: 0)")
    
    args = parser.parse_args()
    
    process_files(
        prepend_file=args.prepend,
        append_file=args.append,
        silence_minutes=args.silence
    )
