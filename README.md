# @online/tokenizer

A flexible and customizable tokenizer for parsing text into meaningful tokens. This module provides functionality to break down text input into various types of tokens such as strings, numbers, identifiers, operators, separators, spaces, and custom instructions.

## Features

- Customizable token validation
- Support for multiple token types:
  - Strings (with escape character support)
  - Numbers
  - Identifiers
  - Operators
  - Separators
  - Spaces
  - Custom Instructions
- Line and position tracking
- Unique token identification
- Optional EOF token insertion

## Installation

```bash
deno add jsr:@online/tokenizer
```

## Usage

### Basic Usage

```typescript
import { tokenizer, TokenType } from "@online/tokenizer";

const text = 'let x = 42 + "Hello, World!"';
const tokens = tokenizer(text);

// Output: Array of IToken objects
console.log(tokens);
```

### Custom Validators

You can customize how the tokenizer identifies different types of characters:

```typescript
import { tokenizer, ITokenizerValidators } from "@online/tokenizer";

const customValidators: Partial<ITokenizerValidators> = {
  isString: (char) => ["'", '"', '`'].includes(char),
  isOperator: (char) => "+-*/".includes(char),
  isInstruction: (token) => token.startsWith("@")
};

const text = 'let x = @print("Hello")';
const tokens = tokenizer(text, { 
  validators: customValidators,
  insertEof: true 
});

/*
[
  { type: 3, text: "let", uid: 225.06930693069307, line: 1, pos: 1 },
  { type: 6, text: " ", uid: 32, line: 1, pos: 4 },
  { type: 3, text: "x", uid: 120, line: 1, pos: 5 },
  { type: 6, text: " ", uid: 32, line: 1, pos: 6 },
  { type: 3, text: "=", uid: 61, line: 1, pos: 7 }, // IDENTIFIER DUE THIS IS NOT ADDED TO "IsOperator"
  { type: 6, text: " ", uid: 32, line: 1, pos: 8 },
  { type: 7, text: "@print", uid: 292.77445460943, line: 1, pos: 9 },
  { type: 5, text: "(", uid: 40, line: 1, pos: 15 },
  {
    type: 1,
    text: '"Hello"',
    uid: 280.93133874615353,
    line: 1,
    pos: 16
  },
  { type: 5, text: ")", uid: 41, line: 1, pos: 22 },
  { type: 8, text: "", uid: 0, line: 0, pos: 0 }
]
*/
```

## Token Types

The tokenizer supports the following token types:

- `TokenType.String`: String literals (e.g., "Hello")
- `TokenType.Number`: Numeric values (e.g., 42, 3.14)
- `TokenType.Identifier`: Variable names and keywords
- `TokenType.Operator`: Mathematical and logical operators
- `TokenType.Separator`: Punctuation and grouping symbols
- `TokenType.Space`: Whitespace characters
- `TokenType.Instruction`: Custom instruction tokens
- `TokenType.EOF`: End of file marker (optional)

## Interface

### IToken

Each token contains the following information:

```typescript
interface IToken {
  uid: number;        // Unique identifier
  type: TokenType;    // Type of the token
  text: string;       // Actual text content
  line: number;       // Line number (1-based)
  pos: number;        // Position in line (1-based)
}
```

### Validator Types

```typescript
type CharacterValidator = (char: string, line: number, pos: number) => boolean;
type TokenValidator = (token: string, line: number, pos: number) => boolean;
```

## Configuration

The tokenizer accepts an options object with the following properties:

```typescript
interface ITokenizerOptions {
  validators: Partial<ITokenizerValidators>;  // Custom validators
  insertEof: boolean;                         // Whether to append EOF token
}
```

## License

MIT License

## Contributing

You're free to send some prs or add issues!