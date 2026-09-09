import { describe, it, expect } from "vitest";
import { translate, makeT, hasMessage, type Dictionary } from "./translate";

const dict: Dictionary = {
  "a.hello": { th: "สวัสดี {name}", en: "Hello {name}" },
  "a.thOnly": { th: "ไทยเท่านั้น", en: "" },
};

describe("translate", () => {
  it("แปลตามภาษาและแทนที่ placeholder", () => {
    expect(translate(dict, "th", "a.hello", { name: "จิระ" })).toBe("สวัสดี จิระ");
    expect(translate(dict, "en", "a.hello", { name: "Jira" })).toBe("Hello Jira");
  });
  it("ไม่มีอังกฤษถอยไปไทย", () => {
    expect(translate(dict, "en", "a.thOnly")).toBe("ไทยเท่านั้น");
  });
  it("key หายคืน key เอง ไม่ throw", () => {
    expect(translate(dict, "th", "missing.key")).toBe("missing.key");
    expect(hasMessage(dict, "missing.key")).toBe(false);
  });
  it("makeT ผูก locale ไว้", () => {
    expect(makeT(dict, "en")("a.hello", { name: "x" })).toBe("Hello x");
  });
});
