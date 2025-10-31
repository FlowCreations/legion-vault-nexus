import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { NextBestAction } from "@/types/personality";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Globe, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";


const channelIcons = {
  email: Mail,
  dm: MessageSquare,
  site: Globe,
  push: Bell,
};

export const NBAQueue = () => {
  // Feature not yet implemented - next_best_actions table doesn't exist
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live NBA Queue</CardTitle>
        <CardDescription>This feature is not yet available</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Next-best-action intelligence features are currently being developed.
        </p>
      </CardContent>
    </Card>
  );
};
