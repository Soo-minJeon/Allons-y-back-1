# recommend4_RandomYear.py -> 추천4 메인 파일 (랜덤 연도 영화 추천, 컨텐츠 기반 필터링 추천 시스템. 영화 10개를 추천)

# -*- coding: utf-8 -*-
import sys
import pandas as pd
from surprise import Reader, Dataset, SVD # 알고리즘이 들어간다.
from surprise import BaselineOnly,  NMF, SlopeOne # 분석툴
import random
# 무시
pd.set_option('mode.chained_assignment', None)  # <==== 경고를 끈다

movie_info = pd.read_csv('csv/movie_info.csv', low_memory=False)
movie_info = movie_info[['original_title', 'poster_path','release_date']]

ratings = pd.read_csv('csv/user_info.csv', low_memory=False)  # 원본은 데이터가 많아서 small 데이터 사용
ratings = ratings[['userId', 'movieId', 'rating']]  # 사용자 아이디, 영화 아이디, 평가
ratings.head()
ratings.movieId = pd.to_numeric(ratings.movieId, errors='coerce')
ratings.userId = pd.to_numeric(ratings.userId, errors='coerce')
ratings.rating = pd.to_numeric(ratings.rating, errors='coerce')
len(ratings)
df = ratings

# 너무 많기 때문에 70퍼센트만 가져온다. (= 결측치 처리 : movie id를 count한 것에 대한 70%)
# 적은 수의 평가가 있는 영화는 제외
df = df[pd.notnull(df['rating'])]  # rating이 null인것 제외하고 df 다시 정의

# agg() 함수는 여러개의 열에 여러가지 함수를 적용 가능하게 함
f = ['count', 'mean']  # -> 그룹 객체에 대해 count(개수구함), mean(평균구함) 함수를 agg() 함수를 통해 적용
df_movie_summary = df.groupby('movieId')['rating'].agg(f)  # 영화(movieId) 별 평가
df_movie_summary.index = df_movie_summary.index.map(int)  # map 함수 쓰면 한번에 형변환 처리 가능, 스트(?)나 튜플을 지정함수로 처리해주는 역할
movie_benchmark = round(df_movie_summary['count'].quantile(0.7), 0)  # quantile 사분위 수 -> ?
drop_movie_list = df_movie_summary[df_movie_summary['count'] < movie_benchmark].index  # 제외 영화 리스트

# 여기서 위에서 제외할 리스트들을 넣어주어 drop 해주었다.
df = df[~df['movieId'].isin(drop_movie_list)]  # df의 'Movie_Id'에서 drop_movie_list의 값이 있으면 True

# 영화 데이터를 가져왔다.
meta = pd.read_csv('csv/movies_metadata.csv', low_memory=False)
# 필요한 컬럼만 가져온다. 아이디,제목,장르,개봉알,인기도,언어
meta = meta[['id', 'original_title', 'genres', 'release_date', 'popularity', 'original_language']]
# 간단하게 id 값을 movieId로 바꿔주고
meta = meta.rename(columns={'id': 'movieId'})
# 문자열 칼럼을 숫자형 칼럼으로 바꿔주는 작업을 해주었다.
meta.movieId = pd.to_numeric(meta.movieId, errors='coerce')
meta.popularity = pd.to_numeric(meta.popularity, errors='coerce')  # popularity를 문자열에서 숫자형으로 변환!

# 알고리즘에 따른 추천
reader = Reader()
data = Dataset.load_from_df(df[['userId', 'movieId', 'rating']], reader=reader)  # 평가 데이터 가져옴
svd = SVD()
slope = SlopeOne()
nmf = NMF()
bsl_options = {'method': 'als',
               'n_epochs': 5,
               'reg_u': 12,
               'reg_i': 5
               }
als = BaselineOnly(bsl_options)


# Estimate_Score_sum1 위 함수와 더불어 추천해주는 함수
def variable_weight(data, usernumber, rating, moviedata, dropdata, reader, algo,yearly):
    df = data
    user_df = moviedata.copy()
    user_df = user_df[~user_df['movieId'].isin(dropdata)]
    data1 = Dataset.load_from_df(df[['userId', 'movieId', 'rating']], reader)
    trainset = data1.build_full_trainset()
    algo.fit(trainset)
    user_df['Estimate_Score'] = user_df['movieId'].apply(lambda x: algo.predict(usernumber, x).est)
    user_df = user_df.sort_values('Estimate_Score', ascending=False)

    movie_info2 = pd.read_csv('csv/movie_info.csv', low_memory=False)
    movie_info2 = movie_info2[['original_title', 'poster_path', 'release_date']]
    movie_info2 = movie_info2.sort_values(by='release_date')

    movieInfo = movie_info2[movie_info2['release_date'] < yearly+9]
    movieInfo = movieInfo[movieInfo['release_date'] > yearly]

    user_df_sum_relase = pd.merge(movieInfo, user_df, on='original_title', how='left')
    user_df_sum_relase = user_df_sum_relase.sort_values('Estimate_Score', ascending=False)
    user_df_sum_relase = user_df_sum_relase[['original_title', 'poster_path']]
    titleArray = []
    posterArray = []
    user_df_sum_relase = user_df_sum_relase.head(10)

    for i in range(len(user_df_sum_relase)):
        titleArray.append(user_df_sum_relase.iloc[i]['original_title'])
        posterArray.append(user_df_sum_relase.iloc[i]['poster_path'])

    result_movie = ""
    result_poster = ""

    for i in range(len(titleArray)):
        result_movie+=titleArray[i]+','
        result_poster+=posterArray[i]+','

    result_movie=result_movie.strip(',')
    result_poster=result_poster.strip(',')
    print("[" + result_movie + "],[" + result_poster + "]")
    return user_df_sum_relase

yearList = [1940,1950,1960,1970,1980,1990] # 추후 연도 추가
randomNum = random.choice(yearList)
print(randomNum)
user_df_sum_relase = variable_weight(df, 1, 6, meta, drop_movie_list, reader, svd, randomNum)
