"use client";

import {
  useState,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
  RefObject,
  Fragment,
  use,
} from "react";
import Decimal from "decimal.js";
import { formatJapaneseLargeNumber } from "./utils/currencyFormatter";
import { useCorporate } from "./hooks/useCorporate";
import ProductionModal from "./modal";
import { makePriceTable } from "./utils/priceTableMaker";

const MAX_BOOST_COUNT = 100000; // 最大の強化回数
const ACCELERATION = 0.99; // 生産速度の加速度
const TAX_RATE = 2;
const COMEBACK_RATE = 3.16; // 輪廻転生の際に生産速度が倍になる倍率
const INITIAL_ABECOIN = new Decimal("1e2");
const INITIAL_NEXT_BOOST = {
  target: 4,
  required: 3,
  requiredAmount: new Decimal(20),
  benefitTarget: [0],
  benefitMultiplier: 2,
};
const INITIAL_IS_AVAILABLE = [
  true,
  true,
  true,
  true,
  false,
  false,
  false,
  false,
];
const MIN_TICK = 10; // 最小のインターバル時間（ミリ秒）

const PRICE_TABLES = [
  makePriceTable(2, 3),
  makePriceTable(3, 4),
  makePriceTable(5, 5),
  makePriceTable(7, 6),
  makePriceTable(9, 7),
  makePriceTable(11, 8),
  makePriceTable(13, 9),
  makePriceTable(35, 10),
];

