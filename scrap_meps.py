from datetime import datetime, date
from scrap_mep_class import Mep
import requests
import xml.etree.ElementTree as ET
import os
from global_variables import origin_directory

political_parties = {
    "Group of the European People's Party (Christian Democrats)": "EPP",
    "Identity and Democracy Group": "ID",
    "Group of the Greens/European Free Alliance": "Greens/EFA",
    "Group of the Progressive Alliance of Socialists and Democrats in the European Parliament": "S&D",
    "European Conservatives and Reformists Group": "ECR",
    "Renew Europe Group": "Renew",
    "The Left group in the European Parliament - GUE/NGL": "The Left",
    "Non-attached Members": "NI",
    "Group of the European United Left - Nordic Green Left": "The Left"
}


def MEP_Name_clean(input_Name):
    input_Name.lower()
    key = 0
    if "-" in input_Name:
        input_Name_split = input_Name.split("-")
        for keys in input_Name_split:
            input_Name_split[key] = input_Name_split[key].capitalize()
            key += 1
        input_Name = "-".join(input_Name_split)
        key = 0
        if " " in input_Name:
            input_Name_split = input_Name.split()
            for keys in input_Name_split:
                input_Name_split[key] = input_Name_split[key][:1].upper(
                ) + input_Name_split[key][1:]
                key += 1
            input_Name = " ".join(input_Name_split)
    elif " " in input_Name:
        input_Name_split = input_Name.split()
        for keys in input_Name_split:
            input_Name_split[key] = input_Name_split[key].capitalize()
            key += 1
        input_Name = " ".join(input_Name_split)
    return input_Name

def clean_text(input_text):
    input_text = input_text.replace("\n", "")
    input_text = input_text.replace("\t", "")
    return input_text.strip()

class ScrapMep():
    url_current = 'https://www.europarl.europa.eu/meps/en/full-list/xml/'
    url_incoming = 'https://www.europarl.europa.eu/meps/en/incoming-outgoing/incoming/xml'
    url_outgoing = 'https://www.europarl.europa.eu/meps/en/incoming-outgoing/outgoing/xml'
    list_meps = []

    def __init__(self) -> None:
        pass

    def scrapMeps(self):
        # Get the file of the incoming
        self.downloadMepsFile(type='incoming')
        # Process the incoming only to retain PersId and entry date
        self.incomingMepsProcess()
        # Delete the file
        os.remove(origin_directory+"incoming.xml")

        # Get the file
        self.downloadMepsFile(type='current')
        # Process the current meps
        self.currentMepsProcess()
        # Delete the file
        os.remove(origin_directory+"current.xml")

        # Get the file
        self.downloadMepsFile(type='outgoing')
        # Process outgoing meps
        self.outgoingMepsProcess()
        # Delete the file
        os.remove(origin_directory+"outgoing.xml")

    def outgoingMepsProcess(self):
        myroot = ET.parse(origin_directory+'outgoing.xml').getroot()
        list_ = []
        # Get all meps and parse them
        for mep in myroot.findall('mep'):
            # Get the name
            Name = MEP_Name_clean(clean_text(mep.find('fullName').text))
            # Get the country
            Country = clean_text(mep.find('country').text)
            # Get the PersId
            PersId = clean_text(mep.find('id').text)
            # Get the EuParty
            EuParty = clean_text(political_parties[mep.find('politicalGroup').text])
            # NationalParty
            NationalParty = clean_text(mep.find('nationalPoliticalGroup').text)
            # Default leave date
            LeaveDate = datetime.strptime(mep.find('mandate-end').text, '%d/%m/%Y')
            # Check for an entry date, otherwise default
            EntryDate = datetime.strptime(mep.find('mandate-start').text, '%d/%m/%Y')
            # Append to list Meps
            self.list_meps.append(Mep(PersId=PersId, Name=Name, EuParty=EuParty, Country=Country, NationalParty=NationalParty, LeaveDate=LeaveDate, EntryDate=EntryDate))

    def incomingMepsProcess(self):
        myroot = ET.parse(origin_directory+'incoming.xml').getroot()
        list_ = []
        # Get all meps and parse them
        for mep in myroot.findall('mep'):
            # Get the PersId
            PersId = clean_text(mep.find('id').text)
            # Entry date
            date = clean_text(mep.find('mandate-start').text).replace('/', '-')
            EntryDate = datetime.strptime(date, "%d-%m-%Y")
            # Append to list Meps
            list_.append(Mep(PersId=PersId, EntryDate=EntryDate).returnMepJson())
        self.incoming = list_

    def currentMepsProcess(self):
        myroot = ET.parse(origin_directory+'current.xml').getroot()
        list_ = []
        # Get all meps and parse them
        for mep in myroot.findall('mep'):
            # Get the name
            Name = MEP_Name_clean(clean_text(mep.find('fullName').text))
            # Get the country
            Country = clean_text(mep.find('country').text)
            # Get the PersId
            PersId = clean_text(mep.find('id').text)
            # Get the EuParty
            EuParty = clean_text(political_parties[mep.find('politicalGroup').text])
            # NationalParty
            try:
                NationalParty = clean_text(mep.find('nationalPoliticalGroup').text)
            except:
                NationalParty = EuParty
            # Default leave date
            LeaveDate = datetime.strptime('02-07-2024', '%d-%m-%Y')
            # Check for an entry date, otherwise default
            if self.incoming:
                EntryDate=''
                for els in self.incoming:
                    if els['PersId'] == PersId:
                        EntryDate = els['EntryDate']
                if EntryDate=='':
                    EntryDate = datetime.strptime('02-06-2019', '%d-%m-%Y')
            # Append to list Meps
            self.list_meps.append(Mep(PersId=PersId, Name=Name, EuParty=EuParty, Country=Country, NationalParty=NationalParty, LeaveDate=LeaveDate, EntryDate=EntryDate))

    def downloadMepsFile(self, type):
        if type=='incoming':
            r = requests.get(self.url_incoming)
        if type=='current':
            r = requests.get(self.url_current)
        if type=='outgoing':
            r = requests.get(self.url_outgoing)

        if r.status_code == 200:
            open(origin_directory+type+'.xml', "wb").write(r.content)


    def returnJsonMeps(self):
        if self.list_meps:
                self.ListJsonCurrentMeps = []
                for els in self.list_meps:
                    jsonMep = els.returnMepJson()
                    self.ListJsonCurrentMeps.append(jsonMep)
                return self.ListJsonCurrentMeps
        else:
            return None
