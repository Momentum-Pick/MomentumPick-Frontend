from fastapi import APIRouter, HTTPException
from pykrx import stock
from datetime import datetime
import pandas as pd
import logging
import os
import json
import aiofiles # 비동기 파일 처리를 위해
import time # (★★★ 1. time 모듈 임포트 ★★★)

analysis_router = APIRouter()

# --- 1. 파일 이름 정의 ---
def get_cache_filename():
    # (기존과 동일)
    today_str = datetime.now().strftime('%Y%m%d')
    latest_trading_day = stock.get_nearest_business_day_in_a_week(today_str)
    return f"analysis_cache_{latest_trading_day}.json"

# --- 2. 실제 분석 로직 ---
def run_stock_analysis():
    # (★변경 없음★ - 스케줄러가 실행하므로 async 불필요)
    logging.info("--- [분석 엔진] KOSPI 전체 분석 실행 ---")
    today = datetime.now().strftime('%Y%m%d')
    start_date = (datetime.now() - pd.DateOffset(days=90)).strftime('%Y%m%d')
    latest_trading_day = stock.get_nearest_business_day_in_a_week(today)
    N_DAYS = 5
    TOP_N = 10
    MIN_AVG_VOLUME = 50000
    MIN_AVG_PRICE = 1000
    try:
        tickers_kospi = stock.get_market_ticker_list(market="KOSPI", date=latest_trading_day)
        all_tickers = tickers_kospi
    except Exception as e:
        return {"error": f"KOSPI 티커 목록 조회 실패: {e}"}
    
    results_list = []
    for i, ticker in enumerate(all_tickers):
        if (i + 1) % 100 == 0:
            logging.info(f"진행 중... {i+1}/{len(all_tickers)} ({ticker})")
            
        # (★★★ 2. 서버 IP 차단 방지를 위해 0.1초 대기 ★★★)
        time.sleep(0.1)
            
        try:
            df = stock.get_market_ohlcv(start_date, latest_trading_day, ticker)
            if len(df) < 35: continue
            close_n_days_ago = df.iloc[-N_DAYS]['종가']
            latest_close = df.iloc[-1]['종가']
            if close_n_days_ago == 0: continue
            change_5d = ((latest_close - close_n_days_ago) / close_n_days_ago) * 100
            volume_5d_avg = df.iloc[-N_DAYS:]['거래량'].mean()
            price_5d_avg = df.iloc[-N_DAYS:]['종가'].mean()
            if volume_5d_avg < MIN_AVG_VOLUME or price_5d_avg < MIN_AVG_PRICE: continue
            ema_fast = df['종가'].ewm(span=12, adjust=False).mean()
            ema_slow = df['종가'].ewm(span=26, adjust=False).mean()
            df['MACD'] = ema_fast - ema_slow
            df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
            df['BB_Mid'] = df['종가'].rolling(window=20).mean()
            df['BB_Std'] = df['종가'].rolling(window=20).std()
            df['BB_Upper'] = df['BB_Mid'] + (df['BB_Std'] * 2)
            latest_indicators = df.iloc[-1]
            prev_indicators = df.iloc[-2]
            macd_golden_cross = (prev_indicators['MACD'] < prev_indicators['MACD_Signal']) and \
                                (latest_indicators['MACD'] > latest_indicators['MACD_Signal'])
            bb_breakout = latest_close > latest_indicators['BB_Upper']
            company_name = stock.get_market_ticker_name(ticker)
            results_list.append({
                "Ticker": ticker, "Name": company_name, "Close(원)": latest_close,
                "Change_5D(%)": change_5d, "Avg_Vol_5D": volume_5d_avg,
                "MACD_Signal": "Golden Cross" if macd_golden_cross else "-",
                "BB_Signal": "Breakout" if bb_breakout else "Inside"
            })
        except Exception as e:
            continue
    if not results_list:
        return {"message": "분석 조건을 만족하는 종목이 없습니다.", "data": {}}
    results_df = pd.DataFrame(results_list)
    top_risers = results_df.sort_values(by="Change_5D(%)", ascending=False).head(TOP_N)
    top_fallers = results_df.sort_values(by="Change_5D(%)", ascending=True).head(TOP_N)
    top_volume = results_df.sort_values(by="Avg_Vol_5D", ascending=False).head(TOP_N)
    macd_cross_stocks = results_df[results_df['MACD_Signal'] == "Golden Cross"]
    bb_breakout_stocks = results_df[results_df['BB_Signal'] == "Breakout"]
    analysis_data = {
        "top_risers": top_risers.to_dict(orient='records'),
        "top_fallers": top_fallers.to_dict(orient='records'),
        "top_volume": top_volume.to_dict(orient='records'),
        "macd_golden_cross": macd_cross_stocks.to_dict(orient='records'),
        "bb_breakout": bb_breakout_stocks.to_dict(orient='records')
    }
    logging.info("--- [분석 엔진] 분석 완료 ---")
    return analysis_data

# --- 3. 스케줄러가 실행할 작업 ---
def perform_and_save_analysis():
    # (★변경 없음★ - 스케줄러가 실행하므로 async 불필요)
    logging.info("--- [스케줄링 작업 시작] 일일 분석 및 파일 저장을 시작합니다. ---")
    analysis_data = run_stock_analysis()
    if "error" in analysis_data or not analysis_data:
        logging.error("[스케줄링 작업] 분석 중 오류가 발생했거나 데이터가 없습니다.")
        return
    CACHE_FILENAME = get_cache_filename()
    try:
        # (동기 파일 쓰기. 스케줄러 스레드이므로 괜찮음)
        with open(CACHE_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(analysis_data, f, ensure_ascii=False, indent=4)
        logging.info(f"--- [스케줄링 작업 완료] '{CACHE_FILENAME}' 파일 저장 성공 ---")
    except Exception as e:
        logging.error(f"[스케줄링 작업] 파일 저장 실패: {e}")


# --- 4. API 엔드포인트 ---
@analysis_router.get('/api/stock-analysis')
async def get_stock_analysis():
    CACHE_FILENAME = get_cache_filename()
    logging.info(f"API 요청 수신. 캐시 파일 확인: '{CACHE_FILENAME}'")
    
    try:
        # (★수정★) 비동기 aiofiles로 파일을 읽습니다.
        async with aiofiles.open(CACHE_FILENAME, 'r', encoding='utf-8') as f:
            data_str = await f.read()
            data = json.loads(data_str)
        
        date_from_filename = CACHE_FILENAME.split('_')[-1].replace('.json', '')
        return {
            "analysis_date": date_from_filename,
            "results": data,
            "data_source": "daily_cache_file (Scheduler)"
        }
    
    except FileNotFoundError:
        logging.warning(f"캐시 파일 '{CACHE_FILENAME}' 없음. 데이터 준비 중일 수 있습니다.")
        raise HTTPException(status_code=503, detail="데이터를 준비 중입니다. (오늘의 첫 분석이 아직 완료되지 않았습니다)")
    except Exception as e:
        logging.error(f"캐시 파일({CACHE_FILENAME})을 읽는 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail="데이터 파일을 읽는데 실패했습니다.")