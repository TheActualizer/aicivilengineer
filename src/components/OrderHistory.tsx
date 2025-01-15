import { useEffect, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Download, Receipt, DollarSign, MapPin, FileText, Info, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatInTimeZone } from 'date-fns-tz';
import { useToast } from "@/hooks/use-toast";
import { StorageError } from "@supabase/storage-js";

interface Order {
  id: string;
  report_name: string;
  purchase_date: string;
  amount: number;
  status: string;
  download_url: string;
  shipping_address?: string;
  notes?: string;
  report?: {
    description?: string;
    created_at: string;
    metadata: any;
  };
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const session = useSession();
  const { toast } = useToast();
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    fetchOrders();
  }, [session, toast]);

  const fetchOrders = async () => {
    try {
      console.log("=== Fetching Orders Process Started ===");
      console.log("User ID:", session?.user.id);
      console.log("User timezone:", userTimeZone);
      
      const { data, error } = await supabase
        .from("reports_orders")
        .select(`
          *,
          report:reports (
            description,
            created_at,
            metadata
          )
        `)
        .order("purchase_date", { ascending: false });

      if (error) {
        console.error("=== Error Fetching Orders ===");
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast({
          title: "Error",
          description: "Failed to load order history",
          variant: "destructive",
        });
        return;
      }

      console.log("=== Orders Fetched Successfully ===");
      console.log("Number of orders:", data?.length || 0);
      console.log("Orders data:", data);
      setOrders(data || []);
    } catch (error) {
      console.error("=== Unexpected Error in fetchOrders ===");
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (order: Order) => {
    try {
      setDownloadingOrderId(order.id);
      console.log("=== Download Process Started ===");
      console.log("Order details:", {
        id: order.id,
        name: order.report_name,
        url: order.download_url
      });
      
      // Clean the file path by removing any potential duplicate 'reports/' prefix
      const filePath = order.download_url.replace(/^reports\//, '');
      console.log("Cleaned file path:", filePath);
      
      console.log("Requesting signed URL from Supabase storage...");
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("reports")
        .createSignedUrl(filePath, 60);

      if (signedUrlError) {
        console.error("=== Storage Error Getting Signed URL ===");
        console.error("Storage Error Details:", {
          message: signedUrlError.message,
          name: signedUrlError.name,
          // Remove statusCode as it's not in the type definition
        });
        throw new Error(`Failed to generate download URL: ${signedUrlError.message}`);
      }

      if (!signedUrlData?.signedUrl) {
        console.error("=== No Signed URL Received ===");
        throw new Error("No signed URL received from storage");
      }

      console.log("Successfully obtained signed URL");
      console.log("Signed URL details:", {
        url: signedUrlData.signedUrl.substring(0, 100) + "...", // Truncate for logging
        expiresIn: "60 seconds"
      });
      
      console.log("Initiating file download...");
      const response = await fetch(signedUrlData.signedUrl);
      console.log("Download response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("=== HTTP Error Response ===");
        console.error("Response details:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create blob and trigger download
      const blob = await response.blob();
      console.log("File blob created:", {
        size: blob.size,
        type: blob.type
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${order.report_name}.pdf`;
      
      console.log("Triggering download with filename:", link.download);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      console.log("Cleaning up download resources...");
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      console.log("=== Download Process Completed Successfully ===");
      
      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      console.error("=== Download Process Failed ===");
      console.error("Error Details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to download report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleShare = async (order: Order) => {
    try {
      const { data, error } = await supabase.storage
        .from("reports")
        .createSignedUrl(order.download_url, 3600); // URL valid for 1 hour

      if (error) {
        throw error;
      }

      await navigator.clipboard.writeText(data.signedUrl);
      toast({
        title: "Success",
        description: "Share link copied to clipboard! Link expires in 1 hour.",
      });
    } catch (error) {
      console.error("Error sharing report:", error);
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (order: Order) => {
    try {
      const { error: deleteStorageError } = await supabase.storage
        .from("reports")
        .remove([order.download_url]);

      if (deleteStorageError) {
        throw deleteStorageError;
      }

      const { error: deleteOrderError } = await supabase
        .from("reports_orders")
        .delete()
        .eq("id", order.id);

      if (deleteOrderError) {
        throw deleteOrderError;
      }

      setOrders(orders.filter((o) => o.id !== order.id));
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  if (!session) return null;

  const formatDate = (dateString: string) => {
    return formatInTimeZone(
      new Date(dateString),
      userTimeZone,
      'MMM d, yyyy h:mm a zzz'
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Your Order History</h2>
        <p className="text-gray-600">View and manage your purchased reports</p>
        <p className="text-sm text-gray-500 mt-1">All times shown in {userTimeZone}</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Receipt className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-600">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{order.report_name}</h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(order.purchase_date)}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          ${order.amount.toFixed(2)}
                        </div>
                        <div className="flex items-center">
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            order.status === "completed" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                      <Button 
                        onClick={() => handleDownload(order)}
                        variant="outline"
                        className="flex-1 md:flex-none"
                        disabled={downloadingOrderId === order.id}
                      >
                        {downloadingOrderId === order.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                            Downloading...
                          </div>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => handleShare(order)}
                        variant="outline"
                        className="flex-1 md:flex-none"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button 
                        onClick={() => handleDelete(order)}
                        variant="destructive"
                        className="flex-1 md:flex-none"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {(order.shipping_address || order.notes || order.report) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.shipping_address && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Shipping Address</p>
                              <p className="text-sm text-gray-600">{order.shipping_address}</p>
                            </div>
                          </div>
                        )}
                        
                        {order.notes && (
                          <div className="flex items-start space-x-2">
                            <FileText className="h-4 w-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Notes</p>
                              <p className="text-sm text-gray-600">{order.notes}</p>
                            </div>
                          </div>
                        )}
                        
                        {order.report && (
                          <div className="flex items-start space-x-2 col-span-full">
                            <Info className="h-4 w-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Report Details</p>
                              {order.report.description && (
                                <p className="text-sm text-gray-600 mt-1">{order.report.description}</p>
                              )}
                              <p className="text-sm text-gray-600 mt-1">
                                Created: {formatDate(order.report.created_at)}
                              </p>
                              {order.report.metadata && Object.keys(order.report.metadata).length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700">Additional Information</p>
                                  {Object.entries(order.report.metadata).map(([key, value]) => (
                                    <p key={key} className="text-sm text-gray-600">
                                      {key}: {value as string}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;