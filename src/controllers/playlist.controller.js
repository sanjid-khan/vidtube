import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    
    const { name , description } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist name is required")
    }

    if (!description || description.trim() === "") {
        throw new ApiError(400, "Playlist description is required")
    }


    const playlist = await Playlist.create({
        name,
        description,
        videos:[],
        owner:req.user._id
    })


    if(!playlist){
        throw new ApiError (500, "Failed to create playlist");
    }


    return res
       .status(201)
       .json( new ApiResponse(201,playlist, "Playlist created successfully"));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$videos" }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                totalVideos: 1,
                owner: 1,
                createdAt: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))

})


const getPlaylistById = asyncHandler(async (req, res) => {
    
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
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
                ownerDetails: { $first: "$ownerDetails" },
                totalVideos: { $size: "$videos" }
            }
        }
    ])

    if (!playlist?.length) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid IDs");
    }

    
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id,
            videos: { $ne: videoId } 
        },
        { $push: { videos: videoId } },
        { new: true }
    )

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found or video already exists");
    }

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added successfully"));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    
     const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid IDs")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id,
            videos: videoId
        },
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) {
        throw new ApiError(
            404,
            "Playlist not found, unauthorized, or video does not exist"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video removed successfully"
            )
        )
    
})


const deletePlaylist = asyncHandler(async (req, res) => {
    
     const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const deletedPlaylist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user._id
    })

    if (!deletedPlaylist) {
        throw new ApiError(
            404,
            "Playlist not found or unauthorized"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Playlist deleted successfully"
            )
        )

})


const updatePlaylist = asyncHandler(async (req, res) => {
    
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist name is required")
    }

    if (!description || description.trim() === "") {
        throw new ApiError(400, "Playlist description is required")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) {
        throw new ApiError(
            404,
            "Playlist not found or unauthorized"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        )
     
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}