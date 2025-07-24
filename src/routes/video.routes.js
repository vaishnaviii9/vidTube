import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
} from '../controllers/video.controller.js';

const router = express.Router();

// Apply verifyJWT middleware to all video routes
router.use(verifyJWT);

// Route to get all videos and publish a new video
router.route('/')
  .get(getAllVideos)
  .post(
    upload.fields([
      { name: 'videoFile', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ]),
    publishAVideo
  );

// Route to get, update, and delete a video by ID
router.route('/:videoId')
  .get(getVideoById)
  .patch(upload.single('thumbnail'), updateVideo)
  .delete(deleteVideo);

// Route to toggle publish status of a video
router.route('/toggle/publish/:videoId')
  .patch(togglePublishStatus);

export default router;
