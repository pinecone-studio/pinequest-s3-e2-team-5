import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../server";

export function unauthorizedError() {
	return new GraphQLError("Unauthorized", {
		extensions: {
			code: "UNAUTHORIZED",
		},
	});
}

export function notFoundError(message: string) {
	return new GraphQLError(message, {
		extensions: {
			code: "NOT_FOUND",
		},
	});
}

export function badUserInputError(message: string) {
	return new GraphQLError(message, {
		extensions: {
			code: "BAD_USER_INPUT",
		},
	});
}

export function assertAuthenticated(context: GraphQLContext) {
	if (!context.auth.userId || !context.auth.isAuthenticated) {
		throw unauthorizedError();
	}

	return context.auth.userId;
}
