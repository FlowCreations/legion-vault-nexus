import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Suspense, lazy } from "react";
import { Users, MapPin, Brain, Heart } from "lucide-react";

const Demographics = lazy(() => import("@/components/merchant/Demographics").then(m => ({ default: m.Demographics })));
const Geography = lazy(() => import("@/components/merchant/Geography").then(m => ({ default: m.Geography })));
const PersonalityBreakdown = lazy(() => import("./PersonalityBreakdown"));
const InterestsHobbies = lazy(() => import("./InterestsHobbies"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

export const CoreDemographics = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
            Core Demographics
          </h2>
          <p className="text-muted-foreground mt-2">
            Deep insights into your most active members and community composition
          </p>
        </div>
      </div>

      <Tabs defaultValue="age-gender" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="age-gender" className="gap-2">
            <Users className="h-4 w-4" />
            Age & Gender
          </TabsTrigger>
          <TabsTrigger value="geography" className="gap-2">
            <MapPin className="h-4 w-4" />
            Geography
          </TabsTrigger>
          <TabsTrigger value="personality" className="gap-2">
            <Brain className="h-4 w-4" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="interests" className="gap-2">
            <Heart className="h-4 w-4" />
            Interests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="age-gender" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <Demographics />
          </Suspense>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <Geography />
          </Suspense>
        </TabsContent>

        <TabsContent value="personality" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <PersonalityBreakdown />
          </Suspense>
        </TabsContent>

        <TabsContent value="interests" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <InterestsHobbies />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};
