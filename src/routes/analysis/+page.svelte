<script>
  import { onMount } from 'svelte';
  import AnalysisMenu from './AnalysisMenu.svelte';
  import Metadane from './sections/Metadane.svelte';
  import StrukturaScen from './sections/StrukturaScen.svelte';
  import Postaci from './sections/Postaci.svelte';
  import Relacje from './sections/Relacje.svelte';
  import Tematy from './sections/Tematy.svelte';
  import Zasoby from './sections/Zasoby.svelte';
  import Pacing from './sections/Pacing.svelte';
  import Flagi from './sections/Flagi.svelte';
  import Ekstra from './sections/Ekstra.svelte';
  import Graf from './sections/Graf.svelte';

  let selectedSection = 'Metadane';

  const sections = [
    'Metadane',
    'Struktura scen',
    'Postaci',
    'Relacje',
    'Tematy',
    'Zasoby',
    'Pacing',
    'Flagi',
    'Ekstra',
    'Graf'
  ];
</script>

<div class="analysis-dashboard">
  <AnalysisMenu {sections} bind:selectedSection />
  <div class="analysis-section">
    {#if selectedSection === 'Metadane'}
      <Metadane />
    {:else if selectedSection === 'Struktura scen'}
      <StrukturaScen />
    {:else if selectedSection === 'Postaci'}
      <Postaci />
    {:else if selectedSection === 'Relacje'}
      <Relacje />
    {:else if selectedSection === 'Tematy'}
      <Tematy />
    {:else if selectedSection === 'Zasoby'}
      <Zasoby />
    {:else if selectedSection === 'Pacing'}
      <Pacing />
    {:else if selectedSection === 'Flagi'}
      <Flagi />
    {:else if selectedSection === 'Ekstra'}
      <Ekstra />
    {:else if selectedSection === 'Graf'}
      <Graf />
    {/if}
  </div>
</div>

<style>
.analysis-dashboard {
  display: flex;
  flex-direction: row;
  min-height: 80vh;
}
.analysis-section {
  flex: 1;
  padding: 2rem;
  background: #fafbfc;
  border-radius: 8px;
  margin-left: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
</style>