export default function Home() {
  const [boostCount, setBoostCount] = useState(0);
  const boostCountRef = useRef(boostCount);
  useEffect(() => {
    boostCountRef.current = boostCount;
  }, [boostCount]);
  const [basetick, setBasetick] = useState(1);
  const basetickRef = useRef(basetick);
  useEffect(() => {
    basetickRef.current = basetick;
  }, [basetick]);
  const [showProduction, setShowProduction] = useState(false);
  const [production, setProduction] = useState(new Decimal(0));
  const [readyToShowModal, setReadyToShowModal] = useState(false);
  const productionRef = useRef(production);
  const [reincarnationCount, setReincarnationCount] = useState(0);
  const reincarnationCountRef = useRef(reincarnationCount);
  useEffect(() => {
    reincarnationCountRef.current = reincarnationCount;
  }, [reincarnationCount]);
  const [isAvailable, setIsAvailable] = useState(INITIAL_IS_AVAILABLE);
  const isAvailableRef = useRef(isAvailable);
  useEffect(() => {
    isAvailableRef.current = isAvailable;
  }, [isAvailable]);
  const [nextBoost, setNextBoost] = useState(INITIAL_NEXT_BOOST);
  const nextBoostRef = useRef(nextBoost);
  useEffect(() => {
    nextBoostRef.current = nextBoost;
  }, [nextBoost]);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(isLoaded);
  useEffect(() => {
    isLoadedRef.current = isLoaded;
  }, [isLoaded]);
  const [intervalTime, setIntervalTime] = useState(1000 / basetick);
  const intervalTimeRef = useRef(intervalTime);
  useEffect(() => {
    intervalTimeRef.current = intervalTime;
  }, [intervalTime]);
  const [abecoinAmount, setAbecoinAmount] = useState(() => INITIAL_ABECOIN);
  const abecoinAmountRef = useRef(abecoinAmount);
  useEffect(() => {
    abecoinAmountRef.current = abecoinAmount;
  }, [abecoinAmount]);
  const [requiredAbecoinToBoostInterval, setRequiredAbecoinToBoostInterval] =
    useState(() => new Decimal(1000));
  const requiredAbecoinToBoostIntervalRef = useRef(
    requiredAbecoinToBoostInterval
  );
  useEffect(() => {
    requiredAbecoinToBoostIntervalRef.current = requiredAbecoinToBoostInterval;
  }, [requiredAbecoinToBoostInterval]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isInfinity, setIsInfinity] = useState(false);
  const [hiddenCoefficient, setHiddenCoefficient] = useState(new Decimal(1));
  const hiddenCoefficientRef = useRef(hiddenCoefficient);
  useEffect(() => {
    hiddenCoefficientRef.current = hiddenCoefficient;
  }, [hiddenCoefficient]);

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
  const upgradeList: ((x: number) => void)[] = Array(PRICE_TABLES.length).fill(
    () => {}
  );
  const maxUpgradeList: (() => void)[] = Array(PRICE_TABLES.length).fill(
    () => {}
  );
  const productivityRefList: RefObject<Decimal>[] = Array(
    PRICE_TABLES.length
  ).fill(new Decimal(4));
  const internalIntervalRefList: RefObject<NodeJS.Timeout | null>[] = Array(
    PRICE_TABLES.length
  ).fill(null);
  const powerRef = useRef(powerList);
  useEffect(() => {
    powerRef.current = powerList;
  }, [powerList]);
  const fundsRef = useRef(fundsList);
  useEffect(() => {
    fundsRef.current = fundsList;
  }, [fundsList]);
  const orderRef = useRef(orderList);
  useEffect(() => {
    orderRef.current = orderList;
  }, [orderList]);

  for (let i = PRICE_TABLES.length - 1; i >= 0; i--) {
    const {
      power,
      setPower,
      funds,
      setFunds,
      order,
      setOrder,
      upgrade,
      maxUpgrade,
      productivityRef,
      internalIntervalRef,
    } = useCorporate(
      PRICE_TABLES[i],
      abecoinAmount,
      setAbecoinAmount,
      intervalTime,
      i === PRICE_TABLES.length - 1 ? null : productivityRefList[i + 1],
      hiddenCoefficientRef
    );
    powerList[i] = power;
    setPowerList[i] = setPower;
    fundsList[i] = funds;
    setFundsList[i] = setFunds;
    orderList[i] = order;
    setOrderList[i] = setOrder;
    upgradeList[i] = upgrade;
    maxUpgradeList[i] = maxUpgrade;
    productivityRefList[i] = productivityRef;
    internalIntervalRefList[i] = internalIntervalRef;
  }

  // 1秒ごとにローカルストレージに保存
  useEffect(() => {
    const saveData = () => {
      localStorage.setItem("boostCount", boostCountRef.current.toString());
      localStorage.setItem("basetick", basetickRef.current.toString());
      localStorage.setItem(
        "reincarnationCount",
        reincarnationCountRef.current.toString()
      );
      localStorage.setItem(
        "isAvailable",
        JSON.stringify(isAvailableRef.current)
      );
      localStorage.setItem("nextBoost", JSON.stringify(nextBoostRef.current));
      localStorage.setItem("intervalTime", intervalTimeRef.current.toString());
      localStorage.setItem("abecoin", abecoinAmountRef.current.toString());
      localStorage.setItem(
        "requiredAbecoinToBoostInterval",
        requiredAbecoinToBoostIntervalRef.current.toString()
      );
      localStorage.setItem(
        "hiddenCoefficient",
        hiddenCoefficientRef.current.toString()
      );
      localStorage.setItem("lastPlayedAt", Date.now().toString());
      for (let i = 0; i < PRICE_TABLES.length; i++) {
        localStorage.setItem(`power-${i + 1}`, powerRef.current[i].toString());
        localStorage.setItem(`funds-${i + 1}`, fundsRef.current[i].toString());
        localStorage.setItem(`order-${i + 1}`, orderRef.current[i].toString());
      }
    };
    setInterval(() => {
      console.log("Saving data to localStorage...");
      if (isLoadedRef.current) {
        saveData();
      }
    }, 1000);
  }, []);

  // 隠し係数の更新
  useEffect(() => {
    if (intervalTime < MIN_TICK) {
      setHiddenCoefficient(() => new Decimal(MIN_TICK).div(intervalTime));
    }
  }, [intervalTime]);

  // マウント時の処理
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      // 単位時間ごとにお金を増やす
      setAbecoinAmount((prev) =>
        prev.plus(
          hiddenCoefficientRef.current.mul(productivityRefList[0].current)
        )
      );
    }, Math.max(intervalTime, MIN_TICK));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalTime]);

  // マウント時データを取得する
  useEffect(() => {
    setBoostCount((prev) => {
      const item = localStorage.getItem("boostCount");
      if (item !== null) {
        return Number(item);
      } else {
        return prev;
      }
    });
    setHiddenCoefficient((prev) => {
      const item = localStorage.getItem("hiddenCoefficient");
      if (item !== null) {
        return new Decimal(item);
      } else {
        return prev;
      }
    });
    setReincarnationCount((prev) => {
      const item = localStorage.getItem("reincarnationCount");
      if (item !== null) {
        return Number(item);
      } else {
        return prev;
      }
    });
    setNextBoost((prev) => {
      const item = localStorage.getItem("nextBoost");
      if (item !== null) {
        const parsedItem = JSON.parse(item) as NextBoostType;
        parsedItem.requiredAmount = new Decimal(parsedItem.requiredAmount);
        return parsedItem;
      } else {
        return prev;
      }
    });
    setIsAvailable((prev) => {
      const item = localStorage.getItem("isAvailable");
      if (item !== null) {
        return JSON.parse(item) as boolean[];
      } else {
        return prev;
      }
    });
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
        return new Decimal(item);
      } else {
        return prev;
      }
    });
    setRequiredAbecoinToBoostInterval((prev) => {
      const item = localStorage.getItem("requiredAbecoinToBoostInterval");
      if (item !== null) {
        return new Decimal(item);
      } else {
        return prev;
      }
    });
    setBasetick((prev) => {
      const item = localStorage.getItem("basetick");
      if (item !== null) {
        return Number(item);
      } else {
        return prev;
      }
    });
    for (let i = 0; i < PRICE_TABLES.length; i++) {
      setPowerList[i]((prev) => {
        const item = localStorage.getItem(`power-${i + 1}`);
        if (item !== null) {
          return new Decimal(item);
        } else {
          return prev;
        }
      });
      setFundsList[i]((prev) => {
        const item = localStorage.getItem(`funds-${i + 1}`);
        if (item !== null) {
          return new Decimal(item);
        } else {
          return prev;
        }
      });
      setOrderList[i]((prev) => {
        const item = localStorage.getItem(`order-${i + 1}`);
        if (item !== null) {
          return new Decimal(item);
        } else {
          return prev;
        }
      });
    }

    setIsLoaded(() => true);
  }, []);

  // 無限大のチェック
  useEffect(() => {
    if (abecoinAmount.greaterThanOrEqualTo(1e10000)) {
      // 生産量を管理するintervalRef.current のインターバルをクリア
      intervalRef.current && clearInterval(intervalRef.current);
      for (let i = 0; i < PRICE_TABLES.length; i++) {
        const internalIntervalRef = internalIntervalRefList[i];
        if (internalIntervalRef.current !== null) {
          clearInterval(internalIntervalRef.current);
        }
      }
      setIsInfinity(() => true);
    }
  }, [abecoinAmount]);

  // 生産量を監視するための参照を更新
  useEffect(() => {
    productionRef.current = production;
  }, [production]);

  // 最後に遊んだ時間を1秒ごとに保存
  useEffect(() => {
    setInterval(() => {
      localStorage.setItem("lastPlayedAt", Date.now().toString());
    }, 1000);
  }, []);

  // 差分を計算
  useEffect(() => {
    if (isLoaded) {
      const lastPlayedStr = localStorage.getItem("lastPlayedAt");
      if (lastPlayedStr) {
        const lastPlayed = parseInt(lastPlayedStr, 10);
        const now = Date.now();
        const diffMs = now - lastPlayed; // 経過ミリ秒

        const totalTicks = Math.floor(diffMs / intervalTime);

        const calculatedProduction =
          productivityRefList[0].current.mul(totalTicks);
        setAbecoinAmount((prev) => {
          return prev.plus(calculatedProduction);
        });
        for (let i = 1; i < PRICE_TABLES.length; i++) {
          setFundsList[i - 1]((prev) =>
            prev.plus(productivityRefList[i].current.mul(totalTicks))
          );
        }
        console.log(calculatedProduction);
        setProduction(() => calculatedProduction);
        setReadyToShowModal(() => true);
      }
    }
  }, [isLoaded]);

  // モーダルを表示するための処理
  useEffect(() => {
    if (readyToShowModal) {
      setShowProduction(() => true);
    }
  }, [readyToShowModal]);

  // 徴税ボタンの処理
  const collectTax = (): void => {
    setAbecoinAmount((prev) =>
      prev.plus(productivityRefList[0].current.mul(TAX_RATE))
    );
  };

  const boostInterval = (): void => {
    if (boostCount >= MAX_BOOST_COUNT) {
      alert("これ以上強化できません。");
      return;
    }
    setAbecoinAmount((prev) => prev.minus(requiredAbecoinToBoostInterval));
    setIntervalTime((prev) => prev * ACCELERATION);
    setBoostCount((prev) => prev + 1);
    setRequiredAbecoinToBoostInterval((prev) => prev.mul(10));
  };

  const boostIntervalMax = (): void => {
    let boostCountCache = boostCount;
    let abecoinAmountCache = abecoinAmount;
    let requiredAbecoinToBoostIntervalCache = requiredAbecoinToBoostInterval;
    let intervalTimeCache = intervalTime;
    while (
      boostCountCache < MAX_BOOST_COUNT &&
      abecoinAmountCache.greaterThanOrEqualTo(
        requiredAbecoinToBoostIntervalCache
      )
    ) {
      abecoinAmountCache = abecoinAmountCache.minus(
        requiredAbecoinToBoostIntervalCache
      );
      intervalTimeCache = intervalTimeCache * ACCELERATION;
      boostCountCache++;
      requiredAbecoinToBoostIntervalCache =
        requiredAbecoinToBoostIntervalCache.mul(10);
    }
    setAbecoinAmount(() => abecoinAmountCache);
    setIntervalTime(() => intervalTimeCache);
    setBoostCount(() => boostCountCache);
    setRequiredAbecoinToBoostInterval(
      () => requiredAbecoinToBoostIntervalCache
    );
  };

  const resetProgress = (): void => {
    setReincarnationCount(0);
    setIntervalTime(1000);
    setBoostCount(0);
    setHiddenCoefficient(new Decimal(1));
    setBasetick(1);
    setAbecoinAmount(new Decimal(INITIAL_ABECOIN));
    setIsAvailable(() => INITIAL_IS_AVAILABLE);
    setNextBoost(INITIAL_NEXT_BOOST);
    setRequiredAbecoinToBoostInterval(new Decimal(1000));
    for (let i = 0; i < PRICE_TABLES.length; i++) {
      setPowerList[i](new Decimal(1));
      setFundsList[i](new Decimal(0));
      setOrderList[i](new Decimal(0));
    }
  };

  return (
    <>
      <ProductionModal
        showProduction={showProduction}
        setShowProduction={setShowProduction}
        productionRef={productionRef}
      />
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4 gap-1">
        <h1 className="text-3xl font-bold mb-4">
          美しい国、<span className="text-red-500">日本</span>
        </h1>
        <h2 className="flex items-center mb-2 text-sm">
          <div className="flex items-start gap-2">
            <span>現在の安倍コイン: </span>
            <span className="inline-block w-[5rem] text-start font-bold">
              {formatJapaneseLargeNumber(abecoinAmount)}
            </span>
          </div>
          <button
            className="bg-purple-600 text-white text-sm px-2 py-2 rounded-md h-[32px] ml-4 disabled:bg-gray-400 disabled:cursor-not-allowed active:bg-purple-700 flex items-center justify-center"
            onClick={collectTax}
            disabled={productivityRefList[0].current.equals(0)}
          >
            徴税
          </button>
        </h2>
        <h3 className="text-xs">
          GDP +
          {formatJapaneseLargeNumber(
            productivityRefList[0].current.mul(1000 / intervalTime)
          )}{" "}
          /秒
        </h3>
        <h3 className="text-red-500 text-xs">
          {isInfinity
            ? "システムの上限に達したため自動生産を中止しました。"
            : ""}
        </h3>
        <hr className="my-2 border-gray-300 w-[90%] max-w-100" />
        <div className="flex w-auto gap-10 items-center min-h-[84px]">
          <div className="flex flex-col items-start">
            <h3 className="text-sm">生産速度 </h3>
            <span className="text-xs text-start">
              ×{(1000 / intervalTime).toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-2 items-start justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={boostInterval}
                className="bg-green-600 text-white text-sm px-2 py-2 rounded-md h-[32px] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={
                  requiredAbecoinToBoostInterval.greaterThan(abecoinAmount) ||
                  MAX_BOOST_COUNT <= boostCount
                }
              >
                速度強化
              </button>
              <button
                onClick={boostIntervalMax}
                className="text-sm bg-green-900 px-2 py-2 rounded-md text-white disabled:bg-gray-400 disabled:cursor-not-allowed h-[32px] flex items-center justify-center"
                disabled={
                  requiredAbecoinToBoostInterval.greaterThan(abecoinAmount) ||
                  MAX_BOOST_COUNT <= boostCount
                }
              >
                最大強化
              </button>
            </div>
            <span className="text-xs leading-3">
              {formatJapaneseLargeNumber(requiredAbecoinToBoostInterval)}
            </span>
          </div>
        </div>
        {Array.from({ length: PRICE_TABLES.length }, (_, i) => i).map((i) => {
          return (
            <Fragment key={i}>
              {(i === 0 ||
                (isAvailable[i] &&
                  fundsList[i - 1] &&
                  fundsList[i - 1].greaterThan(0))) && (
                <>
                  <hr className="my-2 border-gray-300 w-[90%] max-w-100" />
                  <Corp
                    rank={`${i + 1}次請け`}
                    power={powerList[i]}
                    funds={fundsList[i]}
                    upgrade={upgradeList[i]}
                    maxUpgrade={maxUpgradeList[i]}
                    order={orderList[i]}
                    abecoinAmount={abecoinAmount}
                    priceTable={PRICE_TABLES[i]}
                  />
                </>
              )}
            </Fragment>
          );
        })}
        <hr className="my-2 border-gray-300 w-[90%] max-w-100" />
        <div className="flex justify-evenly w-[90%] max-w-100">
          <UnlockButton
            setRequiredAbecoinToBoostInterval={
              setRequiredAbecoinToBoostInterval
            }
            setIsAvailable={setIsAvailable}
            fundsList={fundsList}
            setAbecoinAmount={setAbecoinAmount}
            setOrderList={setOrderList}
            setIntervalTime={setIntervalTime}
            setPowerList={setPowerList}
            setFundsList={setFundsList}
            nextBoost={nextBoost}
            setNextBoost={setNextBoost}
            basetick={basetick}
            reincarnationCount={reincarnationCount}
            setReincarnationCount={setReincarnationCount}
            setBasetick={setBasetick}
            setHiddenCoefficient={setHiddenCoefficient}
            setBoostCount={setBoostCount}
          />
          <ReincarnationButton
            setRequiredAbecoinToBoostInterval={
              setRequiredAbecoinToBoostInterval
            }
            setIsAvailable={setIsAvailable}
            fundsList={fundsList}
            setAbecoinAmount={setAbecoinAmount}
            setOrderList={setOrderList}
            setIntervalTime={setIntervalTime}
            setPowerList={setPowerList}
            setFundsList={setFundsList}
            nextBoost={nextBoost}
            setNextBoost={setNextBoost}
            basetick={basetick}
            reincarnationCount={reincarnationCount}
            setReincarnationCount={setReincarnationCount}
            setBasetick={setBasetick}
            setHiddenCoefficient={setHiddenCoefficient}
            setBoostCount={setBoostCount}
          />
        </div>
        <div className="h-20 flex flex-col justify-end">
          <ResetButton resetProgress={resetProgress} />
        </div>
      </main>
    </>
  );
}

