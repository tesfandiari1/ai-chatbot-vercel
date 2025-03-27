Auth
Auth Concepts

Understand the core concepts behind Composio Auth

Composio Auth simplifies integrating user-authorized actions into your app. It securely manages OAuth flows, handles token storage, and ensures actions are executed with the correct user’s credentials.

Composio Auth relies on three core concepts. Integration, Connection, Entities.

Composio Auth Concepts showing the relationship between Integration, Connection, and Entity
Getting Started
Let’s use Composio Auth to use the X (formerly Twitter) API to read a tweet.

1
Import libraries
First, initialize and import the Composio and OpenAI SDKs.


Python

TypeScript

import { OpenAIToolSet } from "composio-core";
const composioToolset = new OpenAIToolSet();
2
Create an entity
Create or get an existing entity for a user.


Python

TypeScript

const username = prompt("Enter your X username: ");
const entity = composioToolset.getEntity(username);
3
Initiate connection to the X API
Here, we’ll initiate a connection to the X API. This will redirect you to the X OAuth login page where you can login and grant permissions.


Python

TypeScript

const connReq = await entity.initiateConnection({
    appName: "twitter",
});
console.log(`Navigate to the following URL to connect your X account: ${connReq.redirectUrl}`);
4
Wait for connection to be active
Here, we wait for the connection process to finalize and become active.


Python

TypeScript

const connection = await connReq.waitUntilActive(20);
console.log(`Connection created: ${connection.id}`);
5
Read the tweet
Here, we’ll read the tweet from the X API. We specify the connection ID to use the correct user’s credentials.


Python

TypeScript

const postRes = await composioToolset.executeAction({
    action: "twitter_post_lookup_by_post_id",
    params: { id: "1886192184808149383" },
    connectedAccountId: connection.id,
});
console.log((postRes.data as any).data.text);
Full Code

Python

TypeScript

import { OpenAIToolSet } from "composio-core";
const composioToolset = new OpenAIToolSet();
const username = prompt("Enter your X username: ");
if (!username) {
    throw new Error("Username is required");
}
const entity = await composioToolset.getEntity(username);
const connReq = await entity.initiateConnection({
    appName: "twitter",
});
console.log(`Navigate to the following URL to connect your X account: ${connReq.redirectUrl}`);
const connection = await connReq.waitUntilActive(20);
console.log(`Connection created: ${connection.id}`);
const postRes = await composioToolset.executeAction({
    action: "twitter_post_lookup_by_post_id",
    params: { id: "1886192184808149383" },
    connectedAccountId: connection.id,
});
console.log((postRes.data as any).data.text);
