<script lang="ts">
  let selectedFile: File | null = null;
  let uploadStatus: string = '';
  let scriptId: string = '';
  let analysisResult: any = null;
  let isAnalyzing: boolean = false;
  let confirmationMessage: string = '';

  async function handleFileUpload() {
    if (!selectedFile) {
      uploadStatus = 'Proszę wybrać plik PDF';
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      uploadStatus = 'Uploadowanie pliku...';
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        scriptId = data.id;
        uploadStatus = 'Plik został pomyślnie wczytany. Przeczytałem cały scenariusz i jestem gotowy do analizy.';
      } else {
        uploadStatus = 'Błąd podczas uploadowania pliku: ' + data.detail;
      }
    } catch (error) {
      uploadStatus = 'Błąd podczas uploadowania pliku: ' + error;
    }
  }

  async function analyzeScript() {
    if (!scriptId) {
      confirmationMessage = 'Najpierw wgraj scenariusz';
      return;
    }

    try {
      isAnalyzing = true;
      confirmationMessage = 'Analizuję scenariusz...';
      const response = await fetch(`http://localhost:8000/analyze/${scriptId}`, {
        method: 'POST',
      });

      const data = await response.json();
      if (response.ok) {
        analysisResult = data;
        confirmationMessage = 'Analiza zakończona pomyślnie';
      } else {
        confirmationMessage = 'Błąd podczas analizy: ' + data.detail;
      }
    } catch (error) {
      confirmationMessage = 'Błąd podczas analizy: ' + error;
    } finally {
      isAnalyzing = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">Analiza Scenariusza Filmowego</h1>
  
  <div class="mb-8 p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4">Upload Scenariusza</h2>
    <div class="flex flex-col gap-4">
      <input
        type="file"
        accept=".pdf"
        class="border p-2 rounded"
        on:change={(e) => selectedFile = e.target.files?.[0] || null}
      />
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        on:click={handleFileUpload}
      >
        Upload PDF
      </button>
      {#if uploadStatus}
        <p class="mt-2 text-sm {uploadStatus.includes('Błąd') ? 'text-red-500' : 'text-green-500'}">
          {uploadStatus}
        </p>
      {/if}
    </div>
  </div>

  <div class="mb-8 p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4">Analiza</h2>
    <button
      class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors disabled:opacity-50"
      on:click={analyzeScript}
      disabled={!scriptId || isAnalyzing}
    >
      {isAnalyzing ? 'Analizuję...' : 'Analizuj Scenariusz'}
    </button>
    {#if confirmationMessage}
      <p class="mt-2 text-sm {confirmationMessage.includes('Błąd') ? 'text-red-500' : 'text-green-500'}">
        {confirmationMessage}
      </p>
    {/if}
  </div>

  {#if analysisResult}
    <div class="p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">Wyniki Analizy</h2>
      <div class="prose max-w-none">
        <h3 class="text-lg font-semibold mt-4">Lokacje:</h3>
        {#each Object.entries(analysisResult.lokacje || {}) as [nazwa, lokacja]}
          <div class="mt-4 p-4 bg-gray-50 rounded">
            <h4 class="font-semibold">{nazwa}</h4>
            <p><strong>Sceny:</strong> {lokacja.sceny.join(', ')}</p>
            <p><strong>Charakterystyka:</strong> {lokacja.charakterystyka}</p>
            <p><strong>Szacowany czas:</strong> {lokacja.czas_zdjęciowy.szacowany_czas}</p>
            <p><strong>Niezbędność:</strong> {lokacja.niezbędność.poziom}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  :global(body) {
    @apply bg-gray-100;
  }
</style>
