"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Video, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface VideoUploadProps {
  attemptId: string
  onUploadSuccess?: (videoUrl: string) => void
  currentVideoUrl?: string | null
}

export function VideoUpload({ attemptId, onUploadSuccess, currentVideoUrl }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState(currentVideoUrl || "")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentVideoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file")
      return
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("Video file size must be less than 100MB")
      return
    }

    setVideoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error("Please select a video file first")
      return
    }

    setUploading(true)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("video", videoFile)
      formData.append("attemptId", attemptId)

      // Upload to server (you'll need to implement this endpoint)
      const response = await fetch("/api/attempts/upload-video", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      const uploadedUrl = data.videoUrl

      // Update attempt with video URL
      const updateResponse = await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl: uploadedUrl }),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update attempt with video URL")
      }

      setVideoUrl(uploadedUrl)
      toast.success("Video uploaded successfully")
      onUploadSuccess?.(uploadedUrl)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload video. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!videoUrl.trim()) {
      toast.error("Please enter a video URL")
      return
    }

    // Validate URL
    try {
      new URL(videoUrl)
    } catch {
      toast.error("Please enter a valid URL")
      return
    }

    setUploading(true)

    try {
      const response = await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      })

      if (!response.ok) {
        throw new Error("Failed to update video URL")
      }

      setPreviewUrl(videoUrl)
      toast.success("Video URL saved successfully")
      onUploadSuccess?.(videoUrl)
    } catch (error) {
      console.error("URL update error:", error)
      toast.error("Failed to save video URL. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setVideoFile(null)
    setPreviewUrl(null)
    setVideoUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Upload
        </CardTitle>
        <CardDescription>
          Upload a video file or provide a URL for this attempt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video URL Input */}
        <div className="space-y-2">
          <Label htmlFor="videoUrl">Video URL (YouTube, Vimeo, etc.)</Label>
          <div className="flex gap-2">
            <Input
              id="videoUrl"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={uploading}
            />
            <Button onClick={handleUrlSubmit} disabled={uploading || !videoUrl.trim()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save URL"}
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or upload file</span>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="videoFile">Upload Video File</Label>
          <div className="flex gap-2">
            <Input
              id="videoFile"
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="flex-1"
            />
            {videoFile && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {videoFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              <span>{videoFile.name}</span>
              <span>({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        {videoFile && (
          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </>
            )}
          </Button>
        )}

        {/* Video Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="rounded-lg overflow-hidden border bg-muted">
              <video
                src={previewUrl}
                controls
                className="w-full max-h-[400px]"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
