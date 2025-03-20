import { Hono } from "hono";
import { cache } from "hono/cache";
import { cors } from "hono/cors";

interface Model {
  id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
    input_cache_read: string;
    input_cache_write: string;
    web_search: string;
    internal_reasoning: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  per_request_limits: any;
}

interface OpenRouterResponse {
  data: Model[];
}

const app = new Hono();

// Apply CORS middleware
app.use("*", cors());

// Cache the response for 10 minutes to avoid hitting OpenRouter API too frequently
app.use(
  "/models",
  cache({ cacheName: "openrouter-cache", cacheControl: "max-age=600" }),
);

// Main endpoint for filtering models
app.get("/models", async (c) => {
  try {
    // Fetch models from OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/models");

    if (!response.ok) {
      return c.json(
        { error: "Failed to fetch models from OpenRouter API" },
        response.status as any,
      );
    }

    const openRouterResponse: OpenRouterResponse = await response.json();
    let models = openRouterResponse.data;

    // Extract query parameters
    const url = new URL(c.req.url);
    const queryParams = url.searchParams;

    // Filter out free models if ignore_free is set to true
    const ignoreFree = queryParams.get("ignore_free") === "true";
    if (ignoreFree) {
      models = models.filter((model) => !model.id.includes(":free"));
    }

    // Process provider filter if specified
    const providerParam = queryParams.get("provider");
    if (providerParam) {
      const providers = providerParam.split(",");
      models = models.filter((model) => {
        const [provider] = model.id.split("/");
        return providers.includes(provider);
      });
    }

    // Process model filter if specified
    const modelParam = queryParams.get("model");
    if (modelParam) {
      const modelNames = modelParam.split(",");
      models = models.filter((model) => {
        const parts = model.id.split("/");
        if (parts.length > 1) {
          // Extract the model name part (removing any variants after ":")
          const modelName = parts[1].split(":")[0];
          return modelNames.includes(modelName);
        }
        return false;
      });
    }

    // Filter by context length
    const minContextLength = Number.parseInt(
      queryParams.get("min_context") || "0",
    );
    if (minContextLength > 0) {
      models = models.filter(
        (model) => model.context_length >= minContextLength,
      );
    }

    // Filter by modality
    const modality = queryParams.get("modality");
    if (modality) {
      models = models.filter((model) =>
        model.architecture.modality.includes(modality),
      );
    }

    // Check if we should remove the ":free" suffix from model IDs
    const stripSuffix = queryParams.get("strip_suffix") === "true";
    if (stripSuffix) {
      models = models.map((model) => {
        // Create a new object to avoid modifying the original
        const newModel = { ...model };

        // Remove the ":free" or any other suffix after the colon
        if (newModel.id.includes(":")) {
          newModel.id = newModel.id.split(":")[0];
        }

        return newModel;
      });
    }

    return c.json({ data: models });
  } catch (error) {
    console.error("Error processing request:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add a health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "LLM Models API is running" });
});

export default app;
