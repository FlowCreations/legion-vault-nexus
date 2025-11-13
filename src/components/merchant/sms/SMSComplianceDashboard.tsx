import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Shield, Users } from "lucide-react";

export const SMSComplianceDashboard = () => {
  return (
    <div className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>SMS Compliance Status</AlertTitle>
        <AlertDescription>
          Ensure your SMS campaigns comply with TCPA, CAN-SPAM, and carrier regulations
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Opt-In Management
            </CardTitle>
            <CardDescription>Track consent and opt-out requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Opt-Ins</span>
              <Badge variant="outline">0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Opt-Outs</span>
              <Badge variant="outline">0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Opt-In Rate</span>
              <Badge variant="outline">0%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance Checklist</CardTitle>
            <CardDescription>Required for SMS campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Twilio Account Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Opt-In Form Deployed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Database Configured</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Auto-Opt-Out Handler Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Opt-Out Requests</CardTitle>
          <CardDescription>Automatically processed via keyword detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No opt-out requests yet
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
