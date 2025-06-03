import { useState, useRef, useEffect, RefObject } from "react";
import Decimal from "decimal.js";

const ROOT10OF2 = Math.pow(2, 1 / 10);

export function useCorporate(
  priceTable: Decimal[],
  setAbecoinAmount: React.Dispatch<React.SetStateAction<Decimal>>,
  intervalTime: number,
  upperProductivityRef: RefObject<Decimal> | null,
  hiddenCoefficientRef: RefObject<Decimal>
) {
  const [power, setPower] = useState(() => new Decimal(1));
  const [funds, setFunds] = useState(() => new Decimal(0));
  const [order, setOrder] = useState(new Decimal(0));
  const productivityRef = useRef(funds.mul(power));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 増やすお金をリアルタイムで更新
  useEffect(() => {
    productivityRef.current = funds.mul(power);
  }, [power, funds]);

  // マウント時の処理
  useEffect(() => {
    // 前回のインターバルをクリア
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 新しいインターバルをセット
    intervalRef.current = setInterval(() => {
      if (upperProductivityRef) {
        setFunds((prev) =>
          prev.plus(
            hiddenCoefficientRef.current.mul(upperProductivityRef.current)
          )
        );
      }
    }, intervalTime);

    // アンマウント時も含め、クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalTime]);

  const upgrade = (x: number): void => {
    for (let i = 0; i < x; i++) {
      if (funds.equals(0)) {
        setFunds(new Decimal(1));
        setAbecoinAmount((prev) =>
          prev.minus(priceTable[Decimal.floor(order.dividedBy(10)).toNumber()])
        );
        setOrder((prev) => prev.plus(1));
        return;
      }
      setPower((prev) => prev.mul(ROOT10OF2));
      setFunds((prev) => prev.plus(1));
      setAbecoinAmount((prev) =>
        prev.minus(priceTable[Decimal.floor(order.dividedBy(10)).toNumber()])
      );
      setOrder((prev) => prev.plus(1));
    }
  };

  return {
    power,
    setPower,
    funds,
    setFunds,
    order,
    setOrder,
    upgrade,
    productivityRef,
    internalIntervalRef: intervalRef,
  };
}
