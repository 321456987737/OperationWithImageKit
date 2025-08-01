/**
 * Utility functions for generating video thumbnails using HTML5 Canvas
 */

/**
 * Generate a thumbnail from a video file
 * @param {File} videoFile - The video file to generate thumbnail from
 * @param {number} timeOffset - Time in seconds to capture the frame (default: 1)
 * @param {number} maxWidth - Maximum width of the thumbnail (default: 320)
 * @param {number} maxHeight - Maximum height of the thumbnail (default: 180)
 * @returns {Promise<{blob: Blob, dataUrl: string}>} - Returns both blob and data URL
 */
export const generateVideoThumbnail = (videoFile, timeOffset = 1, maxWidth = 320, maxHeight = 180) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('loadedmetadata', () => {
      // Set the time to capture the frame
      video.currentTime = Math.min(timeOffset, video.duration);
    });
    
    video.addEventListener('seeked', () => {
      try {
        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        let { width, height } = calculateDimensions(video.videoWidth, video.videoHeight, maxWidth, maxHeight);
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve({ blob, dataUrl });
          } else {
            reject(new Error('Failed to generate thumbnail blob'));
          }
        }, 'image/jpeg', 0.8);
        
        // Clean up
        video.remove();
      } catch (error) {
        reject(error);
      }
    });
    
    video.addEventListener('error', (e) => {
      reject(new Error('Failed to load video for thumbnail generation'));
    });
    
    // Set video source and load
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
};

/**
 * Calculate thumbnail dimensions maintaining aspect ratio
 * @param {number} originalWidth - Original video width
 * @param {number} originalHeight - Original video height
 * @param {number} maxWidth - Maximum allowed width
 * @param {number} maxHeight - Maximum allowed height
 * @returns {Object} - {width, height}
 */
const calculateDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if too wide
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  // Scale down if too tall
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Generate multiple thumbnails at different time points
 * @param {File} videoFile - The video file
 * @param {number[]} timeOffsets - Array of time offsets in seconds
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<Array>} - Array of thumbnail objects
 */
export const generateMultipleThumbnails = async (videoFile, timeOffsets = [1, 3, 5], maxWidth = 320, maxHeight = 180) => {
  const thumbnails = [];
  
  for (const timeOffset of timeOffsets) {
    try {
      const thumbnail = await generateVideoThumbnail(videoFile, timeOffset, maxWidth, maxHeight);
      thumbnails.push({ ...thumbnail, timeOffset });
    } catch (error) {
      console.warn(`Failed to generate thumbnail at ${timeOffset}s:`, error);
    }
  }
  
  return thumbnails;
};

/**
 * Convert blob to base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - Base64 string
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};