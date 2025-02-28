# recommend1.py -> 추천1 메인 파일, 컨텐츠 기반 필터링 추천 시스템. 영화 10개를 추천한다.

# -*- coding: utf-8 -*-
import sys
import pandas as pd
from surprise import Reader, Dataset, SVD  # 알고리즘이 들어간다.
from surprise import BaselineOnly, NMF, SlopeOne  # 분석툴

# 무시
pd.set_option('mode.chained_assignment', None)  # <==== 경고를 끈다

movie_info = pd.read_csv('csv/movie_info.csv', low_memory=False)
movie_info = movie_info[['original_title', 'poster_path']]

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

# 여기서도 영화 리뷰가 너무 적으면 제외 시킴
df_cust_summary = df.groupby('userId')['rating'].agg(f)  # 사용자(userId) 별 평가
df_cust_summary.index = df_cust_summary.index.map(int)
cust_benchmark = round(df_cust_summary['count'].quantile(0.7), 0)
drop_cust_list = df_cust_summary[df_cust_summary['count'] < cust_benchmark].index  # 제외 사용자 리스트

# 여기서 위에서 제외할 리스트들을 넣어주어 drop 해주었다.
df = df[~df['movieId'].isin(drop_movie_list)]  # df의 'Movie_Id'에서 drop_movie_list의 값이 있으면 True
#df = df[~df['userId'].isin(drop_cust_list)]

# 피봇테이블 생성, pivot_table()은 데이터 프레임 생성, 구성 요소 입력해줌
df_p = pd.pivot_table(df, values='rating', index='userId', columns='movieId')

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


def process(title):
    # 생략없이 출력
    pd.set_option('display.max_rows', None)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 300)

    # csv 파일 불러오기
    movies = pd.read_csv(
        'csv/movie_info.csv',
        low_memory=False)
    movies.columns = ['id', 'original_title', 'poster_path']

    # 제목으로 정보 찾기
    find_row = movies.index[(movies['original_title'] == title)]

    # 장르 문자열 처리
    genres = movies.loc[find_row[0]]['genres']
    genres = genres.replace('[', '').replace(']', '').split('}, {')
    genres_after = []

    for i in range(len(genres)):
        genre = genres[i].split(', ')[1].split(': ')[1].replace("'", '').replace("}", '')
        genres_after.append(genre)

    return (movies.loc[find_row[0]]['original_title'], '|', genres_after, '|', movies.loc[find_row[0]]['poster_path'])


# 변수에 대한 가중치
def user_release_ratio(df, usernumber):
    user_df = df[df['userId'] == usernumber]  # 평가 데이터에서 입력받은 유저 아이디의 데이터를 가져옴
    meta2 = pd.read_csv('csv/movie_info.csv', low_memory=False)  # 영화정보 가져옴
    value_meta = meta2[['id', 'original_title', 'release_date', 'genres']]  # 필요한 영화 정보만 선별
    value_meta = value_meta.rename(columns={'id': 'movieId'})  # 이름 변경 : id를 movieId로 고침
    value_meta.movieId = pd.to_numeric(value_meta.movieId, errors='coerce')
    value_meta = value_meta.dropna(axis=0)
    value_meta = value_meta.reset_index()
    merge_data = pd.merge(user_df, value_meta, on='movieId', how='left')  # 데이터 합침 : 평가 정보 + 영화 정보
    merge_data = merge_data.dropna(axis=0)
    merge_data = merge_data.reset_index()  # index 초기화

    # 사용자가 평점준 영화 개봉 연도에 따라 값을 추가해줌
    release_data_list = {'1900': 0, '1950': 0, '1960': 0, '1970': 0, '1980': 0, '1990': 0, '2000': 0, '2010': 0,
                         '2020': 0}
    for i in range(0, len(merge_data)):
        if int(merge_data['release_date'].loc[i][0:4]) <= 1900:
            release_data_list["1900"] += 1
        elif int(merge_data['release_date'].loc[i][0:4]) <= 1950:
            release_data_list["1950"] += 1
        elif int(merge_data['release_date'].loc[i][0:4]) <= 1960:
            release_data_list["1960"] += 1
        elif int(merge_data['release_date'].loc[i][0:4]) <= 1970:
            release_data_list["1970"] += 1
        elif int(merge_data['release_date'].loc[i][0:4]) <= 1980:
            release_data_list["1980"] += 1
        elif int(merge_data['release_date'].loc[i][0:4]) <= 1990:
            release_data_list["1990"] += 1
        elif int(merge_data['release_date'].loc[i][0:4]) <= 2000:
            release_data_list["2000"] += 1
        elif int(merge_data['release_date'].loc[i][0:4]) <= 2010:
            release_data_list["2010"] += 1
        elif int(merge_data['release_date'].loc[i][0:4]) <= 2020:
            release_data_list["2020"] += 1

    # release_data_list
    sum = 0
    for i in release_data_list:
        sum += release_data_list[i]
    release_data_rate = []
    for i in release_data_list:
        if release_data_list[i] == 0:
            continue
        release_data_list[i] = round(release_data_list[i] / sum, 3)
    return release_data_list

