from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import logging
import warnings
import uvicorn
from contextlib import asynccontextmanager
from datetime import datetime, timedelta # (★★★ 1. timedelta 임포트 ★★★)

# (분리된 API 파일들 임포트)
from .routes.analysis import analysis_router, perform_and_save_analysis
from .routes.chart import chart_router
from .routes.financials import financials_router

# (스케줄러 및 Lifespan 설정)
scheduler = BackgroundScheduler(daemon=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- 앱 시작 시 실행 ---
    logging.info("서버 시작.") #
    
    # (★★★ 2. 기존의 동기(blocking) 실행 코드 삭제 또는 주석 처리 ★★★)
    # logging.info("서버 시작. 초기 분석을 1회 실행합니다 (파일이 없는 경우 대비).")
    # try:
    #     # (routes.analysis 파일에서 가져온 동기 함수)
    #     perform_and_save_analysis() # <--- 이 코드가 서버 시작을 막고 있었습니다.
    # except Exception as e:
    #     logging.error(f"초기 분석 실행 실패: {e}")
    
    # 1. 스케줄러에 작업 등록 (매일 17:30)
    scheduler.add_job(
        perform_and_save_analysis,  # 실행할 함수
        'cron',                     # 실행 방식 (크론탭)
        hour=17,
        minute=30,
        day_of_week='mon-fri'
    )
    
    # (★★★ 3. 서버 시작을 막지 않는 '비동기' 초기 분석 실행 ★★★)
    # 서버가 켜지고 "10초 뒤에" 백그라운드에서 분석을 1회 실행시킵니다.
    scheduler.add_job(
        perform_and_save_analysis,
        'date', # 1회성 실행
        run_date=datetime.now() + timedelta(seconds=10) # 10초 뒤에 실행
    )
    
    # 2. 스케줄러 시작
    scheduler.start()
    # (★★★ 4. 로그 메시지 수정 ★★★)
    logging.info("스케줄러가 시작되었습니다. (10초 뒤 초기 분석 시작 / 매일 17:30 평일 실행)")
    
    yield # <--- 즉시 yield로 넘어가서 서버가 켜집니다.
    
    # --- 앱 종료 시 실행 ---
    logging.info("서버 종료. 스케줄러를 종료합니다.")
    scheduler.shutdown()

# (FastAPI 앱 초기화)
app = FastAPI(lifespan=lifespan)

# (CORS 미들웨어 설정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# (기타 설정)
warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO)

# (라우터 등록)
app.include_router(analysis_router)
app.include_router(chart_router)
app.include_router(financials_router)


# (Uvicorn 서버 실행)
if __name__ == '__main__':
    logging.info("FastAPI 서버를 Uvicorn으로 실행합니다...")
    uvicorn.run(
        "app:app",
        host="127.0.0.1", 
        port=5001, 
        reload=True
    )