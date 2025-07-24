import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
} from '../controllers/subscription.controller.js';

const router = express.Router();

// Apply verifyJWT middleware to all subscription routes
router.use(verifyJWT);

// Route to toggle subscription
router.route('/c/:channelId').post(toggleSubscription);

// Route to get user channel subscribers
router.route('/c/:channelId/subscribers').get(getUserChannelSubscribers);

// Route to get subscribed channels
router.route('/u/:subscriberId/channels').get(getSubscribedChannels);

export default router;
