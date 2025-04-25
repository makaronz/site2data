# Sample Screenplay Files

This directory is intended to store sample screenplay files for testing the screenplay parser.

## Adding Sample Files

To add a sample screenplay file:

1. Place your PDF screenplay file in this directory
2. Make sure the file is properly named (e.g., "screenplay-name.pdf")
3. Add a brief description of the screenplay format in this README

## Available Samples

Currently, the following sample screenplays are available:

_(Add your samples here with description of their format)_

Example:
- `standard-format.pdf` - Standard screenplay format with INT/EXT scene headers
- `location-time-format.pdf` - "Location - Time of Day" format followed by scene number

## Testing with Samples

To test the parser with a sample file:

```bash
# Run the test script with a specific screenplay
node ../scripts/test_script_parser.js --screenplay=./samples/your-screenplay.pdf
```

## Format Documentation

For details on supported screenplay formats, refer to the main project documentation. 

interface DashboardLayout {
  scriptAnalysis: {
    scenesOverview: SceneBreakdown[];
    charactersStats: CharacterStats[];
    productionMetrics: ProductionMetrics;
  };
  productionPlanning: {
    schedule: Schedule;
    resources: ResourceAllocation;
    budget: BudgetEstimation;
  };
  activeProduction: {
    dailyReports: DailyReport[];
    progressTracking: ProgressMetrics;
    issues: ProductionIssue[];
  };
} 