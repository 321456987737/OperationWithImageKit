import { Video } from '@imagekit/next';
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function VideoComponent({ video }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  useEffect(() => {
    if (video?.thumbnailUrl) {
      const img = new Image();
      img.src = video.thumbnailUrl;
      img.onload = () => {
        setThumbnailLoaded(true);
        setIsLoading(false);
      };
      img.onerror = () => {
        setError("Failed to load thumbnail");
        setIsLoading(false);
      };
    }
  }, [video?.thumbnailUrl]);

  const extractPathFromUrl = (url) => {
    if (!url) return '';
    const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT || 'https://ik.imagekit.io/ymcgemyif';
    return url.startsWith(urlEndpoint) ? url.substring(urlEndpoint.length) : url;
  };

  const handleVideoError = () => {
    setError("Failed to load video");
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setThumbnailLoaded(true);
  };

  if (!video) return null;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <Link href={`/videos/${video._id}`} className="relative group block">
          <div
            className="relative w-full bg-gray-100"
            style={{ aspectRatio: "16/9" }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-gray-500 text-sm">Video unavailable</p>
              </div>
            ) : showThumbnail && thumbnailLoaded ? (
              <div className="relative w-full h-full">
                <Image
                  src={video.thumbnailUrl || '/placeholder-thumbnail.svg'}
                  alt={`${video.title} thumbnail`}
                  fill
                  className={`object-cover transition-opacity duration-300 ${
                    thumbnailLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onError={(e) => {
                    e.target.src = '/placeholder-thumbnail.svg';
                    handleVideoLoad();
                  }}
                  onLoad={handleVideoLoad}
                />
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowThumbnail(false);
                  }}
                >
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors group-hover:scale-110 transform duration-200">
                    <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </button>
              </div>
            ) : (
              <Video
                src={video.videourl}
                path={extractPathFromUrl(video.videourl)}
                transformation={[
                  {
                    height: video.transformation?.height || "1080",
                    width: video.transformation?.width || "1920",
                    quality: video.transformation?.quality || "90"
                  },
                ]}
                controls={true}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onError={handleVideoError}
                onLoad={handleVideoLoad}
                poster={video.thumbnailUrl}
              />
            )}
          </div>
        </Link>
        
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {showThumbnail ? 'Preview' : 'Video'}
        </div>
      </div>

      <div className="p-4">
        <Link
          href={`/videos/${video._id}`}
          className="hover:opacity-80 transition-opacity block"
        >
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
            {video.title}
          </h3>
        </Link>

        {video.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {video.description}
          </p>
        )}
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {new Date(video.createdAt).toLocaleDateString()}
          </span>
          <span className="inline-flex items-center text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </span>
        </div>
      </div>
    </div>
  );
}