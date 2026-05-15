import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    
     const { videoId } = req.params;

     if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }


    const existingLike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user?._id
    });

    if (existingLike) {
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Video unliked successfully"));
    }


    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, { isLiked: true }, "Video liked successfully"));
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: req.user?._id
    });

    if (existingLike) {
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Comment unliked successfully"));
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, { isLiked: true }, "Comment liked successfully"));
})

const toggleTweetLike = asyncHandler(async (req, res) => {


    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: req.user?._id
    });


    if (existingLike) {
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Tweet unliked successfully"));
    }


    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    });


    return res
        .status(201)
        .json(new ApiResponse(201, { isLiked: true }, "Tweet liked successfully"));


    }
)



const getLikedVideos = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10 } = req.query;

    const pipeline = [
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: { username: 1, avatar: 1 }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            ownerDetails: { $first: "$ownerDetails" }
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            ownerDetails: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                videoDetails: { $first: "$videoDetails" }
            }
        },
        {
            $match: { videoDetails: { $ne: null } }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $project: {
                videoDetails: 1,
                likedBy: 1,
                createdAt: 1
            }
        }
    ]

    const aggregate = Like.aggregate(pipeline)

    const options = {
        page: Math.max(1, parseInt(page, 10) || 1),
        limit: Math.max(1, Math.min(50, parseInt(limit, 10) || 10))
    }

    const likedVideos = await Like.aggregatePaginate(aggregate, options)

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
     
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}