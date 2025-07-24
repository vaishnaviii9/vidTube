import { Router } from "express";
import { 
    registerUser,
    logoutUser, 
    loginUser, 
    refreshAccessToken, 
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    updateAccountDetails,
    updateUserCoverImage,
    getWatchHistory
} from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middlewares.js';
import {verifyJWT} from '../middlewares/auth.middlewares.js'


const router = Router()

//UNSECURED ROUTES

//register user
router.route("/register").post(
    upload.fields([
        { 
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]),    
    registerUser
)

//user login
router.route("/login").post(loginUser)

//refreshaccesstoken
router.route("/refresh-token").post(refreshAccessToken)

//SECURED ROUTES

//user logout
router.route("/logout").post(
    verifyJWT,
    // something,
    logoutUser
)

//change password
router.route("/change-password").post(
    verifyJWT,
    changeCurrentPassword
)

//get current user
router.route("/current-user").get(
    verifyJWT,
    getCurrentUser
)

//get user channel profile
router.route("/c/:username").get(
    verifyJWT,
    getUserChannelProfile
)

//update account details
router.route("/update-account").patch(
    verifyJWT,
    updateAccountDetails
)

//update user avatar and cover image
router.route("/avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)
router.route("/cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
)

//get watch history
router.route("/history").get(
    verifyJWT,
    getWatchHistory
)

export default router