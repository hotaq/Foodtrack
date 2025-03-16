'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Heart, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface MealImage {
  id: string;
  type: string;
  imageUrl: string;
  date: Date;
  isFood?: boolean;
  foodName?: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role?: string;
  };
}

interface MealGalleryProps {
  meals: MealImage[];
  currentUserId: string;
  favoriteIds: string[];
}

export default function MealGallery({ meals, currentUserId, favoriteIds }: MealGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<MealImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(favoriteIds));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = (meal: MealImage, index: number) => {
    setSelectedImage(meal);
    setCurrentIndex(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const goToPrevious = () => {
    const newIndex = (currentIndex - 1 + meals.length) % meals.length;
    setSelectedImage(meals[newIndex]);
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % meals.length;
    setSelectedImage(meals[newIndex]);
    setCurrentIndex(newIndex);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toggleFavorite = async (mealId: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const isFavorite = favorites.has(mealId);
      
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/${mealId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const newFavorites = new Set(favorites);
          newFavorites.delete(mealId);
          setFavorites(newFavorites);
          toast.success('Removed from favorites');
        } else {
          toast.error('Failed to remove from favorites');
        }
      } else {
        // Add to favorites
        const response = await fetch(`/api/favorites/${mealId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const newFavorites = new Set(favorites);
          newFavorites.add(mealId);
          setFavorites(newFavorites);
          toast.success('Added to favorites');
        } else {
          toast.error('Failed to add to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (meals.length === 0) {
    return (
      <div className="text-center p-8 bg-card rounded-lg vintage-border">
        <p className="text-gray-300">No meal images to display yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {meals.map((meal, index) => (
          <div 
            key={meal.id} 
            className="relative gradient-border group transition-all duration-300 hover:transform hover:scale-[1.02]"
          >
            <div 
              className="relative h-52 cursor-pointer overflow-hidden rounded-t-lg"
              onClick={() => openModal(meal, index)}
            >
              <Image
                src={meal.imageUrl}
                alt={`${meal.type} by ${meal.user.name || 'Anonymous'}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-2 right-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-full">
                {meal.type}
              </div>
            </div>
            
            <div className="p-4 bg-card rounded-b-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-primary">{meal.type}</div>
                  {meal.foodName && (
                    <div className="text-xs text-secondary">{meal.foodName}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(meal.date)}</div>
                </div>
                <button 
                  onClick={() => toggleFavorite(meal.id)}
                  className="p-1.5 hover:bg-primary/10 rounded-full transition-colors"
                  disabled={isSubmitting}
                  aria-label={favorites.has(meal.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart 
                    size={18} 
                    className={favorites.has(meal.id) ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-primary"} 
                  />
                </button>
              </div>
              
              <div className="flex items-center text-sm">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/20 mr-2 flex items-center justify-center">
                  {meal.user.image ? (
                    <Image 
                      src={meal.user.image} 
                      alt={meal.user.name || 'User'} 
                      width={24} 
                      height={24} 
                      className="object-cover"
                    />
                  ) : (
                    <User size={14} className="text-primary" />
                  )}
                </div>
                <span className="text-muted-foreground">
                  {meal.user.id === currentUserId ? 'You' : (meal.user.name || 'Anonymous')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for full-size image */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl mx-auto p-4">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="relative h-[75vh] bg-black rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={selectedImage.imageUrl}
                alt={`${selectedImage.type} by ${selectedImage.user.name || 'Anonymous'}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
              
              <button 
                onClick={() => toggleFavorite(selectedImage.id)}
                className="absolute top-4 right-16 z-10 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                disabled={isSubmitting}
              >
                <Heart 
                  size={24} 
                  className={favorites.has(selectedImage.id) ? "fill-red-500 text-red-500" : "text-white hover:text-primary"} 
                />
              </button>
            </div>
            
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 sm:left-8">
              <button 
                onClick={goToPrevious}
                className="bg-black/50 rounded-full p-2 text-white hover:bg-primary/70 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
            
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 sm:right-8">
              <button 
                onClick={goToNext}
                className="bg-black/50 rounded-full p-2 text-white hover:bg-primary/70 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 mx-auto max-w-md text-center text-white bg-black/60 backdrop-blur-md py-3 px-6 rounded-full">
              <div className="font-bold text-lg">{selectedImage.type}</div>
              {selectedImage.foodName && (
                <div className="text-secondary">{selectedImage.foodName}</div>
              )}
              <div className="text-sm mt-1">by {selectedImage.user.id === currentUserId ? 'You' : (selectedImage.user.name || 'Anonymous')}</div>
              <div className="text-xs text-gray-300 mt-1">{formatDate(selectedImage.date)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 