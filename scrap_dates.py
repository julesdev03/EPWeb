from datetime import datetime
import json
import requests

class ScrapDates():

    url_dates = "https://www.europarl.europa.eu/plenary/en/ajax/getSessionCalendar.html?family=PV&termId=9"

    def __init__(self):
        self.ListDate = []

    def scrapDates(self):
        dic_dates = requests.get(self.url_dates, allow_redirects=True).content.decode('utf8').replace("'", '"')
        dic_dates = json.loads(dic_dates)
        for el in dic_dates["sessionCalendar"]:
            date = el["year"] + "-" + el["month"] + "-" + el["day"]
            self.ListDate.append(datetime.strptime(date, '%Y-%m-%d'))
    
    def returnDateDic(self, String=False):
        self.ListDicDates = []
        for el in self.ListDate:
            DicPlaceholder = {}
            if String == False:
                DicPlaceholder['Date'] = el
            elif String == True:
                DicPlaceholder['Date'] = datetime.strftime(el, '%d-%m-%Y')
            self.ListDicDates.append(DicPlaceholder)
        return self.ListDicDates

