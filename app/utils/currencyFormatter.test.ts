import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { formatJapaneseLargeNumber } from "./currencyFormatter";

describe("formatJapaneseLargeNumber", () => {
  it("formats numbers with extralarge units", () => {
    expect(formatJapaneseLargeNumber(new Decimal("1e73"))).toBe(
      "10.00万無量大数"
    );
  });
  expect(formatJapaneseLargeNumber(new Decimal("1e3592"))).toBe("1.00億多婆羅");
  it("formats numbers with correct Japanese units", () => {
    expect(formatJapaneseLargeNumber(new Decimal("123456789"))).toBe("1.23億");
    expect(formatJapaneseLargeNumber(new Decimal("1234567890123"))).toBe(
      "1.23兆"
    );
    expect(formatJapaneseLargeNumber(new Decimal("12345"))).toBe("1.23万");
    expect(formatJapaneseLargeNumber(new Decimal("123"))).toBe("123.00");
  });

  it("formats extremely large numbers", () => {
    expect(formatJapaneseLargeNumber(new Decimal("1e3584"))).toBe("1.00多婆羅");
    expect(formatJapaneseLargeNumber(new Decimal("1e68"))).toBe("1.00無量大数");
    expect(formatJapaneseLargeNumber(new Decimal("1e64"))).toBe("1.00不可思議");
    expect(formatJapaneseLargeNumber(new Decimal("1e60"))).toBe("1.00那由他");
    expect(formatJapaneseLargeNumber(new Decimal("1e56"))).toBe("1.00阿僧祇");
    expect(formatJapaneseLargeNumber(new Decimal("1e52"))).toBe("1.00恒河沙");
    expect(formatJapaneseLargeNumber(new Decimal("1e48"))).toBe("1.00極");
  });

  it("formats small numbers without unit", () => {
    expect(formatJapaneseLargeNumber(new Decimal("1"))).toBe("1.00");
    expect(formatJapaneseLargeNumber(new Decimal("0.5"))).toBe("0.5");
  });
});
