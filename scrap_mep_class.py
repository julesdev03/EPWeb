from datetime import datetime

class Mep():        
    def __init__(self, **kwargs):
        # Get everything in the kwargs to instantiate
        if "PersId" in kwargs:
            self.PersId = kwargs["PersId"]
        else:
            self.PersId = None
        if "Name" in kwargs:
            self.Name = kwargs["Name"]
        else:
            self.Name = None
        if "EuParty" in kwargs:
            self.EuParty = kwargs['EuParty']
        else:
            self.EuParty = None
        if "Country" in kwargs:
            self.Country = kwargs['Country']
        else:
            self.Country = None
        if "NationalParty" in kwargs:
            self.NationalParty = kwargs['NationalParty']
        else:
            self.NationalParty = None
        if "LeaveDate" in kwargs:
            self.LeaveDate = kwargs['LeaveDate']
        else:
            self.LeaveDate = None
        if "EntryDate" in kwargs:
            self.EntryDate = kwargs['EntryDate']
        else:
            self.EntryDate = None    
            
    def returnMepJson(self):
        return vars(self)