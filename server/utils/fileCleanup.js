const fs = require('fs');
const path = require('path');

/**
 * Clean up old files in the uploads directory.
 * Runs on server startup and periodically to prevent disk space exhaustion.
 * Preserves .gitkeep and the yt-dlp binary.
 *
 * @param {number} maxAgeHours - Maximum age of files in hours before deletion
 */
function cleanupOldUploads(maxAgeHours = 1) {
  const uploadsDir = path.join(__dirname, '../uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    return;
  }

  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();
  let cleaned = 0;

  try {
    fs.readdirSync(uploadsDir).forEach(file => {
      // Skip special files
      if (file === '.gitkeep' || file === 'yt-dlp-binary' || file === 'yt-dlp.exe') return;

      const filePath = path.join(uploadsDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile() && (now - stats.mtimeMs > maxAgeMs)) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch (e) {
        // Ignore errors on individual files (may be in use)
      }
    });

    if (cleaned > 0) {
      console.log(`[Cleanup] Removed ${cleaned} old file(s) from uploads/`);
    }
  } catch (err) {
    console.error('[Cleanup] Error during file cleanup:', err.message);
  }
}

module.exports = { cleanupOldUploads };
