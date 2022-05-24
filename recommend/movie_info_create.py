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
f = open("movie_info.csv", "w")

meta = pd.read_csv('movies_metadata.csv',low_memory=False)
# 필요한 컬럼만 가져온다. 아이디,제목,장르,개봉알,인기도,언어
meta = meta[['id','original_title','genres','release_date','runtime', 'poster_path']]

# 영화 등장인물 가져오기
actor = pd.read_csv('/Users/bag-yejin/Downloads/archive (1)/credits.csv', low_memory=False)
actor = actor[['cast','id']]

theActor = []
headersCSV = ['id', 'original_title', 'genres','runtime', 'release_date', 'actor', 'poster_path']

for j in range(45465):
    listActor = []
    test = actor['cast'][j].strip('[{')
    test = test.strip('}]')
    list1 = test.split('}, {')
    for i in range(len(list1)):
        dic = list1[i].split(',')
        if len(dic)>=5:
            if(len(dic[5].split(':'))>=2):
                listActor.append((dic[5].split(':')[1]).strip().strip(''))
    actor['cast'][j]=listActor

with open('movie_info.csv', 'a', newline='') as f_object:
    dictwriter_object = csv.DictWriter(f_object, fieldnames=headersCSV)
    dictwriter_object.writeheader()

    for i in range(0, 45465):
        dict = {'id': str(meta['id'][i]), 'original_title': str(meta['original_title'][i]), 'genres': str(meta['genres'][i]),'runtime':str(meta['runtime'][i]), 'release_date': str(meta['release_date'][i]),'actor':str(actor['cast'][i]), 'poster_path': str(meta['poster_path'][i])}
        print(dict)
        dictwriter_object.writerow(dict)


f_object.close()
f.close()