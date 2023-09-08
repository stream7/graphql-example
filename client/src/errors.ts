import { GraphQLError } from "graphql";

// problem: this needs to be shared with client and server
// instanceof operator cannot be used due to possible package version mismatch
// so a custom type guard is needed for every new custom error like TodoValidationError
// NOTE: copy pasted for this example in the server/src/errors.ts file

interface UserError {
  path: string;
  message: string;
}

interface TodoNameTaken extends UserError {
  existingTodoId: string;
}

export type TodoError = UserError | TodoNameTaken;

export interface IValidationError {
  message: string;
  extensions: {
    errors: Array<UserError>;
    code: "ValidationError";
  };
}

export interface ITodoValidationError {
  message: string;
  extensions: {
    errors: Array<UserError>;
    code: "TodoValidationError";
  };
}

export function isValidationError(error: unknown): error is IValidationError {
  return (
    error != null &&
    (error as GraphQLError)?.extensions?.code === "ValidationError"
  );
}

export function isTodoValidationError(
  error: unknown
): error is ITodoValidationError {
  return (
    error != null &&
    (error as GraphQLError)?.extensions?.code === "TodoValidationError"
  );
}

// problem: can't bind these classes with the corresponding interface IValidationError
// since GraphQLErrorExtensions are not Generic
export class ValidationError<E extends UserError> extends GraphQLError {
  constructor(message: string, errors: Array<E>, code = "ValidationError") {
    super(message, {
      extensions: { errors, code },
    });
  }
}

export class TodoValidationError extends ValidationError<TodoError> {
  constructor(message: string, errors: Array<TodoError>) {
    super(message, errors, "TodoValidationError");
  }
}
