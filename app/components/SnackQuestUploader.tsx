'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/use-toast-hook';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEdgeStore } from '@/lib/edgestore';
import { SingleImageDropzone } from './SingleImageDropzone';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SnackQuest {
  id: string;
  title: string;
  description: string;
  type: string;
  requirement: number;
  scoreReward: number;
  isAccepted: boolean;
  isCompleted: boolean;
  progress: number;
}

interface Quest {
  id: string;
  title: string;
  isAccepted: boolean;
}

export default function SnackQuestUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackQuests, setSnackQuests] = useState<SnackQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { edgestore } = useEdgeStore();
  const { toast } = useToast();

  useEffect(() => {
    console.log('SnackQuestUploader component mounted');
    fetchSnackQuests();
    fetchAndAcceptSnackQuests();
  }, []);

  // Function to fetch all quests and auto-accept snack quests
  const fetchAndAcceptSnackQuests = async () => {
    try {
      console.log('Fetching all quests to auto-accept snack quests');
      const response = await fetch('/api/quests');
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No snack quests available');
          return;
        }
        throw new Error('Failed to fetch quests');
      }
      
      const data = await response.json();
      
      // Find available snack quests that are not accepted
      const availableSnackQuests = data.quests.filter((q: Quest) => 
        q.title.toLowerCase().includes('snack') && !q.isAccepted
      );
      
      console.log('Available snack quests:', availableSnackQuests);
      
      // Auto-accept each snack quest
      for (const quest of availableSnackQuests) {
        await acceptQuest(quest.id);
      }
    } catch (error) {
      console.error('Error auto-accepting snack quests:', error);
    }
  };

  // Function to accept a quest
  const acceptQuest = async (questId: string) => {
    try {
      console.log(`Auto-accepting snack quest: ${questId}`);
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to accept quest');
      }
      
      console.log(`Successfully accepted quest: ${questId}`);
      return true;
    } catch (error) {
      console.error('Error accepting quest:', error);
      return false;
    }
  };

  const fetchSnackQuests = async () => {
    try {
      console.log('Fetching snack quests');
      setIsLoading(true);
      const response = await fetch('/api/quests/submit-snack');
      
      console.log('Snack quest response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No snack quests available');
          setSnackQuests([]);
          return;
        }
        throw new Error('Failed to fetch snack quests');
      }
      
      const data = await response.json();
      console.log('Snack quests data:', data);
      setSnackQuests(data.quests || []);
    } catch (error) {
      console.error('Error fetching snack quests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load snack quests',
        variant: 'destructive',
      });
      setSnackQuests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file || snackQuests.length === 0) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Upload the image to EdgeStore
      const res = await edgestore.publicFiles.upload({
        file,
        onProgressChange: (progress) => {
          setUploadProgress(progress);
        },
      });
      
      // Submit the snack quest with the image URL
      const response = await fetch('/api/quests/submit-snack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: res.url,
          questId: snackQuests[0]?.id, // Use the first snack quest
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit snack');
      }
      
      // Show success message
      toast({
        title: 'Snack uploaded successfully! 🎉',
        description: `You've earned ${snackQuests[0]?.scoreReward || 0} points!`,
      });
      
      // Clear file and refresh quests
      setFile(null);
      fetchSnackQuests();
      
    } catch (error) {
      console.error('Error submitting snack:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit snack',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full border-2 border-amber-500/20 bg-gradient-to-br from-amber-50/20 to-transparent">
        <CardContent className="py-6">
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (snackQuests.length === 0) {
    return null; // Don't show anything if there are no snack quests
  }

  // Use the first snack quest for display
  const quest = snackQuests[0];
  const isCompleted = quest?.isCompleted;

  return (
    <Card className="w-full border-2 border-amber-500/20 bg-gradient-to-br from-amber-50/20 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">{quest?.title || 'Snack Time'}</CardTitle>
          </div>
        </div>
        <CardDescription>
          {quest?.description || 'Share a picture of your healthy snack!'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {isCompleted ? (
          <div className="text-center p-4 bg-green-50 rounded-md">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Trophy className="h-8 w-8 text-green-500" />
              <p className="font-medium text-green-800">Quest Completed!</p>
              <p className="text-sm text-green-600">Thanks for sharing your snack.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SingleImageDropzone
              width={400}
              height={200}
              value={file}
              onChange={setFile}
              dropzoneOptions={{
                maxSize: 1024 * 1024 * 4, // 4MB
              }}
              className="w-full mx-auto border-2 border-dashed border-amber-200 bg-amber-50/50 hover:bg-amber-50"
            />
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 bg-amber-100 [&>div]:bg-amber-500" />
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <Trophy className="h-4 w-4 mr-1 text-amber-500" />
          <span>Reward: {quest?.scoreReward || 0} points</span>
        </div>
        {!isCompleted && (
          <Button 
            size="sm" 
            className="bg-amber-500 hover:bg-amber-600"
            disabled={!file || isUploading}
            onClick={handleSubmit}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Snack
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 