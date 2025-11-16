import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface StockCardProps {
  ticker: string;
  name: string;
  percentage: number;
  price: string;
  volume: number;
  isGain: boolean;
}

const StockCard = ({ ticker, name, percentage, price, volume, isGain }: StockCardProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[StockCard] mounted', { ticker, name, percentage, price, volume, isGain });
  }, [ticker, name, percentage, price, volume, isGain]);

  const generateMiniChart = () => {
    const points: string[] = [];
    const width = 100;
    const height = 30;
    const segments = 20;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const trend = isGain ? i / segments : 1 - (i / segments);
      const randomness = Math.random() * 0.3;
      const y = height - (trend * height * 0.7) - (randomness * height * 0.3);
      points.push(`${x},${y}`);
    }

    return points.join(" ");
  };

  return (
  <Card
      className={`
        p-4 border rounded-lg cursor-pointer transition-all duration-200
        hover:scale-[1.02]
        ${
          isGain
            ? "bg-green-100 border-green-400 hover:border-green-600"
            : "bg-red-100 border-red-400 hover:border-red-600"
        }
      `}
      onClick={() => navigate(`/news/${encodeURIComponent(ticker)}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-black text-sm mb-1">{name}</h3>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                isGain ? "text-gain" : "text-loss"
              }`}
            >
              {percentage > 0 ? `+${percentage}%` : `${percentage}%`}
            </span>
            {isGain ? (
              <TrendingUp className="w-5 h-5 text-gain" />
            ) : (
              <TrendingDown className="w-5 h-5 text-loss" />
            )}
          </div>
        </div>

        {/* mini chart */}
        <svg width="100" height="30" className="opacity-70">
          <polyline
            points={generateMiniChart()}
            fill="none"
            stroke={isGain ? "hsl(var(--gain))" : "hsl(var(--loss))"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5">
        <div>티커: {ticker}</div>
        <div>현재가: {price}</div>
        <div>평균 거래량: {volume.toLocaleString()}</div>
      </div>
    </Card>
  );
};

export default StockCard;
