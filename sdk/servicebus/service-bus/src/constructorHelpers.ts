// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ConnectionConfig, RetryOptions, WebSocketOptions } from "@azure/core-amqp";
import { TokenCredential } from "@azure/core-auth";
import { ConnectionContext } from "./connectionContext";
import { UserAgentOptions } from "@azure/core-http";
import { SharedKeyCredential } from "./servicebusSharedKeyCredential";

/**
 * Describes the options that can be provided while creating the ServiceBusClient.
 *
 * - `webSocketOptions` : Options to configure the channelling of the AMQP connection over Web Sockets.
 *    - `websocket`     : The WebSocket constructor used to create an AMQP connection if you choose to make the connection
 * over a WebSocket.
 *    - `webSocketConstructorOptions` : Options to pass to the Websocket constructor when you choose to make the connection
 * over a WebSocket.
 * - `retryOptions`     : The retry options for all the operations on the client.
 *    - `maxRetries` : The number of times the operation can be retried in case of a retryable error.
 *    - `maxRetryDelayInMs`: The maximum delay between retries. Applicable only when performing exponential retries.
 *    - `mode`: Which retry mode to apply, specified by the `RetryMode` enum. Options are `Exponential` and `Fixed`. Defaults to `Fixed`.
 *    - `retryDelayInMs`: Amount of time to wait in milliseconds before making the next attempt. When `mode` is set to `Exponential`,
 *       this is used to compute the exponentially increasing delays between retries. Default: 30000 milliseconds.
 *    - `timeoutInMs`: Amount of time in milliseconds to wait before the operation times out. This will trigger a retry if there are any
 *       retry attempts remaining. Minimum value: 60000 milliseconds.
 */
export interface ServiceBusClientOptions {
  /**
   * Retry policy options that determine the mode, number of retries, retry interval etc.
   */
  retryOptions?: RetryOptions;
  /**
   * @property
   * Options to configure the channelling of the AMQP connection over Web Sockets.
   */
  webSocketOptions?: WebSocketOptions;
  /**
   * Options for adding user agent details to outgoing requests.
   */
  userAgentOptions?: UserAgentOptions;
}

/**
 * @internal
 *
 * @param {string} connectionString
 * @param {(SharedKeyCredential | TokenCredential)} credential
 * @param {ServiceBusClientOptions} options
 */
export function createConnectionContext(
  connectionString: string,
  credential: SharedKeyCredential | TokenCredential,
  options: ServiceBusClientOptions
): ConnectionContext {
  const config = ConnectionConfig.create(connectionString);

  config.webSocket = options?.webSocketOptions?.webSocket;
  config.webSocketEndpointPath = "$servicebus/websocket";
  config.webSocketConstructorOptions = options?.webSocketOptions?.webSocketConstructorOptions;

  return ConnectionContext.create(config, credential, options);
}

/**
 * @param connectionString
 * @param options
 * @internal
 */
export function createConnectionContextForConnectionString(
  connectionString: string,
  options: ServiceBusClientOptions = {}
): ConnectionContext {
  const credential = SharedKeyCredential.fromConnectionString(connectionString);
  return createConnectionContext(connectionString, credential, options);
}

/**
 *
 * @param credential
 * @param host
 * @param options
 * @internal
 */
export function createConnectionContextForTokenCredential(
  credential: TokenCredential,
  host: string,
  options: ServiceBusClientOptions = {}
): ConnectionContext {
  if (typeof host !== "string") {
    throw new TypeError("`host` parameter is not a string");
  }

  // host, credential and options based constructor was invoked
  if (!host.endsWith("/")) {
    host += "/";
  }
  const connectionString = `Endpoint=sb://${host};SharedAccessKeyName=defaultKeyName;SharedAccessKey=defaultKeyValue;`;
  return createConnectionContext(connectionString, credential, options);
}

/**
 * Parses a connection string and extracts the EntityPath named entity out.
 * @param connectionString An entity specific Service Bus connection string.
 * @internal
 */
export function getEntityNameFromConnectionString(connectionString: string): string {
  const entityPathMatch = connectionString.match(/^.+EntityPath=(.+?);{0,1}$/);

  if (entityPathMatch != null && entityPathMatch.length === 2) {
    return entityPathMatch[1];
  } else {
    throw new Error("No entity name present in the connection string");
  }
}
