import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ImageKit from "imagekit";
import { dbConnect } from "@/lib/connectb";
import Video from "@/models/Video";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT,
});

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const description = formData.get("description");
    const thumbnail = formData.get("thumbnail");

    if (!file || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a video file." },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds the limit of 100 MB." },
        { status: 400 }
      );
    }

    // Upload video to ImageKit
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const uploadResponse = await imagekit.upload({
      file: base64,
      fileName: `video-${Date.now()}-${file.name}`,
      folder: "/videos",
    });

    // Upload thumbnail to ImageKit if provided
    let thumbnailUploadResponse = null;
    if (thumbnail && thumbnail.size > 0) {
      try {
        const thumbnailBuffer = await thumbnail.arrayBuffer();
        const thumbnailBase64 = Buffer.from(thumbnailBuffer).toString("base64");
        
        thumbnailUploadResponse = await imagekit.upload({
          file: thumbnailBase64,
          fileName: `thumbnail-${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}.jpg`,
          folder: "/thumbnails",
        });
      } catch (thumbnailError) {
        console.error("Thumbnail upload error:", thumbnailError);
        // Continue without thumbnail if upload fails
      }
    }

    // Save to MongoDB
    const video = await Video.create({
      title,
      description,
      videourl: uploadResponse.url,
      thumbnailUrl: thumbnailUploadResponse ? thumbnailUploadResponse.url : (uploadResponse.thumbnailUrl || uploadResponse.url),
      transformation: {
        height: 1920,
        width: 1080,
        quality: 100,
      },
    });

    return NextResponse.json({ success: true, video });
  } catch (error) {
    console.error("Upload error:", error);
    
    // Handle specific ImageKit errors
    if (error.message && error.message.includes("Invalid file")) {
      return NextResponse.json(
        { error: "Invalid file. Please check the file format and try again." },
        { status: 400 }
      );
    }
    
    // Handle general errors
    return NextResponse.json(
      { error: "Failed to upload video. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos. Please try again." },
      { status: 500 }
    );
  }
}