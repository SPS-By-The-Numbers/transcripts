import * as Constants from 'config/constants';
import Ajv from "ajv";

const ajv = new Ajv();

const Iso639_1Regex = '^[a-z]{2}$';

export const Schemas = {
  // Basic types.
  category: { enum: Constants.ALL_CATEGORIES },
  base64Id: {
    type: "string",
    pattern: "^[a-zA-Z0-9_-]{1,64}$",
  },
  videoId: {
    type: "string",
    pattern: "^[a-zA-Z0-9_-]{11}$",
  },
  'iso639-1': {
    type: "string",
    pattern: Iso639_1Regex,
  },
  whisperXTranscript: {
    type: "object",
    properties: {
      language: { "$ref": "iso639-1" },
      segments: { "$ref": "whisperXSegmentData" },
    },
  },

  whisperXSegmentData: {
    type: "object",
    properties: {
      start: { type: "number"},
      end: { type: "number"},
      text: { type: "string"},
      speaker: { type: "string"},
      words: { "$ref": "whisperXWordData" },
    },
  },

  whisperXWordData: {
    type: "object",
    properties: {
      word: { type: "string"},
      start: { type: "number"},
      end: { type: "number"},
      score: { type: "number"},
      speaker: { type: "string"},
    },
  },

  // Auth check validation is separaet from request object validation since
  // it is used everywhere and we want to send a 401 before doing any work
  // including validating the rest of the request.
  authCodeParam : {
    type: "object",
    properties: {
      user_id: { "$ref": "base64Id" },
      auth_code: { "$ref": "base64Id" },
    },
    required: ["user_id", "auth_code"],
  },

  // Validations for individual request objects.
  uploadTranscriptRequest : {
    type: "object",
    additionalProperties: false,
    required: ["category", "video_id"],

    properties: {
      category: { "$ref": "category" },
      video_id: { "$ref": "videoId" },
      transcripts: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        patternProperties: {
          [Iso639_1Regex]: { "$ref": "whisperXTranscript" }
        },
      },
    },
  },

// TODO: Remove these.
reqAuthCode :{
  type: "object",
  properties: {
    user_id: {
      type: "string",
      pattern: "^[a-zA-Z0-9_-]{1,64}$",
    },
    auth_code: {
      type: "string",
      pattern: "^[a-zA-Z0-9_-]{1,64}$",
    },
  },
  required: ["user_id", "auth_code"],
},
reqCategory: {
  type: "object",
  properties: {
    category: { enum: Constants.ALL_CATEGORIES }
  },
  required: ["category"],
},
reqVid: {
  type: "object",
  properties: {
    vid: {
      type: "string",
      pattern: "^[a-zA-Z0-9_-]{11}$",
    },
  },
  // TODO: Rename video_id
  required: ["vid"],
},
reqVideoId: {
  type: "object",
  properties: {
    video_id: {
      type: "string",
      pattern: "^[a-zA-Z0-9_-]{11}$",
    },
  },
  required: ["video_id"],
}
} as const;

// Request uses user_id/auth_code combo for access.
for (const [name, schema] of Object.entries(Schemas)) {
  ajv.addSchema(schema, name);
}
export type SchemaType = keyof typeof Schemas;

export function validateObj(obj : object, ...schemas : SchemaType[]) : Array<string> {
  const errors = new Array<string>();
  for (const schema of schemas) {
    errors.push(...validateObjOneSchema(obj, schema));
  }
  return errors;
}

function validateObjOneSchema(obj : object, schema : SchemaType) : Array<string> {
  const validate = ajv.getSchema(schema);
  if (!validate) {
    console.error(`Missing schema ${schema}`);
    return ['missing schema'];
  }

  if (!validate(obj)) {
    if (!validate.errors) {
      console.error("Unknown validation error for ", obj);
      return ['unknown error'];
    }
    return validate.errors.map(e => e.message ?? '').filter(m => m.length);
  }

  return [];
}

