export interface ParseResult<Type> {
  value: Type,
  remaining: string
}

export type Parse<Type> = (input: string) => ParseResult<Type> | null

export const space: Parse<string> = input => {
  const character = input[0];

  if (character !== " ") {
    return null;
  }

  return {
    value: character,
    remaining: input.slice(1)
  }
};

export const digit: Parse<string> = input => {
  const character = input[0];

  if (character === undefined) {
    return null;
  }

  const integer = parseInt(character);

  if (Number.isNaN(integer)) {
    return null;
  }

  return {
    value: character,
    remaining: input.slice(1)
  }
}

export const many = <Type>(parse: Parse<Type>): Parse<Type[]> => (input) => {
  const result = parse(input);

  if (!result) {
    return {
      value: [],
      remaining: input,
    };
  }

  const rest = many(parse)(result.remaining);

  if (rest === null) {
    return {
      value: [],
      remaining: input
    }
  }

  return {
    value: [result.value, ...rest.value],
    remaining: rest.remaining,
  };
};

export const oneOf = <Type>(...parsers: Parse<Type>[]): Parse<Type> => input => {
  const [parse, ...remainingParsers] = parsers;

  if (parse === undefined) {
    return null;
  }

  const result = parse(input);

  if (result !== null) {
    return result;
  }

  const oneOfRemainingParsers = oneOf(...remainingParsers);

  return oneOfRemainingParsers(input);
}

export const spaces = many(space);

export const literal = (value: string): Parse<string> => input => {
  if (!input.startsWith(value)) {
    return null;
  }

  return {
    value,
    remaining: input.slice(value.length)
  }
}

export const number: Parse<number> = input => {
  const result = many(digit)(input)

  if (result === null) {
    return null;
  }

  const integer = parseInt(result.value.join(""));

  if (Number.isNaN(integer)) {
    return null;
  }

  return {
    value: integer,
    remaining: result.remaining
  }
}

export const nil: Parse<null> = input => {
  const literalNull = literal("null");
  const result = literalNull(input);

  if (result === null) {
    return null;
  }

  return {
    value: null,
    remaining: result.remaining
  }
}

export const character = (value: string): Parse<string> => input => {
  if (input.length === 0) {
    return null;
  }

  if (input[0] !== value) {
    return null;
  }

  return {
    value: input[0],
    remaining: input.slice(1)
  }
}

export const notCharacter = (value: string): Parse<string> => input => {
  const character = input[0];

  if (character === undefined) {
    return null;
  }

  if (character === value) {
    return null;
  }

  return {
    value: character,
    remaining: input.slice(1)
  }
}

export const combine = <Type>(...parsers: Parse<Type>[]): Parse<Type[]> => input => {
  const [parse, ...remainingParsers] = parsers;

  if (parse === undefined) {
    return {
      value: [],
      remaining: input
    }
  }

  const result = parse(input);

  if (result === null) {
    return null;
  }

  const parseUsingRemainingParsers = combine(...remainingParsers);
  const combinedResult = parseUsingRemainingParsers(result.remaining)

  if (combinedResult === null) {
    return null;
  }

  return {
    value: [result.value, ...combinedResult.value],
    remaining: combinedResult.remaining
  }
}

export const string: Parse<string> = input => {
  const delimiter = character('"');
  const startingDelimiterResult = delimiter(input);

  if (startingDelimiterResult === null) {
    return null;
  }

  const content = many(notCharacter('"'));
  const contentResult = content(startingDelimiterResult.remaining);

  if (contentResult === null) {
    return null;
  }

  const endingDelimiterResult = delimiter(contentResult.remaining);

  if (endingDelimiterResult === null) {
    return null;
  }

  return {
    value: contentResult.value.join(""),
    remaining: endingDelimiterResult.remaining
  }
}

export const json = oneOf<string | number | null>(string, number, nil)