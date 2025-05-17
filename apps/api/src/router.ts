import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Context } from './context';
import { MinioClient, MINIO_BUCKET, redisClient, STREAM_PDF_CHUNKS, jobsCollection } from './clients'; // Import clients
// import { Job, JobStatus } from '../../packages/types/src'; // Import shared types (tymczasowo zakomentowane)
import { randomUUID } from 'crypto'; // For generating job IDs
const mongoose = require('mongoose'); // Używamy require dla mongoose, zgodnie z wcześniejszymi ustaleniami

// Import modeli i interfejsów dla naszych encji
import { Scene, IScene, LightingInfo as ILightingInfo, ProductionChecklist as IProductionChecklist } from './models/sceneModel'; // Dodano ILightingInfo i IProductionChecklist
import { Character, ICharacter } from './models/characterModel'; // Import Character model
import { Location, ILocation } from './models/locationModel'; // Import Location model
import { Prop, IProp } from './models/propModel'; // Import Prop model
import { Vehicle, IVehicle } from './models/vehicleModel'; // Import Vehicle model
import { Weapon, IWeapon } from './models/weaponModel'; // Import Weapon model

// Avoid exporting the entire t object
// since it's not very descriptive.创
// Instead, export reusable procedures and adapters.
const t = initTRPC.context<Context>().create();

// --- Schematy Zod dla walidacji ID (MUSI być przed pierwszym użyciem) ---
const ObjectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Nieprawidłowy format ObjectId",
});

// --- Definicje Schematów Zod dla updateScene ---
const LightingInfoSchemaZod = z.object({
  variant: z.enum(['day_natural', 'evening_natural', 'night_natural', 'artificial', 'mixed']).nullable().optional(),
  needs_extra_sources: z.boolean().optional(),
  extra_sources_details: z.string().optional(),
  emotional_note: z.string().optional(),
});

const ProductionChecklistSchemaZod = z.object({
  has_risk: z.boolean().optional(),
  has_children: z.boolean().optional(),
  needs_permit: z.boolean().optional(),
  has_animals: z.boolean().optional(),
  is_night_scene: z.boolean().optional(),
});

const SceneUpdateInputSchema = z.object({
  scene_number: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  description: z.string().optional(),
  page_number: z.number().optional(),
  int_ext: z.enum(['INT', 'EXT']).nullable().optional(),
  location_id: ObjectIdSchema.optional(),
  day_time: z.enum(['DAY', 'NIGHT', 'DUSK', 'DAWN', 'OTHER']).nullable().optional(),
  characters_ids: z.array(ObjectIdSchema).optional(),
  props_ids: z.array(ObjectIdSchema).optional(),
  vehicles_ids: z.array(ObjectIdSchema).optional(),
  weapons_ids: z.array(ObjectIdSchema).optional(),
  estimated_length_tag: z.enum(['short', 'medium', 'long']).nullable().optional(),
  scene_tags: z.array(z.string()).optional(),
  lighting_info: LightingInfoSchemaZod.optional(),
  risk_tags: z.array(z.string()).optional(),
  production_checklist: ProductionChecklistSchemaZod.optional(),
  mood: z.string().optional(),
});

// --- Definicje Schematów Zod dla Character ---
const RelationshipSchemaZod = z.object({
  character_id: ObjectIdSchema,
  relationship_type: z.string(),
  description: z.string().optional(),
});

const CharacterUpdateInputSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  character_arc_notes: z.string().optional(),
  relationships: z.array(RelationshipSchemaZod).optional(),
  ai_notes: z.string().optional(),
  user_notes: z.string().optional(),
});

// --- Definicje Schematów Zod dla Location ---
const LocationUpdateInputSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['interior', 'exterior', 'interior_exterior', 'other']).nullable().optional(),
  address_details: z.string().optional(),
  technical_requirements: z.string().optional(),
  logistic_notes: z.string().optional(),
  ai_notes: z.string().optional(),
  user_notes: z.string().optional(),
});

