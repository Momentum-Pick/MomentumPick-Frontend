import numpy as np
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from fastapi.concurrency import run_in_threadpool
from pykrx import stock
from datetime import datetime
import pandas as pd
import logging
# (세척기 임포트)
from .utils import clean_for_json

financials_router = APIRouter()

@financials_router.get('/api/stock-financials')
async def get_stock_financials(ticker: Optional[str] = Query(None)): #

    if not ticker:
        raise HTTPException(status_code=400, detail="티커(ticker) 파라미터가 필요합니다.") #

    logging.info(f"재무 API 요청 수신: Ticker = {ticker}") #

    try:
        # 1. 90일 범위의 날짜 준비
        start_date = (datetime.now() - pd.DateOffset(days=90)).strftime('%Y%m%d')
        today = datetime.now().strftime('%Y%m%d')
        latest_trading_day = await run_in_threadpool(stock.get_nearest_business_day_in_a_week, today)

        # 2. 90일간의 'DataFrame' 조회
        df_financials = await run_in_threadpool(
            stock.get_market_fundamental,
            start_date, # 시작일
            latest_trading_day, # 종료일
            ticker
        )

        if df_financials is None or df_financials.empty: #
            logging.warning("DEBUG: 4. 데이터가 비어있음. (None 또는 empty)")
            raise HTTPException(status_code=404, detail="해당 티커의 재무 데이터를 찾을 수 없습니다.") #
        
        # 3. 90일간의 '평균' 계산 (1D Series 생성)
        data_series_mean = df_financials.mean()

        # (★★★ 4. 핵심 변경: ROE 계산 및 추가 ★★★)
        try:
            # ROE = (EPS / BPS) * 100
            # (BPS가 0일 경우 0으로 나눌 수 없으므로 try-except)
            eps = data_series_mean.get('EPS', 0)
            bps = data_series_mean.get('BPS', 0)
            if bps != 0:
                data_series_mean['ROE'] = (eps / bps) * 100
            else:
                data_series_mean['ROE'] = None # BPS가 0이면 ROE는 null
        except Exception:
            data_series_mean['ROE'] = None # 계산 실패 시 null
        
        logging.info("DEBUG: 5. to_dict() 변환 시도...")
        
        # 5. 1D Series를 딕셔너리로 변환
        raw_data = data_series_mean.to_dict()
        logging.info("DEBUG: 6. to_dict() 변환 성공.")

        # 6. 데이터 세척 (Infinity, NaN -> null)
        clean_data = clean_for_json(raw_data)
        logging.info("DEBUG: 7. JSON 세척 완료.")

        return clean_data

    except Exception as e:
        logging.error(f"재무 데이터 생성 중 알 수 없는 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류 발생: {str(e)}")