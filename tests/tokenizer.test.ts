import { assertEquals } from "@std/assert";
import { tokenizer, TokenType } from "../mod.ts";

Deno.test("tokenizer - empty string", () => {
  const tokens = tokenizer("");
  assertEquals(tokens.length, 0);
});

Deno.test("tokenizer - single identifier", () => {
  const tokens = tokenizer("variable");
  assertEquals(tokens.length, 1);
  assertEquals(tokens[0].type, TokenType.Identifier);
  assertEquals(tokens[0].text, "variable");
  assertEquals(tokens[0].line, 1);
  assertEquals(tokens[0].pos, 1);
});

Deno.test("tokenizer - multiple identifiers with spaces", () => {
  const tokens = tokenizer("first second third");
  assertEquals(tokens.length, 5);
  assertEquals(tokens[0].type, TokenType.Identifier);
  assertEquals(tokens[0].text, "first");
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.Identifier);
  assertEquals(tokens[2].text, "second");
  assertEquals(tokens[3].type, TokenType.Space);
  assertEquals(tokens[4].type, TokenType.Identifier);
  assertEquals(tokens[4].text, "third");
});

Deno.test("tokenizer - numbers", () => {
  const tokens = tokenizer("123 456.789");
  assertEquals(tokens.length, 3);
  assertEquals(tokens[0].type, TokenType.Number);
  assertEquals(tokens[0].text, "123");
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.Number);
  assertEquals(tokens[2].text, "456.789");
});

Deno.test("tokenizer - strings", () => {
  const tokens = tokenizer('"Hello, World!" "Another string"');
  assertEquals(tokens.length, 3);
  assertEquals(tokens[0].type, TokenType.String);
  assertEquals(tokens[0].text, '"Hello, World!"');
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.String);
  assertEquals(tokens[2].text, '"Another string"');
});

Deno.test("tokenizer - operators", () => {
  const tokens = tokenizer("a + b * c");
  assertEquals(tokens.length, 9);
  assertEquals(tokens[0].type, TokenType.Identifier);
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.Operator);
  assertEquals(tokens[2].text, "+");
  assertEquals(tokens[3].type, TokenType.Space);
  assertEquals(tokens[4].type, TokenType.Identifier);
  assertEquals(tokens[5].type, TokenType.Space);
  assertEquals(tokens[6].type, TokenType.Operator);
  assertEquals(tokens[6].text, "*");
});

Deno.test("tokenizer - separators", () => {
  const tokens = tokenizer("(x + y).method()");
  assertEquals(tokens.length, 9);
  assertEquals(tokens[0].type, TokenType.Separator);
  assertEquals(tokens[0].text, "(");
  assertEquals(tokens[1].type, TokenType.Identifier);
  assertEquals(tokens[2].type, TokenType.Space);
  assertEquals(tokens[3].type, TokenType.Operator);
  assertEquals(tokens[4].type, TokenType.Space);
  assertEquals(tokens[5].type, TokenType.Identifier);
  assertEquals(tokens[6].type, TokenType.Separator);
  assertEquals(tokens[6].text, ").");
  assertEquals(tokens[7].type, TokenType.Identifier);
  assertEquals(tokens[7].text, "method");
  assertEquals(tokens[8].type, TokenType.Separator);
  assertEquals(tokens[8].text, "()");
});

Deno.test("tokenizer - mixed content", () => {
  const tokens = tokenizer('let x = 42 + "test";');
  assertEquals(tokens.length, 12);
  assertEquals(tokens[0].type, TokenType.Identifier);
  assertEquals(tokens[0].text, "let");
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.Identifier);
  assertEquals(tokens[2].text, "x");
  assertEquals(tokens[3].type, TokenType.Space);
  assertEquals(tokens[4].type, TokenType.Operator);
  assertEquals(tokens[4].text, "=");
  assertEquals(tokens[5].type, TokenType.Space);
  assertEquals(tokens[6].type, TokenType.Number);
  assertEquals(tokens[6].text, "42");
  assertEquals(tokens[7].type, TokenType.Space);
  assertEquals(tokens[8].type, TokenType.Operator);
  assertEquals(tokens[8].text, "+");
  assertEquals(tokens[9].type, TokenType.Space);
  assertEquals(tokens[10].type, TokenType.String);
  assertEquals(tokens[10].text, '"test"');
  assertEquals(tokens[11].type, TokenType.Separator);
  assertEquals(tokens[11].text, ";");
});

Deno.test("tokenizer - multiline content", () => {
  const tokens = tokenizer("line1\nline2\nline3");
  assertEquals(tokens[0].line, 1);
  assertEquals(tokens[2].line, 2);
  assertEquals(tokens[4].line, 3);
});

Deno.test("tokenizer - identifiers with numbers", () => {
  const tokens = tokenizer("var123 456var var456var");
  assertEquals(tokens.length, 5);
  assertEquals(tokens[0].type, TokenType.Identifier);
  assertEquals(tokens[0].text, "var123");
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.Number);
  assertEquals(tokens[2].text, "456var");
  assertEquals(tokens[3].type, TokenType.Space);
  assertEquals(tokens[4].type, TokenType.Identifier);
  assertEquals(tokens[4].text, "var456var");
});

