const Handbrake = require('handbrake-js');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'src/videos/Header-impression.mp4');
const outputPath = path.join(__dirname, 'src/videos/Header-impression-compressed.mp4');

// Get original file size
const originalSize = fs.statSync(inputPath).size / (1024 * 1024);
console.log(`Original size: ${originalSize.toFixed(2)} MB`);
console.log('Compressing video...\n');

// Compress the video
Handbrake.spawn({
  input: inputPath,
  output: outputPath,
  preset: 'Fast 1080p30',
  // Additional options for better compression
  'quality': 20,  // Quality (0-51, lower = better)
  'vb': 1500,     // Video bitrate (kbps)
  'ab': 96        // Audio bitrate (kbps)
})
.on('progress', (progress) => {
  process.stdout.write(`Progress: ${progress.percentComplete}%\r`);
})
.on('complete', () => {
  const compressedSize = fs.statSync(outputPath).size / (1024 * 1024);
  const reduction = ((originalSize - compressedSize) / originalSize) * 100;
  
  console.log('\n\n✓ Compression complete!');
  console.log(`Original size: ${originalSize.toFixed(2)} MB`);
  console.log(`Compressed size: ${compressedSize.toFixed(2)} MB`);
  console.log(`Reduction: ${reduction.toFixed(1)}%`);
  console.log(`Output: ${outputPath}`);
})
.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});
