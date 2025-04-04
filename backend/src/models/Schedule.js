const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema(
  {
    production: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Production',
      required: [true, 'Production ID is required']
    },
    title: {
      type: String,
      required: [true, 'Schedule title is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['call_sheet', 'shooting_schedule', 'production_calendar', 'daily_schedule', 'weekly_schedule'],
      default: 'call_sheet'
    },
    date: {
      type: Date,
      required: [true, 'Schedule date is required']
    },
    dayNumber: {
      type: Number
    },
    version: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'cancelled'],
      default: 'draft'
    },
    publishedAt: {
      type: Date
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    generalInfo: {
      weatherForecast: {
        temperature: Number,
        conditions: String,
        windSpeed: Number,
        humidity: Number,
        precipitation: Number,
        sunrise: String,
        sunset: String
      },
      emergencyContacts: [
        {
          name: String,
          phone: String,
          role: String
        }
      ],
      notes: String,
      importantAnnouncements: String
    },
    locations: [
      {
        name: {
          type: String,
          required: true
        },
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          zipCode: String
        },
        parkingInfo: String,
        notes: String,
        arrivalTime: String,
        departureTime: String,
        coordinates: {
          latitude: Number,
          longitude: Number
        }
      }
    ],
    shootingBlocks: [
      {
        startTime: {
          type: String,
          required: true
        },
        endTime: {
          type: String,
          required: true
        },
        location: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Location'
        },
        sets: [
          {
            name: String,
            description: String
          }
        ],
        scenes: [
          {
            sceneNumber: {
              type: String,
              required: true
            },
            description: String,
            pages: Number,
            scriptDay: String,
            timeOfDay: {
              type: String,
              enum: ['day', 'night', 'dawn', 'dusk', 'morning', 'afternoon', 'evening']
            },
            setType: {
              type: String,
              enum: ['interior', 'exterior', 'interior/exterior']
            },
            requiredCast: [
              {
                actor: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User'
                },
                character: String,
                callTime: String,
                pickupInfo: String,
                specialRequirements: String
              }
            ],
            specialEquipment: [String],
            specialRequirements: String,
            notes: String,
            status: {
              type: String,
              enum: ['planned', 'completed', 'postponed', 'cancelled'],
              default: 'planned'
            },
            actualStartTime: Date,
            actualEndTime: Date
          }
        ]
      }
    ],
    departmentCallTimes: [
      {
        department: {
          type: String,
          required: true
        },
        callTime: {
          type: String,
          required: true
        },
        location: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Location'
        },
        notes: String
      }
    ],
    crewCallTimes: [
      {
        crew: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        callTime: {
          type: String,
          required: true
        },
        location: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Location'
        },
        notes: String
      }
    ],
    talentCallTimes: [
      {
        talent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        character: String,
        callTime: {
          type: String,
          required: true
        },
        pickupTime: String,
        location: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Location'
        },
        scenes: [String], // Scene numbers
        specialInstructions: String,
        notes: String
      }
    ],
    mealBreaks: [
      {
        mealType: {
          type: String,
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          required: true
        },
        startTime: {
          type: String,
          required: true
        },
        endTime: {
          type: String,
          required: true
        },
        location: String,
        notes: String
      }
    ],
    attachments: [
      {
        fileName: String,
        fileType: String,
        fileSize: Number,
        fileUrl: String,
        uploadedAt: Date,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],
    nextDayPreview: {
      date: Date,
      dayNumber: Number,
      mainLocations: [String],
      startTime: String,
      keyScenes: [String],
      notes: String
    },
    weatherAlerts: [
      {
        alertType: {
          type: String,
          enum: ['warning', 'alert', 'advisory']
        },
        description: String,
        affectedTimeSlots: [String],
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    conflictAlerts: [
      {
        alertType: {
          type: String,
          enum: ['location', 'cast', 'crew', 'equipment', 'time']
        },
        description: String,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        resolved: {
          type: Boolean,
          default: false
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    workingHourAlerts: [
      {
        crewMember: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        description: String,
        alertType: {
          type: String,
          enum: ['approaching_limit', 'exceeded_limit', 'rest_period_violation']
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Virtual for checking if schedule is published
ScheduleSchema.virtual('isPublished').get(function () {
  return this.status === 'published';
});

// Method to check for scheduling conflicts
ScheduleSchema.methods.checkConflicts = function () {
  // Implementation would search for conflicts in location, cast, crew availability
  // This would be a complex function integrating with other data
  return [];
};

// Method to generate PDF version of the schedule
ScheduleSchema.methods.generatePDF = function () {
  // Implementation would format schedule data for PDF generation
  return { pdfBuffer: null, pdfUrl: null };
};

// Static method to find active schedules for a production
ScheduleSchema.statics.findActiveForProduction = async function (productionId) {
  return this.find({
    production: productionId,
    status: { $in: ['draft', 'published'] }
  }).sort({ date: 1 });
};

module.exports = mongoose.model('Schedule', ScheduleSchema); 