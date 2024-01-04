from db_manager import DBMana
from scrap_meps import ScrapMep
from scrap_dates import ScrapDates


def date_scraper():
    scraper = ScrapDates()
    scraper.scrapDates()
    datan = scraper.returnDateDic()
    db = DBMana(data=datan, data_name='dates')
    db.compareAndSave()

def mep_scraper():
    scraper = ScrapMep()
    scraper.scrapMeps()
    datan = scraper.returnJsonMeps()
    db = DBMana(data=datan, data_name='meps')
    db.compareAndSave()

# date_scraper()
mep_scraper()