import pandas as pd
from datetime import datetime, timedelta
import math
import json


def mepsStats():
    # Total stats
    totalStats = {}
    # Open files
    df_meps_stats = pd.DataFrame(columns=['PersId'])
    df_meps = pd.read_csv('meps.csv')
    # Parse for all assistants types
    for type_assistant in ["accredited", "local", "accredited assistants (grouping)", "local assistants (grouping)"]:
        # Total stats
        totalStats[type_assistant] = {'NbAssistants':0,'DaysAssistants':0}
        # Create a df based on assistant type
        df = pd.read_csv('9_'+type_assistant+'.csv')
        # Get a list of PersId in the table
        listPersId = df['PersId'].unique()
        # Parse all MEPs
        for PersId in listPersId:
            # Get the info about the mep
            reference_mep = df_meps.loc[(df_meps['PersId'] == PersId)]
            # Get the number of assistants
            number_assistants = len(df.loc[(df['PersId'] == PersId)])
            # Get the list of the assistants
            meps_assistants = df.loc[(df['PersId'] == PersId)]
            # Count the average days stayed
            days = timedelta(0)
            count = 0
            for i, line in meps_assistants.iterrows():
                days += datetime.strptime(line['LeaveDate'], '%Y-%m-%d') - datetime.strptime(line['EntryDate'], '%Y-%m-%d')
                count+=1
                # Total stats
                totalStats[type_assistant]['NbAssistants'] += 1
            if days > timedelta(0):
                average_days = str((days/count).days)
            else:
                average_days = '0'
            # Total stats
            totalStats[type_assistant]['DaysAssistants'] += days.days
            # If line not alreay existing, create it
            if len(df_meps_stats.loc[(df_meps_stats['PersId'] == PersId)]) == 0:
                dic_placeholder = {'Name':reference_mep['Name'].to_list()[0], 'EuParty': reference_mep['EuParty'].to_list()[0], 'NationalParty': reference_mep['NationalParty'].to_list()[0], 'EntryDate':reference_mep['EntryDate'].to_list()[0], 'LeaveDate':reference_mep['LeaveDate'].to_list()[0], 'PersId':PersId, 'accredited':0, 'accredited assistants (grouping)':0, 'local':0, 'local assistants (grouping)':0}
                # Add them to the dictionary
                dic_placeholder[type_assistant] = number_assistants
                # Add the average stay
                dic_placeholder['Avg_'+type_assistant] = average_days
                # Add to the df about meps data
                if not df_meps_stats.empty:
                    df_meps_stats = pd.concat([df_meps_stats, pd.DataFrame(dic_placeholder,index=[0])], ignore_index=True)
                else:
                    df_meps_stats = pd.DataFrame(dic_placeholder,index=[0])
            # If line existing change the appropriate value
            else:
                df_meps_stats.loc[df_meps_stats.loc[(df_meps_stats['PersId'] == PersId)].index, [type_assistant]] = number_assistants
                df_meps_stats.loc[df_meps_stats.loc[(df_meps_stats['PersId'] == PersId)].index, ['Avg_'+type_assistant]] = average_days
    # Total stats to json
    df_total = []
    for els in totalStats.keys():
        avg_assistants = round((int(totalStats[els]['NbAssistants']))/(int(len(df_meps))),2)
        avg_days = math.floor(((int(totalStats[els]['DaysAssistants']))/(int(totalStats[els]['NbAssistants']))))
        df_total.append({'type':els, 'avg_assistants':avg_assistants,'avg_days':avg_days})
        print(els, avg_days, avg_assistants)
    df_total = pd.DataFrame(df_total)
    df_total.fillna(0, inplace=True)
    df_total.to_csv('total_stats.csv', index=False)

    # Df to csv
    df_meps_stats.fillna(0, inplace=True)
    df_meps_stats.to_csv('stats_meps.csv', index=False)


mepsStats()
