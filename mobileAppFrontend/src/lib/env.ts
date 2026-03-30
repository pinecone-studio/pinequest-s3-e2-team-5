export const env = {
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "",
  graphqlUrl: process.env.EXPO_PUBLIC_GRAPHQL_URL?.trim() ?? "",
};
