import { describe, expect, it } from "vitest";

import { decodeEvents, encodeEvent, type OperatorEvent } from "./events";

describe("operator event codec", () => {
  it("round-trips an event as a single NDJSON line", () => {
    const event: OperatorEvent = { type: "message", delta: "hello" };
    const line = encodeEvent(event);
    expect(line.endsWith("\n")).toBe(true);

    const { events, rest } = decodeEvents(line);
    expect(events).toEqual([event]);
    expect(rest).toBe("");
  });

  it("decodes multiple events and buffers a trailing partial line", () => {
    const a: OperatorEvent = { type: "status", status: "planning" };
    const b: OperatorEvent = { type: "run-finish", status: "completed" };
    const buffer = `${JSON.stringify(a)}\n${JSON.stringify(b)}`; // no trailing newline

    const first = decodeEvents(buffer);
    expect(first.events).toEqual([a]);
    expect(first.rest).toBe(JSON.stringify(b));

    const second = decodeEvents(`${first.rest}\n`);
    expect(second.events).toEqual([b]);
    expect(second.rest).toBe("");
  });

  it("skips malformed and blank lines without throwing", () => {
    const valid: OperatorEvent = { type: "notice", level: "info", message: "ok" };
    const buffer = `not-json\n\n${JSON.stringify(valid)}\n{"partial":\n`;

    const { events } = decodeEvents(buffer);
    expect(events).toEqual([valid]);
  });

  it("ignores JSON that is not an object with a type", () => {
    const { events } = decodeEvents("123\n\"string\"\nnull\n");
    expect(events).toEqual([]);
  });
});
