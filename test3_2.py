# 추천1, 컨텐츠 기반 필터링 추천 시스템. 영화 10개를 추천한다.

# -*- coding: utf-8 -*-
import pandas as pd
from surprise import Reader, Dataset, SVD, NormalPredictor, KNNBasic # 알고리즘이 들어간다.
from surprise import BaselineOnly, SVDpp, NMF, SlopeOne, CoClustering # 분석툴

# 무시
pd.set_option('mode.chained_assignment',  None) # <==== 경고를 끈다

ratings = pd.read_csv('recommend/ratings_small.csv', low_memory=False) # 원본은 데이터가 많아서 small 데이터 사용
ratings = ratings[['userId', 'movieId', 'rating']] # 사용자 아이디, 영화 아이디, 평가
ratings.head()
ratings.movieId = pd.to_numeric(ratings.movieId, errors='coerce')
ratings.userId = pd.to_numeric(ratings.userId, errors='coerce')
ratings.rating = pd.to_numeric(ratings.rating, errors='coerce')
len(ratings)
df = ratings

# 너무 많기 때문에 70퍼센트만 가져온다. (= 결측치 처리 : movie id를 count한 것에 대한 70%)
# 적은 수의 평가가 있는 영화는 제외
df = df[pd.notnull(df['rating'])] # rating이 null인것 제외하고 df 다시 정의
# agg() 함수는 여러개의 열에 여러가지 함수를 적용 가능하게 함
f = ['count', 'mean'] # -> 그룹 객체에 대해 count(개수구함), mean(평균구함) 함수를 agg() 함수를 통해 적용
df_movie_summary = df.groupby('movieId')['rating'].agg(f) # 영화(movieId) 별 평가

df_movie_summary.index = df_movie_summary.index.map(int) # map 함수 쓰면 한번에 형변환 처리 가능, 스트(?)나 튜플을 지정함수로 처리해주는 역할

movie_benchmark = round(df_movie_summary['count'].quantile(0.7), 0) # quantile 사분위 수 -> ?
drop_movie_list = df_movie_summary[df_movie_summary['count'] < movie_benchmark].index # 제외 영화 리스트

# 여기서도 영화 리뷰가 너무 적으면 제외 시킴
df_cust_summary = df.groupby('userId')['rating'].agg(f) # 사용자(userId) 별 평가
df_cust_summary.index = df_cust_summary.index.map(int)
cust_benchmark = round(df_cust_summary['count'].quantile(0.7),0)
drop_cust_list = df_cust_summary[df_cust_summary['count'] < cust_benchmark].index # 제외 사용자 리스트

# 여기서 위에서 제외할 리스트들을 넣어주어 drop 해주었다.
df = df[~df['movieId'].isin(drop_movie_list)] # df의 'Movie_Id'에서 drop_movie_list의 값이 있으면 True
df = df[~df['userId'].isin(drop_cust_list)]

# 피봇테이블 생성, pivot_table()은 데이터 프레임 생성, 구성 요소 입력해줌
df_p = pd.pivot_table(df, values='rating', index='userId', columns='movieId')

# 영화 데이터를 가져왔다.
meta = pd.read_csv('recommend/movies_metadata.csv',low_memory=False)
# 필요한 컬럼만 가져온다. 아이디,제목,장르,개봉알,인기도,언어
meta = meta[['id','original_title','genres','release_date','popularity','original_language']]

# 간단하게 id 값을 movieId로 바꿔주고
meta = meta.rename(columns={'id':'movieId'})
# 문자열 칼럼을 숫자형 칼럼으로 바꿔주는 작업을 해주었다.
meta.movieId = pd.to_numeric(meta.movieId, errors='coerce')
meta.popularity = pd.to_numeric(meta.popularity, errors='coerce') # popularity를 문자열에서 숫자형으로 변환!

# 알고리즘에 따른 추천
reader = Reader()
data = Dataset.load_from_df(df[['userId', 'movieId', 'rating']], reader=reader) # 평가 데이터 가져옴
svd = SVD()
slope = SlopeOne()
nmf = NMF()

bsl_options = {'method':'als',
               'n_epochs':5,
               'reg_u':12,
               'reg_i':5
               }
als = BaselineOnly(bsl_options)

