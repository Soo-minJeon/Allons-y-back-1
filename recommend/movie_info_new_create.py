import string
import pandas as pd
import csv

# 오류(SettingWithCopyError 발생)
pd.set_option('mode.chained_assignment', 'raise') # SettingWithCopyError

# 경고(SettingWithCopyWarning 발생, 기본 값입니다)
pd.set_option('mode.chained_assignment', 'warn') # SettingWithCopyWarning

# 무시
pd.set_option('mode.chained_assignment',  None) # <==== 경고를 끈다
# 활용할 csv 파일 만들기
f = open("movie_info2.csv", "w")

meta = pd.read_csv('/Users/jeonsumin/Desktop/allonsy-git/Allons-y-back-1/recommend/movie_info 2.csv',low_memory=False)
# 필요한 컬럼만 가져온다. 아이디,제목,장르,개봉알,인기도,언어
meta = meta[['id', 'original_title', 'genres','runtime', 'release_date', 'actor', 'poster_path']]

headersCSV = ['id', 'original_title', 'genres','runtime', 'release_date', 'actor', 'poster_path','remakeTitle','remakePoster']


with open('movie_info2.csv', 'a', newline='') as f_object:
    dictwriter_object = csv.DictWriter(f_object, fieldnames=headersCSV)
    dictwriter_object.writeheader()

    for i in range(0, 35922):
        
        if (i==1):
            remake_title = "Jumanji: Welcome to the Jungle"
            remake_poster = "/t/p/original/22hqf97LadMvkd4zDi3Bq25xSqD.jpg"
            dict = {'id': str(meta['id'][i]), 'original_title': str(meta['original_title'][i]), 'genres': str(meta['genres'][i]),'runtime':str(meta['runtime'][i]), 'release_date': int(str(meta['release_date'][i])[0:4]),'actor':str(meta['actor'][i]), 'poster_path': str(meta['poster_path'][i]), 'remakeTitle':remake_title, 'remakePoster':remake_poster}

        else:
            dict = {'id': str(meta['id'][i]), 'original_title': str(meta['original_title'][i]), 'genres': str(meta['genres'][i]),'runtime':str(meta['runtime'][i]), 'release_date': int(str(meta['release_date'][i])[0:4]),'actor':str(meta['actor'][i]), 'poster_path': str(meta['poster_path'][i]), 'remakeTitle':0, 'remakePoster':0}
        print(dict)
        dictwriter_object.writerow(dict)


f_object.close()
f.close()