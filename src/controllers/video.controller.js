import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"



const extractPublicId = (url) => {
    if (!url || typeof url !== "string") return null

    try {
        const parts = url.split("/")
        const uploadIndex = parts.indexOf("upload")

        if (uploadIndex === -1 || parts.length <= uploadIndex + 2) {
            return null
        }

        const publicIdWithExtension = parts
            .slice(uploadIndex + 2)
            .join("/")

        return publicIdWithExtension.split(".")[0]

    } catch (error) {
        console.log("Error extracting public id", error)
        return null
    }
}



const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const pipeline = []

    
    pipeline.push({ $match: { isPublished: true } })

    if (query) {
       
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: escapeRegex(query), $options: "i" } },
                    { description: { $regex: escapeRegex(query), $options: "i" } }
                ]
            }
        })
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    const allowedSortFields = ["createdAt", "views", "title"]
    sortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"
    const sortOrder = sortType === "asc" ? 1 : -1

    pipeline.push({ $sort: { [sortBy]: sortOrder } })

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    { $project: { username: 1, avatar: 1 } }
                ]
            }
        },
        {
            $addFields: {
                ownerDetails: { $first: "$ownerDetails" }
            }
        }
    )

    const aggregate = Video.aggregate(pipeline)

    const options = {
        page: Math.max(1, parseInt(page, 10)),
        limit: Math.max(1, Math.min(50, parseInt(limit, 10)))
    }


    const videos = await Video.aggregatePaginate(aggregate, options)

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})


const publishAVideo = asyncHandler(async (req, res) => {

    const {title,description} = req.body;

    if(!title || title.trim() === ""){
        throw new ApiError (400, "Title is required");
    }

    if(!description || description.trim() === ""){
        throw new ApiError (400, "Description is required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videoLocalPath){
        throw new ApiError (400, "Video file is required");
    }

    if(!thumbnailLocalPath){
        throw new ApiError (400, "Thumbnail is required");
    }

    let videoFile;
    try{
        videoFile = await uploadOnCloudinary(videoLocalPath);
        console.log("Uploaded videoFile ",videoFile);
      }catch(error){
        console.log("Error uploading video " ,error);
        throw new ApiError (500, "Failed to upload video");
    }

    let thumbnail;
    try{
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        console.log("Uploaded thumbnail ",thumbnail);
    }catch(error){
           if (videoFile?.url) {
            await deleteFromCloudinary(extractPublicId(videoFile.url),"video")  // videoFile cleanup
           }
            console.log("Error uploading thumbnail ",error);
            throw new ApiError (500, "Failed to upload thumbnail");
        }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id,
        isPublished:true
    })

    if(!video){
        await deleteFromCloudinary(extractPublicId(videoFile.url),"video")
        await deleteFromCloudinary(extractPublicId(thumbnail.url))
        throw new ApiError(500, "Failed to publish video");
    }

    return res
       .status(201)
       .json(new ApiResponse(201, video, "Video Published successfully"));
    
})



const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                ownerDetails: { $first: "$ownerDetails" },
                totalLikes: { $size: "$likes" },
                isLiked: req.user?._id
                    ? {
                        $in: [
                            new mongoose.Types.ObjectId(req.user._id),
                            {
                                $map: {
                                    input: "$likes",
                                    as: "like",
                                    in: "$$like.likedBy"
                                }
                            }
                        ]
                    }
                    : false
            }
        },
        {
            $project: { likes: 0 }
        }
    ])

    if (!video?.length) {
        throw new ApiError(404, "Video not found")
    }

    if (req.user?._id) {
        const alreadyWatched = await User.findOne({
            _id: req.user._id,
            watchHistory: new mongoose.Types.ObjectId(videoId)
        })

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: videoId }
        })

        if (!alreadyWatched) {
            await Video.findByIdAndUpdate(videoId, {
                $inc: { views: 1 }
            })
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"))
})
    

const updateVideo = asyncHandler(async (req, res) => {
     
     const {videoId} = req.params;
     const {title, description} = req.body;

     if(!isValidObjectId(videoId)){
        throw new ApiError (400, "Invalid video ID");
     }

     if(!title || title.trim() === ""){
        throw new ApiError (400, "Title is required");
     }

     if(!description || description.trim() === ""){
        throw new ApiError (400, "Description is required");
     }

     const video = await Video.findById(videoId);

     if(!video){
        throw new ApiError (404, "Video not found");
     }

     if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError (403, "You are not allowed to update this video ");
     }


     let thumbnail;
     const thumbnailLocalPath = req.file?.path || req.files?.thumbnail?.[0]?.path

     if(thumbnailLocalPath){

        try{
            thumbnail = await uploadOnCloudinary (thumbnailLocalPath);
            console.log("Updated thumbnail ",thumbnail);

            if(!thumbnail?.url){
                throw new ApiError (500, "Failed to upload thumbnail");
            }

            const oldThumbnailPublicId =  extractPublicId(video.thumbnail);
            if(oldThumbnailPublicId){
            await deleteFromCloudinary (oldThumbnailPublicId);
        }

        }catch(error){
            console.log("Thumbnail update failed", error);
            throw new ApiError (500, "Failed to upload thumbnail");
        }
     }

     const updatedVideo = await Video.findByIdAndUpdate(
         videoId ,
        {
            $set:{
                title,
                description,
                ...(thumbnail && { thumbnail: thumbnail.url})
            }
        },
        { new: true}
     )

     return res
          .status(200)
          .json( new ApiResponse(200, updatedVideo, "Video updated successfully"));
})



const deleteVideo = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video")
    }

    const videoPublicId = extractPublicId(video.videoFile);
    const thumbnailPublicId = extractPublicId(video.thumbnail);

    if (videoPublicId) {
        await deleteFromCloudinary(videoPublicId, "video")
    }


    if(thumbnailPublicId){
        await deleteFromCloudinary(thumbnailPublicId)
    }

    await Video.findByIdAndDelete(videoId);

    return res
       .status(200)
       .json(new ApiResponse (200, {}, "Video deleted successfully"));
})


const togglePublishStatus = asyncHandler(async (req, res) => {
     const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to toggle publish status of this video")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !video.isPublished } },
        { new: true }
    )

    return res
       .status(200)
       .json (new ApiResponse(
           200,
           { isPublished: updatedVideo.isPublished },
           `Video ${updatedVideo.isPublished ? "published" : "unpublished"} successfully`
       ))
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}