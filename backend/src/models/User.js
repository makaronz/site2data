const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    department: {
      type: String,
      enum: [
        'production',
        'direction',
        'camera',
        'lighting',
        'sound',
        'art',
        'costume',
        'makeup',
        'editing',
        'vfx',
        'locations',
        'cast',
        'other'
      ],
      default: 'other'
    },
    phone: {
      type: String,
      trim: true
    },
    profileImage: {
      type: String
    },
    productionCompany: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'pl', 'de', 'fr', 'es'],
      default: 'en'
    },
    lastLogin: {
      type: Date
    },
    pushNotificationsEnabled: {
      type: Boolean,
      default: true
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    productions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Production'
      }
    ],
    devices: [
      {
        deviceId: String,
        deviceType: {
          type: String,
          enum: ['ios', 'android', 'web']
        },
        deviceToken: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();

  try {
    // Hash password with strength of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password matches
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Method to get user's public profile
UserSchema.methods.getProfile = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    department: this.department,
    phone: this.phone,
    profileImage: this.profileImage,
    productionCompany: this.productionCompany,
    preferredLanguage: this.preferredLanguage,
    fullName: this.fullName
  };
};

module.exports = mongoose.model('User', UserSchema); 