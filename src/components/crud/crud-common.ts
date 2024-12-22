import {z} from "zod";

export type SchemaDefinition<T> = { [K in keyof T]: z.Schema<T[K]>; }

export type CrudSchema<Dto> = z.ZodObject<SchemaDefinition<Dto>>;