const { GraphQLServer, PubSub } = require("graphql-yoga");

const messages = [];

const typeDefs = `
  type Message {
    id: ID!
    user: String!
    content: String!
  }

  type Query {
    messages: [Message!]
  }

  type Mutation {
    postMessage(user: String!, content: String!): ID!
    deleteMessages: [Message!]
  }

  type Subscription {
    messages: [Message!]
  }
`;

const subscribers = [];
const onMessagesUpDate = (fn) => subscribers.push(fn);

const resolvers = {
  Query: {
    messages: () => messages,
  },
  Mutation: {
    postMessage: (parent, { user, content }) => {
      const id = messages.length + 1;
      console.log(parent);
      messages.push({ id, content, user });
      subscribers.forEach((fn) => fn());
      return id;
    },
    deleteMessages: () => {
      messages.splice(0, messages.length);
      subscribers.forEach((fn) => fn());
    },
  },
  Subscription: {
    messages: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpDate(() => pubsub.publish(channel, { messages }));
        setTimeout(() => {
          return pubsub.publish(channel, { messages });
        }, 0);
        return pubsub.asyncIterator(channel);
      },
    },
  },
};
const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start((options) => {
  console.log(`Server started on ${options.port}`, { options });
});
