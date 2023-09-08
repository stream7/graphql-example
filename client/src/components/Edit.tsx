import { useMutation, useQuery } from "@apollo/client";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { graphql } from "../gql";
import type { Todo } from "../gql/graphql";
import { isTodoValidationError, TodoError } from "../errors";
import { Link } from "react-router-dom";
import { GET_TODOS } from "./TodoList";

const GET_TODO = graphql(/* GraphQL */ `
  query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      name
    }
  }
`);

const UPDATE_TODO = graphql(/* GraphQL */ `
  mutation UpdateTodo($id: ID!, $name: String!) {
    updateTodo(id: $id, name: $name) {
      id
      name
    }
  }
`);

export default function Edit() {
  const params = useParams();
  const { id } = params;

  if (!id) throw new Error("Missing id");

  const { loading, error, data } = useQuery(GET_TODO, { variables: { id } });

  const [form, setForm] = useState({
    name: data?.todo?.name || "",
  });
  const [errors, setErrors] = useState<
    Record<keyof Todo, TodoError | undefined>
  >({} as Record<keyof Todo, TodoError | undefined>);
  const navigate = useNavigate();
  const [updateTodo] = useMutation(UPDATE_TODO, {
    refetchQueries: [GET_TODOS],
  });

  useEffect(() => {
    if (data && data.todo) setForm({ name: data.todo.name });
  }, [data]);

  if (loading) return <p>Loading...</p>;
  if (error)
    return <p>Error loading todo: {error?.message || "unknown error"}</p>;

  if (!data?.todo) return <p>No todo found for id {id}</p>;

  // These methods will update the state properties.
  function updateForm(value: Record<string, string>) {
    return setForm((prev) => {
      return { ...prev, ...value };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!id) throw new Error("Missing id");

    await updateTodo({
      variables: {
        id,
        name: form.name,
      },
      onCompleted: () => {
        setForm({ name: "" });
        navigate("/");
      },
      onError: (apolloError) => {
        console.log("apolloError on update", apolloError);
        const error = apolloError.graphQLErrors[0];
        if (isTodoValidationError(error)) {
          setErrors(
            error.extensions.errors.reduce((acc, error) => {
              return { ...acc, [error.path]: error };
            }, {} as Record<keyof Todo, TodoError | undefined>)
          );
        } else {
          alert(apolloError.message);
        }
      },
    });
  }

  return (
    <div>
      <h3>Update Record</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name: </label>
          <input
            type="text"
            className="form-control"
            id="name"
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            autoFocus
          />
          {errors.name && (
            <>
              <br />
              <span style={{ color: "red" }}>
                {errors.name.message}{" "}
                {"existingTodoId" in errors.name && (
                  <Link to={`/edit/${errors.name.existingTodoId}`}>
                    Edit existing todo
                  </Link>
                )}
              </span>
            </>
          )}
        </div>

        <br />

        <div className="form-group">
          <input
            type="submit"
            value="Update Record"
            className="btn btn-primary"
          />
        </div>
      </form>
    </div>
  );
}