# 비율 가져옴 , 카운트 셈 - 데이터 편집
def genre_ratio(df, usernumber):
    user_df = df[df['userId'] == usernumber]  # 평가 데이터에서 입력받은 유저 아이디의 데이터를 가져옴
    meta2 = pd.read_csv('csv/movie_info.csv', low_memory=False)  # 영화정보 가져옴
    value_meta = meta2[['id', 'original_title', 'release_date', 'genres']]  # 필요한 영화 정보만 선별
    value_meta = value_meta.rename(columns={'id': 'movieId'})  # 이름 변경 : id를 movieId로 고침
    value_meta.movieId = pd.to_numeric(value_meta.movieId, errors='coerce')
    value_meta = value_meta.dropna(axis=0)
    value_meta = value_meta.reset_index()
    merge_data = pd.merge(user_df, value_meta, on='movieId', how='left')  # 데이터 합침 : 평가 정보 + 영화 정보
    merge_data = merge_data.dropna(axis=0)
    merge_data = merge_data.reset_index()  # index 초기화
    # Animation, Action,Adventure, Comedy, Drama,  Romance, Fantasy, Family, Science Fiction, Horror
    # 사용자가 평점준 영화 개봉 연도에 따라 값을 추가해줌
    release_data_list = {'Animation': 0, 'Action': 0, 'Adventure': 0, 'Comedy': 0, 'Drama': 0, 'Romance': 0, 'Fantasy': 0,'Family':0, 'Science Fiction': 0, 'Horror': 0}

    for i in range(0, len(merge_data)):
        if 'Animation' in merge_data['genres'].loc[i]:
            release_data_list["Animation"] += 1
        elif 'Action' in merge_data['genres'].loc[i]:
            release_data_list["Action"] += 1
        elif 'Adventure' in merge_data['genres'].loc[i]:
            release_data_list["Adventure"] += 1
        elif 'Comedy' in merge_data['genres'].loc[i]:
            release_data_list["Comedy"] += 1
        elif 'Drama' in merge_data['genres'].loc[i]:
            release_data_list["Drama"] += 1
        elif 'Romance' in merge_data['genres'].loc[i]:
            release_data_list["Romance"] += 1
        elif 'Fantasy' in merge_data['genres'].loc[i]:
            release_data_list["Fantasy"] += 1
        elif 'Fantasy' in merge_data['genres'].loc[i]:
            release_data_list["Fantasy"] += 1
        elif 'Science Fiction' in merge_data['genres'].loc[i]:
            release_data_list["Science Fiction"] += 1
        elif 'Horror' in merge_data['genres'].loc[i]:
            release_data_list["Horror"] += 1
        elif 'Action' in merge_data['genres'].loc[i]:
            release_data_list["Action"] += 1

    # release_data_list
    sum = 0
    for i in release_data_list:
        sum += release_data_list[i]
    release_data_rate = []
    for i in release_data_list:
        if release_data_list[i] == 0:
            continue
        release_data_list[i] = round(release_data_list[i] / sum, 3)
    return release_data_list

