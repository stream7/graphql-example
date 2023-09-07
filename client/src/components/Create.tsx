import { useMutation, useApolloClient } from "@apollo/client";
import { graphql } from "../gql";
import type { TodoError, Todo } from "../gql/graphql";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";

const CREATE_TODO = graphql(/* GraphQL */ `
  mutation CreateTodo($name: String!) {
    createTodo(name: $name) {
      todo {
        id
        name
      }
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

export default function Create() {
  const apolloClient = useApolloClient();
  const [createTodo] = useMutation(CREATE_TODO);

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
      onCompleted: (data, options) => {
        const { errors } = data.createTodo!;

        if (errors.length) {
          setErrors(
            errors.reduce((acc, error) => {
              return { ...acc, [error.path]: error };
            }, {} as Record<keyof Todo, TodoError | undefined>)
          );
        } else {
          setForm({ name: "" });
          apolloClient.cache.evict({ fieldName: "todos" });
          navigate("/");
        }
      },
      onError: (error) => {
        console.log("error", error);
        alert(error.message);
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
                {errors.name.__typename === "TodoNameTaken" && (
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
