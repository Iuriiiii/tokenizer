import { getStringUid } from "@online/get-string-uid";

const minLetter1 = "a".charCodeAt(0);
const maxLetter1 = "z".charCodeAt(0);
const minLetter2 = "A".charCodeAt(0);
const maxLetter2 = "Z".charCodeAt(0);
const minNumber = "0".charCodeAt(0);
const maxNumber = "9".charCodeAt(0);

function _isAlpha(char: string) {
  const charCode = char.charCodeAt(0);
  return charCode >= minLetter1 && charCode <= maxLetter1 || charCode >= minLetter2 && charCode <= maxLetter2;
}

function _isNumeric(char: string) {
  const charCode = char.charCodeAt(0);
  return charCode >= minNumber && charCode <= maxNumber;
}

function _isSeparator(char: string) {
  return "[](){}.#?¿:;, ".includes(char);
}

function _isSpace(char: string) {
  return " \t\r\n".includes(char);
}

function _isOperator(char: string) {
  return "+-*/^%&=<>".includes(char);
}

export enum TokenType {
  /**
   * Unknwon token, you must never see this.
   */
  Unknown,
  String,
  Number,
  Identifier,
  Operator,
  Separator,
  Space,
  Instruction,
  EOF
}

export interface IToken {
  /**
   * Unique identifier of this token.
   * @see getTokenId
   */
  uid: number;
  /**
   * The type of this token.
   */
  type: TokenType;
  /**
   * The text of this token.
   */
  text: string;
  /**
   * The line number of this token.
   * @default 1
   */
  line: number;
  /**
   * The position of this token.
   * @default 1
   */
  pos: number;
}

export type CharacterValidator = (char: string, line: number, pos: number) => boolean;
export type TokenValidator = (token: string, line: number, pos: number) => boolean;

/**
 * The validators for the tokenizer.
 */
export interface ITokenizerValidators {
  /**
   * Any alphabetic character.
   */
  isCharacter: CharacterValidator;
  /**
   * Any numeric character.
   */
  isNumber: CharacterValidator;
  /**
   * Any space character.
   */
  isSpace: CharacterValidator;
  /**
   * Any operator character.
   * @example +, -, %, *, /
   */
  isOperator: CharacterValidator;
  /**
   * Any numeric separator character.
   * 
   * Some languages can use special symbols for numbers, for example the "." to
   * make a number a float number or "_" to make a number more readable.
   * 
   * Some examples: 3.14, 1_000_000
   * @default .
   * @example ., _
   */
  isNumberSeparator: CharacterValidator;
  /**
   * Any separator character.
   * @example (, ), [, ], .
   */
  isSeparator: CharacterValidator;
  /**
   * The characters that will start and end a string.
   * @example ", ', `
   * @default "
   */
  isString: CharacterValidator;
  /**
   * Checks if a token is an instruction.
   */
  isInstruction: TokenValidator;
}

export interface ITokenizerOptions {
  validators: Partial<ITokenizerValidators>;
  insertEof: boolean;
}

export { getStringUid as getTokenId };

/**
 * Tokenizes the input text into an array of tokens based on specified options.
 *
 * @param text - The input string to be tokenized.
 * @param options - Optional settings for the tokenizer, including custom
 *                  validators and a flag to insert an EOF token.
 * @returns An array of tokens, each represented as an IToken object.
 *
 * The tokenizer classifies text into different token types such as strings,
 * numbers, identifiers, operators, separators, spaces, and instructions.
 * It supports customizable validators for character classification and can
 * optionally include an EOF token at the end of the token list.
 */