# 영화 추천 시 측정치 + 변수에 따른 가중치를 더해 추천
def Estimate_Score_sum1(user_df, user_release_ratio_list):
    user_df = user_df.dropna(axis=0)
    for i in range(0, len(user_df)):
        if int(user_df.iloc[i]['release_date'][0:4]) <= 1900:
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['1900']
        elif int(user_df.iloc[i]['release_date'][0:4]) <= 1950:
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['1950']
        elif int(user_df.iloc[i]['release_date'][0:4]) <= 1960:
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['1960']
        elif int(user_df.iloc[i]['release_date'][0:4]) <= 1970:
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['1970']
        elif int(user_df.iloc[i]['release_date'][0:4]) <= 1980:
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['1980']
        elif int(user_df.iloc[i]['release_date'][0:4]) <= 1990:
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['1990']
        elif int(user_df.iloc[i]['release_date'][0:4]) <= 2000:
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['2000']
        elif int(user_df.iloc[i]['release_date'][0:4]) <= 2010:
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['2010']
        elif int(user_df.iloc[i]['release_date'][0:4]) <= 2020:
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['2020']
    return user_df

# Animation, Action,Adventure, Comedy, Drama,  Romance, Fantasy, Family, Science Fiction, Horror
# 영화 추천 시 측정치 + 변수에 따른 가중치를 더해 추천
def Estimate_Score_genres(user_df, user_release_ratio_list):
    user_df = user_df.dropna(axis=0)
    for i in range(0, len(user_df)):
        if user_df.iloc[i]['genres'] in "Animation":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['Animation']
        elif user_df.iloc[i]['genres'] in "Action":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['Action']
        elif user_df.iloc[i]['genres'] in "Adventure":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['Adventure']
        elif user_df.iloc[i]['genres'] in "Comedy":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['Comedy']
        elif user_df.iloc[i]['genres'] in "Drama":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['Drama']
        elif user_df.iloc[i]['genres'] in "Romance":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['Romance']
        elif user_df.iloc[i]['genres'] in "Fantasy":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Fantasy'] + \
                                                              user_release_ratio_list['2000']
        elif user_df.iloc[i]['genres'] in "Family":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['Family']
        elif user_df.iloc[i]['genres'] in "Science Fiction":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['Science Fiction']
        elif user_df.iloc[i]['genres'] in "Horror":
            user_df['Estimate_Score'].loc[user_df.index[i]] = user_df.iloc[i]['Estimate_Score'] + \
                                                              user_release_ratio_list['Horror']
    return user_df


# 유저에 따른 개인 영화 추천
# 리뷰 데이터, userId, 평점(5점일 때만), 영화 메타데이터, 사용하지 않을 영화데이터, reader함수, 알고리즘명
def user_difference(data, usernumber, rating, moviedata, dropdata, reader, svd):
    df = data
    df_user = df[(df['userId'] == usernumber) & (df['rating'] == rating)]  # userId로 받아온 사용자 데이터만, 주어진 평점일때만 남김
    df_user = df_user.set_index('movieId')
    df_user = df_user.join(moviedata)['original_title']

    user_df = moviedata.copy()
    user_df = user_df[~user_df['movieId'].isin(dropdata)]  # 사용하지 않는 영화데이터 제거

    data1 = Dataset.load_from_df(df[['userId', 'movieId', 'rating']], reader)  # 학습 데이터를 만들기 위해 Dataset 객체 생성
    trainset = data1.build_full_trainset()  # 데이터를 학습데이터로 만드는 과정
    svd.fit(trainset)  # 가지고있는 trainset으로 fit() 메소드를 실행시킨다. (fit = 훈련시킴)
    # Estimate_Score라는 새로운 칼럼을 만들고, 예측값 처리.
    user_df['Estimate_Score'] = user_df['movieId'].apply(lambda x: svd.predict(usernumber, x).est)  # 나중에 다시 추가
    print('estimate_score : ')
    print(user_df['Estimate_Score'].head(30))
    user_df = user_df.drop('movieId', axis=1)
    user_df = user_df.sort_values('Estimate_Score', ascending=False)  # 나중에 다시 추가
    print('유저에 따른 개인 영화 추천 (10개) : ')
    print(user_df['original_title'].head(10))
    return user_df


