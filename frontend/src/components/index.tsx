import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
// Sorting fixed to Top 10 - removed interactive Select
import StockCard from "@/components/StockCard";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StockItem {
  Ticker: string;
  Name: string;
  "Close(원)": number;
  "Change_5D(%)": number;
  Avg_Vol_5D: number;
  MACD_Signal: string;
  BB_Signal: string;
}

interface ApiResponse {
  analysis_date: string;
  results: {
    top_risers: StockItem[];
    top_fallers: StockItem[];
    top_volume: StockItem[];
    macd_golden_cross: StockItem[];
    bb_breakout: StockItem[];
  };
}

// Mock 데이터 (개발용)
const mockData: ApiResponse = {
  analysis_date: "20251115",
  results: {
    top_risers: [
      { Ticker: "090370", Name: "메타랩스", "Close(원)": 2100, "Change_5D(%)": 26.05, Avg_Vol_5D: 589529, MACD_Signal: "Golden Cross", BB_Signal: "Inside" },
      { Ticker: "005930", Name: "삼성전자", "Close(원)": 69300, "Change_5D(%)": 15.23, Avg_Vol_5D: 1250000, MACD_Signal: "Neutral", BB_Signal: "Inside" },
      { Ticker: "035720", Name: "카카오", "Close(원)": 78200, "Change_5D(%)": 15.23, Avg_Vol_5D: 890000, MACD_Signal: "Golden Cross", BB_Signal: "Breakout" },
      { Ticker: "005490", Name: "포스코", "Close(원)": 312500, "Change_5D(%)": 15.23, Avg_Vol_5D: 450000, MACD_Signal: "Neutral", BB_Signal: "Inside" },
      { Ticker: "035420", Name: "네이버", "Close(원)": 245000, "Change_5D(%)": 15.23, Avg_Vol_5D: 750000, MACD_Signal: "Golden Cross", BB_Signal: "Inside" },
      { Ticker: "005380", Name: "현대차", "Close(원)": 189000, "Change_5D(%)": 15.23, Avg_Vol_5D: 980000, MACD_Signal: "Neutral", BB_Signal: "Inside" },
      { Ticker: "066570", Name: "LG전자", "Close(원)": 156500, "Change_5D(%)": 14.33, Avg_Vol_5D: 620000, MACD_Signal: "Golden Cross", BB_Signal: "Inside" },
      { Ticker: "000660", Name: "SK하이닉스", "Close(원)": 125000, "Change_5D(%)": 14.33, Avg_Vol_5D: 1450000, MACD_Signal: "Golden Cross", BB_Signal: "Breakout" },
      { Ticker: "006400", Name: "삼성SDI", "Close(원)": 578000, "Change_5D(%)": 14.33, Avg_Vol_5D: 380000, MACD_Signal: "Neutral", BB_Signal: "Inside" },
      { Ticker: "068270", Name: "셀트리온", "Close(원)": 198500, "Change_5D(%)": 16.90, Avg_Vol_5D: 720000, MACD_Signal: "Golden Cross", BB_Signal: "Inside" },
    ],
    top_fallers: [
      { Ticker: "028260", Name: "삼성물산", "Close(원)": 125500, "Change_5D(%)": -19.90, Avg_Vol_5D: 450000, MACD_Signal: "Death Cross", BB_Signal: "Inside" },
      { Ticker: "005380", Name: "현대차", "Close(원)": 189000, "Change_5D(%)": -14.70, Avg_Vol_5D: 680000, MACD_Signal: "Neutral", BB_Signal: "Breakdown" },
      { Ticker: "017670", Name: "SK텔레콤", "Close(원)": 45650, "Change_5D(%)": -12.50, Avg_Vol_5D: 320000, MACD_Signal: "Death Cross", BB_Signal: "Inside" },
      { Ticker: "003550", Name: "LG", "Close(원)": 78900, "Change_5D(%)": -13.60, Avg_Vol_5D: 280000, MACD_Signal: "Neutral", BB_Signal: "Inside" },
      { Ticker: "000100", Name: "유한양행", "Close(원)": 52700, "Change_5D(%)": -17.30, Avg_Vol_5D: 190000, MACD_Signal: "Death Cross", BB_Signal: "Breakdown" },
      { Ticker: "035720", Name: "카카오뱅크", "Close(원)": 46150, "Change_5D(%)": -17.30, Avg_Vol_5D: 540000, MACD_Signal: "Death Cross", BB_Signal: "Inside" },
      { Ticker: "000880", Name: "한화", "Close(원)": 23450, "Change_5D(%)": -12.20, Avg_Vol_5D: 210000, MACD_Signal: "Neutral", BB_Signal: "Inside" },
      { Ticker: "012330", Name: "현대모비스", "Close(원)": 156000, "Change_5D(%)": -13.30, Avg_Vol_5D: 380000, MACD_Signal: "Death Cross", BB_Signal: "Inside" },
      { Ticker: "000270", Name: "기아", "Close(원)": 68700, "Change_5D(%)": -16.20, Avg_Vol_5D: 820000, MACD_Signal: "Death Cross", BB_Signal: "Breakdown" },
      { Ticker: "005930", Name: "삼성전자우", "Close(원)": 45300, "Change_5D(%)": -19.00, Avg_Vol_5D: 670000, MACD_Signal: "Death Cross", BB_Signal: "Inside" },
    ],
    top_volume: [],
    macd_golden_cross: [],
    bb_breakout: [],
  },
};

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const { toast } = useToast();

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    setUsingMockData(false);
    
    try {
      const response = await fetch(`${API_URL}/api/stock-analysis`);
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }
  const json = await response.json();

  // 백엔드 응답 구조는 { analysis_date, results: { top_risers, ... } }
  // results 필드가 있으면 그 하위 객체를 사용하고, 없으면 (이전 포맷) 최상위 객체를 사용합니다.
  const root = json.results ?? json;
  const analysis_date = json.analysis_date ?? json.analysisDate ?? '';
      const mapItem = (it: any) => {
        const change5D = it["Change_5D(%)"] ?? it.change5D ?? it.change_5d ?? it.change_5D ?? 0;
        const avgVol = it.Avg_Vol_5D ?? it.avgVol5D ?? it.avg_vol_5d ?? it.avg_vol5d ?? 0;
        const mapped = {
          Ticker: it.ticker || it.TICKER || it.Ticker,
          Name: it.name || it.Name || it.company_name || '',
          "Close(원)": it.close ?? it.close_price ?? it["Close(원)"] ?? 0,
          "Change_5D(%)": Number(change5D) ?? 0,
          Avg_Vol_5D: Number(avgVol) ?? 0,
          MACD_Signal: it.macdSignal ?? it.MACD_Signal ?? '-',
          BB_Signal: it.bbSignal ?? it.BB_Signal ?? '-',
        } as StockItem;

        if (process.env.NODE_ENV !== 'production') {
          // 작은 디버그 출력: 매핑된 항목 일부를 콘솔에 기록
          console.debug('[mapItem] mapped sample', {
            Ticker: mapped.Ticker,
            Change_5D: mapped["Change_5D(%)"],
            Close: mapped["Close(원)"],
          });
        }

        return mapped;
      };

      const mapped: ApiResponse = {
        analysis_date: analysis_date,
        results: {
          top_risers: (root.topRisers || root.top_risers || []).map(mapItem),
          top_fallers: (root.topFallers || root.top_fallers || []).map(mapItem),
          top_volume: (root.topVolume || root.top_volume || []).map(mapItem),
          macd_golden_cross: (root.macdGoldenCross || root.macd_golden_cross || []).map(mapItem),
          bb_breakout: (root.bbBreakout || root.bb_breakout || []).map(mapItem),
        },
      };

      setData(mapped);
      toast({
        title: "데이터 로드 성공",
        description: "실제 API에서 데이터를 가져왔습니다.",
      });
    } catch (err) {
      console.error("API 호출 실패:", err);
      setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
      
      // Mock 데이터 사용
      setData(mockData);
      setUsingMockData(true);
      // mock 데이터를 보여주기 위해 error는 초기화
      setError(null);
      toast({
        title: "Mock 데이터 사용 중",
        description: "로컬 API 서버에 연결할 수 없어 샘플 데이터를 표시합니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const gainStocks = data?.results.top_risers.slice(0, 10) || [];
  const lossStocks = data?.results.top_fallers.slice(0, 10) || [];

  // 디버그: gain/loss 배열 상태 확인 (렌더 문제 진단용)
  // 개발 시에만 쓰고 문제 해결 후 제거 가능
  if (process.env.NODE_ENV !== 'production') {
    // 콘솔에 길이와 첫 몇 항목을 찍음
    console.log('[Index] gainStocks.length=', gainStocks.length, 'lossStocks.length=', lossStocks.length);
    console.log('[Index] gainStocks sample=', gainStocks.slice(0,3));
    console.log('[Index] lossStocks sample=', lossStocks.slice(0,3));
  }

  // (개발용 디버그 박스 제거됨)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              5거래일 시차 실손: 급등/급락 종목
            </h1>
            {usingMockData && (
              <p className="text-sm text-yellow-500 mt-1">
                ⚠️ Mock 데이터 사용 중 (로컬 환경에서 실행하면 실제 API와 연동됩니다)
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchStockData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </div>

        {/* Date and Time */}
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">
            <span className="mr-6">분석일자: {data?.analysis_date || "-"}</span>
            <span>데이터 시간대: {new Date().toLocaleString("ko-KR")}</span>
          </div>
        </div>

  {/* 개발용 디버그 뷰는 제거되었습니다 */}

        {/* Filters (radio buttons removed per design) */}
        <div className="flex items-center justify-between mb-6">
          <div />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">정렬 순서</span>
            <div className="w-[180px] px-3 py-2 bg-card border border-border rounded text-sm">문서 기준 - Top 10</div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-1" />
              검색
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">데이터 로딩 중...</span>
          </div>
        )}

        {/* Error State - API 연결 실패 시 안내 */}
        {error && !loading && !usingMockData && (
          <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-6 mb-6">
            <p className="text-destructive font-semibold mb-2">⚠️ API 연결 오류</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="bg-card/50 rounded p-4 mb-4 text-sm">
              <p className="font-semibold mb-2">해결 방법:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>FastAPI 서버가 <code className="bg-muted px-1">http://127.0.0.1:5001</code>에서 실행 중인지 확인</li>
                <li>CORS 설정이 되어있는지 확인 (FastAPI에서 <code className="bg-muted px-1">CORSMiddleware</code> 추가)</li>
                <li>프로젝트를 로컬로 다운로드하여 <code className="bg-muted px-1">npm run dev</code>로 실행</li>
              </ol>
            </div>
            <Button onClick={fetchStockData} variant="outline" size="sm">
              다시 시도
            </Button>
          </div>
        )}

        {/* Stock Grids */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gain Stocks */}
            <div>
              <div className="bg-gain/20 border border-gain/30 rounded-lg p-4 mb-4">
                <h2 className="text-lg font-bold text-gain">5거래일 급등 Top 10 종목</h2>
              </div>
              <div className="space-y-3 bg-green-900/10 p-4 rounded-lg">
                {gainStocks.length > 0 ? (
                  gainStocks.map((stock) => (
                    <StockCard 
                      key={stock.Ticker} 
                      ticker={stock.Ticker}
                      name={stock.Name}
                      percentage={stock["Change_5D(%)"]}
                      price={`${stock["Close(원)"].toLocaleString()}원`}
                      volume={stock.Avg_Vol_5D}
                      isGain={true}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">데이터가 없습니다.</p>
                )}
              </div>
            </div>

            {/* Loss Stocks */}
            <div>
              <div className="bg-loss/20 border border-loss/30 rounded-lg p-4 mb-4">
                <h2 className="text-lg font-bold text-loss">5거래일 급락 Top 10 종목</h2>
              </div>
              <div className="space-y-3 bg-red-900/10 p-4 rounded-lg">
                {lossStocks.length > 0 ? (
                  lossStocks.map((stock) => (
                    <StockCard 
                      key={stock.Ticker} 
                      ticker={stock.Ticker}
                      name={stock.Name}
                      percentage={stock["Change_5D(%)"]}
                      price={`${stock["Close(원)"].toLocaleString()}원`}
                      volume={stock.Avg_Vol_5D}
                      isGain={false}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">데이터가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
