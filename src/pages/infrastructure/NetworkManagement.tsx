import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";

export default function NetworkManagement() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-gradient-to-br from-blue-500/10 to-green-500/10 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-6 w-6 text-blue-400" />
            <CardTitle className="text-2xl text-gray-100">Network Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">
            Network configuration and monitoring interface.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}