Deno.test("tokenizer - custom validators", () => {
  const tokens = tokenizer("test", {
    validators: {
      isCharacter: () => false,
      isNumber: () => false,
      isSpace: () => false,
      isOperator: () => false,
      isSeparator: () => true,
    },
  });
  assertEquals(tokens.length, 1);
  assertEquals(tokens[0].type, TokenType.Separator);
  assertEquals(tokens[0].text, "test");
});

Deno.test("tokenizer - instruction validator", () => {
  const tokens = tokenizer("PRINT hello ADD 5", {
    validators: {
      isInstruction: (token) => ["PRINT", "ADD"].includes(token),
    },
  });
  assertEquals(tokens.length, 7);
  assertEquals(tokens[0].type, TokenType.Instruction);
  assertEquals(tokens[0].text, "PRINT");
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.Identifier);
  assertEquals(tokens[2].text, "hello");
  assertEquals(tokens[3].type, TokenType.Space);
  assertEquals(tokens[4].type, TokenType.Instruction);
  assertEquals(tokens[4].text, "ADD");
});

Deno.test("tokenizer - mixed instructions and identifiers", () => {
  const tokens = tokenizer("SET x = ADD 5 TO y", {
    validators: {
      isInstruction: (token) => ["SET", "ADD", "TO"].includes(token),
    },
  });
  assertEquals(tokens.length, 13);
  assertEquals(tokens[0].type, TokenType.Instruction);
  assertEquals(tokens[0].text, "SET");
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.Identifier);
  assertEquals(tokens[2].text, "x");
  assertEquals(tokens[3].type, TokenType.Space);
  assertEquals(tokens[4].type, TokenType.Operator);
  assertEquals(tokens[4].text, "=");
  assertEquals(tokens[5].type, TokenType.Space);
  assertEquals(tokens[6].type, TokenType.Instruction);
  assertEquals(tokens[6].text, "ADD");
  assertEquals(tokens[7].type, TokenType.Space);
  assertEquals(tokens[8].type, TokenType.Number);
  assertEquals(tokens[8].text, "5");
  assertEquals(tokens[9].type, TokenType.Space);
  assertEquals(tokens[10].type, TokenType.Instruction);
  assertEquals(tokens[10].text, "TO");
  assertEquals(tokens[11].type, TokenType.Space);
  assertEquals(tokens[12].type, TokenType.Identifier);
  assertEquals(tokens[12].text, "y");
});

Deno.test("tokenizer - case sensitive instructions", () => {
  const tokens = tokenizer("ADD add ADD", {
    validators: {
      isInstruction: (token) => token === "ADD",
    },
  });
  assertEquals(tokens.length, 5);
  assertEquals(tokens[0].type, TokenType.Instruction);
  assertEquals(tokens[0].text, "ADD");
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.Identifier);
  assertEquals(tokens[2].text, "add");
  assertEquals(tokens[3].type, TokenType.Space);
  assertEquals(tokens[4].type, TokenType.Instruction);
  assertEquals(tokens[4].text, "ADD");
});

Deno.test("String escape sequences", async (t) => {
  await t.step("should handle escaped quotes", () => {
    const input = `"This has \\"quotes\\" inside"`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 1);
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[0].text, input);
  });

  await t.step("should handle multiple escaped quotes", () => {
    const input = `"Text with \\"multiple\\" \\"escaped\\" quotes"`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 1);
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[0].text, input);
  });

  await t.step("should handle escaped quotes at string boundaries", () => {
    const input = `"\\"quoted text\\""`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 1);
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[0].text, input);
  });

  await t.step("should handle escaped backslashes", () => {
    const input = `"This has \\\\ backslash"`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 1);
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[0].text, input);
  });

  await t.step("should handle mixed escapes", () => {
    const input = `"Mixed \\\\ backslash and \\"quote\\""`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 1);
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[0].text, input);
  });

  await t.step("should handle escaped quotes with surrounding tokens", () => {
    const input = `identifier "string with \\"quotes\\"" 123`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 5); // identifier, space, string, space, number
    assertEquals(tokens[2].type, TokenType.String);
    assertEquals(tokens[2].text, `"string with \\"quotes\\""`);
  });

  await t.step("should handle incomplete escapes", () => {
    const input = `"incomplete escape\\`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 1);
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[0].text, input);
  });

  await t.step("should handle empty strings with escapes", () => {
    const input = `"\\"\\""`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 1);
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[0].text, input);
  });

  await t.step("should handle multiple strings with escapes", () => {
    const input = `"first \\"quote\\"" "second \\"quote\\""`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 3); // first string, space, second string
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[2].type, TokenType.String);
    assertEquals(tokens[0].text, `"first \\"quote\\""`);
    assertEquals(tokens[2].text, `"second \\"quote\\""`);
  });

  await t.step("should maintain correct line and position tracking with escapes", () => {
    const input = `"line1 \\"quote\\""\n"line2 \\"quote\\""`;
    const tokens = tokenizer(input);

    assertEquals(tokens[0].line, 1);
    assertEquals(tokens[2].line, 2);
  });
});

