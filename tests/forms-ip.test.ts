import { describe, expect, it } from "vitest";
import { IP_HASH_LENGTH, clientIp, hashIp, ipHashFromHeaders } from "@/lib/forms/ip";

const SECRET = "test-secret-for-ip-hashing";

describe("clientIp", () => {
  it("takes the first x-forwarded-for value", () => {
    const headers = new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1, 10.0.0.2", "x-real-ip": "198.51.100.1" });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": " 198.51.100.1 " }))).toBe("198.51.100.1");
    expect(clientIp(new Headers({ "x-forwarded-for": " , ", "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
  });

  it("ignores values that are not IP addresses, so junk cannot mint new senders", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "not-an-ip, 10.0.0.1" }))).toBeNull();
    expect(clientIp(new Headers({ "x-forwarded-for": "<script>", "x-real-ip": "198.51.100.3" }))).toBe("198.51.100.3");
    expect(clientIp(new Headers({ "x-forwarded-for": "1".repeat(500) }))).toBeNull();
  });

  it("accepts IPv6 and drops brackets and an IPv4 port", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "2001:DB8::1" }))).toBe("2001:db8::1");
    expect(clientIp(new Headers({ "x-forwarded-for": "[2001:db8::2]:443" }))).toBe("2001:db8::2");
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.9:51234" }))).toBe("203.0.113.9");
  });

  it("is null when neither header is present", () => {
    expect(clientIp(new Headers())).toBeNull();
    expect(clientIp(new Headers({ "x-real-ip": "  " }))).toBeNull();
  });
});

describe("hashIp", () => {
  it("is 32 lower-case hex characters and stable for one secret", () => {
    const a = hashIp("203.0.113.7", SECRET);
    expect(a).toMatch(new RegExp(`^[0-9a-f]{${IP_HASH_LENGTH}}$`));
    expect(hashIp("203.0.113.7", SECRET)).toBe(a);
  });

  it("never contains the raw IP and changes with the secret or the IP", () => {
    const a = hashIp("203.0.113.7", SECRET)!;
    expect(a).not.toContain("203");
    expect(hashIp("203.0.113.7", "another-secret")).not.toBe(a);
    expect(hashIp("203.0.113.8", SECRET)).not.toBe(a);
  });

  it("passes null through", () => {
    expect(hashIp(null, SECRET)).toBeNull();
    expect(ipHashFromHeaders(new Headers(), SECRET)).toBeNull();
  });

  it("hashes the forwarded client, not the proxy", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(ipHashFromHeaders(headers, SECRET)).toBe(hashIp("203.0.113.7", SECRET));
  });
});
