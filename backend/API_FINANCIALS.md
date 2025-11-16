# 재무 정보 API (백엔드 실제 구현 기준)

이 문서는 현재 리포지토리의 백엔드 코드(`backend/app/routes/financials.py`) 기준으로 작성한 API 문서입니다. 문서와 코드가 일치하도록 아래 내용을 참고하세요.

## 개별 종목 재무 데이터 조회

특정 종목의 재무 지표 및 ROE 정보를 조회합니다. 현재 구현은 쿼리 파라미터 방식으로 동작합니다.

### Endpoint

```
GET /api/stock-financials
```

### Parameters

| 이름 | 타입 | 필수 | 설명 | 예시 |
| --- | ---:|:---:| --- | --- |
| ticker | string | 예 | 조회할 종목 티커 (선행 0 포함 가능) | 027410 |

요청 예시

```
GET /api/stock-financials?ticker=027410
```

응답 예시 (현재 코드의 실제 반환값)

```json
{
  "BPS": 3138,
  "PER": 178.8208333333333,
  "PBR": 0.45616671442985535,
  "EPS": 8,
  "DIV": 0,
  "DPS": 0,
  "ROE": 25.493945188017847
}
```

> 주: `ROE`는 현재 구현에서 `(EPS / BPS) * 100` 으로 계산되어 **퍼센트(%)** 단위로 반환됩니다. 예시 값 25.49는 25.49%를 의미합니다.

응답 필드 설명

- `BPS` (number | null): 주당순자산 (Book Value Per Share). 단위: 원(데이터 소스 기준). 값이 없으면 `null`.
- `PER` (number | null): 주가수익비율 (Price-to-Earnings Ratio). 값이 없으면 `null`.
- `PBR` (number | null): 주가순자산비율 (Price-to-Book Ratio). 값이 없으면 `null`.
- `EPS` (number | null): 주당순이익 (Earnings Per Share). 단위: 원(데이터 소스 기준). 값이 없으면 `null`.
- `DIV` (number | null): 배당 관련 지표(데이터 소스 기준, 단위 확인 필요). 값이 없으면 `null`.
- `DPS` (number | null): 주당배당금 (Dividend Per Share). 값이 없으면 `null`.
- `ROE` (number | null): 자기자본이익률 (Return on Equity), 현재는 **% 단위**로 반환(예: 25.49). 값이 없으면 `null`.

동작/비고

- 현재 구현은 pykrx에서 가져온 최근 데이터(코드상은 90일 범위 평균)를 사용하여 평균값을 계산해 반환합니다.
- NaN 또는 Infinity 같은 비수치 값은 서버에서 `clean_for_json` 함수로 `null`로 변환되어 반환됩니다.
- 에러 응답
  - 400: `ticker` 파라미터 미지정
  - 404: 해당 티커의 재무 데이터가 없을 때
  - 500: 서버 내부 오류

프론트엔드 호출 예시 (쿼리 파라미터 방식)

```js
fetch(`${API_URL}/api/stock-financials?ticker=${encodeURIComponent(ticker)}`)
  .then(r => r.json())
  .then(data => {
    // data는 바로 지표 객체(BPS, PER, PBR, EPS, DIV, DPS, ROE)를 받습니다
  })
```

원하시면 다음 변경 작업을 도와드릴 수 있습니다:
- ROE를 응답에서 소수(0.2549)로 바꾸기(백엔드 변경)
- 응답을 래퍼 형태(`{isSuccess, code, message, result}`)로 바꾸기(백엔드 변경)
- 프론트엔드에서 ROE를 퍼센트/포맷해서 표시하기(프론트 변경)
