# Film Production Assistant (Site2Data Film)

A specialized application for film production teams to extract, process, and analyze screenplay data.

## Overview

Film Production Assistant is a specialized version of Site2Data focused on screenplay parsing and film production data management. This tool helps filmmakers, production assistants, and film crews to efficiently analyze screenplays, plan shooting schedules, and manage production assets.

## Features

- Screenplay parsing and analysis
- Scene breakdown extraction
- Character and dialogue analysis
- Production asset tracking
- Shooting schedule generation
- Cross-reference characters, locations, and props
- Support for various screenplay formats

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/site2data-film.git
cd site2data-film

# Install dependencies
npm install
```

### Usage

```bash
# Run the application
npm start

# Test screenplay parser
node scripts/test_script_parser.js --screenplay=path/to/screenplay.pdf
```

## Screenplay Parser

The core feature of this application is the screenplay parser, which supports multiple screenplay formats:

1. Standard format with INT/EXT scene headers
2. Location-time-number format (as used in "DRUGA FURIOZA")
3. More formats to be added

The parser extracts:
- Scene numbers and headings
- Locations and time of day
- Characters and dialogue
- Props, vehicles, and extras
- Special requirements

## Documentation

For detailed documentation, please see the [docs](/docs) directory.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 