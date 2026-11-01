import { DurableObject } from "cloudflare:workers";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
};

const textHeaders = {
  ...corsHeaders,
  "Content-Type": "text/plain; charset=utf-8",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { ...corsHeaders, Allow: "GET, OPTIONS" },
      });
    }

    try {
      const id = env.COUNTER.idFromName("global");
      const counter = env.COUNTER.get(id);
      const count = await counter.increment();

      return new Response(String(count), { headers: textHeaders });
    } catch (error) {
      console.error("Counter increment failed:", error);
      return new Response("ERROR!", { headers: textHeaders });
    }
  },
};

export class Counter extends DurableObject {
  async increment() {
    const count = (await this.ctx.storage.get("count")) ?? 0;
    const nextCount = count + 1;
    await this.ctx.storage.put("count", nextCount);
    return nextCount;
  }
}
