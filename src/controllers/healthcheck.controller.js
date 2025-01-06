import {ApiResponse} from '../utils/ApiResponse.js'
import {asyncHandler} from '../utils/asyncHandler.js'

// const healthcheck = async (req,res)=>{
//     // try {
//     //     // res.status(200).json()
//     // } catch (error) {
        
//     // }
// }

const healthcheck = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, "OK", "Health check passed"))
    // .json({ message :"test ok"})
})

export {healthcheck}