import * as Constants from 'config/constants';
import Ajv from "ajv";

export type SchemaType = 'reqAuthCode' | 'reqCategory' | 'reqVid';
const ajv = new Ajv();

const reqAuthCodeSchema = {
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
};
ajv.addSchema(reqAuthCodeSchema, 'reqAuthCode');

const reqCategorySchema = {
  type: "object",
  properties: {
    category: { enum: Constants.ALL_CATEGORIES }
  },
  required: ["category"],
};
ajv.addSchema(reqCategorySchema, 'reqCategory');

const reqVidSchema = {
  type: "object",
  properties: {
    vid: {
      type: "string",
      pattern: "^[a-zA-Z0-9_-]{11}$",
    },
  },
  // TODO: Rename video_id
  required: ["vid"],
};
ajv.addSchema(reqVidSchema, 'reqVid');

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

