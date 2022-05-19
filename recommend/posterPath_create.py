# -*- encoding: utf-8 -*-
# -*- coding: utf-8 -*-
import urllib
from urllib.error import HTTPError
from urllib.request import urlopen, Request
from bs4 import BeautifulSoup
import pandas as pd
import csv

# 활용할 csv 파일 만들기
f = open("poster_path.csv", "a")

meta = pd.read_csv('movies_metadata.csv',low_memory=False)

# 필요한 컬럼만 가져온다. 아이디,제목,장르,개봉알,인기도,언어
meta = meta[['id','original_title']]
meta = meta[pd.notnull(meta['original_title'])]
headersCSV = ['id', 'original_title','poster_path']

with open('poster_path.csv', 'a', newline='') as f_object:
    dictwriter_object = csv.DictWriter(f_object, fieldnames=headersCSV)
    dictwriter_object.writeheader()

    for i in range(42904, len(meta)):
        movieId = str(meta['id'][i])
        urlStr = 'https://www.themoviedb.org/movie/' + movieId +'?language=ko%27'
        print(urlStr)
        try:
            req = Request(urlStr, headers={'User-Agent': 'Mozilza/5.0'})
            html = urllib.request.urlopen(req).read()

            bsObject = BeautifulSoup(html, "html.parser")
            bsObject = bsObject.find('body', attrs={'class': 'en v4'})

            if bsObject.find('div', attrs={'class': 'page_wrap movie_wrap'}) != None:
                bsObject = bsObject.find('div', attrs={'class': 'page_wrap movie_wrap'})
                bsObject = bsObject.find('main', attrs={'id': 'main'})
                if (bsObject.find('section', attrs={'class': 'inner_content movie_content backdrop poster'}) != None):
                    bsObject = bsObject.find('section', attrs={'class': 'inner_content movie_content backdrop poster'})
                    #print(bsObject)
                    if(bsObject!=None):
                        if (bsObject.find('div', attrs={'class': 'header large border first'})!= None):
                            bsObject = bsObject.find('div', attrs={'class': 'header large border first'})
                            bsObject = bsObject.find('div', attrs={'class': 'keyboard_s custom_bg'})
                            bsObject = bsObject.find('div', attrs={'class': 'single_column'})
                            bsObject = bsObject.find('section', attrs={'class': 'images inner'})
                            bsObject = bsObject.find('div', attrs={'class': 'poster'})
                            bsObject = bsObject.find('div', attrs={'class': 'image_content backdrop'})
                            bsObject = bsObject.find('img', attrs={'class': 'poster lazyload'})

                            dict = {'id': str(meta['id'][i]), 'original_title': str(meta['original_title'][i]),'poster_path':bsObject['data-src']}
                            dictwriter_object.writerow(dict)
        except HTTPError as e:
            err = e.read()
            code = e.getcode()
            print(code)

f_object.close()
f.close()
