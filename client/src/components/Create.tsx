import { useMutation, useQueryClient } from "@tanstack/react-query";
import request from "graphql-request";
import { graphql } from "../gql";
import type { TodoError, Todo } from "../gql/graphql";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { GRAPHQL_ENDPOINT } from "../config";

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
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
  });

  const createTodo = async (name: string) =>
    request(GRAPHQL_ENDPOINT, CREATE_TODO, { name });

  const { status, mutate, error } = useMutation({
    mutationFn: createTodo,
    onSuccess: (data) => {
      if (!data.createTodo.errors.length) {
        queryClient.invalidateQueries(["todos"]);
        navigate("/");
      } else {
        setErrors(
          data.createTodo.errors.reduce((acc, error) => {
            return { ...acc, [error.path]: error };
          }, {} as Record<keyof Todo, TodoError | undefined>)
        );
      }
    },
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
    mutate(form.name);
  }

  // This following section will display the form that takes the input from the user.
  return (
    <div>
      <h3>Create New Record</h3>
      {error != null && (
        <p style={{ color: "red" }}>
          {error instanceof Error ? error.message : String(error)}`
        </p>
      )}
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
            disabled={status === "loading"}
          />
        </div>
      </form>
    </div>
  );
}
