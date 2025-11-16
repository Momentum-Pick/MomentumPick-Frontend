모든 API는 FastAPI로 실행되며, app.py  파일에 의해 http://127.0.0.1:5001 (또는 배포된 서버 주소)에서 실행됩니다.

실행 : 
prompt(파이썬)에서 해당 파일이 있는 디렉토리로 이동 후, python app.py 명령어로 실행합니다. 


1. routes/analysis.py
이 파일은 메인 대시보드 화면을 구성하는 핵심 분석 데이터를 제공합니다. 서버 스케줄러에 의해 매일 1회 자동으로 갱신됩니다.

메인 분석 API (Top 5 상승 / 하락, 볼린저밴드 breakout, MACD 골든 크로스)
Endpoint: /api/stock-analysis?ticker=티커변수

Method: GET

설명: 5거래일 기준 급등, 급락, 거래량 Top 5 및 MACD 골든크로스, 볼린저 밴드 돌파 종목 리스트를 반환합니다. 이 API는 메인 페이지 로드 시 1회만 호출하면 됩니다.

Parameters: 없음


2. routes/chart.py
이 파일은 사용자가 특정 종목을 클릭했을 때 상세 차트를 그리기 위한 데이터를 제공합니다.

개별 종목 차트 API
Endpoint: /api/stock-chart?ticker=티커변수

Method: GET

설명: 특정 ticker를 기준으로 최근 90일간의 주가(OHLCV), 이동평균선(MA5, MA20), 볼린저 밴드(Upper, Mid, Lower) 데이터를 반환합니다.

Parameters:

ticker (string, Required): 조회할 종목의 티커(예: 005930).


3. routes/financials.py
이 파일은 사용자가 특정 종목을 클릭했을 때 상세 재무 정보(PER, PBR 등)를 제공합니다.

개별 종목 재무 API (ROE 포함)
Endpoint: /api/stock-financials

Method: GET

설명: 특정 ticker의 최근 90일간 평균 재무 비율(BPS, PER, PBR, EPS, DIV, DPS) 및 계산된 ROE 값을 반환합니다.

Parameters:

ticker (string, Required): 조회할 종목의 티커(예: 027410).


+ routes/utils.py 
이 파일은 프로젝트의 "데이터 세척기" 또는 "JSON 유효성 검사기" 역할을 합니다.

이 파일이 필요한 이유 (문제점)

chart.py 나 financials.py 가 pykrx에서 데이터를 가져와 이동평균선, ROE 등을 계산할 때, 가끔 JSON이 이해하지 못하는 특수 값(비정상적인 Float)이 포함될 수 있습니다.


Infinity (무한대)

-Infinity (음의 무한대)

NaN (숫자 아님)

이 "오염된" 값들이 API 응답에 섞여 있으면, 프론트엔드는 데이터를 받지 못하고 ValueError: Out of range float... (500 Internal Server Error) 오류를 만나게 됩니다.

이 파일의 역할 (해결책)
utils.py의 clean_for_json 함수는 API가 데이터를 프론트엔드에 전송하기 직전에, 이 모든 "오염된" 데이터를 "청소"합니다.

Infinity (무한대) -> null (JSON이 아는 '빈 값')

NaN (숫자 아님) -> null (JSON이 아는 '빈 값')

다른 파일에서의 사용법

chart.py 와 financials.py 는 데이터를 to_dict()로 변환하여 raw_data를 만든 뒤, 이 raw_data를 clean_for_json(raw_data) 함수에 통과시켜 "깨끗한" 데이터(clean_data)를 만듭니다.


프론트엔드에는 이 "깨끗한" clean_data만 전송됩니다.

결론: 이 파일 덕분에 프론트엔드 개발자는 Infinity나 NaN 같은 비정상적인 값으로 인한 500 오류를 걱정할 필요 없이, 항상 null 값이 포함된 안전하고 유효한 JSON만 받게 됩니다.
