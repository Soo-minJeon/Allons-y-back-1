from pandas import read_csv
import sys
random_num = []

result_movie = ''
result_poster = ''
df = read_csv('recommend/movie_info.csv')

def process(fActor):
    result_movie = ""
    result_poster = ""
    for i in range(len(df)):
        if(fActor in df['actor'][i]):
            random_num.append(i)

    count = 0
    for i in range(len(random_num)):
        if count<10:
            result_movie += df['original_title'][random_num[i]] + ", "
            result_poster += df['poster_path'][random_num[i]] + ", "
            count+=1

    result_movie=result_movie.strip().strip(',')
    result_poster=result_poster.strip().strip(',')

    print("["+result_movie+"],["+result_poster+"]")

if __name__ == '__main__':
    #process('Angelina Jolie')
    process(sys.argv[1])
