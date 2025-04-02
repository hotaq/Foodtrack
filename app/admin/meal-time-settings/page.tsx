import { Metadata } from "next";
import MealTimeSettingsForm from "./meal-time-settings-form";

export const metadata: Metadata = {
  title: "Admin | Meal Time Settings",
  description: "Manage meal time settings for the application",
};

export default function MealTimeSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 vintage-text">Meal Time Settings</h1>
      <div className="bg-card p-6 rounded-lg shadow-lg border border-primary/20">
        <MealTimeSettingsForm />
      </div>
    </div>
  );
} 