type CorpProps = {
  rank: String;
  power: Decimal;
  funds: Decimal;
  upgrade: (x: number) => void;
  maxUpgrade: () => void;
  order: Decimal;
  abecoinAmount: Decimal;
  priceTable: Decimal[];
};

const Corp: React.FC<CorpProps> = ({
  rank,
  power,
  funds,
  upgrade,
  maxUpgrade,
  order,
  abecoinAmount,
  priceTable,
}) => {
  const [isMax, setIsMax] = useState(
    priceTable.length <= Decimal.floor(order.dividedBy(10)).toNumber()
  );

  useEffect(() => {
    setIsMax(
      () => priceTable.length <= Decimal.floor(order.dividedBy(10)).toNumber()
    );
  }, [order]);

  const getMaxAffordablePurchases = (): number => {
    const unitPrice =
      priceTable[Decimal.floor(order.dividedBy(10)).toNumber()] ?? undefined;
    if (unitPrice) {
      const max = new Decimal(10).minus(order.mod(10));
      const affordablePurchases = Decimal.floor(
        abecoinAmount.dividedBy(unitPrice)
      );
      return Decimal.min(max, affordablePurchases).toNumber();
    } else {
      return 0;
    }
  };

  const getFormattedPrice = () => {
    const minPrice = priceTable[Decimal.floor(order.dividedBy(10)).toNumber()];
    if (minPrice) {
      const maxAffordablePurchases = getMaxAffordablePurchases();
      if (maxAffordablePurchases === 0) {
        return formatJapaneseLargeNumber(minPrice);
      } else {
        return formatJapaneseLargeNumber(minPrice.mul(maxAffordablePurchases));
      }
    } else {
      return null;
    }
  };

  return (
    <div className="flex w-auto gap-10 items-center min-h-[84px]">
      <div className="flex flex-col items-start w-32 gap-1">
        <h3 className="text-sm">{rank}</h3>
        <p className="text-xs text-left">
          生産力: ×{formatJapaneseLargeNumber(power)}
        </p>
        <p className="text-xs text-left">
          資金: {formatJapaneseLargeNumber(funds)}
        </p>
      </div>
      <div className="w-48 flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <button
            className={`${
              funds.equals(0) ? "bg-purple-600" : "bg-purple-400"
            } px-2 py-2 rounded-md h-[32px] disabled:bg-gray-400 disabled:cursor-not-allowed relative overflow-hidden flex items-center justify-center`}
            onClick={() => upgrade(getMaxAffordablePurchases())}
            disabled={
              isMax ||
              abecoinAmount.lessThan(
                priceTable[Decimal.floor(order.dividedBy(10)).toNumber()] ??
                  new Decimal(0)
              )
            }
          >
            {/* 塗りつぶし部分 */}
            <div
              className="absolute top-0 left-0 h-full rounded-md bg-purple-600"
              style={{
                width: `${
                  funds.equals(0)
                    ? 0
                    : (getMaxAffordablePurchases() + order.mod(10).toNumber()) *
                      10
                }%`,
              }}
            ></div>
            <span className="text-white relative z-10 text-sm">
              {isMax ? "MAX" : funds.equals(0) ? "資金提供" : "生産力強化"}
            </span>
          </button>
          <button
            onClick={maxUpgrade}
            disabled={
              funds.equals(0) ||
              isMax ||
              abecoinAmount.lessThan(
                priceTable[Decimal.floor(order.dividedBy(10)).toNumber()] ??
                  new Decimal(0)
              )
            }
            className="bg-purple-800 text-white text-sm px-2 py-2 rounded-md h-[32px] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            最大強化
          </button>
        </div>
        {funds.equals(0) ? (
          <span className="text-xs">
            {formatJapaneseLargeNumber(
              priceTable[Decimal.floor(order.dividedBy(10)).toNumber()] ??
                new Decimal(0)
            )}
          </span>
        ) : (
          <span className="text-xs">{getFormattedPrice()}</span>
        )}
      </div>
    </div>
  );
};

