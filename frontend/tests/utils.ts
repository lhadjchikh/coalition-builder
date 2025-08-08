/**
 * Utilities Module
 *
 * Shared functions for HTTP requests, service checking, and testing
 */

import * as http from "http";
import * as https from "https";
import { URL } from "url";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

interface ResponseData {
  statusCode: number;
  data: string;
  headers: http.IncomingHttpHeaders;
}

interface WaitForServiceOptions {
  maxAttempts?: number;
  timeout?: number;
  initialDelay?: number;
  maxDelay?: number;
}

interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: http.IncomingHttpHeaders;
  url: string;
  json: () => any;
  text: () => string;
}

interface RetryOptions {
  retryCount?: number;
  initialDelay?: number;
  maxDelay?: number;
}

/**
 * Makes an HTTP request to the specified URL
 *
 * @param url - The URL to request
 * @param options - Request options
 * @returns Response object
 */
function makeRequest(
  url: string,
  options: RequestOptions = {},
): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    try {
      // Parse the URL to get the protocol
      const parsedUrl = new URL(url);
      const httpModule = parsedUrl.protocol === "https:" ? https : http;

      const requestOptions: http.RequestOptions = {
        method: options.method || "GET",
        headers: options.headers || {},
        timeout: options.timeout || 30000,
      };

      const req = httpModule.get(
        url,
        requestOptions,
        (response: http.IncomingMessage) => {
          let data = "";

          // Handle data chunks
          response.on("data", (chunk: Buffer) => {
            data += chunk;
          });

          // Handle end of response
          response.on("end", () => {
            try {
              resolve({
                statusCode: response.statusCode || 0,
                data: data,
                headers: response.headers,
              });
            } catch (error) {
              const err = error as Error;
              reject(new Error(`Failed to process response: ${err.message}`));
            }
          });
        },
      );

      // Handle request errors
      req.on("error", (error: Error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      // Handle timeout
      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Request timeout after ${requestOptions.timeout}ms`));
      });
    } catch (error) {
      const err = error as Error;
      reject(new Error(`Failed to make request: ${err.message}`));
    }
  });
}

/**
 * Waits for a service to be ready, with exponential backoff
 *
 * @param url - The URL to check
 * @param options - Wait configuration options
 * @returns True if service is ready
 */
async function waitForService(
  url: string,
  {
    maxAttempts = 30,
    timeout = 60000,
    initialDelay = 1000,
    maxDelay = 8000,
  }: WaitForServiceOptions = {},
): Promise<boolean> {
  console.log(`Waiting for service at ${url}...`);

  const startTime = Date.now();
  let retryDelay = initialDelay;
  let attempts = 0;

  while (Date.now() - startTime < timeout && attempts < maxAttempts) {
    attempts++;
    try {
      const response = await makeRequest(url);
      if (response.statusCode === 200) {
        console.log(`✅ Service at ${url} is ready`);
        return true;
      } else {
        console.log(
          `⚠️ Service at ${url} returned status ${response.statusCode}, waiting...`,
        );
      }
    } catch (error) {
      const err = error as Error;
      console.log(`⚠️ Service not ready: ${err.message}`);
    }

    if (
      attempts >= maxAttempts ||
      Date.now() + retryDelay > startTime + timeout
    ) {
      break;
    }

    console.log(`Waiting for ${url}... (${attempts}/${maxAttempts})`);

    // Exponential backoff with jitter
    const jitter = Math.random() * 500;
    retryDelay = Math.min(retryDelay * 1.5 + jitter, maxDelay);

    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  throw new Error(
    `Service at ${url} not ready after ${attempts} attempts or ${Date.now() - startTime}ms`,
  );
}

/**
 * A fetch-like wrapper around makeRequest for compatibility
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Fetch-like response object
 */
async function fetchCompatible(
  url: string,
  options: RequestOptions = {},
): Promise<FetchResponse> {
  try {
    const response = await makeRequest(url, options);
    return {
      ok: response.statusCode >= 200 && response.statusCode < 300,
      status: response.statusCode,
      statusText: response.statusCode === 200 ? "OK" : "Error",
      headers: response.headers,
      url: url,
      json: () => JSON.parse(response.data),
      text: () => response.data,
    };
  } catch (error) {
    const err = error as Error;
    console.error(`Fetch error: ${err.message}`);
    throw error;
  }
}

/**
 * Make HTTP requests with retries and exponential backoff
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryOptions - Retry configuration
 * @returns Fetch response
 */
async function fetchWithRetry(
  url: string,
  options: RequestOptions = {},
  { retryCount = 5, initialDelay = 3000, maxDelay = 10000 }: RetryOptions = {},
): Promise<FetchResponse> {
  let retryDelay = initialDelay;

  for (let i = 0; i < retryCount; i++) {
    try {
      return await fetchCompatible(url, options);
    } catch (error) {
      if (i === retryCount - 1) {
        throw error;
      }

      const err = error as Error;
      console.log(
        `Request failed (attempt ${i + 1}/${retryCount}): ${err.message}, retrying...`,
      );

      // Exponential backoff with jitter
      const jitter = Math.random() * 500;
      retryDelay = Math.min(retryDelay * 1.5 + jitter, maxDelay);

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error(`Failed after ${retryCount} attempts`);
}

/**
 * Creates authentication headers for site protection if enabled
 * @returns RequestOptions with authentication headers if needed
 */
function createAuthenticatedRequestOptions(): RequestOptions {
  const sitePasswordEnabled = ["true", "1", "yes"].includes(
    (process.env.SITE_PASSWORD_ENABLED || "").toLowerCase(),
  );

  const requestOptions: RequestOptions = {};

  if (sitePasswordEnabled) {
    const username = process.env.SITE_USERNAME || "admin";
    const password = process.env.SITE_PASSWORD || "";

    if (password) {
      const credentials = Buffer.from(`${username}:${password}`).toString(
        "base64",
      );
      requestOptions.headers = {
        Authorization: `Basic ${credentials}`,
      };
      console.log("🔐 Site protection detected - using authentication");
    } else {
      console.log("⚠️  Site protection enabled but no password configured");
    }
  }

  return requestOptions;
}

export {
  makeRequest,
  waitForService,
  fetchCompatible,
  fetchWithRetry,
  createAuthenticatedRequestOptions,
  type RequestOptions,
  type ResponseData,
  type WaitForServiceOptions,
  type FetchResponse,
  type RetryOptions,
};
