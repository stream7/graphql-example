import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import request from "graphql-request";
import { GRAPHQL_ENDPOINT } from "../config";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { graphql } from "../gql";
import type { Todo, TodoError } from "../gql/graphql";
import { Link } from "react-router-dom";

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

export default function Edit() {
  const params = useParams();
  const { id } = params;

  if (!id) throw new Error("Missing id");

  const queryClient = useQueryClient();

  const {
    status: fetchTodoStatus,
    error,
    data,
  } = useQuery({
    queryKey: ["todos", id],
    queryFn: async () => request(GRAPHQL_ENDPOINT, GET_TODO, { id }),
  });

  const [form, setForm] = useState({
    name: data?.todo?.name || "",
  });
  const [errors, setErrors] = useState<
    Record<keyof Todo, TodoError | undefined>
  >({} as Record<keyof Todo, TodoError | undefined>);
  const navigate = useNavigate();

  const updateTodo = ({ id, name }: { id: string; name: string }) =>
    request(GRAPHQL_ENDPOINT, UPDATE_TODO, { id, name });

  const { mutate } = useMutation({
    mutationFn: updateTodo,
    onSuccess: (data) => {
      if (!data.updateTodo.errors.length) {
        queryClient.invalidateQueries(["todos"]);
        setForm({ name: "" });
        navigate("/");
      } else {
        setErrors(
          data.updateTodo.errors.reduce((acc, error) => {
            return { ...acc, [error.path]: error };
          }, {} as Record<keyof Todo, TodoError | undefined>)
        );
      }
    },
  });

  useEffect(() => {
    if (data && data.todo) setForm({ name: data.todo.name });
  }, [data]);

  switch (fetchTodoStatus) {
    case "loading":
      return <p>Loading...</p>;
    case "error":
      return (
        <p>
          Error loading todo:{" "}
          {error instanceof Error ? error.message : String(error)}
        </p>
      );
    case "success": {
      if (!data?.todo) return <p>No todo found for id {id}</p>;

      const updateForm = (value: Record<string, string>) => {
        return setForm((prev) => {
          return { ...prev, ...value };
        });
      };

      const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!id) throw new Error("Missing id");

        mutate({
          id,
          name: form.name,
        });
      };

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
                value="Update Record"
                className="btn btn-primary"
              />
            </div>
          </form>
        </div>
      );
    }
  }
}