export function tokenizer(text: string, options?: Partial<ITokenizerOptions>) {
  const tokens: IToken[] = [];
  const isSpace = options?.validators?.isSpace ?? _isSpace;
  const isSeparator = options?.validators?.isSeparator ?? _isSeparator;
  const isNumeric = options?.validators?.isNumber ?? _isNumeric;
  const isAlpha = options?.validators?.isCharacter ?? _isAlpha;
  const isOperator = options?.validators?.isOperator ?? _isOperator;
  const isString = options?.validators?.isString ?? ((char: string) => char === '"');
  const isInstruction = options?.validators?.isInstruction ?? (() => false);
  const isNumberSeparator = options?.validators?.isNumberSeparator ?? ((char: string) => char === ".");
  let line = 1;
  let pos = 1;
  let token: IToken = { type: TokenType.Unknown, text: "", uid: 0, line, pos };

  const resetToken = () => token = { type: TokenType.Unknown, text: "", uid: 0, line, pos };

  const pushToken = () => {
    if (token.type === TokenType.Identifier && isInstruction(token.text, line, pos)) {
      token.type = TokenType.Instruction;
    }

    token.uid = getStringUid(token.text);
    tokens.push(token);
    resetToken();
  };

  const pushIfNotTypes = (types: TokenType[]) => {
    if (!types.includes(token.type)) {
      pushToken();
    }

    token.type = types.find((type) => type !== TokenType.Unknown)!;
  };

  const concatIfTypes = (types: TokenType[], text: string) => {
    if (types.includes(token.type)) {
      token.text += text;
      token.uid = getStringUid(token.text);
      token.type = types.find((type) => type !== TokenType.Unknown)!;

      return true;
    }
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "\n") {
      line++;
      pos = 1;
    }

    switch (true) {
      case isString(char, line, pos):
        if (token.text.endsWith("\\")) {
          token.text += char;
          continue;
        }

        pushIfNotTypes([TokenType.Unknown, TokenType.String]);
        concatIfTypes([TokenType.String, TokenType.Unknown], char);

        if (token.type === TokenType.String && token.text.length > 1 && token.text.startsWith(char) && token.text.endsWith(char)) {
          pushToken();
        }
        break;
      case token.type === TokenType.String:
        concatIfTypes([TokenType.String], char);
        break;
      case isSpace(char, line, pos):
        pushIfNotTypes([TokenType.Unknown, TokenType.Space]);
        concatIfTypes([TokenType.Space], char);
        break;
      case isSeparator(char, line, pos):
        if (isNumberSeparator(char, line, pos) && token.type === TokenType.Number) {
          pushIfNotTypes([TokenType.Unknown, TokenType.Number]);
          concatIfTypes([TokenType.Number], char);
          break;
        }

        pushIfNotTypes([TokenType.Unknown, TokenType.Separator]);
        concatIfTypes([TokenType.Separator], char);
        break;
      case isNumeric(char, line, pos): {
        const type = token.type === TokenType.Identifier ? TokenType.Identifier : TokenType.Number;

        pushIfNotTypes([TokenType.Unknown, type]);
        concatIfTypes([type], char);
        break;
      }
      case isAlpha(char, line, pos): {
        const type = token.type === TokenType.Number ? TokenType.Number : TokenType.Identifier;

        pushIfNotTypes([TokenType.Unknown, type]);
        concatIfTypes([type], char);
        break;
      }
      case isOperator(char, line, pos):
        pushIfNotTypes([TokenType.Unknown, TokenType.Operator]);
        concatIfTypes([TokenType.Operator], char);
        break;
      case isNumberSeparator(char, line, pos) && token.type === TokenType.Number:
        pushIfNotTypes([TokenType.Unknown, TokenType.Number]);
        concatIfTypes([TokenType.Number], char);
        break;
      default:
        pushIfNotTypes([TokenType.Unknown, TokenType.Identifier]);
        concatIfTypes([TokenType.Identifier], char);
    }

    pos++;
  }

  pushIfNotTypes([TokenType.Unknown]);

  if (options?.insertEof) {
    tokens.push({ type: TokenType.EOF, text: "", uid: 0, line: 0, pos: 0 });
  }

  return tokens;
}
