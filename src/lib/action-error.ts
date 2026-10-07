/** Deliberate, public validation copy. Never construct this from provider or database errors. */
export class UserInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserInputError";
  }
}
