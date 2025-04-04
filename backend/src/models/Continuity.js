const mongoose = require('mongoose');

const ContinuitySchema = new mongoose.Schema(
  {
    production: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Production',
      required: [true, 'Production ID is required']
    },
    scene: {
      type: String,
      required: [true, 'Scene number is required']
    },
    timeTracking: {
      scriptDay: String,
      timeOfDay: {
        type: String,
        enum: ['day', 'night', 'dawn', 'dusk', 'morning', 'afternoon', 'evening']
      },
      continuousWithScene: [String], // Scene numbers
      timeElapsedFromPreviousScene: String
    },
    recordedDate: {
      type: Date,
      default: Date.now
    },
    shotBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scriptSupervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    characters: [
      {
        characterName: {
          type: String,
          required: true
        },
        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        costume: {
          description: String,
          notes: String,
          images: [String], // URLs to costume images
          continuousWithScene: [String] // Scene numbers
        },
        makeup: {
          description: String,
          notes: String,
          images: [String], // URLs to makeup images
          continuousWithScene: [String] // Scene numbers
        },
        hair: {
          description: String,
          notes: String,
          images: [String], // URLs to hair images
          continuousWithScene: [String] // Scene numbers
        },
        accessories: [
          {
            name: String,
            description: String,
            images: [String], // URLs to accessory images
            continuousWithScene: [String] // Scene numbers
          }
        ],
        ageChanges: {
          description: String,
          notes: String
        },
        emotionalState: String,
        physicalCondition: String,
        notes: String
      }
    ],
    props: [
      {
        name: {
          type: String,
          required: true
        },
        description: String,
        handledBy: [String], // Character names
        position: {
          start: String,
          end: String
        },
        condition: String,
        images: [String], // URLs to prop images
        continuousWithScene: [String], // Scene numbers
        notes: String
      }
    ],
    setDressing: [
      {
        name: {
          type: String,
          required: true
        },
        description: String,
        position: String,
        condition: String,
        images: [String], // URLs to set dressing images
        continuousWithScene: [String], // Scene numbers
        notes: String
      }
    ],
    vehicles: [
      {
        type: {
          type: String,
          required: true
        },
        make: String,
        model: String,
        color: String,
        licensePlate: String,
        condition: String,
        position: {
          start: String,
          end: String
        },
        usedBy: [String], // Character names
        images: [String], // URLs to vehicle images
        continuousWithScene: [String], // Scene numbers
        notes: String
      }
    ],
    location: {
      name: String,
      weatherConditions: String,
      timeOfDay: String,
      lighting: String,
      setChanges: [
        {
          description: String,
          before: [String], // URLs to before images
          after: [String], // URLs to after images
          notes: String
        }
      ],
      images: [String], // URLs to location images
      notes: String
    },
    camera: {
      angles: [String],
      movements: [String],
      lenses: [String],
      filters: [String],
      notes: String
    },
    sound: {
      ambientNoise: String,
      musicInScene: String,
      soundEffects: [String],
      notes: String
    },
    specialEffects: [
      {
        description: String,
        timing: String,
        notes: String,
        images: [String] // URLs to special effects images
      }
    ],
    animalTracking: [
      {
        type: String,
        name: String,
        handler: String,
        actions: String,
        notes: String,
        images: [String] // URLs to animal images
      }
    ],
    sceneFootage: {
      takeNumbers: [String],
      selectedTakes: [String],
      issues: [String],
      notes: String
    },
    dialogueChanges: [
      {
        character: String,
        originalLine: String,
        revisedLine: String,
        reason: String,
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],
    script: {
      revisionPages: [String],
      revisionColor: String,
      revisionDate: Date,
      notes: String
    },
    continuityIssues: [
      {
        description: {
          type: String,
          required: true
        },
        severity: {
          type: String,
          enum: ['minor', 'moderate', 'major'],
          default: 'minor'
        },
        area: {
          type: String,
          enum: [
            'costume',
            'makeup',
            'hair',
            'props',
            'set',
            'vehicle',
            'lighting',
            'weather',
            'time',
            'dialogue',
            'action',
            'other'
          ]
        },
        resolvedStatus: {
          type: Boolean,
          default: false
        },
        resolvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        resolvedDate: Date,
        resolution: String,
        images: {
          issue: [String], // URLs showing the issue
          resolution: [String] // URLs showing the resolution
        },
        notes: String
      }
    ],
    screenshots: [
      {
        imageUrl: {
          type: String,
          required: true
        },
        description: String,
        timestamp: String, // Timecode from footage
        purpose: {
          type: String,
          enum: ['makeup', 'costume', 'set', 'props', 'blocking', 'lighting', 'other']
        },
        tags: [String],
        notes: String
      }
    ],
    notes: {
      general: String,
      forDirector: String,
      forEditor: String,
      forNextScene: String
    },
    aiAnalysis: {
      detectedContinuityIssues: [
        {
          description: String,
          confidence: Number,
          frameReferences: [String]
        }
      ],
      suggestedMatches: [
        {
          fromScene: String,
          toScene: String,
          elements: [String],
          confidence: Number
        }
      ],
      summary: String
    }
  },
  {
    timestamps: true
  }
);

// Index for text search in continuity notes
ContinuitySchema.index({ 'notes.general': 'text', 'continuityIssues.description': 'text' });

// Virtual for checking if there are unresolved continuity issues
ContinuitySchema.virtual('hasUnresolvedIssues').get(function () {
  return this.continuityIssues.some(issue => !issue.resolvedStatus);
});

// Method to find matching continuity elements across scenes
ContinuitySchema.statics.findMatchingElements = async function (productionId, sceneNumber, elementType, elementId) {
  // Implementation would find all continuity records that match the criteria
  // This would help identify where certain props, costumes, etc. appear across scenes
  return this.find({
    production: productionId,
    $or: [
      { scene: sceneNumber },
      { [`${elementType}.continuousWithScene`]: sceneNumber }
    ]
  }).select(`scene ${elementType}`);
};

// Method to check for continuity conflicts between scenes
ContinuitySchema.statics.checkContinuityConflicts = async function (productionId, sceneA, sceneB) {
  const sceneARecord = await this.findOne({ production: productionId, scene: sceneA });
  const sceneBRecord = await this.findOne({ production: productionId, scene: sceneB });
  
  if (!sceneARecord || !sceneBRecord) {
    return { hasConflicts: false, message: 'One or both scenes do not have continuity records.' };
  }
  
  // Implementation would compare elements between scenes to detect potential conflicts
  // This is a complex function that would need to be customized based on specific needs
  
  return {
    hasConflicts: false,
    conflicts: []
  };
};

module.exports = mongoose.model('Continuity', ContinuitySchema); 