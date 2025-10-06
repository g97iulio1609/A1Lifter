"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Video, Play, Radio, ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"

interface LiveStreamingProps {
  eventId: string
  eventName: string
  streamUrl?: string | null
  isLive?: boolean
  onStreamUrlUpdate?: (url: string) => void
}

export function LiveStreaming({
  eventId,
  eventName,
  streamUrl: initialStreamUrl,
  isLive = false,
  onStreamUrlUpdate,
}: LiveStreamingProps) {
  const [streamUrl, setStreamUrl] = useState(initialStreamUrl || "")
  const [embedCode, setEmbedCode] = useState("")
  const [activeTab, setActiveTab] = useState<"viewer" | "embed" | "settings">("viewer")

  const handleSaveStreamUrl = async () => {
    if (!streamUrl.trim()) {
      toast.error("Please enter a valid stream URL")
      return
    }

    try {
      // Update event with stream URL
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ streamUrl }),
      })

      if (!response.ok) {
        throw new Error("Failed to update stream URL")
      }

      toast.success("Stream URL saved successfully")
      onStreamUrlUpdate?.(streamUrl)
      
      // Generate embed code
      generateEmbedCode(streamUrl)
    } catch (error) {
      console.error("Error saving stream URL:", error)
      toast.error("Failed to save stream URL")
    }
  }

  const generateEmbedCode = (url: string) => {
    // Support different streaming platforms
    let embedUrl = url

    // YouTube
    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0]
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0]
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    }

    // Twitch
    else if (url.includes("twitch.tv")) {
      const channel = url.split("twitch.tv/")[1]?.split("?")[0]
      embedUrl = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`
    }

    // Vimeo
    else if (url.includes("vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0]
      embedUrl = `https://player.vimeo.com/video/${videoId}`
    }

    const code = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
    setEmbedCode(code)
  }

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode)
    toast.success("Embed code copied to clipboard")
  }

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/events/${eventId}/live`
    navigator.clipboard.writeText(shareLink)
    toast.success("Share link copied to clipboard")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Live Streaming
            </CardTitle>
            <CardDescription>{eventName}</CardDescription>
          </div>
          {isLive && (
            <Badge variant="default" className="bg-red-500 animate-pulse">
              <Radio className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="viewer">
              <Play className="h-4 w-4 mr-2" />
              Viewer
            </TabsTrigger>
            <TabsTrigger value="embed">
              <ExternalLink className="h-4 w-4 mr-2" />
              Embed
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="viewer" className="space-y-4">
            {streamUrl ? (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {embedCode ? (
                    <div dangerouslySetInnerHTML={{ __html: embedCode }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Stream viewer will appear here</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Click &quot;Generate Embed&quot; to view the stream
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => generateEmbedCode(streamUrl)} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Generate Embed
                  </Button>
                  <Button variant="outline" onClick={copyShareLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No stream URL configured</p>
                <p className="text-sm mt-2">Go to Settings to add a stream URL</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            {embedCode ? (
              <div className="space-y-4">
                <div>
                  <Label>Embed Code</Label>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={embedCode}
                      className="w-full h-32 p-3 text-sm font-mono bg-muted rounded-lg border resize-none"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={copyEmbedCode}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Copy and paste this code into your website to embed the live stream
                  </p>
                </div>

                <div>
                  <Label>Preview</Label>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <div dangerouslySetInnerHTML={{ __html: embedCode }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No embed code generated</p>
                <p className="text-sm mt-2">Add a stream URL and generate embed code first</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="streamUrl">Stream URL</Label>
                <Input
                  id="streamUrl"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://twitch.tv/..."
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Supports YouTube, Twitch, Vimeo, and direct stream URLs
                </p>
              </div>

              <Button onClick={handleSaveStreamUrl} className="w-full">
                Save Stream URL
              </Button>

              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Supported Platforms</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• YouTube: Live streams and videos</li>
                  <li>• Twitch: Live channel streams</li>
                  <li>• Vimeo: Videos and live events</li>
                  <li>• Direct URLs: HLS (.m3u8) and DASH streams</li>
                </ul>
              </div>

              <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Going Live
                </h4>
                <p className="text-sm text-muted-foreground">
                  Start your stream on your platform, then add the URL here. The stream will
                  automatically be embedded and shareable.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
