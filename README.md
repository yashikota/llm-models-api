# llm-models-api

A lightweight REST API proxy for OpenRouter's models API. This proxy allows for enhanced filtering of AI models by provider, model name, and other parameters.

## Features

- Filter models by provider (e.g., OpenAI, Google, Anthropic)
- Filter models by model name
- Filter by minimum context length
- Filter by modality (text, image, etc.)
- Exclude free models (OpenRouter original model) from results
- Strip suffixes from model IDs
- Response caching to minimize requests to OpenRouter
- CORS support for browser access

## API Usage

### Base Endpoint

<https://llm-models-api.yashikota.workers.dev>

Returns all models from OpenRouter API.

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `provider` | string | Filter by provider (comma-separated) | `provider=openai,google` |
| `model` | string | Filter by model name (comma-separated) | `model=gpt-4,gemini-pro` |
| `min_context` | number | Filter by minimum context length | `min_context=32000` |
| `modality` | string | Filter by modality | `modality=text+image` |
| `ignore_free` | boolean | Exclude models with `:free` in their ID | `ignore_free=true` |
| `strip_suffix` | boolean | Remove suffixes (like `:free`) from model IDs | `strip_suffix=true` |

### Examples

#### Get all models

<https://llm-models-api.yashikota.workers.dev/models>

#### Get only models from OpenAI and Google

<https://llm-models-api.yashikota.workers.dev/models?provider=openai,google>

#### Get models with at least 32K context length

<https://llm-models-api.yashikota.workers.dev/models?min_context=32000>

#### Get models excluding free ones

<https://llm-models-api.yashikota.workers.dev/models?ignore_free=true>

#### Get models with suffixes removed from IDs

<https://llm-models-api.yashikota.workers.dev/models?strip_suffix=true>

#### Combine multiple filters

<https://llm-models-api.yashikota.workers.dev/models?provider=mistralai&min_context=32000&strip_suffix=true>

## Response Format

```json
{
  "data": [
    {
      "id": "mistralai/mistral-small-3.1-24b-instruct",
      "name": "Mistral: Mistral Small 3.1 24B (free)",
      "created": 1742238937,
      "description": "...",
      "context_length": 128000,
      "architecture": {
        "modality": "text+image->text",
        "tokenizer": "Mistral",
        "instruct_type": null
      },
      "pricing": {
        "prompt": "0",
        "completion": "0",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "top_provider": {
        "context_length": 128000,
        "max_completion_tokens": 128000,
        "is_moderated": false
      },
      "per_request_limits": null
    }
  ]
}
```
