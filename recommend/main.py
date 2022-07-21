import sys
import numpy as np
import pandas as pd # pandas
from sklearn.metrics.pairwise import cosine_similarity

# 수정필요한 부분 - movies : movie_info.csv 파일 경로 수정(현재 전수민 노트북 로컬 파일 경로로 설정해놓았음.)

def process(id):
    # row, col 생략 없이 출력
    pd.set_option('display.max_rows', None)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 300)

    ### 필요한 함수와 알고리즘 구현부
    ratings = pd.read_csv(
        'recommend/user_info.csv',
        low_memory=False)
    movies = pd.read_csv(
        'recommend/movie_info.csv',
        low_memory=False)
    movies.columns = ['movieId','original_title','genres','runtime','release_date','actor','poster_path', 'remakeTitle',
              'remakePoster']

    movies.movieId = pd.to_numeric(movies.movieId, errors='coerce')
    ratings.movieId = pd.to_numeric(ratings.movieId, errors='coerce')

    movie_ratings = pd.merge(ratings, movies, on="movieId")

    ################################################
    ## 맨 첫 파라미터(rating - 수행모델 결과로 수정해야 함.)##
    ################################################
    title_user = movie_ratings.pivot_table('rating', index='userId', columns='movieId')
    # 결측치는 0으로 처리
    title_user.fillna(0, inplace=True)

    # 유저와 유저 간의 유사도
    user_based_collab = cosine_similarity(title_user, title_user)
    user_based_collab = pd.DataFrame(user_based_collab, index=title_user.index, columns=title_user.index)

    # 대상이 되는 유저의 id
    # client_user = int(id)
    client_user = int(id)

    #
    recommend_user = 5
    users = []
    movieid = []
    movieTitle = []
    moviePoster = []

   # 가장 유사도가 높은 유저의 감상기록 가져오기
    for i in range(1, recommend_user + 1):
        user = user_based_collab[client_user].sort_values(ascending=False)[:10].index[i]
        user2 = (title_user.loc[user].sort_values(ascending=False))
        users.append(user)
        movieid = np.concatenate((movieid, user2.head(5).index.values), axis=0)

        movieid_ = []
        for j in movieid:
            if j not in movieid_:
                movieid_.append(j)
        movieid = movieid_

        if (len(movieid) < (i * 5)):
            while(len(movieid) < i * 5):

                lack = (i*5) - len(movieid)
                movieid = np.concatenate((movieid, user2.head(5+lack).index.values), axis=0)

                movieid_ = []
                for j in movieid:
                    if j not in movieid_:
                        movieid_.append(j)
                movieid = movieid_

    for i in range(len(movieid)):
        movieid[i] = int(movieid[i])


    for j in range(25):
        find_row = movies.index[(movies['movieId'] == movieid[j])]
        # print(find_row[0])
        movieTitle.append(movies.loc[find_row[0]]['original_title'])
        moviePoster.append(movies.loc[find_row[0]]['poster_path'])

    print(users, movieTitle, moviePoster)

if __name__ == '__main__':
    # process(671)
    process(sys.argv[1])

