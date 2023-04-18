import { serve } from "./deps.ts";

async function handler(req: Request): Promise<Response> {
  switch (req.method) {
    case "GET": {
      const url = new URL(req.url);
      switch (url.pathname) {
        case "/": {
          const version = await swiftVersion();
          return new Response(JSON.stringify({ status: "pass", version }));
        }
        case "/healthz": {
          const version = await swiftVersion();
          return new Response(JSON.stringify({ status: "pass", version }));
        }
        default: {
          break;
        }
      }
      break;
    }
    case "POST": {
      const url = new URL(req.url);
      switch (url.pathname) {
        case "/runner/2.2/run": {
          if (req.body) {
            const parameters: ExecutionRequestParameters = await req.json();
            if (!parameters.code) {
              return new Response("No code provided", { status: 400 });
            }
            const result = await run(parameters);
            return new Response(JSON.stringify(result));
          }
          break;
        }
        default: {
          break;
        }
      }
      break;
    }
    default: {
      break;
    }
  }

  return new Response("Not found", { status: 404 });
}

async function swiftVersion(): Promise<string> {
  const command = new Deno.Command(
    "swift",
    { args: ["-version"] },
  );
  const { stdout } = await command.output();
  return new TextDecoder().decode(stdout);
}

async function run(
  parameters: ExecutionRequestParameters,
): Promise<ExecutionResponse> {
  const version = await swiftVersion();

  const options = parameters.options || "";
  const timeout = parameters.timeout || 30;
  const color = parameters._color || false;

  const command = new Deno.Command(
    "sh",
    {
      args: [
        "-c",
        `echo '${parameters.code}' | timeout ${timeout} swift ${options} -`,
      ],
      env: {
        "TERM": color ? "xterm-256color" : "",
      },
    },
  );
  const { stdout, stderr } = await command.output();
  return new ExecutionResponse(
    new TextDecoder().decode(stdout),
    new TextDecoder().decode(stderr),
    version,
  );
}

interface ExecutionRequestParameters {
  command?: string;
  options?: string;
  code?: string;
  timeout?: number;
  _color?: boolean;
  _nonce?: string;
}

class ExecutionResponse {
  output: string;
  errors: string;
  version: string;

  constructor(output: string, errors: string, version: string) {
    this.output = output;
    this.errors = errors;
    this.version = version;
  }
}

serve(handler, { port: 8000 });
