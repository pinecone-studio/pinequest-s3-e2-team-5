import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "./graphql/schemas";
import { resolvers } from "./graphql/resolvers";


export const yoga = createYoga({
    schema: createSchema({
        typeDefs,
        resolvers
    })
})