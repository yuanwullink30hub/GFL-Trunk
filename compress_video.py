import subprocess
import os

input_video = r"c:\Users\yuanw\github\GFL-Trunk\src\videos\Header-impression.mp4"
output_video = r"c:\Users\yuanw\github\GFL-Trunk\src\videos\Header-impression-compressed.mp4"

# Get original file size
original_size = os.path.getsize(input_video) / (1024 * 1024)
print(f"Original size: {original_size:.2f} MB")
print("Compressing video (this may take a few minutes)...")

# Use ffmpeg via subprocess - lower bitrate and codec optimization
cmd = [
    'ffmpeg',
    '-i', input_video,
    '-c:v', 'libx264',
    '-crf', '18',  # Quality (18-28, lower = better quality)
    '-preset', 'slow',  # Speed/quality tradeoff
    '-c:a', 'aac',
    '-b:a', '96k',  # Lower audio bitrate
    '-y',  # Overwrite output
    output_video
]

try:
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        compressed_size = os.path.getsize(output_video) / (1024 * 1024)
        reduction = ((original_size - compressed_size) / original_size) * 100
        
        print(f"\n✓ Compression complete!")
        print(f"Original size: {original_size:.2f} MB")
        print(f"Compressed size: {compressed_size:.2f} MB")
        print(f"Reduction: {reduction:.1f}%")
        print(f"Output: {output_video}")
    else:
        print(f"Error: {result.stderr}")
except FileNotFoundError:
    print("ffmpeg not found. Please install FFmpeg and try again.")
