import { asyncHandler} from '../utils/asyncHandler.js'
import { ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.models.js'
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId)
    
        if(!user){
            throw new ApiError(400,"User doesnot exists.")
        }
    
     const accessToken = user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()
    
     user.refreshToken = refreshToken
     await user.save({validateBeforeSave: false})
     return {accessToken,refreshToken}
    
    } catch (error) {
        
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens.")

    }

}


const registerUser = asyncHandler(async (req,res)=>{
    //Todo

  const {fullname, username ,email , password}= req.body

  //validation
    if ([fullname,username,email,password].some((field)=> field?.trim()=== '')) {
        throw new ApiError(400, "All fields are required.")
    }

    //check if user already exists

   const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409,"User with email or username already exists.")
    }

    // console.log(req.files);
    

    //handle images

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing.")
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = ""
    // if(coverImageLocalPath){
    //      coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // }

    let avatar;
    try {
      avatar=  await uploadOnCloudinary(avatarLocalPath)
      console.log("Uploaded avatar", avatar);
      
    
    } catch (error) {
        console.log( "Error uploading avatar",error);
        throw new ApiError(500,"Failed to upload avatar.")
    }
    let coverImage;
    try {
        coverImage =  await uploadOnCloudinary(coverImageLocalPath)
      console.log("Uploaded coverImage", coverImage);
      
    
    } catch (error) {
        console.log( "Error uploading coverImage",error);
        throw new ApiError(500,"Failed to upload coverImage.")
    }

   try {
    const user = await User.create({
         fullname,
         avatar:avatar.url,
         coverImage: coverImage?.url || "",
         email,
         password,
         username: username.toLowerCase()
     })
 
     //verify user
     const createdUser = await User.findById(user._id).select(
         "-password -refreshToken"
     )
 
     //conditional check
 
     if(!createdUser){
         throw new ApiError(500, "Something went wrong while registering a user.")
     }
 
     return res
     .status(201)
     .json(new ApiResponse(200, "User registered successfully."))
     
   } catch (error) {
        console.log("User creation failed.");
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500, "Something went wrong while registering a user and Images were deleted.")
   }
})

//route

const loginUser = asyncHandler(async (req,res)=>{

    //get data from body
    const {email,username, password} = req.body

    //validation
    if (!email) {
        throw new ApiError(400, "Email is required.")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if (!user) {
        throw new ApiError(409,"User with email or username already exists.")
    }

    //validate password

   const isPasswordValid =  await user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new ApiError(401, "Invalid credentials.")
   }

   const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

   const loggedInUser = await User.findById(user._id)
   .select("-password -refreshToken")

   if(!loggedInUser){
    throw new ApiError(401, "Something went wrong while logging in the user.")
   }


   //generate token
   const options ={
    httpOnly : true,
    secure: process.env.NODE_ENV === "production",
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken ,options)
//    .json(new ApiResponse(200, loggedInUser, "User logged in successfully."))
   .json(new ApiResponse(
    200,
    {user: loggedInUser,accessToken,refreshToken},
     "User logged in successfully."
 ))

})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id ,
        {
            $set:{
                refreshToken: undefined,
            }
        },
        {
            new: true
        }
    )

    const options={
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken',options)
        .json(new ApiResponse(
            200,
            "User logout successfully."
        ))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if(!incomingRefreshToken){
            throw new ApiError(401, "Refresh token is required.")
        }

        try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )

            const user = await User.findById(decodedToken?._id)

            if(!user){
                throw new ApiError(401, "Invalid refresh token.")
            }

            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401,"Invalid refresh token.")
            }

            //generate token
            const options={
                httpOnly:true,
                secure: process.env.NODE_ENV === "production",
            }

        const {accessToken,refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken", newRefreshToken, options)
        .json( 
            new ApiResponse(
            200,
            {accessToken, 
            refreshToken: newRefreshToken
        },
            "Access Token refreshed successfully."
        ));

        } catch (error) {
            throw new ApiError(500, "Something went wrong while refreshing access token.")
        }
});


export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
}