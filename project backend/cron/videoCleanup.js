const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');

/**
 * Cleanup expired videos
 * Runs daily at midnight
 */
const startVideoCleanupCron = () => {
  // Cron schedule: 0 0 * * * (Every day at midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running video cleanup job...');
    try {
      const now = new Date();
      const expiredVideos = await Video.find({ expiresAt: { $lte: now } });

      if (expiredVideos.length === 0) {
        console.log('[Cron] No expired videos to clean up.');
        return;
      }

      console.log(`[Cron] Found ${expiredVideos.length} expired video(s) to remove.`);

      for (const video of expiredVideos) {
        const absolutePath = path.join(__dirname, '..', video.filePath);
        
        // Remove file from disk
        if (fs.existsSync(absolutePath)) {
          try {
            fs.unlinkSync(absolutePath);
            console.log(`[Cron] Deleted video file: ${video.filePath}`);
          } catch (fileErr) {
            console.error(`[Cron] Error deleting file ${absolutePath}:`, fileErr.message);
          }
        } else {
          console.warn(`[Cron] File not found on disk: ${absolutePath}`);
        }

        // Remove document from db
        await Video.findByIdAndDelete(video._id);
        console.log(`[Cron] Deleted video record from DB: ${video.title}`);
      }

      console.log('[Cron] Video cleanup finished.');
    } catch (error) {
      console.error('[Cron] Error during video cleanup:', error.message);
    }
  });
  
  console.log('[Cron] Video cleanup job scheduled.');
};

module.exports = startVideoCleanupCron;
