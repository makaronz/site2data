<script>
  export let selectedSection;
</script>

{#if selectedSection === 'Graf'}
  <div class="section-placeholder graph-placeholder">
    <h2>Graph (placeholder)</h2>
    <p>Visualization of the relationship graph will appear here.</p>
  </div>
{:else}
  <div class="section-placeholder">
    <h2>{selectedSection}</h2>
    <p>Section "{selectedSection}" is under construction.</p>
  </div>
{/if}

<style>
.section-placeholder {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  background: #fff;
  border: 1px dashed #b0b8c1;
  border-radius: 8px;
  padding: 2rem;
  color: #444;
}
.graph-placeholder {
  background: #f5faff;
  border-color: #7ec3e6;
}
</style>
