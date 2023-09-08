import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { graphql } from "../gql";
import type { Todo } from "../gql/graphql";
import { isTodoValidationError } from "../errors";

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
      id
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
  const [deleteTodo, { loading, error: apolloError }] = useMutation(
    DELETE_TODO,
    {
      variables: { id },
      refetchQueries: [GET_TODOS],
    }
  );

  if (loading) return <span>Deleting...</span>;

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
      {apolloError && (
        <>
          {" "}
          <span style={{ color: "red" }}>
            {apolloError.graphQLErrors.length
              ? isTodoValidationError(apolloError.graphQLErrors[0])
                ? apolloError.graphQLErrors[0].extensions.errors[0].message
                : apolloError.graphQLErrors[0].message
              : apolloError.message}
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
