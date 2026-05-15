import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const createTweet = asyncHandler(async (req, res) => {
    
    const { content } = req.body;

    if(!content || content.trim() === ""){
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner : req.user._id
    })

    if(!tweet){
          throw new ApiError (500, "Failed to create tweet");
    }

    return res
        .status(201)
        .json( new ApiResponse(201, tweet, "Tweet created successfully"));

})


const updateTweet = asyncHandler(async (req, res) => {

    const { tweetId } = req.params;
    const { content } = req.body;

    if(!isValidObjectId(tweetId)){
        throw new ApiError (400, "Invalid tweet ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this tweet")
    }


    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    )

    return res
       .status(200)
       .json( new ApiResponse (200, updatedTweet, "Tweet updated successfully"));

    
})

const deleteTweet = asyncHandler(async (req, res) => {

    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id
    });

    if (!deletedTweet) {
        throw new ApiError(
            404,
            "Tweet not found or unauthorized"
        );
    }

    
    return res
        .status(200)
        .json( new ApiResponse(200, {}, "Tweet deleted successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;


    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }


    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const tweetAggregate = Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
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
            $sort: {
                createdAt: -1
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const tweets = await Tweet.aggregatePaginate(
        tweetAggregate,
        options
    )

    if (!tweets) {
        throw new ApiError(500, "Failed to fetch tweets")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweets,
                "User tweets fetched successfully"
            )
        )
    
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}