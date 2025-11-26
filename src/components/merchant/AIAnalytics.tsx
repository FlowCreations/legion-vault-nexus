import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, BarChart, ShoppingBag } from "lucide-react";

export function AIAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Cohort Rivers
            </CardTitle>
            <CardDescription>Overlapping behavioral segments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Nashville, TN</span>
                <Badge>High Activity</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Austin, TX</span>
                <Badge variant="secondary">Medium</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Los Angeles, CA</span>
                <Badge>High Activity</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Timing
            </CardTitle>
            <CardDescription>Peak login & purchase hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Peak Hours</span>
                <span className="text-sm font-semibold">7PM - 10PM EST</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Purchase Peak</span>
                <span className="text-sm font-semibold">8PM - 9PM EST</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Content Peak</span>
                <span className="text-sm font-semibold">9PM - 11PM EST</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Top Content Analytics
            </CardTitle>
            <CardDescription>Most-watched & shared media</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Virtual Tour Finale</span>
                <span className="text-sm font-semibold">2.4k views</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Acoustic Session</span>
                <span className="text-sm font-semibold">1.8k views</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Behind the Scenes</span>
                <span className="text-sm font-semibold">1.2k views</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Merch Performance
            </CardTitle>
            <CardDescription>Best sellers + margin data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Tour Hoodie</span>
                <div className="text-right">
                  <p className="text-sm font-semibold">143 sold</p>
                  <p className="text-xs text-muted-foreground">45% margin</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Limited Vinyl</span>
                <div className="text-right">
                  <p className="text-sm font-semibold">89 sold</p>
                  <p className="text-xs text-muted-foreground">60% margin</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-medium">Signature Cap</span>
                <div className="text-right">
                  <p className="text-sm font-semibold">67 sold</p>
                  <p className="text-xs text-muted-foreground">55% margin</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Behavior Flow Mapping</CardTitle>
          <CardDescription>Navigation from content → commerce</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg flex-wrap gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">Video Views</p>
              <p className="text-sm font-semibold text-muted-foreground mt-1">Entry Point</p>
            </div>
            <div className="text-2xl text-muted-foreground">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold">Profile Visit</p>
              <p className="text-sm font-semibold text-muted-foreground mt-1">45% convert</p>
            </div>
            <div className="text-2xl text-muted-foreground">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold">Merch Browse</p>
              <p className="text-sm font-semibold text-muted-foreground mt-1">62% engage</p>
            </div>
            <div className="text-2xl text-muted-foreground">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold">Purchase</p>
              <p className="text-sm font-semibold text-muted-foreground mt-1">28% convert</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
