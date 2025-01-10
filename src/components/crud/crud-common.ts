import {z} from "zod";

export type SchemaFields<T> = { [K in keyof T]: z.Schema<T[K]>; }

export type CrudSchema<Dto> = z.ZodObject<SchemaFields<Dto>>;

export type Schema<Dto> = z.infer<CrudSchema<Dto>>;


