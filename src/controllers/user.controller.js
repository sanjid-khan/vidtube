import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


// Helper for Extract Cloudinary Public ID
const extractPublicId=(url)=>{
    
    if (!url || typeof url !== 'string') return null;

    try{
        
        const parts = url.split("/")
        const uploadIndex = parts.indexOf("upload")

        if (uploadIndex === -1 || parts.length <= uploadIndex + 2) {
        return null;
        }

        const publicIdWithExtension = parts
            .slice(uploadIndex + 2)
            .join("/")

        return publicIdWithExtension.split(".")[0]

    } catch (error){
        console.error("Error extracting Public ID:", error);
        return null;
    }

}



const generateAccessAndRefreshToken=async (userId)=>{
  
   try{
    const user= await User.findById(userId)
    // small check for user existence

    if (!user)
         {
            throw new ApiError(404, "User not found")
        }

    const accessToken= user.generateAccessToken()
    const refreshToken= user.generateRefreshToken()

    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})
    return {accessToken,refreshToken}
   }
    catch(error){
      throw new ApiError(
         error.statusCode || 500, 
         error.message || "Something went wrong while generating access and refresh tokens")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body

    //validation
    if (
        [fullname, email, username, password].some((field) => typeof field !== "string" || field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [
            { username: username.toLowerCase() },
            { email: email.toLowerCase() }
        ]
    })


    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }


    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Uploaded avatar", avatar);

        if(!avatar?.url){
            throw new ApiError(500, "Failed to upload avatar");
        }

    } catch (error) {
        console.log("Error uploading avatar", error)
        throw new ApiError(500, "Failed to upload avatar");
    }


    let coverImage;
    if(coverLocalPath){
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("Uploaded coverImafe", coverImage);

    } catch (error) {
        console.log("Error uploading coverImage", error)
        throw new ApiError(500, "Failed to upload coverImage");
     }
   }

    try{
      const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email:email.toLowerCase(),
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered Successfully"));
    }

    catch(error){
         console.log("User Creation failed",error);

         if (avatar?.url) {
            await deleteFromCloudinary(extractPublicId(avatar.url))
        }

        if (coverImage?.url) {
            await deleteFromCloudinary(extractPublicId(coverImage.url))
        }

         throw new ApiError(
           error.statusCode || 500, 
           error.message ||  "Something went wrong while registering the user and images were deleted");
    }

});


const loginUser=asyncHandler(async (req,res)=>{
  
  const {email,username,password}=req.body

  // validation
  if(!email && !username){
    throw new ApiError(400, "Email or username is required")
  }

  if(!password) {
        throw new ApiError(400, "Password is required")
    }

  
    const user = await User.findOne({
        $or: [
            { username: username?.toLowerCase() },
            { email: email?.toLowerCase() }
        ]
    })


    if (!user) {
        throw new ApiError(404, "User not found")
    }
  
    // validate password
   const isPasswordValid = await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(401, "Invalid credentials")
   }

   const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)

   const loggedInUser= await User.findById(user._id)
      .select("-password -refreshToken");

   const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
    }

   return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json( new ApiResponse (
        200, 
       {user:loggedInUser, accessToken,refreshToken},
       "User Logged in successfully" 
      ))

})

const refreshAccessToken= asyncHandler(async (req,res)=>{
   
    const incomingRefreshToken =req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
      throw new ApiError (401, "Refresh token is required")
    }

    try{
     const decodedToken= jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      )

      const user=  await User.findById(decodedToken?._id)

      if(!user){
         throw new ApiError(401, "Invalid refresh token")
      }

      if(incomingRefreshToken!==user?.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
      }

    const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
    }

     const {accessToken,refreshToken :newRefreshToken}= await generateAccessAndRefreshToken(user._id)
         
      return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json( new ApiResponse (
           200, 
          {
            accessToken,
            refreshToken: newRefreshToken
          },
       "Access token refreshed successfully" 
      ));

    }

    catch(error){
        throw new ApiError(
            401, 
            error?.message || "Invalid refresh token" )
    }

})


const logoutUser= asyncHandler (async (req,res)=>{
      await User.findByIdAndUpdate(
        req.user._id,
        {
         $unset:{
          refreshToken: 1,
         }
        },
        {
          new:true
        }
      )

    const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
    }

       return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json (new ApiResponse(200, {}, "User logged out successfully"))

})


const changeCurrentPassword= asyncHandler( async (req , res)=>{

     const {oldPassword, newPassword}=req.body;

     if(!oldPassword || !newPassword){
        throw new ApiError (400, "Old password and new password are required");
     }

     if(oldPassword === newPassword){
        throw new ApiError(400, "New password must be different from old password");
     }

    const user= await User.findById(req.user?._id)
    
    if (!user) {
     throw new ApiError(404, "User not found")
    }

     const isPasswordValid= await user.isPasswordCorrect(oldPassword)

     if(!isPasswordValid){
        throw new ApiError(401, "Old password is incorrect")
     }

     user.password=newPassword;
     await user.save({validateBeforeSave:false})

     return res.status(200).json(new ApiResponse(200,{}, "Password changed successfully"))

})

const getCurrentUser=asyncHandler(async (req,res)=>{
  return res.status(200).json(new ApiResponse(200,req.user, "Current user details"))
})



const updateAccountDetails=asyncHandler(async (req,res)=>{
    
    const {fullname, email}=req.body

    if(!fullname){
        throw new ApiError(400, "Fullname is required")
    }

    if(!email){
        throw new ApiError(400, "email is required")
    }

    const existedUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user?._id }
    })

    if (existedUser) {
        throw new ApiError(409, "Email already in use")
    }

  const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                 email: email.toLowerCase()
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    return res.status(200).json( new ApiResponse(200, user,
        "Account details updated successfully"
    ))
})



const updateUserAvatar=asyncHandler(async (req,res)=>{
    
const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path;

   if(!avatarLocalPath) { 
    throw new ApiError(400, "File is required")
   }


  let avatar
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
    } catch (error) {
        throw new ApiError(500, "Failed to upload avatar")
    }

    if (!avatar?.url) {
        throw new ApiError(500, "Failed to upload avatar")
    }


  const oldAvatarPublicId = extractPublicId(req.user?.avatar)

    if (oldAvatarPublicId) {
        await deleteFromCloudinary(oldAvatarPublicId)
    }


 const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
                avatar: avatar.url
            }
    },
    {new:true}
  ).select("-password -refreshToken")

  return res.status(200).json( new ApiResponse(200, user,
        "Avatar updated successfully"
    ))

})




const updateUserCoverImage=asyncHandler(async (req,res)=>{
     

    const coverImageLocalPath = req.file?.path || req.files?.coverImage?.[0]?.path;

   if(!coverImageLocalPath){
    throw new ApiError(400, "File is required")
   }

   let coverImage
    try {
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    } catch (error) {
        throw new ApiError(500, "Failed to upload cover image")
    }

    if (!coverImage?.url) {
        throw new ApiError(500, "Failed to upload cover image")
    }


   const oldCoverImagePublicId = extractPublicId(req.user?.coverImage)

    if (oldCoverImagePublicId) {
        await deleteFromCloudinary(oldCoverImagePublicId)
    }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
                coverImage: coverImage.url
            }
    },
    {new:true}
  ).select("-password -refreshToken")

  return res.status(200).json( new ApiResponse(200, user,
        "Cover Image updated successfully"
    ))


})



const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [new mongoose.Types.ObjectId(req.user?._id), "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})



const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

     if (!user.length) {
        throw new ApiError(404, "User not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})



export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
