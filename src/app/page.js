import { apiClient } from "@/lib/api-client"
import VideoFeed from "@/components/videofeed"

async function getVideos() {
  const videos = await apiClient.getVideos()
  return videos
}

export default async function Home() {
  const videos = await getVideos()
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Discover Amazing Videos
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore creative content from our community of talented creators
        </p>
      </div>
      <VideoFeed videos={videos} />
    </main>
  )
}