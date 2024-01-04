import os
import pandas as pd
import numpy as np
import json
from datetime import datetime

class DBMana():

    def __init__(self, data_name, data=None):
        self.data = data
        self.data_name = data_name

    def compareAndSave(self):
        # If the file is already existing
        if self.data_name + ".csv" in os.listdir():
            # Get the csv
            df1 = pd.read_csv('EPWeb/'+self.data_name + '.csv')

            # Get the data
            df2 = pd.DataFrame().from_records(self.data)

            # Ensuring that both frames have int for meps
            if self.data_name == "meps":
                df1['PersId']=df1['PersId'].astype(int)
                df2['PersId']=df2['PersId'].astype(int)
                if 'LeaveDate' in df2.columns and not pd.api.types.is_datetime64_any_dtype(df2['LeaveDate']):
                    df2['LeaveDate'] = pd.to_datetime(df2['LeaveDate'])
                if 'EntryDate' in df2.columns and not pd.api.types.is_datetime64_any_dtype(df2['EntryDate']):
                    df2['EntryDate'] = pd.to_datetime(df2['EntryDate'])
                if 'EntryDate' in df1.columns and not pd.api.types.is_datetime64_any_dtype(df1['EntryDate']):
                    df1['EntryDate'] = pd.to_datetime(df1['EntryDate'])
                if 'LeaveDate' in df1.columns and not pd.api.types.is_datetime64_any_dtype(df1['LeaveDate']):
                    df1['LeaveDate'] = pd.to_datetime(df1['LeaveDate'])
            if self.data_name == "dates":
                # Change string to timestamp
                df1['Date'] = pd.to_datetime(df1.Date)

            # Get a df with all elements not matching (either new or different values)
            df = pd.merge(df1, df2, how='right', indicator='Exist')
            df['Exist'] = np.where(df.Exist == 'both', True, False)
            isFalse = df.loc[df['Exist'] == False]
            isFalse = isFalse.drop('Exist', axis=1)

            # Add or update based on the PersId
            if self.data_name == 'meps':
                final_df = pd.concat([isFalse,df1]).drop_duplicates(['PersId'], keep='first')
                final_df.to_csv(self.data_name+'.csv', index=False)
            if self.data_name == 'dates':
                final_df = pd.concat([isFalse, df1])
                final_df.to_csv(self.data_name+'.csv', index=False)

        else:
            df = pd.DataFrame().from_records(self.data)
            df.to_csv(self.data_name+'.csv', index=False)

    def csvToJson(self):
            # Get csv
        df1 = pd.read_csv('EPWeb/'+self.data_name + '.csv')
        if self.data_name == 'meps':
            df = df1.to_dict(orient='records')
            return json.dumps(df)
        elif self.data_name == 'dates':
            df = df1['Date'].values.tolist()
            return json.dumps(df)
        elif self.data_name == 'list_countries':
            df = df1['Country'].values.tolist()
            return json.dumps(df)

    def csvToDf(self):
        return pd.read_csv('EPWeb/'+self.data_name + '.csv')