type ResetButtonProps = {
  resetProgress: () => void;
};

const ResetButton: React.FC<ResetButtonProps> = ({ resetProgress }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");

  const requiredText = "安倍晋三";

  const handleReset = () => {
    // 実際のリセット処理を書く
    resetProgress();
    setIsOpen(false);
    setInputText("");
  };

  return (
    <div>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        onClick={() => setIsOpen(true)}
      >
        売国
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-xl w-[90%]">
            <h2 className="text-lg font-semibold mb-4">
              ゲームをリセットしますか？（すべての情報が消去されます）
            </h2>
            <p className="mb-2">
              「<span className="font-mono font-bold">{requiredText}</span>
              」と入力してください。
            </p>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setInputText("");
                }}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                戻る
              </button>
              <button
                onClick={handleReset}
                disabled={inputText !== requiredText}
                className={`px-4 py-2 rounded text-white ${
                  inputText === requiredText
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type NextBoostType = {
  target: number;
  required: number;
  requiredAmount: Decimal;
  benefitTarget: number[];
  benefitMultiplier: number;
};

type ButtonProps = {
  setIsAvailable: Dispatch<SetStateAction<boolean[]>>;
  setPowerList: Dispatch<SetStateAction<Decimal>>[];
  fundsList: Decimal[];
  setOrderList: Dispatch<SetStateAction<Decimal>>[];
  setFundsList: Dispatch<SetStateAction<Decimal>>[];
  setIntervalTime: Dispatch<SetStateAction<number>>;
  setAbecoinAmount: Dispatch<SetStateAction<Decimal>>;
  nextBoost: NextBoostType;
  setNextBoost: Dispatch<SetStateAction<NextBoostType>>;
  setRequiredAbecoinToBoostInterval: Dispatch<SetStateAction<Decimal>>;
  basetick: number;
  setBasetick: Dispatch<SetStateAction<number>>;
  reincarnationCount: number;
  setReincarnationCount: Dispatch<SetStateAction<number>>;
  setHiddenCoefficient: Dispatch<SetStateAction<Decimal>>;
  setBoostCount: Dispatch<SetStateAction<number>>;
};

const UnlockButton: React.FC<ButtonProps> = ({
  setIsAvailable,
  fundsList,
  setPowerList,
  setFundsList,
  setOrderList,
  setIntervalTime,
  setAbecoinAmount,
  nextBoost,
  setNextBoost,
  setRequiredAbecoinToBoostInterval,
  basetick,
  setHiddenCoefficient,
  setBoostCount,
}) => {
  const boost = () => {
    setBoostCount(() => 0);
    setHiddenCoefficient(new Decimal(1));
    setRequiredAbecoinToBoostInterval(new Decimal(1000));
    setAbecoinAmount(() => INITIAL_ABECOIN);
    setIntervalTime(1000 / basetick);
    for (let i of nextBoost.benefitTarget) {
      setPowerList[i]((prev) => prev.mul(2));
    }
    for (let i = 0; i < PRICE_TABLES.length; i++) {
      setFundsList[i](() => new Decimal(0));
      setOrderList[i](() => new Decimal(0));
    }
    if (nextBoost.target < PRICE_TABLES.length) {
      setIsAvailable((prev) => {
        const newIsAvailable = [...prev];
        newIsAvailable[nextBoost.target] = true;
        return newIsAvailable;
      });
    }
    setNextBoost((prev) => {
      const nextBenefitTarget = [...prev.benefitTarget];
      if (prev.benefitTarget.length < PRICE_TABLES.length) {
        nextBenefitTarget.push(prev.benefitTarget.length);
      }
      console.log(prev.requiredAmount);
      return {
        target:
          prev.target < PRICE_TABLES.length - 1 ? prev.target + 1 : prev.target,
        required:
          prev.required < PRICE_TABLES.length - 1
            ? prev.required + 1
            : prev.required,
        requiredAmount:
          prev.required === PRICE_TABLES.length - 1
            ? prev.requiredAmount.plus(15)
            : prev.requiredAmount,
        benefitTarget: nextBenefitTarget,
        benefitMultiplier: 2,
      };
    });
  };

  return (
    <div className="w-[48%] flex flex-col gap-2">
      <p className="text-xs text-red-500">
        条件: {nextBoost.required + 1}次請け 資金{" "}
        {nextBoost.requiredAmount.toString()}
      </p>
      <button
        className="border px-3 py-3 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed h-[140px] flex flex-col items-center justify-center text-center"
        onClick={boost}
        disabled={fundsList[nextBoost.required].lessThan(
          nextBoost.requiredAmount
        )}
      >
        <h3 className="text-sm font-bold">アベノミクス</h3>
        <p className="text-xs">
          安倍コイン、資産、生産速度をリセットし、
          {nextBoost.benefitTarget.map((n) => `${n + 1}次`).join("、")}
          請け企業の生産力を2倍にする。
        </p>
      </button>
    </div>
  );
};

const ReincarnationButton: React.FC<ButtonProps> = ({
  setIsAvailable,
  fundsList,
  setPowerList,
  setFundsList,
  setOrderList,
  setIntervalTime,
  setAbecoinAmount,
  nextBoost,
  setNextBoost,
  setRequiredAbecoinToBoostInterval,
  basetick,
  reincarnationCount,
  setReincarnationCount,
  setBasetick,
  setHiddenCoefficient,
  setBoostCount,
}) => {
  const reincarnate = () => {
    setBoostCount(() => 0);
    setAbecoinAmount(INITIAL_ABECOIN);
    setHiddenCoefficient(new Decimal(1));
    setIsAvailable(INITIAL_IS_AVAILABLE);
    setIntervalTime(1000 / (basetick * COMEBACK_RATE));
    setNextBoost(INITIAL_NEXT_BOOST);
    setRequiredAbecoinToBoostInterval(new Decimal(1000));
    setReincarnationCount((prev) => ++prev);
    for (let i = 0; i < PRICE_TABLES.length; i++) {
      setPowerList[i](() => new Decimal(1));
      setFundsList[i](() => new Decimal(0));
      setOrderList[i](() => new Decimal(0));
    }

    setBasetick((prev) => prev * COMEBACK_RATE);
  };

  return (
    <div className="w-[48%] flex flex-col gap-2">
      <p className="text-xs text-red-500">
        条件: 8次請け 資金 {80 + reincarnationCount * 60}
      </p>
      <button
        className="border px-3 py-3 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed h-[140px] flex flex-col items-center justify-center text-center"
        disabled={
          !fundsList[7].greaterThanOrEqualTo(80 + reincarnationCount * 60)
        }
        onClick={reincarnate}
      >
        <h3 className="text-sm font-bold">
          <ruby>
            輪廻転生<rt>カムバック</rt>
          </ruby>
        </h3>
        <p className="text-xs">
          安倍コイン、生産力、資産、生産速度をリセットし、 生産速度を
          {COMEBACK_RATE}倍にする。
        </p>
      </button>
    </div>
  );
};
