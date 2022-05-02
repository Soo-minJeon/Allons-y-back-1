import pandas as pd # pandas
import sys

def process(title):

        # 생략없이 출력
        pd.set_option('display.max_rows', None)
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 300)

        # csv 파일 불러오기
        movies = pd.read_csv(
                '/recommend/movie_info.csv',
                low_memory=False)
        movies.columns = ['id', 'original_title', 'genres','runtime', 'release_date', 'actor', 'poster_path']

        # 제목으로 정보 찾기
        find_row = movies.index[(movies['original_title'] == title)]

        # 장르 문자열 처리
        genres = movies.loc[find_row[0]]['genres']
        genres = genres.replace('[', '').replace(']', '').split('}, {')
        genres_after = []

        for i in range(len(genres)):
                genre = genres[i].split(', ')[1].split(': ')[1].replace("'", '').replace("}", '')
                genres_after.append(genre)

        print(movies.loc[find_row[0]]['original_title'],'|',  genres_after, '|', movies.loc[find_row[0]]['poster_path'])


if __name__ == '__main__':
    process(sys.argv[1])