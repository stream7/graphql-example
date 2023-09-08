import { useMutation } from "@apollo/client";
import { graphql } from "../gql";
import type { Todo } from "../gql/graphql";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { GET_TODOS } from "./TodoList";
import { type TodoError, isTodoValidationError } from "../errors";

const CREATE_TODO = graphql(/* GraphQL */ `
  mutation CreateTodo($name: String!) {
    createTodo(name: $name) {
      id
      name
    }
  }
`);

export default function Create() {
  const [createTodo] = useMutation(CREATE_TODO, {
    refetchQueries: [GET_TODOS],
  });

  const [form, setForm] = useState({
    name: "",
  });
  const [errors, setErrors] = useState<
    Record<keyof Todo, TodoError | undefined>
  >({} as Record<keyof Todo, TodoError | undefined>);
  const navigate = useNavigate();

  // These methods will update the state properties.
  function updateForm(value: Record<string, string>) {
    return setForm((prev) => {
      return { ...prev, ...value };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await createTodo({
      variables: {
        name: form.name,
      },
      onCompleted: () => {
        setForm({ name: "" });
        navigate("/");
      },
      onError: (apolloError) => {
        const error = apolloError.graphQLErrors[0];
        console.log("apolloError on create", apolloError);
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

  // This following section will display the form that takes the input from the user.
  return (
    <div>
      <h3>Create New Record</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
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
            value="Create person"
            className="btn btn-primary"
          />
        </div>
      </form>
    </div>
  );
}
