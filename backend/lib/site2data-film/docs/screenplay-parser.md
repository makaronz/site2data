# Screenplay Parser Documentation

## Overview

The Screenplay Parser is a utility for extracting structured data from screenplay PDF files. It supports multiple screenplay formats and extracts information such as scenes, characters, dialogue, locations, and more.

## Supported Formats

The parser can automatically detect and process the following screenplay formats:

1. **Standard Format**
   - Scene headers with INT/EXT markers
   - Example: `1. INT. KITCHEN - DAY`
   - Or: `SCENA 1. WNĘTRZE. KUCHNIA - DZIEŃ`

2. **Location-Time-Number Format**
   - Location and time of day in one line, followed by scene number
   - Example: 
     ```
     PL. AUTOSTRADA - DZIEŃ.
     1
     ```

## Extracted Data

The parser extracts the following information:

- **Metadata**
  - Title
  - Version
  - Total number of scenes
  - List of unique characters
  - Total number of dialogues

- **Scene Data**
  - Scene number
  - Location (type and name)
  - Time of day
  - Characters present in the scene
  - Dialogue
  - Props
  - Vehicles
  - Extras/Background actors
  - Special requirements

## Usage

### Using the API

```javascript
const scriptParser = require('./utils/scriptParser');

async function parseScreenplay(filePath) {
  try {
    const parsedScript = await scriptParser.parse(filePath);
    console.log('Screenplay parsed successfully');
    console.log(`Found ${parsedScript.metadata.totalScenes} scenes`);
    console.log(`Found ${parsedScript.metadata.uniqueCharacters.length} characters`);
    return parsedScript;
  } catch (error) {
    console.error('Error parsing screenplay:', error);
    throw error;
  }
}
```

### Using the Test Scripts

We provide test scripts to quickly test the parser with different screenplays:

```bash
# Test a specific screenplay
node scripts/test_script_parser.js --screenplay=path/to/screenplay.pdf

# Test multiple screenplays
node scripts/test_multiple_scripts.js
```

## Parser Configuration

The parser is designed to automatically detect the screenplay format, but you can also specify the format explicitly:

```javascript
// Force a specific format
const parsedScript = await scriptParser.parse(filePath, { format: 'standard' });
```

## Output Format

The parser returns a JSON object with the following structure:

```javascript
{
  title: "Screenplay Title",
  version: "1.0",
  date: "2023-04-05T12:00:00.000Z",
  scenes: [
    {
      sceneNumber: "1",
      location: {
        type: "INT",
        name: "KITCHEN"
      },
      timeOfDay: "DAY",
      cast: ["CHARACTER1", "CHARACTER2"],
      dialogue: [
        {
          character: "CHARACTER1",
          text: "Hello, world!"
        }
      ],
      props: [
        {
          name: "KNIFE",
          description: "large kitchen knife",
          quantity: 1
        }
      ],
      description: "Scene description text..."
    }
    // More scenes...
  ],
  metadata: {
    totalScenes: 120,
    uniqueCharacters: ["CHARACTER1", "CHARACTER2", "CHARACTER3"],
    totalDialogues: 348
  }
}
```

## Extensibility

The parser is designed to be easily extended to support additional screenplay formats. To add support for a new format:

1. Add a new detection pattern in the `_detectScriptFormat` method
2. Implement a parsing method for the new format
3. Update the format selection logic in the `parse` method 