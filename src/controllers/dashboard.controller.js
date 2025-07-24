import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    // Total video views
    const totalVideoViews = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    // Total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: new mongoose.Types.ObjectId(channelId)
    });

    // Total videos
    const totalVideos = await Video.countDocuments({
        owner: new mongoose.Types.ObjectId(channelId)
    });

    // Total likes
    const totalLikes = await Like.countDocuments({
        video: { $in: await Video.find({ owner: new mongoose.Types.ObjectId(channelId) }).distinct("_id") }
    });

    const stats = {
        totalVideoViews: totalVideoViews.length > 0 ? totalVideoViews[0].totalViews : 0,
        totalSubscribers,
        totalVideos,
        totalLikes
    };

    return res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const videos = await Video.find({ owner: channelId });

    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export {
    getChannelStats,
    getChannelVideos
};
