import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination
    const pipeline = [];

    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    {
                        title: {
                            $regex: query,
                            $options: "i",
                        },
                    },
                    {
                        description: {
                            $regex: query,
                            $options: "i",
                        },
                    },
                ],
            },
        });
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid User ID");
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        });
    }

    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "desc" ? -1 : 1,
            },
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    const videoAggregate = Video.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const videos = await Video.aggregatePaginate(videoAggregate, options);
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required.");
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile || !thumbnail) {
        throw new ApiError(500, "Failed to upload video or thumbnail");
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id,
    });
    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }
    const thumbnailLocalPath = req.file?.path;
    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail) {
            throw new ApiError(500, "Failed to upload thumbnail");
        }

        await deleteFromCloudinary(video.thumbnail);
        video.thumbnail = thumbnail.url;
    }

    if (title) {
        video.title = title;
    }

    if (description) {
        video.description = description;
    }

    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    await deleteFromCloudinary(video.videoFile);
    await deleteFromCloudinary(video.thumbnail);

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to toggle publish status of this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video publish status toggled successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
