"use client" // This component must be a client component

import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
} from "@imagekit/next";
import { useState, useRef } from "react";
import { Upload, FileVideo, AlertCircle, CheckCircle } from "lucide-react";

const FileUpload = () => {
   const [uploading, setUploading] = useState(false);
   const [uploadProgress, setUploadProgress] = useState(0);
   const [error, setError] = useState(null);
   const [success, setSuccess] = useState(false);
   const fileInputRef = useRef(null);
   const [dragActive, setDragActive] = useState(false);

   // optional validate file
   const validateFile = (file) => {
      if (!file.type.startsWith("video/")) {
         setError("Invalid file type. Please upload a video file.");
         return false;
      }
      if (file.size > 100 * 1024 * 1024) { // 100 MB limit
         setError("File size exceeds the limit of 100 MB.");
         return false;
      }
      return true;
   }

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
         handleFileUpload(e.dataTransfer.files[0]);
      }
   };

   const handleFileUpload = async (file) => {
      if (!file) return;
      
      // Validate file before upload
      if (!validateFile(file)) {
         return;
      }
      
      setError(null);
      setSuccess(false);
      setUploading(true);
      setUploadProgress(0);
      
      try {
         const authres = await fetch("/api/auth/imagekit-auth");
         const auth = await authres.json();
         
         const uploadResponse = await upload({
            // Authentication parameters
            file,
            fileName: file.name,
            signature: auth.signature,
            expire: auth.expire,
            token: auth.token,
            onProgress: (event) => {
               if (event.lengthComputable) {
                  const percent = Math.round((event.loaded * 100) / event.total);
                  setUploadProgress(percent);
               }
            },
         });
         
         console.log("Upload successful:", uploadResponse);
         setSuccess(true);
      } catch (error) {
         if (error instanceof ImageKitUploadNetworkError) {
            setError("Network error. Please try again.");
         } else if (error instanceof ImageKitInvalidRequestError) {
            setError("Invalid request. Please try again.");
         } else if (error instanceof ImageKitAbortError) {
            setError("Upload aborted. Please try again.");
         } else if (error instanceof ImageKitServerError) {
            setError("Server error. Please try again.");
         } else {
            setError("Something went wrong. Please try again.");
         }
      } finally {
         setUploading(false);
      }
   }

   const handleChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleFileUpload(file);
   };

   const triggerFileInput = () => {
      fileInputRef.current?.click();
   };

   return (
      <div className="space-y-4">
         <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition ${
               dragActive
                  ? "border-blue-500 bg-blue-50"
                  : error
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
         >
            <div className="space-y-1 text-center">
               {uploading ? (
                  <div className="space-y-3">
                     <div className="flex justify-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                     <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">
                           Uploading...
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                           <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                           ></div>
                        </div>
                        <div className="text-xs text-gray-500">
                           {uploadProgress}%
                        </div>
                     </div>
                  </div>
               ) : success ? (
                  <div className="space-y-3">
                     <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                     <div className="text-sm font-medium text-green-700">
                        Upload Successful!
                     </div>
                  </div>
               ) : (
                  <div className="space-y-3">
                     <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
                     <div className="flex text-sm text-gray-600 justify-center">
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
            accept="video/*"
            onChange={handleChange}
            className="hidden"
         />
         
         {error && (
            <div className="flex items-center text-red-600 text-sm">
               <AlertCircle className="w-4 h-4 mr-1" />
               <span>{error}</span>
            </div>
         )}
      </div>
   );
};

export default FileUpload;