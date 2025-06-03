import Decimal from "decimal.js";

export function makePriceTable(
  initial_exponent: number,
  exponent_step: number
): Decimal[] {
  const priceTable: Decimal[] = [];
  for (let i = 0; i < 10100; i++) {
    const exponent = initial_exponent + i * exponent_step;
    priceTable.push(new Decimal("1e" + exponent.toString()));
  }
  return priceTable;
}
