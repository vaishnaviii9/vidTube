// _id string pk
//   subscriber ObjectId users
//   channel ObjectId users
//   createdAt Date
//   updatedAt Date
import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber:{
            //one who is SUBSCRIBING
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        channel:{
            //one to whom `subscriber` is SUBSCRIBING
            type: Schema.Types.ObjectId,
            ref: "User"
        },

    },
    {
        timestamps: true
    }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)