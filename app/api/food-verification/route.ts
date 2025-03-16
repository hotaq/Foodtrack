import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SPOONACULAR_API_KEY = "e4481b7386e04bf486e91e985f4815ab";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { message: "Image URL is required" },
        { status: 400 }
      );
    }

    // Call Spoonacular API to analyze the food image
    const response = await fetch(
      `https://api.spoonacular.com/food/images/analyze?apiKey=${SPOONACULAR_API_KEY}&imageUrl=${encodeURIComponent(imageUrl)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Spoonacular API error:", errorData);
      
      return NextResponse.json(
        { 
          message: "Failed to verify food image",
          isFood: false,
          details: errorData
        },
        { status: 200 } // Still return 200 to handle this gracefully in the UI
      );
    }

    const data = await response.json();
    
    // Check if the image contains food
    const isFood = data.category && data.category.name === "food";
    
    // Get food name if available
    const foodName = isFood && data.recipes && data.recipes.length > 0
      ? data.recipes[0].title
      : null;

    return NextResponse.json({
      message: isFood ? "Food detected" : "No food detected",
      isFood,
      foodName,
      details: data
    });
  } catch (error) {
    console.error("Error verifying food image:", error);
    return NextResponse.json(
      { 
        message: "Error verifying food image",
        isFood: false,
        error: String(error)
      },
      { status: 500 }
    );
  }
} 