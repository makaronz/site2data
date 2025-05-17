import { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc'; // Założenie: klient tRPC jest tutaj

export interface JobStatus {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'NOT_FOUND'; // NOT_FOUND dodane dla obsługi braku zadania
  progress?: number; // 0-100
  message?: string;
  finalResultUrl?: string; // URL do wyniku końcowego, np. przetworzonego pliku
  error?: string; // Komunikat błędu, jeśli status to FAILED
  processedPages?: number; // Dodatkowe pole, jeśli potrzebne
  totalPages?: number; // Dodatkowe pole, jeśli potrzebne
}

// TODO: Zdefiniować dokładny typ odpowiedzi z backendu dla statusu zadania
// interface BackendJobStatusResponse {
//   status: string;
//   progress: number;
//   message?: string;
//   resultUrl?: string;
//   error?: string;
// }

export function useJobStatus(initialJobId: string | null) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const queryClient = trpc.useContext(); // Dla potencjalnej invalidacji

  // Procedura tRPC do pobierania statusu zadania
  const jobStatusQuery = trpc.getJobStatus.useQuery(
    { jobId: initialJobId! }, // Używamy ! ponieważ enabled jest zależne od initialJobId
    {
      enabled: !!initialJobId, // Zapytanie jest aktywne tylko jeśli initialJobId istnieje
      refetchInterval: (data) => {
        // Jeśli zadanie nie jest zakończone (COMPLETED/FAILED) lub nie znalezione (NOT_FOUND),
        // kontynuuj odpytywanie co 2 sekundy.
        // W przeciwnym razie zatrzymaj odpytywanie.
        const status = data?.status;
        if (status === 'COMPLETED' || status === 'FAILED' || status === 'NOT_FOUND') {
          return false; // Zatrzymaj odpytywanie
        }
        return 2000; // Odpytuj co 2 sekundy
      },
      refetchIntervalInBackground: true,
      onError: (err) => {
        console.error('Błąd podczas pobierania statusu zadania:', err);
        if (err.data?.code === 'NOT_FOUND') {
          setJobStatus({
            jobId: initialJobId!,
            status: 'NOT_FOUND',
            message: `Zadanie o ID ${initialJobId} nie zostało znalezione.`
          });
        } else {
          setError('Nie udało się pobrać statusu zadania. Spróbuj odświeżyć stronę.');
        }
        setIsLoading(false);
      },
      onSuccess: (data) => {
        // Mapowanie danych z backendu (Job) na JobStatus (frontend)
        // Typ Job z backendu (../../packages/types/src/index.ts) zawiera więcej pól,
        // mapujemy tylko te, które są potrzebne w JobStatus
        if (data) {
            const frontendStatus: JobStatus = {
                jobId: data.jobId,
                status: data.status as JobStatus['status'], // Rzutowanie, jeśli statusy są zgodne
                progress: data.progressPercentage, // Zakładamy, że backend ma pole progressPercentage
                message: data.currentStep || undefined, // Zakładamy, że backend ma pole currentStep
                finalResultUrl: data.finalResultUrl || undefined,
                error: data.errorMessage || undefined, // Zakładamy, że backend ma pole errorMessage
                // Można dodać mapowanie processedPages i totalPages jeśli są w `data`
            };
            setJobStatus(frontendStatus);
        } else {
             // To się nie powinno zdarzyć jeśli query jest enabled tylko gdy initialJobId istnieje i onError NOT_FOUND działa
            setJobStatus({
                jobId: initialJobId!,
                status: 'NOT_FOUND',
                message: `Zadanie o ID ${initialJobId} nie zostało znalezione (onSuccess data is null).`
            });
        }
        setError(null);
        setIsLoading(false);
      },
      onSettled: () => {
        // Można coś zrobić po każdym zapytaniu, np. zatrzymać ładowanie jeśli nie jest już potrzebne
      }
    }
  );

  useEffect(() => {
    if (initialJobId) {
      setIsLoading(true); // Rozpocznij ładowanie, gdy jobId jest dostępne
      // jobStatusQuery.refetch(); // Opcjonalnie: wymuś pierwsze pobranie od razu, choć useQuery zrobi to samo
    } else {
      setJobStatus(null);
      setError(null);
      setIsLoading(false);
    }
  }, [initialJobId]);

  return { jobStatus, error, isLoading, refetchJobStatus: jobStatusQuery.refetch };
}

export default useJobStatus; 