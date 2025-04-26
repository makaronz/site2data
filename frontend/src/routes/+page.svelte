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
      const response = await fetch('http://localhost:3001/api/script/analyze', {
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

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectedFile = input.files[0];
      uploadStatus = '';
    }
  }
</script>

<div class="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
  <div class="relative py-3 sm:max-w-xl sm:mx-auto">
    <div class="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
      <div class="max-w-md mx-auto">
        <div class="divide-y divide-gray-200">
          <div class="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
            <h2 class="text-2xl font-bold mb-8 text-center text-gray-900">Prześlij plik PDF</h2>
            
            <form on:submit|preventDefault={handleFileUpload} class="space-y-6">
              <div class="flex items-center justify-center w-full">
                <label class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg class="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p class="mb-2 text-sm text-gray-500">
                      {#if selectedFile}
                        Wybrany plik: {selectedFile.name}
                      {:else}
                        Kliknij aby wybrać plik lub przeciągnij go tutaj
                      {/if}
                    </p>
                    <p class="text-xs text-gray-500">Tylko pliki PDF</p>
                  </div>
                  <input 
                    type="file" 
                    class="hidden" 
                    accept=".pdf"
                    on:change={handleFileSelect}
                  />
                </label>
              </div>

              {#if uploadStatus}
                <div class="text-center p-2 rounded {uploadStatus.includes('błąd') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                  {uploadStatus}
                </div>
              {/if}

              <button
                type="submit"
                disabled={!selectedFile || isAnalyzing}
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {#if isAnalyzing}
                  Analizowanie...
                {:else}
                  Prześlij plik
                {/if}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 