export interface OrbitItErrorOptions {
  message: string;
  content?: {
    message: string;
    target?: string;
  }[];
}

export class OrbitItError extends Error {
  message: OrbitItErrorOptions['message'];
  content?: OrbitItErrorOptions['content'];

  constructor({ message, content }: OrbitItErrorOptions) {
    super(message);
    this.message = message;
    this.content = content;
    this.name = 'OrbitItError';
  }
}
