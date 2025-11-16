from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pykrx import stock
from datetime import datetime
import pandas as pd
import logging
# (방금 만든 강력 세척기 임포트)
from .utils import clean_for_json

chart_router = APIRouter()

@chart_router.get('/api/stock-chart/{ticker}')
async def get_stock_chart(ticker: str):
    """Get chart data for a specific ticker using a path parameter.

    Example: GET /api/stock-chart/005930
    """
    
    if not ticker:
        raise HTTPException(status_code=400, detail="티커(ticker) 파라미터가 필요합니다.")

    logging.info(f"차트 API 요청 수신: Ticker = {ticker}")

    try:
        start_date = (datetime.now() - pd.DateOffset(days=90)).strftime('%Y%m%d')
        today = datetime.now().strftime('%Y%m%d')
        latest_trading_day = await run_in_threadpool(stock.get_nearest_business_day_in_a_week, today)

        df = await run_in_threadpool(stock.get_market_ohlcv, start_date, latest_trading_day, ticker)

        if df.empty:
            raise HTTPException(status_code=404, detail="해당 티커의 데이터를 찾을 수 없습니다.")

        # 지표 계산 (Infinity가 발생할 수 있는 구간)
        df['MA5'] = df['종가'].rolling(window=5).mean()
        df['BB_Mid'] = df['종가'].rolling(window=20).mean()
        df['BB_Std'] = df['종가'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Mid'] + (df['BB_Std'] * 2)
        df['BB_Lower'] = df['BB_Mid'] - (df['BB_Std'] * 2)
        df['MA20'] = df['BB_Mid']

        df_chart = df.reset_index()
        df_chart['date'] = df_chart['날짜'].dt.strftime('%Y-%m-%d')
        
        # 딕셔너리 변환 (아직 Infinity가 섞여있을 수 있음)
        raw_data = df_chart[[
            'date', '시가', '고가', '저가', '종가', '거래량',
            'MA5', 'MA20', 'BB_Upper', 'BB_Mid', 'BB_Lower'
        ]].to_dict('records')

        # (★★★ 핵심 해결책 ★★★)
        # 데이터 강제 세척: 여기서 Infinity와 NaN이 모두 null로 바뀝니다.
        clean_data = clean_for_json(raw_data)

        return clean_data

    except Exception as e:
        logging.error(f"차트 데이터 생성 중 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류 발생: {str(e)}")