// --- Definicje Schematów Zod dla Prop ---
const PropUpdateInputSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().optional(),
  availability_status: z.enum(['available', 'to_source', 'in_making', 'problematic']).nullable().optional(),
  source_details: z.string().optional(),
  visual_references: z.array(z.string()).optional(),
  placement_notes: z.string().optional(),
  ai_notes: z.string().optional(),
  user_notes: z.string().optional(),
});

// --- Definicje Schematów Zod dla Vehicle ---
const VehicleUpdateInputSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  visual_characteristics: z.string().optional(),
  availability_status: z.enum(['available', 'to_source', 'rented', 'unavailable']).nullable().optional(),
  source_details: z.string().optional(),
  action_props: z.string().optional(),
  ai_notes: z.string().optional(),
  user_notes: z.string().optional(),
});

// --- Definicje Schematów Zod dla Weapon ---
const WeaponUpdateInputSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  caliber: z.string().optional(),
  source_details: z.string().optional(),
  safety_notes: z.string().optional(),
  visual_references: z.array(z.string()).optional(),
  ai_notes: z.string().optional(),
  user_notes: z.string().optional(),
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Define procedures here
export const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  requestPresignedUrl: publicProcedure
    .input(z.object({
      filename: z.string().refine(name => name.toLowerCase().endsWith('.pdf'), {
        message: 'Dozwolony jest tylko format PDF.',
      }),
    }))
    .mutation(async ({ input }) => {
      const objectKey = `uploads/${randomUUID()}-${input.filename}`;
      const expirySeconds = 60 * 5; // 5 minutes validity

      try {
        const presignedUrl = await MinioClient.presignedPutObject(
          MINIO_BUCKET,
          objectKey,
          expirySeconds
        );
        console.log(`Generated presigned URL for: ${objectKey}`);
        return { success: true, url: presignedUrl, objectKey };
      } catch (error) {
        console.error('Failed to generate presigned URL:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Nie udało się wygenerować adresu do uploadu.',
          cause: error,
        });
      }
    }),

  notifyUploadComplete: publicProcedure
    .input(z.object({ objectKey: z.string() }))
    .mutation(async ({ input }) => {
      const jobId = `job-${randomUUID()}`;
      const now = new Date();

      const newJob: any = {
        jobId,
        status: 'PENDING' as any,
        objectKey: input.objectKey,
        createdAt: now,
        updatedAt: now,
        // sceneCount and processedScenes will be updated by workers
      };

      try {
        // 1. Insert job into MongoDB
        const collection = jobsCollection();
        const insertResult = await collection.insertOne(newJob);
        if (!insertResult.acknowledged) {
          // This case should ideally not happen if MongoDB is running correctly
          // but good to have a specific error for it.
          console.error(`Failed to insert job ${jobId} into database, insert not acknowledged.`);
          throw new Error('Failed to insert job into database, operation not acknowledged.');
        }
        console.log(`Created job ${jobId} in MongoDB.`);

        try {
          // 2. Publish message to Redis Stream to trigger chunking
          const streamMessage = [
            'jobId', jobId,
            'objectKey', input.objectKey,
          ];
          await redisClient.xadd(STREAM_PDF_CHUNKS, '*', ...streamMessage);
          console.log(`Published job ${jobId} to stream ${STREAM_PDF_CHUNKS}.`);
        } catch (redisError) {
          // If Redis publish fails after successful DB insert, attempt to clean up the job document
          console.error(`Failed to publish job ${jobId} to Redis stream after DB insert. Attempting cleanup.`, redisError);
          try {
            await collection.deleteOne({ jobId });
            console.log(`Successfully deleted job ${jobId} from MongoDB after Redis publish failure.`);
          } catch (cleanupError) {
            console.error(`CRITICAL: Failed to delete job ${jobId} from MongoDB after Redis publish failure. Manual cleanup required.`, cleanupError);
            // Log critical error, as we now have an orphaned job that won't be processed
          }
          // Re-throw the original Redis error or a new error indicating publish failure
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Nie udało się opublikować zadania do przetworzenia po zapisie do bazy danych.',
            cause: redisError,
          });
        }

        return { success: true, jobId };

      } catch (error: any) {
        // Catch errors from DB insert, Redis publish (if not caught by inner try-catch), or other unexpected errors
        console.error(`Failed to process upload notification for ${input.objectKey}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Nie udało się rozpocząć przetwarzania pliku.',
          cause: error,
        });
      }
    }),

  // --- Procedury dla Scen ---
  getScenesByScriptId: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const scenes = await Scene.find({ script_id: new mongoose.Types.ObjectId(input.scriptId) }).sort({ scene_number: 1 });
        if (!scenes || scenes.length === 0) {
          // W tRPC zwykle zwracamy pustą tablicę lub null, a nie rzucamy błędem 404 bezpośrednio,
          // chyba że to faktycznie błąd. Klient może obsłużyć brak danych.
          return []; 
        }
        return scenes;
      } catch (error: any) {
        console.error('[getScenesByScriptId] Błąd:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania scen.',
          cause: error,
        });
      }
    }),

  getSceneById: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema, sceneId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const scene = await Scene.findOne({ _id: new mongoose.Types.ObjectId(input.sceneId), script_id: new mongoose.Types.ObjectId(input.scriptId) });
        if (!scene) {
          // Podobnie, możemy zwrócić null lub rzucić specyficzny błąd tRPC NOT_FOUND
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono sceny.',
          });
        }
        return scene;
      } catch (error: any) {
        console.error('[getSceneById] Błąd:', error);
        if (error instanceof TRPCError && error.code === 'NOT_FOUND') throw error; // Przekaż dalej błąd NOT_FOUND
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania sceny.',
          cause: error,
        });
      }
    }),

  updateScene: publicProcedure
    .input(z.object({
      scriptId: ObjectIdSchema,
      sceneId: ObjectIdSchema,
      data: SceneUpdateInputSchema, 
    }))
    .mutation(async ({ input }) => {
      const { sceneId, scriptId, data } = input;

      // Sprawdzenie, czy dane do aktualizacji nie są puste
      if (Object.keys(data).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Brak danych do aktualizacji.',
        });
      }

      try {
        // Logika `allowedUpdates` jest teraz częściowo obsługiwana przez schemat Zod (SceneUpdateInputSchema)
        // Mongoose również nie zaktualizuje pól, których nie ma w schemacie.
        const updatedScene = await Scene.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(sceneId), script_id: new mongoose.Types.ObjectId(scriptId) },
          { $set: data as Partial<IScene> }, // Użycie Partial<IScene> dla lepszego typowania
          { new: true, runValidators: true }
        );

        if (!updatedScene) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono sceny do aktualizacji lub nie należy ona do tego scenariusza.',
          });
        }
        return updatedScene;
      } catch (error: any) {
        console.error('[updateScene] Błąd:', error);
        if (error instanceof mongoose.Error.ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Błąd walidacji Mongoose.',
            cause: error.errors, // Przekazanie błędów walidacji
          });
        }
        if (error instanceof TRPCError) throw error; // Przekaż dalej inne błędy tRPC
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas aktualizacji sceny.',
          cause: error,
        });
      }
    }),

  // --- Procedury dla Character ---
  getCharactersByScriptId: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const characters = await Character.find({ script_id: new mongoose.Types.ObjectId(input.scriptId) }).sort({ name: 1 });
        if (!characters || characters.length === 0) {
          // W tRPC zwykle zwracamy pustą tablicę lub null, a nie rzucamy błędem 404 bezpośrednio,
          // chyba że to faktycznie błąd. Klient może obsłużyć brak danych.
          return []; 
        }
        return characters;
      } catch (error: any) {
        console.error('[getCharactersByScriptId] Błąd:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania postaci.',
          cause: error,
        });
      }
    }),

  getCharacterById: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema, characterId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const character = await Character.findOne({ _id: new mongoose.Types.ObjectId(input.characterId), script_id: new mongoose.Types.ObjectId(input.scriptId) });
        if (!character) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono postaci.',
          });
        }
        return character;
      } catch (error: any) {
        console.error('[getCharacterById] Błąd:', error);
        if (error instanceof TRPCError && error.code === 'NOT_FOUND') throw error; // Przekaż dalej błąd NOT_FOUND
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania postaci.',
          cause: error,
        });
      }
    }),

  updateCharacter: publicProcedure
    .input(z.object({
      scriptId: ObjectIdSchema,
      characterId: ObjectIdSchema,
      data: CharacterUpdateInputSchema, 
    }))
    .mutation(async ({ input }) => {
      const { characterId, scriptId, data } = input;

      // Sprawdzenie, czy dane do aktualizacji nie są puste
      if (Object.keys(data).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Brak danych do aktualizacji.',
        });
      }

      try {
        // Logika `allowedUpdates` jest teraz częściowo obsługiwana przez schemat Zod (CharacterUpdateInputSchema)
        // Mongoose również nie zaktualizuje pól, których nie ma w schemacie.
        const updatedCharacter = await Character.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(characterId), script_id: new mongoose.Types.ObjectId(scriptId) },
          { $set: data as Partial<ICharacter> }, // Użycie Partial<ICharacter> dla lepszego typowania
          { new: true, runValidators: true }
        );

        if (!updatedCharacter) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono postaci do aktualizacji lub nie należy ona do tego scenariusza.',
          });
        }
        return updatedCharacter;
      } catch (error: any) {
        console.error('[updateCharacter] Błąd:', error);
        if (error instanceof mongoose.Error.ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Błąd walidacji Mongoose.',
            cause: error.errors, // Przekazanie błędów walidacji
          });
        }
        if (error instanceof TRPCError) throw error; // Przekaż dalej inne błędy tRPC
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas aktualizacji postaci.',
          cause: error,
        });
      }
    }),

  // --- Procedury dla Location ---
  getLocationsByScriptId: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const locations = await Location.find({ script_id: new mongoose.Types.ObjectId(input.scriptId) }).sort({ name: 1 });
        if (!locations || locations.length === 0) {
          return []; 
        }
        return locations;
      } catch (error: any) {
        console.error('[getLocationsByScriptId] Błąd:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania lokacji.',
          cause: error,
        });
      }
    }),

  getLocationById: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema, locationId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const location = await Location.findOne({ _id: new mongoose.Types.ObjectId(input.locationId), script_id: new mongoose.Types.ObjectId(input.scriptId) });
        if (!location) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono lokacji.',
          });
        }
        return location;
      } catch (error: any) {
        console.error('[getLocationById] Błąd:', error);
        if (error instanceof TRPCError && error.code === 'NOT_FOUND') throw error; // Przekaż dalej błąd NOT_FOUND
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania lokacji.',
          cause: error,
        });
      }
    }),

  updateLocation: publicProcedure
    .input(z.object({
      scriptId: ObjectIdSchema,
      locationId: ObjectIdSchema,
      data: LocationUpdateInputSchema, 
    }))
    .mutation(async ({ input }) => {
      const { locationId, scriptId, data } = input;

      // Sprawdzenie, czy dane do aktualizacji nie są puste
      if (Object.keys(data).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Brak danych do aktualizacji.',
        });
      }

      try {
        const updatedLocation = await Location.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(locationId), script_id: new mongoose.Types.ObjectId(scriptId) },
          { $set: data as Partial<ILocation> },
          { new: true, runValidators: true }
        );

        if (!updatedLocation) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono lokacji do aktualizacji lub nie należy ona do tego scenariusza.',
          });
        }
        return updatedLocation;
      } catch (error: any) {
        console.error('[updateLocation] Błąd:', error);
        if (error instanceof mongoose.Error.ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Błąd walidacji Mongoose.',
            cause: error.errors,
          });
        }
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas aktualizacji lokacji.',
          cause: error,
        });
      }
    }),

  // --- Procedury dla Prop ---
  getPropsByScriptId: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const props = await Prop.find({ script_id: new mongoose.Types.ObjectId(input.scriptId) }).sort({ name: 1 });
        if (!props || props.length === 0) {
          return []; 
        }
        return props;
      } catch (error: any) {
        console.error('[getPropsByScriptId] Błąd:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania rekwizytów.',
          cause: error,
        });
      }
    }),

  getPropById: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema, propId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const prop = await Prop.findOne({ _id: new mongoose.Types.ObjectId(input.propId), script_id: new mongoose.Types.ObjectId(input.scriptId) });
        if (!prop) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono rekwizytu.',
          });
        }
        return prop;
      } catch (error: any) {
        console.error('[getPropById] Błąd:', error);
        if (error instanceof TRPCError && error.code === 'NOT_FOUND') throw error; // Przekaż dalej błąd NOT_FOUND
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania rekwizytu.',
          cause: error,
        });
      }
    }),

  updateProp: publicProcedure
    .input(z.object({
      scriptId: ObjectIdSchema,
      propId: ObjectIdSchema,
      data: PropUpdateInputSchema, 
    }))
    .mutation(async ({ input }) => {
      const { propId, scriptId, data } = input;

      // Sprawdzenie, czy dane do aktualizacji nie są puste
      if (Object.keys(data).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Brak danych do aktualizacji.',
        });
      }

      try {
        const updatedProp = await Prop.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(propId), script_id: new mongoose.Types.ObjectId(scriptId) },
          { $set: data as Partial<IProp> },
          { new: true, runValidators: true }
        );

        if (!updatedProp) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono rekwizytu do aktualizacji lub nie należy on do tego scenariusza.',
          });
        }
        return updatedProp;
      } catch (error: any) {
        console.error('[updateProp] Błąd:', error);
        if (error instanceof mongoose.Error.ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Błąd walidacji Mongoose.',
            cause: error.errors,
          });
        }
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas aktualizacji rekwizytu.',
          cause: error,
        });
      }
    }),

  // --- Procedury dla Vehicle ---
  getVehiclesByScriptId: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const vehicles = await Vehicle.find({ script_id: new mongoose.Types.ObjectId(input.scriptId) }).sort({ name: 1 });
        if (!vehicles || vehicles.length === 0) {
          return []; 
        }
        return vehicles;
      } catch (error: any) {
        console.error('[getVehiclesByScriptId] Błąd:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania pojazdów.',
          cause: error,
        });
      }
    }),

  getVehicleById: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema, vehicleId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const vehicle = await Vehicle.findOne({ _id: new mongoose.Types.ObjectId(input.vehicleId), script_id: new mongoose.Types.ObjectId(input.scriptId) });
        if (!vehicle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono pojazdu.',
          });
        }
        return vehicle;
      } catch (error: any) {
        console.error('[getVehicleById] Błąd:', error);
        if (error instanceof TRPCError && error.code === 'NOT_FOUND') throw error; // Przekaż dalej błąd NOT_FOUND
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania pojazdu.',
          cause: error,
        });
      }
    }),

  updateVehicle: publicProcedure
    .input(z.object({
      scriptId: ObjectIdSchema,
      vehicleId: ObjectIdSchema,
      data: VehicleUpdateInputSchema, 
    }))
    .mutation(async ({ input }) => {
      const { vehicleId, scriptId, data } = input;

      // Sprawdzenie, czy dane do aktualizacji nie są puste
      if (Object.keys(data).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Brak danych do aktualizacji.',
        });
      }

      try {
        const updatedVehicle = await Vehicle.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(vehicleId), script_id: new mongoose.Types.ObjectId(scriptId) },
          { $set: data as Partial<IVehicle> },
          { new: true, runValidators: true }
        );

        if (!updatedVehicle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono pojazdu do aktualizacji lub nie należy on do tego scenariusza.',
          });
        }
        return updatedVehicle;
      } catch (error: any) {
        console.error('[updateVehicle] Błąd:', error);
        if (error instanceof mongoose.Error.ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Błąd walidacji Mongoose.',
            cause: error.errors,
          });
        }
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas aktualizacji pojazdu.',
          cause: error,
        });
      }
    }),

  // --- Procedury dla Weapon ---
  getWeaponsByScriptId: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const weapons = await Weapon.find({ script_id: new mongoose.Types.ObjectId(input.scriptId) }).sort({ name: 1 });
        if (!weapons || weapons.length === 0) {
          return []; 
        }
        return weapons;
      } catch (error: any) {
        console.error('[getWeaponsByScriptId] Błąd:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania broni.',
          cause: error,
        });
      }
    }),

  getWeaponById: publicProcedure
    .input(z.object({ scriptId: ObjectIdSchema, weaponId: ObjectIdSchema }))
    .query(async ({ input }) => {
      try {
        const weapon = await Weapon.findOne({ _id: new mongoose.Types.ObjectId(input.weaponId), script_id: new mongoose.Types.ObjectId(input.scriptId) });
        if (!weapon) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono broni.',
          });
        }
        return weapon;
      } catch (error: any) {
        console.error('[getWeaponById] Błąd:', error);
        if (error instanceof TRPCError && error.code === 'NOT_FOUND') throw error; // Przekaż dalej błąd NOT_FOUND
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania broni.',
          cause: error,
        });
      }
    }),

  updateWeapon: publicProcedure
    .input(z.object({
      scriptId: ObjectIdSchema,
      weaponId: ObjectIdSchema,
      data: WeaponUpdateInputSchema, 
    }))
    .mutation(async ({ input }) => {
      const { weaponId, scriptId, data } = input;

      // Sprawdzenie, czy dane do aktualizacji nie są puste
      if (Object.keys(data).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Brak danych do aktualizacji.',
        });
      }

      try {
        const updatedWeapon = await Weapon.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(weaponId), script_id: new mongoose.Types.ObjectId(scriptId) },
          { $set: data as Partial<IWeapon> },
          { new: true, runValidators: true }
        );

        if (!updatedWeapon) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono broni do aktualizacji lub nie należy ona do tego scenariusza.',
          });
        }
        return updatedWeapon;
      } catch (error: any) {
        console.error('[updateWeapon] Błąd:', error);
        if (error instanceof mongoose.Error.ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Błąd walidacji Mongoose.',
            cause: error.errors,
          });
        }
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas aktualizacji broni.',
          cause: error,
        });
      }
    }),

  // TODO: Add getJobDetails procedure
  // getJobDetails: publicProcedure
  //   .input(z.object({ jobId: z.string() }))
  //   .query(async ({ input }) => {
  //     // Logic to fetch job details from MongoDB
  //     console.log('Fetching details for job:', input.jobId);
  //     // Replace with actual DB logic
  //     return { jobId: input.jobId, status: 'COMPLETED', /* other details */ };
  //   }),

  getJobStatus: publicProcedure // Nowa procedura
    .input(z.object({ jobId: z.string().startsWith('job-', { message: "Nieprawidłowy format jobId"}) }))
    .query(async ({ input }) => {
      try {
        const collection = jobsCollection();
        const job = await collection.findOne({ jobId: input.jobId });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Nie znaleziono zadania o ID: ${input.jobId}`,
          });
        }
        // Upewnij się, że typ zwracany jest zgodny z oczekiwaniami frontendu (interfejs Job)
        // W szczególności upewnij się, że status jest typu JobStatus
        return job as any; 
      } catch (error: any) {
        console.error(`[getJobStatus] Błąd podczas pobierania statusu zadania ${input.jobId}:`, error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Błąd serwera podczas pobierania statusu zadania.',
          cause: error,
        });
      }
    }),

    // TODO: Add searchScenes procedure
  // searchScenes: publicProcedure
  //   .input(z.object({ query: z.string() }))
  //   .query(async ({ input }) => {
  //     // Logic to search Weaviate
  //     console.log('Searching scenes for query:', input.query);
  //     // Replace with actual Weaviate logic
  //     return { results: [{ sceneId: 'scene1', text: 'Example scene...' }] };
  //   }),
});

// Export type definition of API
export type AppRouter = typeof appRouter; 