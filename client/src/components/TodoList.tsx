import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import request from "graphql-request";
import { graphql } from "../gql";
import type { Todo } from "../gql/graphql";
import { GRAPHQL_ENDPOINT } from "../config";

export const GET_TODOS = graphql(/* GraphQL */ `
  query GetTodos {
    todos {
      id
      name
    }
  }
`);
const DELETE_TODO = graphql(/* GraphQL */ `
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id) {
      errors {
        __typename
        ... on TodoNameTaken {
          message
          path
          existingTodoId
        }
        ... on UserError {
          message
          path
        }
      }
    }
  }
`);

const TodoRow = ({ todo }: { todo: Todo }) => {
  return (
    <tr>
      <td>{todo.name}</td>
      <td>
        <Link className="btn btn-link" to={`/edit/${todo.id}`} state={{ todo }}>
          Edit
        </Link>{" "}
        <DeleteTodo id={todo.id} />
      </td>
    </tr>
  );
};

const DeleteTodo = ({ id }: { id: Todo["id"] }) => {
  const queryClient = useQueryClient();

  const { status, mutate, error, data } = useMutation(
    () => request(GRAPHQL_ENDPOINT, DELETE_TODO, { id }),
    {
      onSuccess: (data) => {
        if (!data.deleteTodo.errors.length)
          queryClient.invalidateQueries(["todos"]);
      },
    }
  );

  switch (status) {
    case "loading":
      return <span>Deleting...</span>;
    case "error":
      return (
        <span>
          `Delete error! $
          {error instanceof Error ? error.message : String(error)}`
        </span>
      );
    case "idle":
    case "success":
      return (
        <>
          <button className="btn btn-link" onClick={() => mutate()}>
            Delete
          </button>
          {data?.deleteTodo.errors.length && (
            <>
              {" "}
              <span style={{ color: "red" }}>
                {data.deleteTodo.errors[0].message}
              </span>
            </>
          )}
        </>
      );
  }
};

export default function TodoList() {
  const { status, error, data } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => request(GRAPHQL_ENDPOINT, GET_TODOS),
  });

  switch (status) {
    case "loading":
      return <p>Loading...</p>;
    case "error":
      return (
        <p>Error : {error instanceof Error ? error.message : String(error)}</p>
      );
    case "success":
      return (
        <div>
          <h3>Record List</h3>
          <table className="table table-striped" style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.todos
                .concat([
                  {
                    id: "600",
                    name: "This todo cannot be found in the db and thus it's not editable or deletable (here for testing errors on delete and caching of null)",
                  },
                ])
                .map((todo) => (
                  <TodoRow todo={todo} key={todo.id} />
                ))}
            </tbody>
          </table>
        </div>
      );
  }
}
