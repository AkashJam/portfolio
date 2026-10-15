import { describe, expect, it } from "vitest";

import type { Sensor } from "@/lib/market-schemas";
import { findSensor, isSimulated, sensorTitle } from "@/lib/sensor-title";

const base: Sensor = {
  symbol: "MUFG",
  name: "Mitsubishi UFJ Financial Group",
  group: "country",
  country: "Japan",
  theme: null,
  region: "Asia-Pacific",
  liquidity: null,
  note: null,
  liquidityUsdM: null,
  liquidityAsOf: null,
  order: 1,
};

describe("sensorTitle", () => {
  it("names a country sensor by its country", () => {
    expect(sensorTitle(base)).toEqual({
      place: "Japan",
      heading: "Japan · MUFG",
      sub: "Mitsubishi UFJ Financial Group · country sensor",
    });
  });

  it("names a global sensor by its theme", () => {
    const t = sensorTitle({ ...base, symbol: "NVDA", name: "NVIDIA", group: "global", country: null, theme: "Semiconductors" });
    expect(t.heading).toBe("Semiconductors · NVDA");
    expect(t.sub).toBe("NVIDIA · global sensor");
  });

  it("carries the note beside the company", () => {
    expect(sensorTitle({ ...base, symbol: "BCH", country: "Chile", note: "telecom" }).sub).toBe(
      "Mitsubishi UFJ Financial Group · country sensor · telecom",
    );
  });
});

describe("findSensor", () => {
  it("finds by symbol and answers null for anything else", () => {
    expect(findSensor([base], "MUFG")).toBe(base);
    expect(findSensor([base], "IXN")).toBeNull();
    expect(findSensor(null, "MUFG")).toBeNull();
  });
});

describe("isSimulated", () => {
  it("is the SIM: prefix", () => {
    expect(isSimulated("SIM:NOVA")).toBe(true);
    expect(isSimulated("MUFG")).toBe(false);
  });
});
