import type { Resolvers, Todo } from "../generated/graphql-types";

const db: Record<string, Todo | undefined> = {};

export type RevertToResolveFn<T> = NonNullable<
  T extends { resolve: any } ? never : T
>;

type DeleteTodo = RevertToResolveFn<Resolvers<{}>["Mutation"]["deleteTodo"]>;

let id = 0;
const getNextId = () => `${++id}`;

const resolvers: Resolvers<{}> = {
  Query: {
    todo(_, { id }) {
      return db[id] || null;
    },
    todos() {
      return Object.values(db);
    },
  },
  Mutation: {
    createTodo(_, { name }) {
      const existingTodo = Object.values(db).find((todo) => todo.name === name);

      if (existingTodo) {
        return {
          errors: [
            {
              __typename: "TodoNameTaken",
              message: "Todo name taken",
              path: "name",
              existingTodoId: existingTodo.id,
            },
          ],
        };
      }

      if (name) {
        const id = getNextId();
        const todo = { id, name };
        db[id] = todo;
        return { todo, errors: [] };
      }

      return {
        errors: [
          {
            __typename: "UserError",
            message: "Name is required",
            path: "name",
          },
        ],
      };
    },
    updateTodo(_, { id, name }) {
      const todo = db[id];

      if (name.trim() === "")
        return {
          errors: [
            {
              __typename: "UserError",
              message: "Name is required",
              path: "name",
            },
          ],
        };

      const existingTodo = Object.values(db).find((todo) => todo.name === name);
      if (existingTodo && existingTodo.id !== id) {
        return {
          errors: [
            {
              __typename: "TodoNameTaken",
              message: "Todo name taken",
              path: "name",
              existingTodoId: existingTodo.id,
            },
          ],
        };
      }

      if (todo) {
        todo.name = name;
        return { todo, errors: [] };
      }

      return {
        errors: [
          { __typename: "UserError", message: "Todo not found", path: "id" },
        ],
      };
    },
    deleteTodo: (_, { id }) => {
      const todo = db[id];

      if (todo) {
        delete db[id];
        return {
          errors: [],
        };
      }

      return {
        errors: [
          {
            __typename: "UserError",
            message: "Todo not found",
            path: "id",
          },
        ],
      };
    },
  },
};

export default resolvers;