# 변수에 대한 가중치
def user_release_ratio(df, usernumber):
    user_df = df[df['userId'] == usernumber] # 평가 데이터에서 입력받은 유저 아이디의 데이터를 가져옴
    meta2 = pd.read_csv('recommend/movies_metadata.csv', low_memory=False) # 영화정보 가져옴
    value_meta = meta2[['id','original_title','release_date','genres']] # 필요한 영화 정보만 선별

    value_meta = value_meta.rename(columns={'id':'movieId'}) # 이름 변경 : id를 movieId로 고침
    value_meta.movieId = pd.to_numeric(value_meta.movieId, errors='coerce')
    value_meta = value_meta.dropna(axis=0)
    value_meta = value_meta.reset_index()
    merge_data = pd.merge(user_df, value_meta, on='movieId', how='left') # 데이터 합침 : 평가 정보 + 영화 정보
    merge_data = merge_data.dropna(axis=0)
    merge_data = merge_data.reset_index() # index 초기화

    # 사용자가 평점준 영화 개봉 연도에 따라 값을 추가해줌
    release_data_list = {'1900':0, '1950':0, '1960':0, '1970':0, '1980':0, '1990':0, '2000':0, '2010':0, '2020':0}
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
        release_data_list[i] = round(release_data_list[i]/sum, 3)
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

# 유저에 따른 개인 영화 추천
# 리뷰 데이터, userId, 평점(5점일 때만), 영화 메타데이터, 사용하지 않을 영화데이터, reader함수, 알고리즘명
def user_difference(data, usernumber, rating, moviedata, dropdata, reader, svd):
    df = data
    df_user = df[(df['userId']==usernumber) & (df['rating']==rating)]  # userId로 받아온 사용자 데이터만, 주어진 평점일때만 남김
    df_user = df_user.set_index('movieId')
    df_user = df_user.join(moviedata)['original_title']
    #print('1. 개인별 영화 추천을 위해 처리한 user 정보 : ')
    #print(df_user)

    #  유저의 연도 비율을 가져온다.
    user_release_ratio_list = user_release_ratio(df, usernumber) # 유저의 년도 비율을 가져온다.
    print('유저 연도 비율 : ')
    print(user_release_ratio_list)
    user_df = moviedata.copy()
    user_df = user_df[~user_df['movieId'].isin(dropdata)]  # 사용하지 않는 영화데이터 제거
    print('영화 메타 데이터 : ')
    print(user_df)

    data1 = Dataset.load_from_df(df[['userId', 'movieId', 'rating']], reader) #학습 데이터를 만들기 위해 Dataset 객체 생성
    # data1 = <surprise.dataset.DatasetAutoFolds object at 0x7ff1d0196b00>
    trainset = data1.build_full_trainset() # 데이터를 학습데이터로 만드는 과정
    svd.fit(trainset) # 가지고있는 trainset으로 fit() 메소드를 실행시킨다. (fit = 훈련시킴)
    # Estimate_Score라는 새로운 칼럼을 만들고, 예측값 처리.
    user_df['Estimate_Score'] = user_df['movieId'].apply(lambda x : svd.predict(usernumber, x).est) # 나중에 다시 추가
    print('estimate_score : ')
    print(user_df['Estimate_Score'].head(30))
    user_df = user_df.drop('movieId', axis = 1)

    user_df = user_df.sort_values('Estimate_Score', ascending = False) # 나중에 다시 추가

    print('유저에 따른 개인 영화 추천 (10개) : ')
    print(user_df['original_title'].head(10))

    return user_df

# 위 함수와 더불어 추천해주는 함수
def variable_weight(data, usernumber, rating, moviedata, dropdata, reaader, algo):
    df = data
    user_release_ratio_list = user_release_ratio(df, usernumber) # 유저의 년도 비율을 가져온다.
    #user_pop_ratio_list = user_pop_ratio(df, usernumber) # 유저의 popularity 비율을 가져온다.
    #user_language_ratio_list = user_language_ratio(df, usernumber) # 유저의 language 비율을 가져온다.

    user_df = moviedata.copy()
    user_df = user_df[~user_df['movieId'].isin(dropdata)]
    data1 = Dataset.load_from_df(df[['userId', 'movieId', 'rating']], reader)
    trainset = data1.build_full_trainset()
    algo.fit(trainset)
    user_df['Estimate_Score'] = user_df['movieId'].apply(lambda x: algo.predict(usernumber,x).est)
    user_df = user_df.sort_values('Estimate_Score', ascending=False)

    user_df_sum = Estimate_Score_sum1(user_df, user_release_ratio_list)
    #user_df_total = Estimate_Score_sum1(user_df, user_release_ratio_list)
    user_df_sum_relase = user_df_sum.sort_values('Estimate_Score', ascending=False)
    print("개봉일 별 가중치 반영하여 영화 추천 : ")
    print(user_df_sum_relase['original_title'].head(10))

    return user_df_sum_relase

user_df_sum_relase = variable_weight(df, 665, 6, meta, drop_movie_list, reader, svd)

#user_df665 = user_difference(df, 665, 5, meta, drop_movie_list, reader, svd)
