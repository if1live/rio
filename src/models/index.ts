export * from "./s8202.js";
export * from "./reports.js";

// {"message":"Not connected"}
export interface MessageResponse {
  message: string;
}

// {"error_type":"RequestTimeoutError","errors":[],"messages":[],"result":{}}
export interface ErrorResponse {
  error_type: string;
  errors: object[];
  messages: object[];
  result: object;
}
