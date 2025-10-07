import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// API function for enqueueing QBO jobs
async function enqueueQboJob(input: {
  clientId: string; realmId: string; objectType: string; payload?: any;
}) {
  const res = await fetch("/api/qbo/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ id: string }>;
}

export default function QboDemo() {
  const [clientId, setClientId] = useState("");
  const [realmId, setRealmId] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const { id } = await enqueueQboJob({
        clientId,
        realmId,
        objectType: "Ping", // or "InvoiceCreate" etc.
        payload: { ping: Date.now() },
      });
      setJobId(id);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>QuickBooks Integration Test</CardTitle>
        <CardDescription>
          Test the QuickBooks job queue system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input 
            value={clientId} 
            onChange={e => setClientId(e.target.value)} 
            placeholder="Client ID" 
            className="w-full"
          />
          <Input 
            value={realmId} 
            onChange={e => setRealmId(e.target.value)} 
            placeholder="Realm ID" 
            className="w-full"
          />
        </div>
        
        <Button 
          onClick={submit} 
          disabled={loading || !clientId || !realmId}
          className="w-full"
        >
          {loading ? "Enqueueing..." : "Enqueue Job"}
        </Button>
        
        {jobId && (
          <div className="space-y-2">
            <Badge variant="default" className="w-full justify-center">
              Job Enqueued: {jobId}
            </Badge>
            <p className="text-sm text-muted-foreground text-center">
              Check the worker logs to see processing status
            </p>
          </div>
        )}
        
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            Error: {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
