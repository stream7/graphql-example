import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import { graphql } from "../gql";
import type { Todo } from "../gql/graphql";

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
  const apolloClient = useApolloClient();
  const [deleteTodo, { data, loading, error }] = useMutation(DELETE_TODO, {
    variables: { id },
    onCompleted: (data) => {
      if (!data.deleteTodo.errors.length) {
        apolloClient.cache.evict({ fieldName: "todos" });
      }
    },
  });

  if (loading) return <span>Deleting...</span>;
  if (error) return <span>`Delete error! ${error.message}`</span>;

  return (
    <>
      <button
        className="btn btn-link"
        onClick={() => {
          deleteTodo({
            variables: { id },
          }).catch(console.error); // apollo client con: needs a catch if you don't provide an onError callback (on the hook or the call) :(
        }}
      >
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
};

export default function TodoList() {
  const { loading, error, data } = useQuery(GET_TODOS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  // apollo client con: invalid state
  if (!data)
    throw new Error(
      "Invalid state! no data, no error, no loading. react-query returns a much better result type with discriminated union"
    );

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
