import { useEffect, useState } from "react";
import { Check, Loader2, MapPin, FileText, Building2, FileOutput } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface ProcessingStatusProps {
  requestId: string;
}

interface ProcessingSteps {
  address_validated: boolean;
  coordinates_mapped: boolean;
  zoning_checked: boolean;
  report_generated: boolean;
  completed: boolean;
}

interface StatusDetails {
  address_validation: string | null;
  geospatial_analysis: string | null;
  zoning_analysis: string | null;
  report_generation: string | null;
}

interface ProcessingStatus {
  processing_steps: ProcessingSteps;
  status_details: StatusDetails;
}

export const ProcessingStatus = ({ requestId }: ProcessingStatusProps) => {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!requestId) return;

    // Subscribe to changes
    const channel = supabase
      .channel(`property_request_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload: any) => {
          console.log('Processing status updated:', payload);
          if (payload.new) {
            const newStatus: ProcessingStatus = {
              processing_steps: payload.new.processing_steps as ProcessingSteps,
              status_details: payload.new.status_details as StatusDetails
            };
            setStatus(newStatus);
            
            // Calculate progress
            const steps = Object.values(newStatus.processing_steps || {});
            const completedSteps = steps.filter(step => step === true).length;
            setProgress((completedSteps / (steps.length - 1)) * 100); // -1 to exclude the "completed" flag
          }
        }
      )
      .subscribe();

    // Initial fetch
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('property_requests')
        .select('processing_steps, status_details')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error fetching status:', error);
        return;
      }

      console.log('Initial status:', data);
      const initialStatus: ProcessingStatus = {
        processing_steps: data.processing_steps as ProcessingSteps,
        status_details: data.status_details as StatusDetails
      };
      setStatus(initialStatus);
      
      // Calculate initial progress
      const steps = Object.values(initialStatus.processing_steps || {});
      const completedSteps = steps.filter(step => step === true).length;
      setProgress((completedSteps / (steps.length - 1)) * 100);
    };

    fetchStatus();

    return () => {
      channel.unsubscribe();
    };
  }, [requestId]);

  if (!status) return null;

  const getStepIcon = (stepCompleted: boolean) => {
    if (stepCompleted) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
  };

  return (
    <Card className="mt-8 bg-white shadow-lg">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-2xl font-bold text-gray-900">Processing Status</CardTitle>
        <CardDescription className="text-gray-600">Track the progress of your property analysis</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 text-right">{Math.round(progress)}% Complete</p>
          </div>

          <div className="space-y-6">
            {/* Address Validation */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100">
              <div className="bg-blue-100 p-2 rounded-full">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Address Validation</h4>
                  {getStepIcon(status.processing_steps?.address_validated)}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {status.status_details?.address_validation || 'Validating address...'}
                </p>
              </div>
            </div>

            {/* Geospatial Analysis */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100">
              <div className="bg-green-100 p-2 rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Geospatial Analysis</h4>
                  {getStepIcon(status.processing_steps?.coordinates_mapped)}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {status.status_details?.geospatial_analysis || 'Analyzing location data...'}
                </p>
              </div>
            </div>

            {/* Zoning Analysis */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100">
              <div className="bg-purple-100 p-2 rounded-full">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Zoning Analysis</h4>
                  {getStepIcon(status.processing_steps?.zoning_checked)}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {status.status_details?.zoning_analysis || 'Checking zoning regulations...'}
                </p>
              </div>
            </div>

            {/* Report Generation */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100">
              <div className="bg-orange-100 p-2 rounded-full">
                <FileOutput className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Report Generation</h4>
                  {getStepIcon(status.processing_steps?.report_generated)}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {status.status_details?.report_generation || 'Generating final report...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};