// Additional test suite for edge cases
Deno.test("String escape edge cases", async (t) => {
  await t.step("should handle consecutive escapes", () => {
    const input = `"text\\\\\\\"more text"`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 1);
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[0].text, input);
  });

  await t.step("should handle escaped quotes at the end", () => {
    const input = `"text\\""`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 1);
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[0].text, input);
  });

  await t.step("should handle multiple strings with different escape patterns", () => {
    const input = `"normal" "escaped\\"quote" "double\\\\backslash"`;
    const tokens = tokenizer(input);

    assertEquals(tokens.length, 5); // 3 strings + 2 spaces
    assertEquals(tokens[0].type, TokenType.String);
    assertEquals(tokens[2].type, TokenType.String);
    assertEquals(tokens[4].type, TokenType.String);
  });
});

Deno.test("tokenizer should handle decimal numbers correctly", () => {
  const input = "3.14";
  const tokens = tokenizer(input);

  assertEquals(tokens.length, 1);
  assertEquals(tokens[0].type, TokenType.Number);
  assertEquals(tokens[0].text, "3.14");
});

Deno.test("tokenizer should handle multiple decimal numbers", () => {
  const input = "3.14 2.718 1.618";
  const tokens = tokenizer(input);

  assertEquals(tokens.length, 5); // 3 numbers + 2 spaces
  assertEquals(tokens[0].type, TokenType.Number);
  assertEquals(tokens[0].text, "3.14");
  assertEquals(tokens[2].type, TokenType.Number);
  assertEquals(tokens[2].text, "2.718");
  assertEquals(tokens[4].type, TokenType.Number);
  assertEquals(tokens[4].text, "1.618");
});

Deno.test("tokenizer should handle underscore number separators", () => {
  const input = "1_000_000";
  const tokens = tokenizer(input, {
    validators: {
      isNumberSeparator: (char) => char === "_"
    }
  });

  assertEquals(tokens.length, 1);
  assertEquals(tokens[0].type, TokenType.Number);
  assertEquals(tokens[0].text, "1_000_000");
});

Deno.test("tokenizer should handle mixed decimal and underscore separators", () => {
  const input = "1_000.50 2_500_000.75";
  const tokens = tokenizer(input, {
    validators: {
      isNumberSeparator: (char) => char === "_" || char === "."
    }
  });

  assertEquals(tokens.length, 3); // 2 numbers + 1 space
  assertEquals(tokens[0].type, TokenType.Number);
  assertEquals(tokens[0].text, "1_000.50");
  assertEquals(tokens[2].type, TokenType.Number);
  assertEquals(tokens[2].text, "2_500_000.75");
});

Deno.test("tokenizer should handle invalid number separators", () => {
  const input = "1..2 1__2 .5 _1";
  const tokens = tokenizer(input, {
    validators: {
      isNumberSeparator: (char) => char === "_" || char === "."
    }
  });

  // Should split invalid numbers into separate tokens
  assertEquals(tokens[0].type, TokenType.Number);
  assertEquals(tokens[0].text, "1..2");
  assertEquals(tokens[1].type, TokenType.Space);
  assertEquals(tokens[2].type, TokenType.Number);
});

Deno.test("tokenizer should handle numbers in expressions", () => {
  const input = "3.14 * 2_000 + 1.5";
  const tokens = tokenizer(input, {
    validators: {
      isNumberSeparator: (char) => char === "_" || char === "."
    }
  });

  assertEquals(tokens.length, 9); // 3 numbers + 2 operators + 4 spaces
  assertEquals(tokens[0].type, TokenType.Number);
  assertEquals(tokens[0].text, "3.14");
  assertEquals(tokens[4].type, TokenType.Number);
  assertEquals(tokens[4].text, "2_000");
  assertEquals(tokens[6].type, TokenType.Operator);
  assertEquals(tokens[6].text, "+");
  assertEquals(tokens[8].type, TokenType.Number);
  assertEquals(tokens[8].text, "1.5");
});

Deno.test("tokenizer should handle numbers at start and end of input", () => {
  const input = "1_234.56\n7_890.12";
  const tokens = tokenizer(input, {
    validators: {
      isNumberSeparator: (char) => char === "_" || char === "."
    }
  });

  assertEquals(tokens.length, 3); // 2 numbers + 1 space (newline)
  assertEquals(tokens[0].type, TokenType.Number);
  assertEquals(tokens[0].text, "1_234.56");
  assertEquals(tokens[2].type, TokenType.Number);
  assertEquals(tokens[2].text, "7_890.12");
});

Deno.test("tokenizer should maintain correct line and position for numbers with separators", () => {
  const input = "1_000.00\n2_000.00";
  const tokens = tokenizer(input, {
    validators: {
      isNumberSeparator: (char) => char === "_" || char === "."
    }
  });

  assertEquals(tokens[0].type, TokenType.Number);
  assertEquals(tokens[0].text, "1_000.00");
  assertEquals(tokens[2].type, TokenType.Number);
  assertEquals(tokens[2].text, "2_000.00");
});