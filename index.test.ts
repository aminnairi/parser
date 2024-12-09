import { expect } from "@std/expect"
import { string } from "./index.ts"

Deno.test("Should parse a string", () => {
  expect(string('"Hello, world!"')).toStrictEqual({
    value: "Hello, world!",
    remaining: ""
  });
});
