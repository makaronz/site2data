const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    production: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Production',
      required: [true, 'Production ID is required']
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
    type: {
      type: String,
      enum: [
        'script',
        'call_sheet',
        'crew_list',
        'cast_list',
        'location_agreement',
        'talent_agreement',
        'budget',
        'shooting_schedule',
        'storyboard',
        'shotlist',
        'equipment_list',
        'continuity_notes',
        'dailies_report',
        'production_report',
        'contract',
        'legal',
        'other'
      ],
      required: [true, 'Document type is required']
    },
    subtype: {
      type: String,
      trim: true
    },
    version: {
      type: String,
      default: '1.0'
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'final', 'archived'],
      default: 'draft'
    },
    fileName: {
      type: String
    },
    fileSize: {
      type: Number
    },
    fileType: {
      type: String
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    thumbnailUrl: {
      type: String
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader information is required']
    },
    description: {
      type: String,
      trim: true
    },
    tags: [String],
    category: {
      type: String,
      trim: true
    },
    linkedTo: [
      {
        entityType: {
          type: String,
          enum: ['schedule', 'scene', 'location', 'equipment', 'cast', 'crew', 'production']
        },
        entityId: {
          type: mongoose.Schema.Types.ObjectId
        }
      }
    ],
    accessLevel: {
      type: String,
      enum: ['public', 'team', 'department', 'restricted'],
      default: 'team'
    },
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    allowedDepartments: [String],
    allowedRoles: [String],
    isTemplate: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    },
    extractedText: {
      type: String
    },
    aiSummary: {
      type: String
    },
    aiKeywords: [String],
    aiCategories: [String],
    reviewStatus: {
      reviewedBy: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'changes_requested']
          },
          comments: String,
          timestamp: {
            type: Date,
            default: Date.now
          }
        }
      ],
      approvedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    versions: [
      {
        versionNumber: String,
        fileUrl: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        uploadedAt: Date,
        changes: String
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Index for text search
DocumentSchema.index({ title: 'text', description: 'text', extractedText: 'text', tags: 'text' });

// Virtual property for document age
DocumentSchema.virtual('documentAge').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to create a new version of the document
DocumentSchema.methods.createNewVersion = function (fileUrl, versionNumber, uploadedBy, changes) {
  const newVersion = {
    versionNumber: versionNumber || String(parseFloat(this.version) + 0.1).toFixed(1),
    fileUrl,
    uploadedBy,
    uploadedAt: new Date(),
    changes: changes || ''
  };

  this.versions.push(newVersion);
  this.version = newVersion.versionNumber;
  this.fileUrl = fileUrl;
  
  return this.save();
};

// Static method to find documents by production and type
DocumentSchema.statics.findByProductionAndType = function (productionId, type) {
  return this.find({
    production: productionId,
    type,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to find accessible documents for a user
DocumentSchema.statics.findAccessibleForUser = async function (user, productionId) {
  const query = {
    production: productionId,
    isDeleted: false,
    $or: [
      { accessLevel: 'public' },
      { allowedUsers: user._id }
    ]
  };

  // Add team-level access if user is part of the production team
  if (user.productions.includes(productionId)) {
    query.$or.push({ accessLevel: 'team' });
  }

  // Add department-level access
  if (user.department) {
    query.$or.push({
      accessLevel: 'department',
      allowedDepartments: user.department
    });
  }

  // Add role-level access
  if (user.role) {
    query.$or.push({
      allowedRoles: user.role
    });
  }

  return this.find(query).sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Document', DocumentSchema); 