<script>
  export let sections = [];
  export let selectedSection;
</script>

<nav class="analysis-menu">
  {#each sections as section}
    <button
      class:selected={selectedSection === section}
      on:click={() => selectedSection = section}
    >
      {section}
    </button>
  {/each}
</nav>

<style>
.analysis-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 180px;
  background: #f0f2f5;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.analysis-menu button {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}
.analysis-menu button.selected,
.analysis-menu button:hover {
  background: #e0e7ef;
  font-weight: bold;
}
</style>
