import { X } from "lucide-react"; // アイコンライブラリ（lucide-react）を使用する場合
import React, { RefObject } from "react";
import { formatJapaneseLargeNumber } from "./utils/currencyFormatter";
import Decimal from "decimal.js";
interface ProductionModalProps {
  showProduction: boolean;
  setShowProduction: (value: boolean) => void;
  productionRef: RefObject<Decimal>;
}

const ProductionModal: React.FC<ProductionModalProps> = ({
  showProduction,
  setShowProduction,
  productionRef,
}) => {
  if (!showProduction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.50)]">
      <div className="relative w-[90%] max-w-md bg-white rounded-xl shadow-lg p-6">
        {/* 閉じるボタン */}
        <button
          onClick={() => setShowProduction(false)}
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
        >
          <X className="w-8 h-8" />
        </button>

        {/* モーダルの中身 */}
        <h2 className="text-lg font-semibold mb-4">お知らせ</h2>
        <p>
          放置中に
          {formatJapaneseLargeNumber(productionRef.current ?? new Decimal(0))}
          安倍コイン稼ぎました。これからもわーくにを発展させていきましょう。
        </p>
        <p className="text-end text-sm pt-1">イッポンを、トリモロス。</p>
      </div>
    </div>
  );
};

export default ProductionModal;
