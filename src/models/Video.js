import mongoose, { model, Schema, models } from "mongoose";

const videoSchema = new Schema(
  {
      title: {
         type: String,
         required: true,
      },
      description: {
         type: String,
         required: true,
      },
      thumbnailUrl: {
         type: String,
         required: true,
      },
      videourl:{
         type: String,
         required: true,
      },
      controls1:{
         type: Boolean,
         default: true,
      },
      transformation:{
         height :{
            type: Number,
            default: 1080,
         },
         width: {
            type: Number,
            default: 1920,
         },
         quality:{
            type: Number,
            min: 1,
            max: 100,
         }
      },
     
  },{
      timestamps: true,
  }
)


const Video = models.Video || model("Video", videoSchema);

export default Video;
