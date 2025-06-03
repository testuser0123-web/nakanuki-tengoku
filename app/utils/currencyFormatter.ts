import Decimal from "decimal.js";

export function formatJapaneseLargeNumber(value: Decimal): string {
  const units = [
    { value: new Decimal("1e7168"), label: "界分" },
    { value: new Decimal("1e3584"), label: "多婆羅" },
    { value: new Decimal("1e1792"), label: "阿婆羅" },
    { value: new Decimal("1e896"), label: "摩婆羅" },
    { value: new Decimal("1e448"), label: "最勝" },
    { value: new Decimal("1e224"), label: "阿伽羅" },
    { value: new Decimal("1e112"), label: "矜羯羅" },
    { value: new Decimal("1e68"), label: "無量大数" },
    { value: new Decimal("1e64"), label: "不可思議" },
    { value: new Decimal("1e60"), label: "那由他" },
    { value: new Decimal("1e56"), label: "阿僧祇" },
    { value: new Decimal("1e52"), label: "恒河沙" },
    { value: new Decimal("1e48"), label: "極" },
    { value: new Decimal("1e44"), label: "載" },
    { value: new Decimal("1e40"), label: "正" },
    { value: new Decimal("1e36"), label: "澗" },
    { value: new Decimal("1e32"), label: "溝" },
    { value: new Decimal("1e28"), label: "穣" },
    { value: new Decimal("1e24"), label: "𥝱" },
    { value: new Decimal("1e20"), label: "垓" },
    { value: new Decimal("1e16"), label: "京" },
    { value: new Decimal("1e12"), label: "兆" },
    { value: new Decimal("1e8"), label: "億" },
    { value: new Decimal("1e4"), label: "万" },
    { value: new Decimal("1"), label: "" },
  ];

  for (const unit of units) {
    if (value.greaterThanOrEqualTo(unit.value)) {
      let mantissa = value.dividedBy(unit.value);
      let formatted = mantissa.toFixed(2);
      if (mantissa.greaterThanOrEqualTo(new Decimal("1e5"))) {
        formatted = formatJapaneseLargeNumber(mantissa);
      }
      return `${formatted}${unit.label}`;
    }
  }

  return value.toFixed();
}
