Install the SDK
Python
TypeScript
Before installing the SDK, ensure you have NodeJS 16+.

1
Install Composio

npm

pnpm

bun

npm install composio-core
2
Plugins
The TS package comes installed with support for:

Cloudflare Worker AI
Vercel AI SDK
3
Post Installation
On new installations, you’ll need to generate the SDK types. If you encounter errors related to missing “metadata,” it likely means you need to update your types.

composio apps generate-types



Tool Calling
Tool Calling and Composio

Tool calling enables AI models to perform tasks beyond simple conversations, allowing them to interact with external services and applications. Instead of just answering questions, your AI assistant can now browse the internet, schedule meetings, update CRM records, or even manage tasks in project management tools.

With Composio, your AI apps and agents gain access to over 250 integrations, including popular services like GitHub, Google Calendar, Salesforce, Slack, and many more. This means your AI agents can seamlessly handle real-world tasks, saving you time and effort.

Overview
Tool calling flow

Tool Calling with Composio
Here’s the preceding example in code:


Python

TypeScript

import { ActionExecutionResDto, OpenAIToolSet, RawExecuteRequestParam } from "composio-core"
import { OpenAI } from "openai";
import { z } from "zod"
import dotenv from "dotenv";
dotenv.config();
const openai_client = new OpenAI();
const toolset = new OpenAIToolSet();
await toolset.createAction({
  actionName: "calculateSum",
  description: "Calculate the sum of two numbers",
  inputParams: z.object({
      a: z.number(),
      b: z.number()
  }),
  callback: async (inputParams: {}, authCredentials: Record<string, string> | undefined, executeRequest: (data: RawExecuteRequestParam) => Promise<ActionExecutionResDto>) => {
      const { a, b } = inputParams as { a: number, b: number };
      const sum = a + b;
      return {
        successful: true,
        data: {
          sum: sum
        }
      };
  }
});
const tools = await toolset.getTools({
  actions: ["calculateSum"]
});
const instruction = "What is 3932 + 2193?";
const response = await openai_client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: instruction }],
  tools: tools,
  tool_choice: "auto",
});
const result = await toolset.handleToolCall(response);
console.log(result);
1
Create tool

Convert a function into LLM-readable form using the @action wrapper (Python) or the callback function (JS)
2
LLM calls the tool

The LLM reasons about the user’s query and decides whethere to use a tool.
If yes, the LLM generate a properly formatted tool use request with the input parameters specified.
3
Handling of the tool call

Composio intercepts, interprets, and calls the actual method defined. handle_tool_calls method interprets the tool call and calls the actual method defined.
Tool Calling with Composio
Composio supports three main ways to use tool calling:

Hosted Tools
Pre-built tools that Composio hosts and maintains, giving you instant access to thousands of actions across hundreds of apps.

Local Tools
Tools that run locally in your environment, like file operations or custom business logic.

Custom Tools
Your own tools defined using Composio’s tool definition format, which can be hosted anywhere.

Using Composio’s Hosted Tools
Composio hosts a growing list of tools from various popular apps like Gmail, Notion to essential apps for AI Engineers like Firecrawl, Browserbase.

This lets you build AI apps and agents without having to manually write the API calls and integrations in the tool format.

Here’s an example of using Firecrawl with to scrape a webpage.

You will need to add a Firecrawl integration. Learn how to do it here

Python

JavaScript

import { OpenAIToolSet } from "composio-core"
import { OpenAI } from "openai";
const openai_client = new OpenAI();
const toolset = new OpenAIToolSet();
const tools = await toolset.getTools({
  actions: ["FIRECRAWL_SCRAPE_EXTRACT_DATA_LLM"]
});
const instruction = "Scrape https://example.com and extract the data";
const response = await openai_client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: instruction }],
  tools: tools,
  tool_choice: "auto",
});
const result = await toolset.handleToolCalls(response);
console.log(result);
Using Composio’s Local Tools
Composio ships with a host of tools that run locally on your system for performing common development tasks like file operations, shell commands, and code execution.

These don’t require any integration or authentication.

Local tools are currently only supported on our Python SDK
These tools run directly on the defined workspace while maintaining security through permission controls.

Workspaces
Workspaces are environments where local tools are fun. Read more about them here.

Workspaces?
from composio_claude import ComposioToolSet, action
from anthropic import Anthropic
client = Anthropic()
toolset = ComposioToolSet()
tools = toolset.get_tools(["FILETOOL_LIST_FILES"])
question = "List all files in the current directory"
response = client.messages.create(
    model="claude-3-5-haiku-latest",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": question}],
)
result = toolset.handle_tool_calls(response)
print(result)

Using Custom Tools
Custom tools allow you to define your own functions for LLMs to call without manually writing JSON schemas. This provides a unified tool calling experience across your application.

These can be:

Functions you define in your codebase
External APIs you want to expose to the LLM
Business logic specific to your application
Custom tools can be seamlessly combined with both local and hosted tools

For creating custom tools using OpenAPI specifications, visit the Custom Tools Dashboard where you can upload and manage your API specs.

Here’s how to create and use custom tools with Composio:


Python

JavaScript

import { OpenAIToolSet } from "composio-core"
import { OpenAI } from "openai";
import { z } from "zod"
import dotenv from "dotenv";
dotenv.config();
const openai_client = new OpenAI();
const toolset = new OpenAIToolSet();
// Create a custom tool
await toolset.createAction({
  actionName: "calculateSum",
  description: "Calculate the sum of two numbers",
  inputParams: z.object({
      a: z.number(),
      b: z.number()
  }),
  callback: async (inputParams) => {
      const a = inputParams.a;
      const b = inputParams.b;
      const sum = a + b;
      return sum;
  }
});
const tools = await toolset.getTools({
  actions: ["calculateSum"]
});
const instruction = "What is 3932 + 2193?";
const response = await openai_client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: instruction }],
  tools: tools,
  tool_choice: "auto",
});
const result = await toolset.handleToolCall(response);
console.log(result);