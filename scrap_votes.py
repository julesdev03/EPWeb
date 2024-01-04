from datetime import datetime
import pandas as pd
import xml.etree.ElementTree as ET
import requests
import os

class ScrapVotes():

    url_vote = 'https://www.europarl.europa.eu/doceo/document/PV-9-{date}-RCV_FR.xml'
    file_path = 'RCV_EP/VOTE-{date}.xml'
    directory_csv = 'RCV_CSV'

    def __init__(self, Date):
        # insert as datetime and not str
        self.Date = Date
    
    def deleteFile(self):
        os.remove(self.file_path.replace("{date}", datetime.strftime(self.Date, '%d-%m-%Y')))
    
    def downloadVote(self):
        date = datetime.strftime(self.Date, '%Y-%m-%d')     
        url = self.url_vote.replace("{date}", date)
        r = requests.get(url)

        # Save the file if the request is successful
        if r.status_code == 200:
            open(self.file_path.replace("{date}", datetime.strftime(self.Date, '%d-%m-%Y')), "wb").write(r.content)
    
    def saveCsv(self):
        try:
            if self.ListOfVotes:
                df = pd.DataFrame.from_records(self.ListOfVotes)
                df.to_csv(datetime.strftime(self.Date, '%d-%m-%Y')+'.csv')
        except:
            pass

    def processVote(self):
        # Get file with the date as string format
        file_path = self.file_path.replace("{date}", datetime.strftime(self.Date, '%d-%m-%Y') )

        # List was not working - therefore use a df; but it is slower
        df = pd.DataFrame()

        # Parse votes
        myroot = ET.parse(file_path).getroot()

        for vote in myroot.findall('RollCallVote.Result'):
            DicPlaceHolder = {}

            # Get Description of the vote as a string
            DicPlaceHolder['Description'] = ET.tostring(vote.find("RollCallVote.Description.Text"), method='text', encoding="unicode")

            # Get vote identifier 
            UniqueIdentifier = vote.get('Identifier')
            DicPlaceHolder['Identifier'] = UniqueIdentifier

            # Add date as datetime format
            DicPlaceHolder['Date'] = self.Date

            # Get individual MEPs
            try:
                resultFOR = vote.find("Result.For")
                if resultFOR:
                    for groups in resultFOR.findall("Result.PoliticalGroup.List"):
                        for meps in groups.findall("PoliticalGroup.Member.Name"):
                            if 'PersId' in DicPlaceHolder.keys():
                                DicPlaceHolder.pop('PersId')
                            if 'Vote' in DicPlaceHolder.keys():
                                DicPlaceHolder.pop('Vote')
                            DicPlaceHolder['PersId'] = meps.get("PersId")
                            DicPlaceHolder['Vote'] = 'For'
                            df = pd.concat([df, pd.DataFrame(DicPlaceHolder, index=[0])], ignore_index=True)
            except:
                pass

            try:
                resultAbs = vote.find("Result.Abstention")
                if resultAbs:
                    for groups in resultAbs.findall("Result.PoliticalGroup.List"):
                        for meps in groups.findall("PoliticalGroup.Member.Name"):
                            if 'PersId' in DicPlaceHolder.keys():
                                DicPlaceHolder.pop('PersId')
                            if 'Vote' in DicPlaceHolder.keys():
                                DicPlaceHolder.pop('Vote')
                            DicPlaceHolder['PersId'] = meps.get("PersId")
                            DicPlaceHolder['Vote'] = 'Abstention'
                            df = pd.concat([df, pd.DataFrame(DicPlaceHolder, index=[0])], ignore_index=True)
            except:
                pass

            try:
                resultAgainst = vote.find("Result.Against")
                if resultAgainst:
                    for groups in resultAgainst.findall("Result.PoliticalGroup.List"):
                        for meps in groups.findall("PoliticalGroup.Member.Name"):
                            if 'PersId' in DicPlaceHolder.keys():
                                DicPlaceHolder.pop('PersId')
                            if 'Vote' in DicPlaceHolder.keys():
                                DicPlaceHolder.pop('Vote')
                            DicPlaceHolder['PersId'] = meps.get("PersId")
                            DicPlaceHolder['Vote'] = 'Against'
                            df = pd.concat([df, pd.DataFrame(DicPlaceHolder, index=[0])], ignore_index=True)
            except:
                pass
        
        self.ListOfVotes = df.to_dict('records')

        return self.ListOfVotes
