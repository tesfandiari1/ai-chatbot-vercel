// Script to test the MCP server endpoint
const { exec } = require('node:child_process');

// Create a curl command to test the MCP server
const testMcpServer = () => {
  const mcpUrl = 'http://localhost:3001/api/mcp/server';
  const jsonData = JSON.stringify({
    jsonrpc: '2.0',
    id: '1',
    method: 'listTools',
    params: {},
  });

  const curlCmd = `curl -X POST "${mcpUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonData}'`;

  console.log(`\nExecuting request to MCP server: ${mcpUrl}`);
  console.log(`Request payload: ${jsonData}`);

  exec(curlCmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing MCP request:', error);
      return;
    }

    if (stderr && !stderr.includes('% Total')) {
      console.error('stderr:', stderr);
    }

    console.log('\nMCP Server Response:');
    try {
      const response = JSON.parse(stdout);
      console.log(JSON.stringify(response, null, 2));

      // Check for success
      if (response.result?.tools) {
        console.log(
          `\nSuccess! Found ${Object.keys(response.result.tools).length} tools available.`,
        );
      } else if (response.error) {
        console.error(
          `\nError from MCP server: ${response.error.message || JSON.stringify(response.error)}`,
        );
      }
    } catch (e) {
      console.log('Raw response:', stdout);
      console.error('Failed to parse MCP response:', e);
    }
  });
};

// Run the test
console.log('Testing MCP server endpoint...');
testMcpServer();
