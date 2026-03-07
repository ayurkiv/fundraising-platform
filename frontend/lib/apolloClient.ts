import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const graphUrl = process.env.NEXT_PUBLIC_GRAPH_URL;

if (!graphUrl) {
  throw new Error("NEXT_PUBLIC_GRAPH_URL is missing in .env.local");
}

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: graphUrl }),
  cache: new InMemoryCache(),
});
