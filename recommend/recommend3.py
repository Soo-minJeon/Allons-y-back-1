from pandas import read_csv
import sys
random_num = []

result_movie = ''
result_poster = ''
df = read_csv('movie_info.csv')

def process(fActor):
    result_movie = ""
    result_poster = ""
    for i in range(len(df)):
        if(fActor in df['actor'][i]):
            random_num.append(i)
    print(random_num)

    for i in range(len(random_num)):
        if i<=10:
            result_movie += df['original_title'][random_num[i]] + ", "
            result_poster += df['poster_path'][random_num[i]] + ", "

    print("["+result_movie+"],["+result_poster+"]")

if __name__ == '__main__':
    #process('Angelina Jolie')
    process(sys.argv[1])
