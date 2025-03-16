'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEdgeStore } from '@/lib/edgestore';
import { User } from '@prisma/client';
import { toast } from 'react-hot-toast';

interface ProfileSettingsProps {
  user: User;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter();
  const { edgestore } = useEdgeStore();
  const [name, setName] = useState(user.name || '');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Upload image if a new one was selected
      let imageUrl = user.image;
      
      if (image) {
        setIsUploading(true);
        const res = await edgestore.profileImages.upload({
          file: image,
          options: {
            replaceTargetUrl: user.image || undefined,
          },
        });
        imageUrl = res.url;
        setIsUploading(false);
      }
      
      // Update user profile
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          image: imageUrl,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      toast.success('Profile updated successfully');
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg vintage-border max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6 vintage-text">Profile Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Image */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10">
                  <span className="text-4xl text-primary/50">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <label className="vintage-button cursor-pointer text-center">
              Change Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={isUploading || isSubmitting}
              />
            </label>
            
            {isUploading && (
              <div className="text-sm text-primary">Uploading image...</div>
            )}
          </div>
          
          {/* Profile Details */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-background border border-primary/30 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                This is your public display name
              </p>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user.email}
                className="w-full p-2 bg-background/50 border border-primary/30 rounded text-gray-400"
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="vintage-button bg-primary py-2 px-6"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 