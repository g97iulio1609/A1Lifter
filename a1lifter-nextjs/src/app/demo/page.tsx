"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts"
import { VideoUpload } from "@/components/attempts/VideoUpload"
import { LiveStreaming } from "@/components/live/LiveStreaming"
import { 
  Sparkles, 
  Video, 
  BarChart3, 
  Globe, 
  Mail, 
  Radio,
  CheckCircle 
} from "lucide-react"

/**
 * Demo page showcasing all Milestone 5 features
 * This page demonstrates the new advanced features implemented
 */
export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Milestone 5: Advanced Features
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the new capabilities added to A1Lifter including video uploads, live streaming,
            advanced analytics, internationalization, and email notifications.
          </p>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Video className="h-8 w-8 text-purple-600" />
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
              <CardTitle>Video Upload</CardTitle>
              <CardDescription>
                Upload videos or add URLs for attempt recordings
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Radio className="h-8 w-8 text-blue-600" />
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
              <CardTitle>Live Streaming</CardTitle>
              <CardDescription>
                Embed YouTube, Twitch, and Vimeo streams
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-pink-200 dark:border-pink-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <BarChart3 className="h-8 w-8 text-pink-600" />
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
              <CardTitle>Analytics Charts</CardTitle>
              <CardDescription>
                Interactive charts with Chart.js
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Globe className="h-8 w-8 text-green-600" />
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
              <CardTitle>Internationalization</CardTitle>
              <CardDescription>
                Support for 5 languages (en, it, es, fr, de)
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Mail className="h-8 w-8 text-orange-600" />
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Automated emails for key events
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Sparkles className="h-8 w-8 text-indigo-600" />
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Production Ready
                </Badge>
              </div>
              <CardTitle>All Features</CardTitle>
              <CardDescription>
                Ready for deployment and use
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Interactive Demo */}
        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="h-4 w-4 mr-2" />
              Video Upload
            </TabsTrigger>
            <TabsTrigger value="streaming">
              <Radio className="h-4 w-4 mr-2" />
              Live Stream
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics Charts</CardTitle>
                <CardDescription>
                  Interactive data visualization with Chart.js
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsCharts />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Video Upload Demo</CardTitle>
                <CardDescription>
                  This is a demo of the video upload component. In production, this would be
                  connected to an actual attempt record.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoUpload
                  attemptId="demo-attempt-id"
                  onUploadSuccess={(url) => console.log("Video uploaded:", url)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streaming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Streaming Demo</CardTitle>
                <CardDescription>
                  This is a demo of the live streaming component. Add a YouTube, Twitch, or Vimeo
                  URL to see the embed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LiveStreaming
                  eventId="demo-event-id"
                  eventName="Demo Competition"
                  onStreamUrlUpdate={(url) => console.log("Stream URL updated:", url)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Documentation Link */}
        <Card className="mt-12 border-2 border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Implementation Documentation
            </CardTitle>
            <CardDescription>
              For detailed documentation on all features, integration guides, and usage examples,
              see the MILESTONE_5_IMPLEMENTATION.md file in the project root.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="font-semibold">Key Files:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code>/MILESTONE_5_IMPLEMENTATION.md</code> - Complete guide</li>
                <li>• <code>/a1lifter-nextjs/.env.example</code> - Environment configuration</li>
                <li>• <code>/messages/</code> - Translation files</li>
                <li>• <code>/src/components/analytics/</code> - Chart components</li>
                <li>• <code>/src/components/attempts/</code> - Video upload</li>
                <li>• <code>/src/components/live/</code> - Live streaming</li>
                <li>• <code>/src/lib/email/</code> - Email service</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
