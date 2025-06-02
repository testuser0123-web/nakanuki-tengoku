"use client";

import {
  useState,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
  RefObject,
  Fragment,
} from "react";
import Decimal from "decimal.js";
import { formatJapaneseLargeNumber } from "./utils/currencyFormatter";
import { useCorporate } from "./hooks/useCorporate";

const MIN_TICK = 10;
const FIRST_PRICE_TABLE = [2, 5, 8, 11].map(
  (x) => new Decimal("1e" + x.toString())
);
const SECOND_PRICE_TABLE = [3, 6, 9, 12].map(
  (x) => new Decimal("1e" + x.toString())
);
const THIRD_PRICE_TABLE = [4, 6, 9, 12].map(
  (x) => new Decimal("1e" + x.toString())
);
const FOURTH_PRICE_TABLE = [5, 6, 9, 12].map(
  (x) => new Decimal("1e" + x.toString())
);
const PRICE_TABLES = [
  FIRST_PRICE_TABLE,
  SECOND_PRICE_TABLE,
  THIRD_PRICE_TABLE,
  FOURTH_PRICE_TABLE,
];

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [intervalTime, setIntervalTime] = useState(1000); // 初期値は1000ms
  const [abecoinAmount, setAbecoinAmount] = useState(() => new Decimal(100));
  const [requiredAbecoinToBoostInterval, setRequiredAbecoinToBoostInterval] =
    useState(() => new Decimal(1000));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const powerList: Decimal[] = Array(PRICE_TABLES.length).fill(new Decimal(4));
  const setPowerList: Dispatch<SetStateAction<Decimal>>[] = Array(
    PRICE_TABLES.length
  ).fill(() => new Decimal(0));
  const fundsList: Decimal[] = Array(PRICE_TABLES.length).fill(new Decimal(4));
  const setFundsList: Dispatch<SetStateAction<Decimal>>[] = Array(
    PRICE_TABLES.length
  ).fill(() => new Decimal(0));
  const orderList: Decimal[] = Array(PRICE_TABLES.length).fill(new Decimal(4));
  const setOrderList: Dispatch<SetStateAction<Decimal>>[] = Array(
    PRICE_TABLES.length
  ).fill(() => new Decimal(0));
  const upgradeList: (() => void)[] = Array(PRICE_TABLES.length).fill(() => {});
  const productivityRefList: RefObject<Decimal>[] = Array(
    PRICE_TABLES.length
  ).fill(new Decimal(4));

  for (let i = PRICE_TABLES.length - 1; i >= 0; i--) {
    const {
      power,
      setPower,
      funds,
      setFunds,
      order,
      setOrder,
      upgrade,
      productivityRef,
    } = useCorporate(
      PRICE_TABLES[i],
      setAbecoinAmount,
      intervalTime,
      i === PRICE_TABLES.length - 1 ? null : productivityRefList[i + 1]
    );
    powerList[i] = power;
    setPowerList[i] = setPower;
    fundsList[i] = funds;
    setFundsList[i] = setFunds;
    orderList[i] = order;
    setOrderList[i] = setOrder;
    upgradeList[i] = upgrade;
    productivityRefList[i] = productivityRef;
  }

  // マウント時の処理
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      // 単位時間ごとにお金を増やす
      setAbecoinAmount((prev) => prev.plus(productivityRefList[0].current));
    }, intervalTime);

    // MIN_TICKで購入制限
    if (intervalTime == MIN_TICK) {
      setRequiredAbecoinToBoostInterval(new Decimal(Infinity));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalTime]);

  // マウント時データを取得する
  useEffect(() => {
    setIntervalTime((prev) => {
      const item = localStorage.getItem("intervalTime");
      if (item !== null) {
        return Number(item);
      } else {
        return prev;
      }
    });
    setAbecoinAmount((prev) => {
      const item = localStorage.getItem("abecoin");
      if (item !== null) {
        return new Decimal(Number(item));
      } else {
        return prev;
      }
    });
    setRequiredAbecoinToBoostInterval((prev) => {
      const item = localStorage.getItem("requiredAbecoinToBoostInterval");
      if (item !== null) {
        return new Decimal(Number(item));
      } else {
        return prev;
      }
    });

    for (let i = 0; i < PRICE_TABLES.length; i++) {
      setPowerList[i]((prev) => {
        const item = localStorage.getItem(`power-${i + 1}`);
        if (item !== null) {
          return new Decimal(Number(item));
        } else {
          return prev;
        }
      });
      setFundsList[i]((prev) => {
        const item = localStorage.getItem(`funds-${i + 1}`);
        if (item !== null) {
          return new Decimal(Number(item));
        } else {
          return prev;
        }
      });
      setOrderList[i]((prev) => {
        const item = localStorage.getItem(`order-${i + 1}`);
        if (item !== null) {
          return new Decimal(Number(item));
        } else {
          return prev;
        }
      });
    }

    setIsLoaded(() => true);
  }, []);

  // データを保存する
  useEffect(() => {
    const saveData = () => {
      if (isLoaded) {
        localStorage.setItem("intervalTime", intervalTime.toString());
        localStorage.setItem("abecoin", abecoinAmount.toString());
        for (let i = 0; i < PRICE_TABLES.length; i++) {
          localStorage.setItem(`power-${i + 1}`, powerList[i].toString());
          localStorage.setItem(`funds-${i + 1}`, fundsList[i].toString());
          localStorage.setItem(`order-${i + 1}`, orderList[i].toString());
        }
        localStorage.setItem(
          "requiredAbecoinToBoostInterval",
          requiredAbecoinToBoostInterval.toString()
        );
      }
    };
    window.addEventListener("beforeunload", saveData);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveData();
    });
    return () => {
      window.removeEventListener("beforeunload", saveData);
      window.removeEventListener("visibilitychange", saveData);
    };
  }, [
    isLoaded,
    intervalTime,
    abecoinAmount,
    ...powerList,
    ...fundsList,
    ...orderList,
    requiredAbecoinToBoostInterval,
  ]);

  const collectTax = (): void => {
    setAbecoinAmount((prev) =>
      prev.plus(productivityRefList[0].current.mul(10))
    );
  };

  const boostInterval = (): void => {
    setAbecoinAmount((prev) => prev.minus(requiredAbecoinToBoostInterval));
    setIntervalTime(
      (prev) => Math.max(prev * 0.95, MIN_TICK) // 例えば10%短縮、最小100msまで
    );
    setRequiredAbecoinToBoostInterval((prev) => prev.mul(10));
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4 gap-2">
      <h1 className="text-3xl font-bold mb-4">美しい国、日本</h1>
      <h2 className="mb-2">
        <span className="text-xl font-mono">
          現在の安倍コイン: {formatJapaneseLargeNumber(abecoinAmount)}
        </span>
        <button
          className="bg-purple-600 text-white p-2 rounded-md ml-4"
          onClick={collectTax}
        >
          徴税
        </button>
      </h2>

      <hr className="my-4 border-gray-300 w-[90%] max-w-100" />

      <div className="flex w-auto gap-10 items-center ">
        <div className="flex flex-col items-start w-32 ">
          <h3>生産速度: ×{(1000 / intervalTime).toFixed(2)}</h3>
        </div>
        <div className="w-24">
          <button
            onClick={boostInterval}
            className="bg-green-600 text-white p-2 w-full rounded-md h-16 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={requiredAbecoinToBoostInterval.greaterThan(abecoinAmount)}
          >
            速度強化
            <br />
            <span className="text-xs">
              {formatJapaneseLargeNumber(requiredAbecoinToBoostInterval)}
            </span>
          </button>
        </div>
      </div>

      {Array.from({ length: PRICE_TABLES.length }, (_, i) => i).map((i) => {
        return (
          <Fragment key={i}>
            <hr className="my-4 border-gray-300 w-[90%] max-w-100" />

            <Corp
              rank={`${i + 1}次請け`}
              power={powerList[i]}
              funds={fundsList[i]}
              upgrade={upgradeList[i]}
              order={orderList[i]}
              abecoinAmount={abecoinAmount}
              priceTable={PRICE_TABLES[i]}
            />
          </Fragment>
        );
      })}
    </main>
  );
}

type CorpProps = {
  rank: String;
  power: Decimal;
  funds: Decimal;
  upgrade: () => void;
  order: Decimal;
  abecoinAmount: Decimal;
  priceTable: Decimal[];
};

const Corp: React.FC<CorpProps> = ({
  rank,
  power,
  funds,
  upgrade,
  order,
  abecoinAmount,
  priceTable,
}) => {
  return (
    <div className="flex w-auto gap-10 items-center">
      <div className="flex flex-col items-start w-32">
        <h3>{rank}</h3>
        <p>生産力: ×{power.toFixed(2)}</p>
        <p>資金: {formatJapaneseLargeNumber(funds)}</p>
      </div>
      <div className="w-24">
        <button
          className="bg-purple-600 text-white p-2 rounded-md h-16 w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={upgrade}
          disabled={abecoinAmount.lessThan(
            priceTable[Decimal.floor(order.dividedBy(10)).toNumber()]
          )}
        >
          {funds.equals(0) ? "資金提供" : "生産力強化"}
          <br />
          <span className="text-xs">
            {formatJapaneseLargeNumber(
              priceTable[Decimal.floor(order.dividedBy(10)).toNumber()]
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