# Estimate_Score_sum1 위 함수와 더불어 추천해주는 함수
def temporary_recommend1(data, usernumber, rating, moviedata, dropdata, reader, algo):
    df = data
    user_df = moviedata.copy()
    user_df = user_df[~user_df['movieId'].isin(dropdata)]
    data1 = Dataset.load_from_df(df[['userId', 'movieId', 'rating']], reader)
    trainset = data1.build_full_trainset()
    algo.fit(trainset)
    user_df['Estimate_Score'] = user_df['movieId'].apply(lambda x: algo.predict(usernumber, x).est)
    user_df = user_df.sort_values('Estimate_Score', ascending=False)

    #user_df_total = Estimate_Score_sum1(user_df, user_release_ratio_list)
    user_df_sum_relase = pd.merge(movie_info, user_df, on='original_title', how='left')
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

# Estimate_Score_sum1 위 함수와 더불어 추천해주는 함수
def variable_weight(data, usernumber, rating, moviedata, dropdata, reader, algo):
    df = data
    user_release_ratio_list = genre_ratio(df, usernumber)  # 유저의 장르 비율을 가져온다.
    # user_pop_ratio_list = user_pop_ratio(df, usernumber) # 유저의 popularity 비율을 가져온다.
    # user_language_ratio_list = user_language_ratio(df, usernumber) # 유저의 language 비율을 가져온다.
    user_df = moviedata.copy()
    user_df = user_df[~user_df['movieId'].isin(dropdata)]
    data1 = Dataset.load_from_df(df[['userId', 'movieId', 'rating']], reader)
    trainset = data1.build_full_trainset()
    algo.fit(trainset)
    user_df['Estimate_Score'] = user_df['movieId'].apply(lambda x: algo.predict(usernumber, x).est)
    user_df = user_df.sort_values('Estimate_Score', ascending=False)

    user_df_sum = Estimate_Score_genres(user_df, user_release_ratio_list) # 가중치 적용 함수
    #user_df_total = Estimate_Score_sum1(user_df, user_release_ratio_list)
    user_df_sum_relase = pd.merge(movie_info, user_df_sum, on='original_title', how='left')
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

# 가중치 반영 함수 : variable_weight , 임시로 주석처리 해둔 것이니 나중에 주석처리 풀어야함
#user_df_sum_relase = variable_weight(df, sys.argv[1], 6, meta, drop_movie_list, reader, svd)
# 가중치 반영 안한 임시 함수 : temporary_recommend1
user_df_sum_relase = temporary_recommend1(df, 1, 6, meta, drop_movie_list, reader, svd)
#print("[Broken Blossoms,Broken Blossoms,5 Card Stud,Sleepless in Seattle,While You Were Sleeping,Dead Man,座頭市,座頭市,Gremlins 2: The New Batch,Lonely Hearts],[/t/p/w300_and_h450_bestv2/9rZUn5x7dIeaC08WKXPlPlWL0Kk.jpg,/t/p/w300_and_h450_bestv2/l9rHRp7Yb2PVy5Qd5wUR9coXZoy.jpg,/t/p/w300_and_h450_bestv2/ow1esWlXoRPijAvR6GZQbv0uv9r.jpg,/t/p/w300_and_h450_bestv2/iLWsLVrfkFvOXOG9PbUAYg7AK3E.jpg,/t/p/w300_and_h450_bestv2/qNGO3ETcNwlWqK2kNRpbJSJRlos.jpg,/t/p/w300_and_h450_bestv2/gh7227sZsC28fQdl8c4wZ5QCppI.jpg,/t/p/w300_and_h450_bestv2/iCIycswWbX1EDS6PYYBcR9ohrC.jpg,/t/p/w300_and_h450_bestv2/uLpWIKg5DdLNan1o2u6gvQ6KIVe.jpg,/t/p/w300_and_h450_bestv2/jN7yvxnIHRozhq2mzWZDE5GPRc0.jpg,/t/p/w300_and_h450_bestv2/qnQK4JUwEUFDKt7dSMY2fJmhv2f.jpg]")