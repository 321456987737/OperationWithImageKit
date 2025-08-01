import { apiClient } from "@/lib/api-client";
import { Video } from '@imagekit/next';
import { notFound } from "next/navigation";

async function getVideo(id) {
  try {
    const videos = await apiClient.getVideos();
    const video = videos.find(v => v._id === id);
    return video || null;
  } catch (error) {
    console.error("Error fetching video:", error);
    return null;
  }
}

export default async function VideoPage({ params }) {
  const video = await getVideo(params.id);

  if (!video) {
    notFound();
  }

  const extractPathFromUrl = (url) => {
    if (!url) return '';
    const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT || 'https://ik.imagekit.io/ymcgemyif';
    if (url.startsWith(urlEndpoint)) {
      return url.substring(urlEndpoint.length);
    }
    return url;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative w-full bg-gray-900" style={{ aspectRatio: "16/9" }}>
            <Video
              src={extractPathFromUrl(video.videourl)}
              transformation={[
                {
                  height: "1080",
                  width: "1920",
                },
              ]}
              controls={true}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
            <p className="text-gray-600 mb-4">{video.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Uploaded on {new Date(video.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}