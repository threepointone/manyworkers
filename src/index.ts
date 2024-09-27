import { WorkerEntrypoint } from "cloudflare:workers";

type Env = {
  A: Service<A>;
  B: Service<B>;
  C: Service<C>;
};

export class C extends WorkerEntrypoint<Env> {
  someStream() {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("Hello World"));
        controller.close();
      },
    });
  }
}

export class B extends WorkerEntrypoint<Env> {
  async something(request: Request): Promise<Response> {
    // let's get a stream from C
    const stream = await this.env.C.someStream();
    return new Response(stream);
  }
}

export class A extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    // this.env and this.ctx are available here
    return this.env.B.something(request);
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // let's make a request to A
    return env.A.fetch("https://example.com");
  },
} satisfies ExportedHandler<Env>;
