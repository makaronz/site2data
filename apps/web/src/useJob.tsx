import { useState, useEffect } from "react";

// Define interfaces for better type safety
interface SSEMessage {
  percent: number;
  section?: string;
  payload?: any; // Consider a more specific type if payload structure is known
  type?: string;
  zip?: string; // URL to the zip file
  error?: string; // For error messages from SSE
}

interface JobData {
  [key: string]: any; // Or specific known sections if possible
}

interface UseJobReturn {
  pct: number;
  data: JobData;
  error: string | null;
}

const useJob = (jobId: string): UseJobReturn => {
  const [pct, setPct] = useState(0);
  const [data, setData] = useState<JobData>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      // Do not attempt to connect if jobId is not provided
      return;
    }

    setError(null); // Clear previous errors on new jobId
    const sse = new EventSource(`/api/job/${jobId}/events`);

    sse.onmessage = e => {
      try {
        const msg: SSEMessage = JSON.parse(e.data);
        if (msg.error) {
          console.error("SSE Error Message:", msg.error);
          setError(msg.error);
          // Optionally close SSE on critical error messages from server
          // sse.close(); 
          return;
        }

        setPct(msg.percent);
        if (msg.section && msg.payload !== undefined) {
          setData((d: JobData) => ({ ...d, [msg.section!]: msg.payload }));
        }
        if (msg.type === "done" && msg.zip) {
          // Consider prompting user before opening new window or providing a link
          window.open(msg.zip, "_blank");
          // sse.close(); // Optionally close after "done"
        }
      } catch (parseError) {
        console.error("Failed to parse SSE message data:", e.data, parseError);
        setError("Błąd przetwarzania danych z serwera.");
      }
    };

    sse.onerror = (err) => {
      console.error("EventSource failed:", err);
      setError("Błąd połączenia z serwerem do aktualizacji statusu.");
      // EventSource will attempt to reconnect automatically by default
      // but you might want to close it if jobId becomes invalid or after too many errors
      // sse.close();
    };

    return () => {
      sse.close();
    };
  }, [jobId]);

  return { pct, data, error };
};

export default useJob; 