# routes/utils.py
import math
import numpy as np
import pandas as pd

def clean_for_json(data):
    """
    데이터 내의 Infinity, NaN을 재귀적으로 찾아 None(null)으로 변환합니다.
    JSON 변환 오류를 100% 방지하기 위한 함수입니다.
    """
    if isinstance(data, dict):
        return {k: clean_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_for_json(v) for v in data]
    elif isinstance(data, float):
        if math.isinf(data) or math.isnan(data):
            return None
        return data
    elif pd.isna(data): # pandas NaT, NaN 등 처리
        return None
    else:
        return data