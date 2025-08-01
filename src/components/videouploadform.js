"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useNotification } from "./Notification";
import { apiClient } from "@/lib/api-client";
import { generateVideoThumbnail, blobToBase64 } from "@/lib/thumbnail-generator";
import { Upload, FileVideo, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function VideoUploadForm() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const fileInputRef = useRef(null);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    file: null,
    thumbnail: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.file) newErrors.file = "Video file is required";
    if (form.file && form.file.size > 100 * 1024 * 1024) {
      newErrors.file = "File size exceeds 100MB limit";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
    
    // Clear error when user starts typing/selecting
    if (name === "title" && errors.title) {
      setErrors(prev => ({ ...prev, title: null }));
    }
    if (name === "file" && errors.file) {
      setErrors(prev => ({ ...prev, file: null }));
    }
    
    // Create preview and generate thumbnail for video file
    if (name === "file" && files && files[0]) {
      const url = URL.createObjectURL(files[0]);
      setPreviewUrl(url);
      generateThumbnailForVideo(files[0]);
    }
  };

  const generateThumbnailForVideo = async (videoFile) => {
    try {
      setGeneratingThumbnail(true);
      const { blob, dataUrl } = await generateVideoThumbnail(videoFile, 1, 320, 180);
      
      setForm(prev => ({ ...prev, thumbnail: blob }));
      setThumbnailUrl(dataUrl);
      
      showNotification("Thumbnail generated successfully!", "success");
    } catch (error) {
      console.error("Thumbnail generation error:", error);
      showNotification("Failed to generate thumbnail", "error");
    } finally {
      setGeneratingThumbnail(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setForm(prev => ({ ...prev, file }));
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setErrors(prev => ({ ...prev, file: null }));
        generateThumbnailForVideo(file);
      } else {
        setErrors(prev => ({ ...prev, file: "Please select a video file" }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification("Please fix the errors before submitting", "error");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("file", form.file);
      formData.append("title", form.title);
      formData.append("description", form.description);
      
      // Add thumbnail if generated
      if (form.thumbnail) {
        formData.append("thumbnail", form.thumbnail, "thumbnail.jpg");
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 95));
      }, 200);

      await apiClient.createVideo(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      showNotification("Video uploaded successfully!", "success");
      
      // Wait a bit before redirecting to show completion
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Upload error:", err);
      showNotification("Failed to upload video", "error");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Video</h2>
          <p className="text-gray-600">Share your creative content with the world</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter a title for your video"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Describe your video content"
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video File *
            </label>
            
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : errors.file
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                {form.file ? (
                  <div className="flex flex-col items-center">
                    <FileVideo className="mx-auto h-12 w-12 text-blue-500" />
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {form.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(form.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="relative font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                      >
                        <span>Upload a video</span>
                      </button>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      MP4, MOV, AVI up to 100MB
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept="video/*"
              onChange={handleChange}
              required
              className="hidden"
            />
            
            {errors.file && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.file}
              </p>
            )}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preview
              </label>
              <div className="mt-1 bg-gray-100 rounded-lg overflow-hidden">
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}

          {/* Thumbnail Preview */}
          {(thumbnailUrl || generatingThumbnail) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Generated Thumbnail
              </label>
              <div className="mt-1 bg-gray-100 rounded-lg overflow-hidden p-4">
                {generatingThumbnail ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex flex-col items-center">
                      <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-gray-600">Generating thumbnail...</p>
                    </div>
                  </div>
                ) : thumbnailUrl ? (
                  <div className="flex justify-center">
                    <div className="relative max-w-xs">
                      <Image
                        src={thumbnailUrl}
                        alt="Generated thumbnail"
                        width={320}
                        height={180}
                        className="h-auto rounded-lg shadow-sm border"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={uploading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition flex items-center justify-center ${
                uploading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              }`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Video
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}