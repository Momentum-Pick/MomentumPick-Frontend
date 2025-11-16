import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

// chart.js + react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend, 
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface ChartPoint {
  date: string;
  시가?: number;
  고가?: number;
  저가?: number;
  종가?: number;
  거래량?: number;
  MA5?: number;
  MA20?: number;
  BB_Upper?: number;
  BB_Mid?: number;
  BB_Lower?: number;
}

interface Financials {
  BPS?: number;
  PER?: number;
  PBR?: number;
  EPS?: number;
  DIV?: number;
  DPS?: number;
  ROE?: number;
}
 

const NewsDetail = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001";

  // Prepare chart.js data and options from backend chart array
  const chartData = useMemo(() => {
    if (!chart || chart.length === 0) return { labels: [], datasets: [] };
    const labels = chart.map(c => c.date);
  const openData = chart.map(c => (c['시가'] ?? null) as number | null);
  const highData = chart.map(c => (c['고가'] ?? null) as number | null);
  const lowData = chart.map(c => (c['저가'] ?? null) as number | null);
  const closeData = chart.map(c => (c['종가'] ?? null) as number | null);
    const ma5 = chart.map(c => (c.MA5 ?? null) as number | null);
    const ma20 = chart.map(c => (c.MA20 ?? null) as number | null);
    const bbUp = chart.map(c => (c.BB_Upper ?? null) as number | null);
    const bbMid = chart.map(c => (c.BB_Mid ?? null) as number | null);
    const bbLow = chart.map(c => (c.BB_Lower ?? null) as number | null);
    const volume = chart.map(c => (c.거래량 ?? null) as number | null);

    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: '거래량',
          data: volume,
          backgroundColor: 'rgba(100,116,139,0.4)',
          yAxisID: 'yVolume',
        },
        {
          type: 'line' as const,
          label: '시가',
          data: openData,
          borderColor: 'rgba(59,130,246,0.7)',
          borderWidth: 1,
          tension: 0.1,
          yAxisID: 'yPrice',
          pointRadius: 0,
        },
        {
          type: 'line' as const,
          label: '고가',
          data: highData,
          borderColor: 'rgba(16,185,129,0.7)',
          borderWidth: 1,
          tension: 0.1,
          yAxisID: 'yPrice',
          pointRadius: 0,
        },
        {
          type: 'line' as const,
          label: '저가',
          data: lowData,
          borderColor: 'rgba(244,63,94,0.7)',
          borderWidth: 1,
          tension: 0.1,
          yAxisID: 'yPrice',
          pointRadius: 0,
        },
        {
          type: 'line' as const,
          label: '종가',
          data: closeData,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,0.08)',
          tension: 0.2,
          yAxisID: 'yPrice',
          pointRadius: 0,
        },
        {
          type: 'line' as const,
          label: 'MA5',
          data: ma5,
          borderColor: '#10b981',
          borderDash: [4, 4],
          yAxisID: 'yPrice',
          pointRadius: 0,
        },
        {
          type: 'line' as const,
          label: 'MA20',
          data: ma20,
          borderColor: '#8b5cf6',
          borderDash: [4, 4],
          yAxisID: 'yPrice',
          pointRadius: 0,
        },
        {
          type: 'line' as const,
          label: 'BB_Upper',
          data: bbUp,
          borderColor: '#ef4444',
          borderDash: [2, 2],
          yAxisID: 'yPrice',
          pointRadius: 0,
        },
        {
          type: 'line' as const,
          label: 'BB_Mid',
          data: bbMid,
          borderColor: '#f59e0b',
          borderDash: [2, 2],
          yAxisID: 'yPrice',
          pointRadius: 0,
        },
        {
          type: 'line' as const,
          label: 'BB_Lower',
          data: bbLow,
          borderColor: '#ef4444',
          borderDash: [2, 2],
          yAxisID: 'yPrice',
          pointRadius: 0,
        },
      ],
    };
  }, [chart]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    stacked: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { display: true },
      yPrice: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { drawOnChartArea: true },
      },
      yVolume: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: {
          callback: function(value: any) {
            if (typeof value === 'number') return value.toLocaleString();
            return value;
          }
        }
      }
    }
  }), [chart]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!ticker) return;
      setLoading(true);

      try {
        // 차트: path-param 형식
    const chartUrl = `${API_URL}/api/stock-chart/${ticker}`;
    console.debug('[NewsDetail] fetching chart URL:', chartUrl);
    const chartRes = await fetch(chartUrl);
  // 재무: 현재 백엔드는 쿼리파라미터 방식으로 동작하므로 ?ticker= 사용
  const finUrl = `${API_URL}/api/stock-financials?ticker=${encodeURIComponent(ticker)}`;
  console.debug('[NewsDetail] fetching financials URL:', finUrl);
  const finRes = await fetch(finUrl);

        if (chartRes.ok) {
          const jc = await chartRes.json();
          const arr = Array.isArray(jc) ? jc : (jc.result ?? jc);
          // 안전을 위해 날짜 기준으로 정렬(오름차순)
          if (Array.isArray(arr)) {
            arr.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
          }
          console.debug('차트 응답 샘플:', Array.isArray(arr) ? arr.slice(0,3) : arr);
          setChart(arr ?? []);
        } else {
          console.warn('차트 API 응답 오류', chartRes.status);
        }

        if (finRes.ok) {
          const jf = await finRes.json();
          const finObj = jf.result ?? jf;
          console.debug('재무 응답:', finObj);
          setFinancials(finObj ?? null);
        } else {
          console.warn('재무 API 응답 오류', finRes.status);
        }
      } catch (error) {
        console.error('상세 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [ticker]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

    <h1 className="text-3xl font-bold text-foreground mb-2">종목 상세</h1>
    <p className="mb-6 text-white">티커: <span className="font-semibold text-white">{ticker}</span></p>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold mb-2">기본 재무 지표</h2>
            {loading && <p className="text-muted-foreground">데이터 로드 중...</p>}
            {!loading && !financials && <p className="text-muted-foreground">재무 데이터 없음</p>}
            {financials && (
              <div className="text-sm space-y-1">
                <div>PER: {financials.PER ?? '-'}</div>
                <div>PBR: {financials.PBR ?? '-'}</div>
                <div>BPS: {financials.BPS ?? '-'}</div>
                <div>EPS: {financials.EPS ?? '-'}</div>
                <div>DIV: {financials.DIV ?? '-'}</div>
                <div>ROE: {financials.ROE ?? '-'}</div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold mb-2">차트 데이터(최근 항목)</h2>
            {loading && <p className="text-muted-foreground">차트 로드 중...</p>}
            {!loading && chart.length === 0 && <p className="text-muted-foreground">차트 데이터 없음</p>}
            {chart.length > 0 && (
              <div className="text-sm">
                <div>데이터 포인트 수: {chart.length}</div>
                <div className="mt-2">최근 날짜: {chart[chart.length - 1]?.date}</div>

                {/* 상세 차트 (종가 + MA + BB + 거래량) */}
                <div className="mt-4">
                  <Chart type="bar" data={chartData} options={chartOptions} />
                </div>

                {/* 최근 5개 항목(날짜/종가) */}
                <div className="mt-4 text-xs">
                  <div className="font-medium">최근 5개 데이터</div>
                  <ul className="list-disc list-inside">
                    {chart.slice(-5).map((p, i) => (
                      <li key={i}>{p.date}: {p['종가'] ?? '-'}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default NewsDetail;
