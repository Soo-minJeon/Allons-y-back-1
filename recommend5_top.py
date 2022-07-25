# 추천6 : 고전탑텐 메인 파일

# -*- coding: utf-8 -*-
import sys
import pandas as pd

# 영화 데이터를 가져왔다.
meta = pd.read_csv('recommend/movies_metadata.csv', low_memory=False)
# 필요한 컬럼만 가져온다. 아이디,제목,장르,개봉알,인기도,언어
meta = meta[['id', 'popularity']]
poster_info = pd.read_csv('recommend/poster_path.csv', low_memory=False)
poster_info['id'] = poster_info['id'].astype(object)
meta = pd.merge(meta, poster_info, on='id', how='left')
print(meta)

# 간단하게 id 값을 movieId로 바꿔주고
meta = meta.rename(columns={'id': 'movieId'})
# 문자열 칼럼을 숫자형 칼럼으로 바꿔주는 작업을 해주었다.
# meta.movieId = pd.to_numeric(meta.movieId, errors='coerce')
meta.popularity = pd.to_numeric(meta.popularity, errors='coerce') # popularity를 문자열에서 숫자형으로 변환!

meta = meta.sort_values('popularity', ascending=False)  # 나중에 다시 추가

meta = meta[['original_title','poster_path']].head(10)


titleArray = []
posterArray = []

for i in range(len(meta)):

    titleArray.append(meta.iloc[i]['original_title'])
    posterArray.append(meta.iloc[i]['poster_path'])

result_movie = ""
result_poster = ""

for i in range(len(titleArray)):

    result_movie += titleArray[i] + ','
    result_poster += posterArray[i] + ','

result_movie = result_movie.strip(',')
result_poster = result_poster.strip(',')
print("[" + result_movie + "],[" + result_poster + "]")
