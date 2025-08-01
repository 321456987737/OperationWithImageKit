class ApiClient {
  constructor() {
    // Use different base URLs for server-side vs client-side
    if (typeof window === 'undefined') {
      // Server-side (including build time) - use localhost or configured URL
      this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    } else {
      // Client-side - use configured URL or current origin
      this.baseURL = (process.env.NEXT_PUBLIC_API_URL || window.location.origin).replace(/\/$/, '');
    }
  }

  async fetch(endpoint, options = {}) {
    const { method = "GET", body, headers = {}, showLogs = true } = options;
    const isFormData = body instanceof FormData;

    const defaultHeaders = isFormData
      ? headers
      : {
          "Content-Type": "application/json",
          ...headers,
        };

    // Construct the full URL properly
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${this.baseURL}/api${normalizedEndpoint}`;

    try {
      if (showLogs) {
        console.log("API Request URL:", fullUrl);
      }
      
      const response = await fetch(fullUrl, {
        method,
        headers: defaultHeaders,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      });
      
      if (showLogs) {
        console.log("Response:", response);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API request failed with status ${response.status}`);
      }

      // Handle cases where response has no content
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
      } else {
        return {};
      }
    } catch (error) {
      if (showLogs) {
        console.error("API Client Error:", error);
      }
      throw error;
    }
  }

  async getVideos() {
    // This will construct '/api/video'
    return this.fetch("/video");
  }

  async createVideo(formData) {
    // This will construct '/api/video'
    return this.fetch("/video", {
      method: "POST",
      body: formData,
      showLogs: false // Reduce logs for file uploads
    });
  }
}

export const apiClient = new ApiClient();