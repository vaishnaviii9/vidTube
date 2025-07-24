import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
} from '../controllers/tweet.controller.js';

const router = express.Router();

// Apply verifyJWT middleware to all tweet routes
router.use(verifyJWT);

// Route to create a tweet
router.route('/').post(createTweet);

// Route to get user tweets
router.route('/user/:userId').get(getUserTweets);

// Route to update and delete a tweet by ID
router.route('/:tweetId').patch(updateTweet).delete(deleteTweet);

export default router;
